import { WebSocket } from 'ws';

async function runTest() {
  console.log('--- Starting Integration Test ---');

  const testUsername = `TesterAda_${Date.now().toString(36)}`;
  // 1. Login
  const loginRes = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUsername, color: '#8be9fd' })
  });
  const loginData = await loginRes.json();
  console.log('1. Login response:', loginData.success, 'Username:', testUsername, 'Token:', loginData.token);

  // 2. Connect WebSocket
  const ws = new WebSocket('ws://localhost:3001');

  await new Promise((resolve, reject) => {
    ws.on('open', () => {
      console.log('2. WS Connected. Sending AUTH...');
      ws.send(JSON.stringify({ type: 'AUTH', token: loginData.token }));
    });

    let stage = 0;

    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'AUTH_SUCCESS') {
        console.log('3. AUTH_SUCCESS received! Total chunks:', msg.totalWorldChunks, 'Max client cache %:', msg.maxClientCachePercent);
        // Request chunk
        ws.send(JSON.stringify({ type: 'REQUEST_CHUNK', cx: 0, cz: 0 }));
      } else if (msg.type === 'CHUNK_DATA' && stage === 0) {
        stage = 1;
        console.log('4. CHUNK_DATA received! Zone:', msg.chunk.zoneName, 'Objects count:', msg.chunk.objects.length, 'NPCs count:', msg.chunk.npcs.length);
        // Send first dialogue to Einstein
        console.log('5. Asking Einstein about relativity...');
        ws.send(JSON.stringify({
          type: 'AGENT_CHAT',
          agentId: 'einstein',
          text: 'Привет, Альберт! Почему время замедляется?'
        }));
      } else if (msg.type === 'AGENT_REPLY' && stage === 1) {
        stage = 2;
        console.log('6. Einstein reply #1:', msg.reply);
        console.log('   Known facts:', msg.knownFactsCount, 'Turns:', msg.turnsCount);

        // Send second dialogue to test ADAPTIVITY
        console.log('7. Asking Einstein follow-up question...');
        ws.send(JSON.stringify({
          type: 'AGENT_CHAT',
          agentId: 'einstein',
          text: 'А что насчет парадокса близнецов?'
        }));
      } else if (msg.type === 'AGENT_REPLY' && stage === 2) {
        stage = 3;
        console.log('8. Einstein reply #2 (Adapted!):', msg.reply);
        console.log('   Known facts:', msg.knownFactsCount, 'Turns:', msg.turnsCount);

        // Test safe incorrect code
        console.log('9. Testing Safe with wrong code "0000"...');
        ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '0000' }));
      } else if (msg.type === 'CODE_INCORRECT' && stage === 3) {
        stage = 4;
        console.log('10. Safe correctly rejected wrong code:', msg.message);

        // Test safe correct code
        console.log('11. Testing Safe with correct code "2327" (Founders Safe)...');
        ws.send(JSON.stringify({ type: 'SUBMIT_GATE_CODE', code: '2327' }));
      } else if (msg.type === 'VICTORY' && stage === 4) {
        stage = 5;
        console.log('12. VICTORY broadcast received successfully! 🎉 Winner:', msg.winner, 'Code:', msg.code);

        // Test collecting artifact by moving close to Papyrus of Herodotus at (-45, 0.8, 2)
        console.log('13. Moving player towards Papyrus artifact at (-45, 2)...');
        ws.send(JSON.stringify({ type: 'MOVE', x: -45.0, y: 0.8, z: 2.0, rotY: 0 }));
      } else if (msg.type === 'ITEM_COLLECTED' && stage === 5) {
        console.log('14. Artifact successfully collected! Item:', msg.item.name, 'Inventory count:', msg.inventory.length);
        ws.close();
        resolve();
      }
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('Test timeout')), 15000);
  });

  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅ ---');
}

runTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
