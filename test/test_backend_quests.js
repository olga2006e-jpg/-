import { WebSocket } from 'ws';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../data/gameState.json');

async function runQuestTest() {
  console.log('=== TEST: BACKEND & QUESTS (ROLE 3) ===');

  const testUser = `Lead_${Date.now().toString().slice(-4)}`;

  // 1. Login
  const loginRes = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser, color: '#bd93f9' })
  });
  const loginData = await loginRes.json();
  console.log('✅ 1. Login OK for', testUser, 'Token:', loginData.token);

  const ws = new WebSocket('ws://localhost:3001');

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('✅ 2. WebSocket Connected, sending AUTH...');
      ws.send(JSON.stringify({ type: 'AUTH', token: loginData.token }));
    });

    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'AUTH_SUCCESS') {
        console.log('✅ 3. AUTH_SUCCESS received, totalChunks:', msg.totalWorldChunks, 'inventory:', msg.inventory.length);
        // Step 4: Move towards artifact at (x=4, z=-3)
        console.log('➡️ 4. Moving to artifact coordinates (x=4, z=-3)...');
        ws.send(JSON.stringify({ type: 'MOVE', x: 4, y: 1.6, z: -3, rotY: 0 }));
      } else if (msg.type === 'ITEM_COLLECTED') {
        console.log('✅ 5. ITEM_COLLECTED received! Item:', msg.item.name, 'Icon:', msg.item.icon);
        console.log('   Updated inventory count:', msg.inventory.length);
        
        // Step 6: Test submitting wrong code
        console.log('➡️ 6. Submitting incorrect code "0000"...');
        ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '0000' }));
      } else if (msg.type === 'CODE_INCORRECT') {
        console.log('✅ 7. CODE_INCORRECT received correctly:', msg.message);
        
        // Step 8: Test submitting winning code "2327"
        console.log('➡️ 8. Submitting WINNING code "2327"...');
        ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '2327' }));
      } else if (msg.type === 'VICTORY') {
        console.log('🏆 9. VICTORY received! Message:', msg.message);
        console.log('   Winner:', msg.winner, 'Code:', msg.code);
        ws.close();
        resolve();
      }
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error('Test timed out after 8 seconds')), 8000);
  });

  // Verify DB state on disk
  const rawState = fs.readFileSync(DB_FILE, 'utf-8');
  const dbData = JSON.parse(rawState);
  const saved = dbData.users[testUser];
  console.log('✅ 10. Persisted state verified in data/gameState.json:');
  console.log('    Username:', saved.username);
  console.log('    Saved Position:', `x=${saved.x}, z=${saved.z}`);
  console.log('    Inventory:', saved.inventory.map(i => `${i.icon} ${i.name}`));
  console.log('=== ALL ROLE 3 BACKEND & QUEST TESTS PASSED! 🎉 ===');
}

runQuestTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
