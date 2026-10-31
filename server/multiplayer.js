import { WebSocket } from 'ws';
import { AuthManager } from './auth.js';
import { db } from './db.js';
import {
  getChunk,
  getChunkByteSize,
  worldToChunkCoord,
  TOTAL_WORLD_CHUNKS,
  TOTAL_WORLD_CANONICAL_BYTES,
  COLLECTIBLE_ITEMS
} from './world.js';
import { AgentService } from './ai/agentService.js';
import { AGENT_PERSONAS } from './ai/personalities.js';

export function setupMultiplayer(wss) {
  // Map of username -> { ws, username, color, x, y, z, rotY, currentChunk, dirty, lastUpdate, replaced }
  const clients = new Map();

  wss.on('connection', (ws, req) => {
    let authenticatedUser = null;

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Malformed JSON payload' }));
        return;
      }

      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message structure' }));
        return;
      }

      // ==========================================
      // 1. Initial Authentication (Mandatory Gate)
      // ==========================================
      if (msg.type === 'AUTH') {
        const username = AuthManager.verifyToken(msg.token);
        if (!username) {
          ws.send(JSON.stringify({ type: 'AUTH_FAIL', error: 'Invalid or expired token' }));
          ws.close(4003, 'Forbidden: Invalid token');
          return;
        }

        authenticatedUser = username;

        // Handle existing connection with same username: close old connection cleanly
        if (clients.has(username)) {
          const oldSession = clients.get(username);
          if (oldSession && oldSession.ws !== ws) {
            console.log(`[WS] Reconnecting username "${username}" — closing superseded connection.`);
            db.saveUser({
              username,
              color: oldSession.color,
              x: oldSession.x,
              y: oldSession.y,
              z: oldSession.z,
              rotY: oldSession.rotY
            });
            oldSession.replaced = true;
            try {
              oldSession.ws.close(4001, 'Replaced by newer connection');
            } catch (e) {}
          }
        }

        // Restore saved position from SQLite/JSON persistence
        const savedUser = db.getUser(username) || {};
        const startX = Number.isFinite(savedUser.x) ? savedUser.x : 0;
        const startY = Number.isFinite(savedUser.y) ? savedUser.y : 1.6;
        const startZ = Number.isFinite(savedUser.z) ? savedUser.z : 10.5;
        const startRotY = Number.isFinite(savedUser.rotY) ? savedUser.rotY : 0;
        const color = savedUser.color || '#8be9fd';

        const clientState = {
          ws,
          username,
          color,
          x: startX,
          y: startY,
          z: startZ,
          rotY: startRotY,
          currentChunk: worldToChunkCoord(startX, startZ),
          dirty: false,
          lastUpdate: Date.now(),
          replaced: false
        };

        clients.set(username, clientState);

        // Send auth success, inventory, world metadata, and canonical byte sizing
        ws.send(JSON.stringify({
          type: 'AUTH_SUCCESS',
          username,
          totalWorldChunks: TOTAL_WORLD_CHUNKS,        // 100
          totalWorldBytes: TOTAL_WORLD_CANONICAL_BYTES, // Canonical serialized bytes of all chunks
          maxClientCachePercent: 10,                  // 10%
          maxAllowedChunksOnClient: 10,                // 10 chunks max
          initialPosition: { x: clientState.x, y: clientState.y, z: clientState.z, rotY: clientState.rotY },
          inventory: db.getInventory(username),
          quest: db.getQuestProgress()
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

        console.log(`[WS] Player ${username} authenticated. Active sessions: ${clients.size}`);
        return;
      }

      // ==========================================
      // Guard: Reject any gameplay actions before AUTH
      // ==========================================
      if (!authenticatedUser) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Not authenticated' }));
        return;
      }

      const player = clients.get(authenticatedUser);
      if (!player) return;

      // ==========================================
      // 2. Position & Movement Validation
      // ==========================================
      if (msg.type === 'MOVE' || msg.type === 'PLAYER_MOVE') {
        const x = Number(msg.x);
        const y = Number(msg.y);
        const z = Number(msg.z);
        const rotY = Number(msg.rotY);

        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Coordinates must be valid finite numbers' }));
          return;
        }

        // Campus boundary enforcement: world is 100 chunks [-120, 120]
        const MAX_COORD = 150;
        if (Math.abs(x) > MAX_COORD || Math.abs(z) > MAX_COORD || y < -20 || y > 150) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Coordinates out of world bounds' }));
          return;
        }

        player.x = x;
        player.y = y;
        player.z = z;
        player.rotY = Number.isFinite(rotY) ? rotY : player.rotY;
        player.dirty = true;
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

      // ==========================================
      // 3. Chunk Request (Dynamic Streaming)
      // ==========================================
      if (msg.type === 'REQUEST_CHUNK') {
        const cx = Number(msg.cx);
        const cz = Number(msg.cz);

        if (!Number.isInteger(cx) || !Number.isInteger(cz) || cx < -5 || cx > 4 || cz < -5 || cz > 4) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid chunk coordinates [-5..4]' }));
          return;
        }

        const rawChunk = getChunk(cx, cz);
        const chunkBytes = getChunkByteSize(cx, cz);

        if (rawChunk) {
          ws.send(JSON.stringify({
            type: 'CHUNK_DATA',
            chunk: {
              ...rawChunk,
              byteSize: chunkBytes // Chunk canonical size
            },
            chunkBytes // Top-level metadata agreed with client lead
          }));
        }
        return;
      }

      // ==========================================
      // 4. Chat Message (Validation & Broadcast)
      // ==========================================
      if (msg.type === 'CHAT') {
        if (typeof msg.text !== 'string') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Chat text must be a string' }));
          return;
        }
        const text = msg.text.trim().slice(0, 300);
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

      // ==========================================
      // 5. AI Agent Interaction
      // ==========================================
      if (msg.type === 'AGENT_CHAT') {
        const { agentId, text } = msg;
        if (typeof agentId !== 'string' || typeof text !== 'string') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'agentId and text must be strings' }));
          return;
        }

        if (!AGENT_PERSONAS[agentId]) {
          ws.send(JSON.stringify({ type: 'ERROR', message: `Unknown agent persona: "${agentId}"` }));
          return;
        }

        const question = text.trim().slice(0, 500);
        if (!question) return;

        // Notify client that NPC is typing/thinking
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
          console.error('[AI Error in multiplayer.js]', err.message);
          // Gracefully deliver fallback without breaking chat or multiplayer
          const fallback = AgentService.generateAdaptiveFallback(
            AGENT_PERSONAS[agentId],
            db.getAgentMemory(authenticatedUser, agentId),
            question
          );
          ws.send(JSON.stringify({
            type: 'AGENT_REPLY',
            agentId,
            agentName: AGENT_PERSONAS[agentId].name,
            reply: fallback,
            usedLLM: false,
            provider: 'heuristic_rule_engine',
            error: false
          }));
        }
        return;
      }

      // ==========================================
      // 6. Quest: Gate Code Submission
      // ==========================================
      if (msg.type === 'SUBMIT_GATE_CODE') {
        if (typeof msg.code !== 'string') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Code must be a string' }));
          return;
        }

        const code = msg.code.trim().slice(0, 20);
        const WIN_CODE = '2327'; // 2 (E=mc^2) + 3 (Пирамиды) + 2 (Группа радия) + 7 (Склеп/OSI)

        if (code === WIN_CODE) {
          db.saveQuestProgress({
            completed: true,
            winner: authenticatedUser,
            code: WIN_CODE,
            completedAt: Date.now()
          });

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

      // ==========================================
      // 7. Inventory Request
      // ==========================================
      if (msg.type === 'GET_INVENTORY') {
        ws.send(JSON.stringify({
          type: 'INVENTORY_DATA',
          inventory: db.getInventory(authenticatedUser)
        }));
        return;
      }
    });

    // ==========================================
    // Disconnect & Stale Session Protection
    // ==========================================
    ws.on('close', () => {
      if (authenticatedUser) {
        const active = clients.get(authenticatedUser);
        // Only clean up and broadcast if THIS socket is the active one!
        if (active && active.ws === ws) {
          db.saveUser({
            username: authenticatedUser,
            x: active.x,
            y: active.y,
            z: active.z,
            rotY: active.rotY
          });
          clients.delete(authenticatedUser);
          broadcast({
            type: 'PLAYER_LEFT',
            username: authenticatedUser
          });
          console.log(`[WS] Player ${authenticatedUser} left. Remaining sessions: ${clients.size}`);
        } else {
          console.log(`[WS] Superseded socket for ${authenticatedUser} closed cleanly without dropping active session.`);
        }
      }
    });
  });

  // ==========================================
  // Periodic Background Auto-Save (every 5 seconds)
  // ==========================================
  const autoSaveInterval = setInterval(() => {
    for (const [, p] of clients.entries()) {
      if (p.dirty) {
        db.saveUser({
          username: p.username,
          color: p.color,
          x: p.x,
          y: p.y,
          z: p.z,
          rotY: p.rotY
        });
        p.dirty = false;
      }
    }
  }, 5000);

  // ==========================================
  // 20 Hz State Broadcast Loop
  // ==========================================
  const TICK_RATE_MS = 50; // 20 times per second
  const broadcastInterval = setInterval(() => {
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

  // Graceful shutdown helper
  function gracefulShutdown() {
    console.log('[Multiplayer] Saving all active sessions before shutdown...');
    clearInterval(autoSaveInterval);
    clearInterval(broadcastInterval);

    for (const [, p] of clients.entries()) {
      db.saveUser({
        username: p.username,
        color: p.color,
        x: p.x,
        y: p.y,
        z: p.z,
        rotY: p.rotY
      });
      try {
        p.ws.close(1001, 'Server shutting down');
      } catch (e) {}
    }
    clients.clear();
    db.close();
    console.log('[Multiplayer] All players saved cleanly to database.');
  }

  process.once('SIGINT', () => {
    gracefulShutdown();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    gracefulShutdown();
    process.exit(0);
  });

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

  return { clients, gracefulShutdown };
}
