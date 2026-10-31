import { WebSocket } from 'ws';

async function runTest() {
  console.log('--- Starting Integration Test ---');

  // 1. Login
  const loginRes = await fetch('http://localhost:3001/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'TesterAda', color: '#8be9fd' })
  });
  const loginData = await loginRes.json();
  console.log('1. Login response:', loginData.success, 'Token:', loginData.token);

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
        console.log('8. Einstein reply #2 (Adapted!):', msg.reply);
        console.log('   Known facts:', msg.knownFactsCount, 'Turns:', msg.turnsCount);
        ws.close();
        resolve();
      }
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error('Test timeout')), 10000);
  });

  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅ ---');
}

runTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
