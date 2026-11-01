// scripts/patch_beacons_and_https.js
import fs from 'fs';
import path from 'path';

console.log('🔧 1. Обновление walkthrough/src/campus-game.js (маяки и свет)...');
const campusGamePath = path.resolve('d:/rip-2026/hackathon/walkthrough/src/campus-game.js');
let campusGame = fs.readFileSync(campusGamePath, 'utf8');

// Заменяем блок кнопок действий с сервером на кнопки зажечь/погасить маяк
const oldActions = `    const actions=el('div','','game-world-actions');actions.append(el('small','ПОПРОСИТЬ ИЗМЕНИТЬ МИР'));
    for(const [label,text]of [['Освети дорогу','Освети дорогу, создай световой маяк'],['Создай серверную стойку','Создай серверную стойку']])actions.append(button(label,()=>{
      if(onlineCampus)network.send({type:'CAMPUS_ACTION',agentId:npc.id,text});
      else{const pos=npc.id==='kanev'?{x:28,z:-2.4}:npc.id==='korshunov'?{x:27,z:19}:{x:-27,z:14};applyMutation({id:crypto.randomUUID(),mutationType:text.includes('стойку')?'SPAWN_SERVER_RACK':'SPAWN_LIGHT_BEAM',...pos,y:0,message:'Преподаватель изменил окружение по вашей просьбе.'});}
    }));body.append(actions);`;

const newActions = `    const actions=el('div','','game-world-actions');actions.append(el('small','УПРАВЛЕНИЕ СВЕТОВЫМ МАЯКОМ'));
    actions.append(button('✨ Зажечь маяк',()=>{
      if(onlineCampus)network.send({type:'CAMPUS_ACTION',agentId:npc.id,text:'Освети дорогу, создай световой маяк'});
      else{const pos=npc.id==='kanev'?{x:28,z:-2.4}:npc.id==='korshunov'?{x:27,z:19}:{x:-27,z:14};applyMutation({id:crypto.randomUUID(),mutationType:'SPAWN_LIGHT_BEAM',...pos,y:0,message:'Преподаватель зажёг световой маяк.'});}
    }));
    actions.append(button('🌙 Погасить маяк',()=>{
      if(onlineCampus)network.send({type:'CAMPUS_ACTION',agentId:npc.id,text:'Погаси свет, выключи маяк'});
      else applyMutation({mutationType:'CLEAR_MUTATIONS',message:'Световой маяк погашен.'});
    }));body.append(actions);`;

if (campusGame.includes("['Создай серверную стойку'")) {
  campusGame = campusGame.replace(oldActions, newActions);
  console.log('   ✅ Убран спавн сервера, добавлены кнопки [✨ Зажечь маяк] и [🌙 Погасить маяк]');
} else {
  console.log('   (Actions block already updated or formatted differently)');
}

// Исправляем сплющивание маяка в applyMutation
const oldScale = "if(type==='SPAWN_LIGHT_BEAM')group.scale.set(.2,.075,.2);";
const newScale = "if(type==='SPAWN_LIGHT_BEAM')group.scale.set(.65,.45,.65);";
if (campusGame.includes(oldScale)) {
  campusGame = campusGame.replace(oldScale, newScale);
  console.log('   ✅ Исправлен масштаб маяка: теперь это высокий красивый вертикальный столб света');
}

fs.writeFileSync(campusGamePath, campusGame, 'utf8');

console.log('\n🔧 2. Обновление server/campus.js (обработка выключения света)...');
const campusServerPath = path.resolve('d:/rip-2026/hackathon/server/campus.js');
let campusServer = fs.readFileSync(campusServerPath, 'utf8');

const oldCampusAction = `      const action=classifyIntentActions(String(msg.text||'').slice(0,200)).find(a=>['SPAWN_LIGHT_BEAM','SPAWN_SERVER_RACK'].includes(a));
      if(!action){responseError(p,'Попросите осветить дорогу или создать серверную стойку.');return true;}
      const pos=msg.agentId==='kanev'?{x:28,z:-2.4}:msg.agentId==='korshunov'?{x:27,z:19}:{x:-27,z:14};
      mutate({mutationType:action,...pos,y:0,author:professor.name,message:action==='SPAWN_LIGHT_BEAM'?'По вашей просьбе преподаватель зажёг световой маяк.':'По вашей просьбе преподаватель создал серверную стойку.'});`;

const newCampusAction = `      const reqText = String(msg.text||'').toLowerCase();
      if (reqText.includes('погас') || reqText.includes('выключ') || reqText.includes('потуш') || reqText.includes('убер')) {
        mutate({mutationType:'CLEAR_MUTATIONS',author:professor.name,message:'По вашей просьбе световой маяк погашен.'});
        return true;
      }
      const action='SPAWN_LIGHT_BEAM';
      const pos=msg.agentId==='kanev'?{x:28,z:-2.4}:msg.agentId==='korshunov'?{x:27,z:19}:{x:-27,z:14};
      mutate({mutationType:'SPAWN_LIGHT_BEAM',...pos,y:0,author:professor.name,message:'По вашей просьбе преподаватель зажёг световой маяк.'});`;

if (campusServer.includes("classifyIntentActions(String(msg.text||'').slice(0,200)).find(a=>['SPAWN_LIGHT_BEAM','SPAWN_SERVER_RACK']")) {
  campusServer = campusServer.replace(oldCampusAction, newCampusAction);
  console.log('   ✅ server/campus.js теперь включает и выключает маяк по команде!');
}

fs.writeFileSync(campusServerPath, campusServer, 'utf8');

console.log('\n🔧 3. Настройка HTTPS в server/index.js...');
const indexPath = path.resolve('d:/rip-2026/hackathon/server/index.js');
let serverIndex = fs.readFileSync(indexPath, 'utf8');

if (!serverIndex.includes("import https from 'node:https';")) {
  serverIndex = "import https from 'node:https';\nimport { getOrCreateSSLCert } from './ssl/certHelper.js';\n" + serverIndex;
}

// Заменяем блок запуска сервера на одновременную поддержку HTTP + HTTPS
const oldListenBlock = `server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\\n======================================================');
  console.log('🎃 HAUNTED ACADEMY — HACKATHON SERVER READY!');
  console.log(\`📡 Localhost:     http://localhost:\${PORT}\`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(\`🌐 LAN (Wi-Fi):   http://\${ip}:\${PORT}\`);
    });
  } else {
    console.log('🌐 LAN: (No active Wi-Fi / LAN interface detected, offline mode)');
  }
  console.log('🤖 AI Endpoint:   Ollama on localhost:11434 (with smart offline fallback)');
  console.log('======================================================\\n');
});`;

const newListenBlock = `const sslCerts = await getOrCreateSSLCert();
const PORT_HTTPS = process.env.HTTPS_PORT || 3443;
const httpsServer = https.createServer(sslCerts, app);

// Upgrade WebSocket соединений для обоих серверов (HTTP + HTTPS)
function handleUpgrade(req, socket, head) {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
}
server.on('upgrade', handleUpgrade);
httpsServer.on('upgrade', handleUpgrade);

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\\n======================================================');
  console.log('🎃 HAUNTED ACADEMY — HACKATHON SERVER READY (HTTP + HTTPS)!');
  console.log(\`📡 HTTP Local:    http://localhost:\${PORT}\`);
  console.log(\`🔒 HTTPS Local:   https://localhost:\${PORT_HTTPS}\`);
  if (ips.length > 0) {
    ips.forEach(ip => {
      console.log(\`🌐 HTTP LAN:      http://\${ip}:\${PORT}\`);
      console.log(\`🔒 HTTPS LAN:     https://\${ip}:\${PORT_HTTPS}\`);
    });
  }
  console.log(\`🎛️  Admin Panel:   http://localhost:\${PORT}/admin  (or https://localhost:\${PORT_HTTPS}/admin)\`);
  console.log('🤖 AI Endpoint:   Ollama with smart fallback');
  console.log('======================================================\\n');
});

httpsServer.listen(PORT_HTTPS, '0.0.0.0');`;

if (serverIndex.includes("server.listen(PORT, '0.0.0.0', () => {")) {
  serverIndex = serverIndex.replace(oldListenBlock, newListenBlock);
  console.log('   ✅ server/index.js теперь запускает и HTTP (порт 3001) и HTTPS (порт 3443)!');
}

fs.writeFileSync(indexPath, serverIndex, 'utf8');
console.log('\n🎉 Все патчи успешно применены!');
