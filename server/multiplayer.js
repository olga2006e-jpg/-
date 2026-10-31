import { WebSocket } from 'ws';
import { AuthManager } from './auth.js';
import { db } from './db.js';
import { getChunk, worldToChunkCoord, TOTAL_WORLD_CHUNKS } from './world.js';
import { AgentService } from './ai/agentService.js';

export function setupMultiplayer(wss) {
  // Map of username -> { ws, username, color, x, y, z, rotY, currentChunk, lastUpdate }
  const clients = new Map();

  wss.on('connection', (ws, req) => {
    let authenticatedUser = null;

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        return;
      }

      // 1. Initial Authentication
      if (msg.type === 'AUTH') {
        const username = AuthManager.verifyToken(msg.token);
        if (!username) {
          ws.send(JSON.stringify({ type: 'AUTH_FAIL', error: 'Invalid or expired token' }));
          ws.close();
          return;
        }

        authenticatedUser = username;
        const savedUser = db.getUser(username) || { x: 0, y: 1.6, z: 0, rotY: 0, color: '#ff79c6' };

        const clientState = {
          ws,
          username,
          color: savedUser.color,
          x: savedUser.x || 0,
          y: savedUser.y || 1.6,
          z: savedUser.z || 0,
          rotY: savedUser.rotY || 0,
          currentChunk: worldToChunkCoord(savedUser.x || 0, savedUser.z || 0),
          lastUpdate: Date.now()
        };

        clients.set(username, clientState);

        // Send auth success and world metadata
        ws.send(JSON.stringify({
          type: 'AUTH_SUCCESS',
          username,
          totalWorldChunks: TOTAL_WORLD_CHUNKS, // 100
          maxClientCachePercent: 10,           // 10%
          maxAllowedChunksOnClient: 10,         // 10 chunks max
          initialPosition: { x: clientState.x, y: clientState.y, z: clientState.z, rotY: clientState.rotY }
        }));

        // Broadcast player joined to everyone else
        broadcastExcept(username, {
          type: 'PLAYER_JOINED',
          player: {
            username,
            color: clientState.color,
            x: clientState.x,
            y: clientState.y,
            z: clientState.z,
            rotY: clientState.rotY
          }
        });

        console.log(`[WS] Player ${username} joined. Active: ${clients.size}`);
        return;
      }

      // All subsequent messages require authentication
      if (!authenticatedUser) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Not authenticated' }));
        return;
      }

      const player = clients.get(authenticatedUser);
      if (!player) return;

      // 2. Position and Movement Update
      if (msg.type === 'MOVE') {
        player.x = msg.x ?? player.x;
        player.y = msg.y ?? player.y;
        player.z = msg.z ?? player.z;
        player.rotY = msg.rotY ?? player.rotY;
        player.lastUpdate = Date.now();
        player.currentChunk = worldToChunkCoord(player.x, player.z);
        return;
      }

      // 3. Chunk Request (Dynamic Streaming)
      if (msg.type === 'REQUEST_CHUNK') {
        const { cx, cz } = msg;
        const chunk = getChunk(cx, cz);
        if (chunk) {
          ws.send(JSON.stringify({
            type: 'CHUNK_DATA',
            chunk
          }));
        }
        return;
      }

      // 4. Chat Message (Global or Proximity)
      if (msg.type === 'CHAT') {
        const text = (msg.text || '').trim().slice(0, 300);
        if (!text) return;

        const chatEntry = db.addChatMessage(authenticatedUser, text);
        broadcast({
          type: 'CHAT_MESSAGE',
          sender: authenticatedUser,
          text,
          time: chatEntry.time,
          x: player.x,
          z: player.z
        });
        return;
      }

      // 5. AI Agent Interaction
      if (msg.type === 'AGENT_CHAT') {
        const { agentId, text } = msg;
        const question = (text || '').trim().slice(0, 300);
        if (!agentId || !question) return;

        // Notify client AI is thinking
        ws.send(JSON.stringify({
          type: 'AGENT_TYPING',
          agentId
        }));

        try {
          const aiResult = await AgentService.chat(authenticatedUser, agentId, question);
          ws.send(JSON.stringify({
            type: 'AGENT_REPLY',
            ...aiResult
          }));
        } catch (err) {
          console.error('[AI Error]', err);
          ws.send(JSON.stringify({
            type: 'AGENT_REPLY',
            agentId,
            reply: 'Призрак заколебался в тумане и не смог донести свой голос...',
            error: true
          }));
        }
        return;
      }
    });

    ws.on('close', () => {
      if (authenticatedUser) {
        const player = clients.get(authenticatedUser);
        if (player) {
          // Save final position to db
          db.saveUser({
            username: authenticatedUser,
            x: player.x,
            y: player.y,
            z: player.z,
            rotY: player.rotY
          });
        }
        clients.delete(authenticatedUser);
        broadcast({
          type: 'PLAYER_LEFT',
          username: authenticatedUser
        });
        console.log(`[WS] Player ${authenticatedUser} left. Active: ${clients.size}`);
      }
    });
  });

  // 20 Hz State Broadcast Loop
  const TICK_RATE_MS = 50; // 20 times per second
  setInterval(() => {
    if (clients.size === 0) return;

    const snapshot = [];
    for (const [username, p] of clients.entries()) {
      snapshot.push({
        username,
        color: p.color,
        x: p.x,
        y: p.y,
        z: p.z,
        rotY: p.rotY
      });
    }

    const payload = JSON.stringify({
      type: 'PLAYERS_SYNC',
      players: snapshot
    });

    for (const [, p] of clients.entries()) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(payload);
      }
    }
  }, TICK_RATE_MS);

  // Helper broadcast methods
  function broadcast(msgObj) {
    const raw = JSON.stringify(msgObj);
    for (const [, p] of clients.entries()) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(raw);
      }
    }
  }

  function broadcastExcept(excludeUser, msgObj) {
    const raw = JSON.stringify(msgObj);
    for (const [username, p] of clients.entries()) {
      if (username !== excludeUser && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(raw);
      }
    }
  }
}
