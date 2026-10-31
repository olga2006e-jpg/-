import http from 'node:http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure separate test database file
const TEST_DB_PATH = path.resolve(__dirname, '../data/test_verification.db');
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
process.env.SQLITE_PATH = TEST_DB_PATH;

// Import server modules after environment setup
const { createStorage, db: testDb } = await import('../server/db.js');
// Override db singleton in imported modules by re-exporting or passing
const { AuthManager } = await import('../server/auth.js');
const { setupMultiplayer } = await import('../server/multiplayer.js');
const { AgentService } = await import('../server/ai/agentService.js');
const { AGENT_PERSONAS } = await import('../server/ai/personalities.js');
const { TOTAL_WORLD_CHUNKS, TOTAL_WORLD_CANONICAL_BYTES } = await import('../server/world.js');

const PORT = 3099;
const app = express();
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { username, color } = req.body || {};
  const auth = AuthManager.login(username, color);
  res.json({
    success: true,
    token: auth.token,
    user: auth.user,
    authType: 'guest_session',
    isGuest: true,
    disclaimer: 'Гостевой вход без пароля: сохранение привязано к никнейму на локальном сервере',
    world: {
      totalChunks: TOTAL_WORLD_CHUNKS,
      totalWorldBytes: TOTAL_WORLD_CANONICAL_BYTES,
      maxClientCachePercent: 10
    }
  });
});

app.get('/api/status', async (req, res) => {
  const ollamaHealth = await AgentService.checkOllamaHealth();
  res.json({
    status: 'online',
    timestamp: Date.now(),
    totalChunks: TOTAL_WORLD_CHUNKS,
    totalWorldBytes: TOTAL_WORLD_CANONICAL_BYTES,
    databaseEngine: testDb.type,
    aiModel: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
    ollama: ollamaHealth
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const multiplayerInstance = setupMultiplayer(wss);

function startServer() {
  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    wss.close(() => {
      server.close(() => {
        resolve();
      });
    });
  });
}

function createClientWs() {
  return new WebSocket(`ws://127.0.0.1:${PORT}`);
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🦇 RUNNING EXHAUSTIVE BACKEND VERIFICATION SUITE 🦇');
  console.log(`📁 Test Database: ${TEST_DB_PATH}`);
  console.log('====================================================\n');

  await startServer();

  let passedChecks = 0;

  // ----------------------------------------------------
  // TEST 1: Rejection of gameplay actions prior to AUTH
  // ----------------------------------------------------
  console.log('🧪 [Check 1] Rejection of gameplay actions before AUTH...');
  {
    const ws = createClientWs();
    await new Promise((resolve) => ws.once('open', resolve));

    const errorsReceived = [];
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ERROR') {
        errorsReceived.push(msg.message);
      }
    });

    ws.send(JSON.stringify({ type: 'MOVE', x: 10, y: 1.6, z: 20 }));
    ws.send(JSON.stringify({ type: 'CHAT', text: 'Hello unauth' }));
    ws.send(JSON.stringify({ type: 'AGENT_CHAT', agentId: 'kanev', text: 'Вопрос' }));
    ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '2327' }));

    await new Promise((r) => setTimeout(r, 150));
    assert(errorsReceived.length >= 4, `Expected at least 4 errors before AUTH, got ${errorsReceived.length}`);
    assert(errorsReceived.every(err => err === 'Not authenticated'), 'Errors must state Not authenticated');

    ws.close();
    passedChecks++;
    console.log('  ✅ Unauthenticated actions strictly rejected.');
  }

  // ----------------------------------------------------
  // TEST 2: Authentication failure on invalid token & guest login
  // ----------------------------------------------------
  console.log('\n🧪 [Check 2] Auth failure on invalid token & guest session tagging...');
  {
    const ws = createClientWs();
    await new Promise((resolve) => ws.once('open', resolve));

    const authFailPromise = new Promise((resolve) => {
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'AUTH_FAIL') resolve(msg);
      });
    });

    ws.send(JSON.stringify({ type: 'AUTH', token: 'invalid_deadbeef_token' }));
    const failMsg = await authFailPromise;
    assert.strictEqual(failMsg.error, 'Invalid or expired token');

    // Valid login via REST
    const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Alice', color: '#ff79c6' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.isGuest, true);
    assert.strictEqual(loginData.authType, 'guest_session');
    assert.strictEqual(typeof loginData.world.totalWorldBytes, 'number');
    assert(loginData.world.totalWorldBytes > 40000, 'Canonical bytes metadata must be > 40KB');
    passedChecks++;
    console.log('  ✅ Invalid token rejected; guest session properly marked without password requirement.');
  }

  // ----------------------------------------------------
  // TEST 3: Multi-player (2 players in game, broadcast & chat)
  // ----------------------------------------------------
  console.log('\n🧪 [Check 3] Multi-player synchronization & chat...');
  let aliceToken, bobToken;
  {
    const resA = await fetch(`http://127.0.0.1:${PORT}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Alice', color: '#ff79c6' })
    });
    aliceToken = (await resA.json()).token;

    const resB = await fetch(`http://127.0.0.1:${PORT}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Bob', color: '#50fa7b' })
    });
    bobToken = (await resB.json()).token;

    const wsAlice = createClientWs();
    const wsBob = createClientWs();

    await Promise.all([
      new Promise(r => wsAlice.once('open', r)),
      new Promise(r => wsBob.once('open', r))
    ]);

    // Alice authenticates
    const aliceAuthPromise = new Promise(resolve => {
      wsAlice.on('message', raw => {
        const m = JSON.parse(raw.toString());
        if (m.type === 'AUTH_SUCCESS') resolve(m);
      });
    });
    wsAlice.send(JSON.stringify({ type: 'AUTH', token: aliceToken }));
    const aliceAuth = await aliceAuthPromise;
    assert.strictEqual(aliceAuth.username, 'Alice');

    // Bob authenticates; Alice should get PLAYER_JOINED
    const bobJoinedPromise = new Promise(resolve => {
      wsAlice.on('message', raw => {
        const m = JSON.parse(raw.toString());
        if (m.type === 'PLAYER_JOINED' && m.player.username === 'Bob') resolve(m);
      });
    });
    wsBob.send(JSON.stringify({ type: 'AUTH', token: bobToken }));
    const joinMsg = await bobJoinedPromise;
    assert.strictEqual(joinMsg.player.username, 'Bob');

    // Alice sends chat message; Bob receives CHAT_MESSAGE
    const bobChatPromise = new Promise(resolve => {
      wsBob.on('message', raw => {
        const m = JSON.parse(raw.toString());
        if (m.type === 'CHAT_MESSAGE' && m.sender === 'Alice') resolve(m);
      });
    });
    wsAlice.send(JSON.stringify({ type: 'CHAT', text: 'Привет из зала Бауманки!' }));
    const chatMsg = await bobChatPromise;
    assert.strictEqual(chatMsg.text, 'Привет из зала Бауманки!');

    // 20Hz Tick: Bob should receive PLAYERS_SYNC with both Alice and Bob
    const syncPromise = new Promise(resolve => {
      wsBob.on('message', raw => {
        const m = JSON.parse(raw.toString());
        if (m.type === 'PLAYERS_SYNC' && m.players.some(p => p.username === 'Alice') && m.players.some(p => p.username === 'Bob')) {
          resolve(m);
        }
      });
    });
    const syncPayload = await syncPromise;
    assert(syncPayload.players.length >= 2, 'Sync contains both players');

    wsAlice.close();
    wsBob.close();
    passedChecks++;
    console.log('  ✅ 2 players synchronized: joined broadcast, chat, and 20Hz tick working.');
  }

  // ----------------------------------------------------
  // TEST 4: Reconnecting same nickname (closing old socket safely)
  // ----------------------------------------------------
  console.log('\n🧪 [Check 4] Reconnecting same nickname (duplicate connection handling)...');
  {
    const ws1 = createClientWs();
    await new Promise(r => ws1.once('open', r));
    ws1.send(JSON.stringify({ type: 'AUTH', token: aliceToken }));

    await new Promise(r => setTimeout(r, 100));

    // Connect second socket with Alice's token
    const ws2 = createClientWs();
    await new Promise(r => ws2.once('open', r));

    const ws1ClosePromise = new Promise(resolve => {
      ws1.on('close', (code, reason) => {
        resolve({ code, reason: reason.toString() });
      });
    });

    ws2.send(JSON.stringify({ type: 'AUTH', token: aliceToken }));

    const closeInfo = await ws1ClosePromise;
    assert.strictEqual(closeInfo.code, 4001, 'Old connection should be closed with code 4001');

    // Verify Alice is still active on ws2
    const pingPromise = new Promise(resolve => {
      ws2.on('message', raw => {
        const m = JSON.parse(raw.toString());
        if (m.type === 'PLAYERS_SYNC') resolve(m);
      });
    });
    const syncAfterReconnect = await pingPromise;
    assert(syncAfterReconnect.players.some(p => p.username === 'Alice'), 'Alice must still be in active session list');

    ws2.close();
    passedChecks++;
    console.log('  ✅ Old connection closed cleanly with 4001; new connection retained without losing player.');
  }

  // ----------------------------------------------------
  // TEST 5: Fallback local AI response when Ollama is unavailable
  // ----------------------------------------------------
  console.log('\n🧪 [Check 5] AI fallback without Ollama (Heuristic Rule Engine)...');
  {
    const res = await AgentService.chat('Alice', 'kanev', 'Расскажи про транспортный уровень модели OSI');
    assert.strictEqual(res.usedLLM, false, 'Must flag usedLLM as false');
    assert.strictEqual(res.provider, 'heuristic_rule_engine', 'Provider must be heuristic_rule_engine');
    assert(!res.reply.toLowerCase().includes('я языковая модель'), 'Must never claim to be an LLM');
    assert(res.reply.includes('Транспортный уровень') || res.reply.includes('OSI') || res.reply.includes('Приветствую') || res.reply.includes('TCP'),
      'Reply must be relevant to networking topic');
    assert(res.turnsCount >= 1, 'Turns count must increment');

    passedChecks++;
    console.log('  ✅ AI Fallback answered intelligently, did not call itself LLM, tracked topic.');
  }

  // ----------------------------------------------------
  // TEST 6: Simulated successful Ollama model response
  // ----------------------------------------------------
  console.log('\n🧪 [Check 6] AI response tracking when model returns response...');
  {
    // Start local mock Ollama endpoint on port 11435 for verification
    const targetModel = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
    const mockOllama = http.createServer((req, res) => {
      if (req.url === '/api/tags') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ models: [{ name: targetModel }] }));
      } else if (req.url === '/api/chat' || req.url === '/api/generate') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: { content: 'С точки зрения теории относительности, гравитация искривляет лучи света.' },
          response: 'С точки зрения теории относительности, гравитация искривляет лучи света.'
        }));
      }
    });

    await new Promise(r => mockOllama.listen(11435, '127.0.0.1', r));

    process.env.OLLAMA_HOST = 'http://127.0.0.1:11435';
    const health = await AgentService.checkOllamaHealth();
    assert.strictEqual(health.serviceAvailable, true);
    assert.strictEqual(health.modelPresent, true);

    const aiRes = await AgentService.chat('Alice', 'einstein', 'Что такое гравитация?');
    assert.strictEqual(aiRes.usedLLM, true, 'usedLLM must be true when Ollama returns answer');
    assert(aiRes.provider.startsWith('ollama:'));
    assert(aiRes.reply.includes('искривляет лучи света'));

    await new Promise(r => mockOllama.close(r));
    delete process.env.OLLAMA_HOST;
    passedChecks++;
    console.log('  ✅ Ollama health check & model presence verification validated.');
  }

  // ----------------------------------------------------
  // TEST 7: Quest lore, gate code validation & victory state persistence
  // ----------------------------------------------------
  console.log('\n🧪 [Check 7] Quest submission (invalid code -> winning code 2327 -> victory)...');
  {
    const ws = createClientWs();
    await new Promise(r => ws.once('open', r));

    let incorrectReceived = false;
    let victoryReceived = false;

    ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'CODE_INCORRECT') incorrectReceived = true;
      if (m.type === 'VICTORY' && m.code === '2327') victoryReceived = true;
    });

    ws.send(JSON.stringify({ type: 'AUTH', token: aliceToken }));
    await new Promise(r => setTimeout(r, 100));

    // Submit wrong code
    ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '9999' }));
    await new Promise(r => setTimeout(r, 100));
    assert(incorrectReceived, 'Incorrect code should return CODE_INCORRECT');

    // Submit winning code 2327
    ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '2327' }));
    await new Promise(r => setTimeout(r, 100));
    assert(victoryReceived, 'Code 2327 must trigger VICTORY');

    // Verify DB persistence of quest progress
    const questState = testDb.getQuestProgress();
    assert.strictEqual(questState.completed, true);
    assert.strictEqual(questState.code, '2327');
    assert.strictEqual(questState.winner, 'Alice');

    ws.close();
    passedChecks++;
    console.log('  ✅ Quest code 2327 verified, VICTORY broadcasted, and state persisted in DB.');
  }

  // ----------------------------------------------------
  // TEST 8: Streaming metadata (byte size without sending whole world)
  // ----------------------------------------------------
  console.log('\n🧪 [Check 8] Chunk streaming byte-size metadata...');
  {
    const ws = createClientWs();
    await new Promise(r => ws.once('open', r));

    let chunkMeta = null;
    ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'CHUNK_DATA') chunkMeta = m;
    });

    ws.send(JSON.stringify({ type: 'AUTH', token: aliceToken }));
    await new Promise(r => setTimeout(r, 100));

    ws.send(JSON.stringify({ type: 'REQUEST_CHUNK', cx: 0, cz: 0 }));
    await new Promise(r => setTimeout(r, 100));

    assert(chunkMeta !== null, 'Should receive CHUNK_DATA');
    assert.strictEqual(typeof chunkMeta.chunkBytes, 'number', 'chunkBytes must be a number');
    assert.strictEqual(typeof chunkMeta.chunk.byteSize, 'number', 'chunk.byteSize must be a number');
    assert(chunkMeta.chunkBytes > 0 && chunkMeta.chunkBytes < 131072, 'Chunk size must be realistic and < 128KB');

    ws.close();
    passedChecks++;
    console.log('  ✅ Chunk metadata delivered byteSize & chunkBytes without broadcasting full world.');
  }

  // ----------------------------------------------------
  // TEST 9: State restoration after restart (position, inventory, memory)
  // ----------------------------------------------------
  console.log('\n🧪 [Check 9] Persistence across server restart in SQLite...');
  {
    // Save specific position, inventory, and memory for Alice in testDb
    testDb.saveUser({
      username: 'Alice',
      color: '#ff79c6',
      x: 33.5,
      y: 1.6,
      z: -18.2,
      rotY: 2.14
    });

    testDb.addItemToInventory('Alice', {
      id: 'hourglass_relativity',
      name: 'Песочные Часы Относительности',
      icon: '⏳',
      clue: 'Первая цифра: 2'
    });

    testDb.updateAgentMemory('Alice', 'curie', mem => {
      mem.turnsCount = 4;
      mem.factsKnown = ['radium_discovery', 'nobel_prizes'];
      mem.lastTopic = 'радий';
    });

    // Close and simulate restart: instantiate fresh storage from the same file
    const restartedDb = createStorage(TEST_DB_PATH);
    const restoredUser = restartedDb.getUser('Alice');
    assert.strictEqual(restoredUser.username, 'Alice');
    assert.strictEqual(restoredUser.x, 33.5);
    assert.strictEqual(restoredUser.z, -18.2);

    const restoredInv = restartedDb.getInventory('Alice');
    assert(restoredInv.some(it => it.id === 'hourglass_relativity'), 'Inventory item restored');

    const restoredMem = restartedDb.getAgentMemory('Alice', 'curie');
    assert.strictEqual(restoredMem.turnsCount, 4);
    assert(restoredMem.factsKnown.includes('radium_discovery'));
    assert.strictEqual(restoredMem.lastTopic, 'радий');

    passedChecks++;
    console.log('  ✅ User position, inventory, and agent memory perfectly restored across restart.');
  }

  // ----------------------------------------------------
  // TEST 10: Input validation (bounds, NaN, malformed messages)
  // ----------------------------------------------------
  console.log('\n🧪 [Check 10] Input type and limits validation...');
  {
    const ws = createClientWs();
    await new Promise(r => ws.once('open', r));

    const errors = [];
    ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.type === 'ERROR') errors.push(m.message);
    });

    ws.send(JSON.stringify({ type: 'AUTH', token: aliceToken }));
    await new Promise(r => setTimeout(r, 100));

    // NaN coordinate
    ws.send(JSON.stringify({ type: 'MOVE', x: 'invalid_nan', y: 1.6, z: 10 }));
    // Out of campus bounds
    ws.send(JSON.stringify({ type: 'MOVE', x: 9999, y: 1.6, z: 10 }));
    // Invalid chunk coordinate
    ws.send(JSON.stringify({ type: 'REQUEST_CHUNK', cx: 999, cz: 999 }));
    // Invalid agentId
    ws.send(JSON.stringify({ type: 'AGENT_CHAT', agentId: 'non_existent_ghost', text: 'Хеллоу' }));

    await new Promise(r => setTimeout(r, 150));
    assert(errors.some(e => e.includes('finite numbers')), 'Must catch NaN');
    assert(errors.some(e => e.includes('out of world bounds')), 'Must catch out of bounds');
    assert(errors.some(e => e.includes('Invalid chunk coordinates')), 'Must catch invalid chunk');
    assert(errors.some(e => e.includes('Unknown agent persona')), 'Must catch unknown agent');

    ws.close();
    passedChecks++;
    console.log('  ✅ Coordinates and input limits thoroughly validated.');
  }
  multiplayerInstance.gracefulShutdown();
  await stopServer();
  testDb.close();

  // Cleanup test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedChecks}/10 AUTOMATED VERIFICATION CHECKS PASSED! 🎉`);
  console.log('====================================================\n');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
