import { WebSocket } from 'ws';
import { AuthManager } from './auth.js';
import { db } from './db.js';
import { getChunk, worldToChunkCoord, TOTAL_WORLD_CHUNKS, COLLECTIBLE_ITEMS } from './world.js';
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
        const savedUser = db.getUser(username) || { x: 0, y: 1.6, z: 10.5, rotY: 0, color: '#ff79c6', inventory: [] };

        const startX = savedUser.x ?? 0;
        const startZ = savedUser.z ?? 10.5;
        const startRotY = savedUser.rotY ?? 0;

        const clientState = {
          ws,
          username,
          color: savedUser.color,
          x: startX,
          y: savedUser.y || 1.6,
          z: startZ,
          rotY: startRotY,
          currentChunk: worldToChunkCoord(startX, startZ),
          lastUpdate: Date.now()
        };

        clients.set(username, clientState);

        // Send auth success, inventory and world metadata
        ws.send(JSON.stringify({
          type: 'AUTH_SUCCESS',
          username,
          totalWorldChunks: TOTAL_WORLD_CHUNKS, // 100
          maxClientCachePercent: 10,           // 10%
          maxAllowedChunksOnClient: 10,         // 10 chunks max
          initialPosition: { x: clientState.x, y: clientState.y, z: clientState.z, rotY: clientState.rotY },
          inventory: db.getInventory(username)
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
      if (msg.type === 'MOVE' || msg.type === 'PLAYER_MOVE') {
        player.x = msg.x ?? player.x;
        player.y = msg.y ?? player.y;
        player.z = msg.z ?? player.z;
        player.rotY = msg.rotY ?? player.rotY;
        player.lastUpdate = Date.now();
        player.currentChunk = worldToChunkCoord(player.x, player.z);

        // Check proximity to collectible items in player's current chunk
        for (const item of COLLECTIBLE_ITEMS) {
          if (item.chunkX === player.currentChunk.cx && item.chunkZ === player.currentChunk.cz) {
            const dist = Math.hypot(player.x - item.x, player.z - item.z);
            if (dist < 2.5) {
              const added = db.addItemToInventory(authenticatedUser, item);
              if (added) {
                const userInventory = db.getInventory(authenticatedUser);
                ws.send(JSON.stringify({
                  type: 'ITEM_COLLECTED',
                  item,
                  inventory: userInventory
                }));
                broadcast({
                  type: 'NOTIFICATION',
                  message: `✨ Исследователь ${authenticatedUser} нашел артефакт: ${item.icon} ${item.name}!`
                });
                console.log(`[Quest] Player ${authenticatedUser} collected artifact ${item.id}`);
              }
            }
          }
        }
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

      // 6. Quest: Gate Code Submission («Тайна Хэллоуинских Врат»)
      if (msg.type === 'SUBMIT_GATE_CODE') {
        const code = (msg.code || '').trim();
        const WIN_CODE = '2327'; // 2 (E=mc^2) + 3 (Пирамиды) + 2 (Группа радия) + 7 (Склеп)

        if (code === WIN_CODE) {
          broadcast({
            type: 'VICTORY',
            winner: authenticatedUser,
            code: WIN_CODE,
            message: `🎉 Игрок ${authenticatedUser} и команда разгадали тайны призраков и открыли Врата Вечности!`
          });
          console.log(`[Quest] VICTORY! Gate code solved by ${authenticatedUser}`);
        } else {
          ws.send(JSON.stringify({
            type: 'CODE_INCORRECT',
            enteredCode: code,
            message: 'Замок звякнул цепями: код неверен! Спросите призраков или найдите свитки в залах.'
          }));
        }
        return;
      }

      // 7. Inventory Request
      if (msg.type === 'GET_INVENTORY') {
        ws.send(JSON.stringify({
          type: 'INVENTORY_DATA',
          inventory: db.getInventory(authenticatedUser)
        }));
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
