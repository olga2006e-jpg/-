// scripts/fix_ip_and_agent_chat.js
import fs from 'fs';
import path from 'path';

console.log('🔧 1. Настройка IP 172.16.236.14 в server/ai/agentService.js...');
const agentServicePath = path.resolve('d:/rip-2026/hackathon/server/ai/agentService.js');
let agentService = fs.readFileSync(agentServicePath, 'utf8');

// Добавляем жесткий приоритет IP 172.16.236.14
const oldTarget = `  const candidateHosts = [];
  if (currentEnvHost) candidateHosts.push(currentEnvHost.replace(/\\/$/, ''));
  if (!candidateHosts.includes(LOCAL_OLLAMA)) candidateHosts.push(LOCAL_OLLAMA);`;

const newTarget = `  const candidateHosts = [];
  if (currentEnvHost) candidateHosts.push(currentEnvHost.replace(/\\/$/, ''));
  // Приоритетный ноутбук с Ollama (IP 172.16.236.14)
  candidateHosts.push("http://172.16.236.14:11434");
  if (!candidateHosts.includes(LOCAL_OLLAMA)) candidateHosts.push(LOCAL_OLLAMA);`;

agentService = agentService.replace(oldTarget, newTarget);

// Увеличиваем таймаут запроса к Ollama до 8500 мс (чтобы через Wi-Fi успел прийти ответ)
agentService = agentService.replace(
  'signal: AbortSignal.timeout(4500),',
  'signal: AbortSignal.timeout(8500),'
);

fs.writeFileSync(agentServicePath, agentService, 'utf8');
console.log('   ✅ IP http://172.16.236.14:11434 прописан как приоритетный хост Ollama!');

console.log('\n🔧 2. Проверка и разблокировка диалога в walkthrough/src/campus-game.js...');
const campusGamePath = path.resolve('d:/rip-2026/hackathon/walkthrough/src/campus-game.js');
let campusGame = fs.readFileSync(campusGamePath, 'utf8');

// В функции ask убираем запрет на ввод при quiz, чтобы игрок мог писать ИИ в любой момент
const oldAsk = `  function ask(npc,text){
    if(pending.has(npc.id))return;addTurn(npc.id,'user',text);
    if(quiz){toast('Выберите вариант ответа в карточке задания.');return;}
    if(network.isConnected()){
      const timeout=setTimeout(()=>{pending.delete(npc.id);addTurn(npc.id,'agent','Ответ сервера не пришёл вовремя. Можно повторить вопрос или пройти локальное задание.');},20000);pending.set(npc.id,timeout);network.sendAgentChat(npc.id,text);renderDialogue();return;
    }`;

const newAsk = `  function ask(npc,text){
    if(pending.has(npc.id))pending.delete(npc.id); // сброс застрявшего ожидания
    quiz = false; // переключаем из квиза в режим свободного диалога с ИИ
    addTurn(npc.id,'user',text);
    if(network.isConnected()||network.isAuthenticated){
      const timeout=setTimeout(()=>{pending.delete(npc.id);renderDialogue();},12000);
      pending.set(npc.id,timeout);
      network.sendAgentChat(npc.id,text);
      renderDialogue();
      return;
    }`;

if (campusGame.includes(oldAsk)) {
  campusGame = campusGame.replace(oldAsk, newAsk);
  console.log('   ✅ Функция ask() обновлена: ввод вопроса ИИ теперь всегда активен и сразу шлёт AGENT_CHAT!');
} else {
  console.log('   (ask function formatted differently, check manually)');
}

// Убедимся, что кнопка отправки активна и форма отправляет даже если pending подвис
const oldFormSubmit = `form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(text)ask(npc,text);};`;
const newFormSubmit = `form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(text){input.value='';ask(npc,text);}};`;
campusGame = campusGame.replace(oldFormSubmit, newFormSubmit);

fs.writeFileSync(campusGamePath, campusGame, 'utf8');
console.log('   ✅ campus-game.js успешно пропатчен!');
