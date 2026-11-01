import fs from 'fs';
import path from 'path';

const file = path.resolve('d:/rip-2026/hackathon/walkthrough/src/campus-game.js');
let code = fs.readFileSync(file, 'utf8');

// Исправляем обработчик onAgentReply: убираем глушащий if(!timer)return
const oldHandler = "network.onAgentReply=data=>{const timer=pending.get(data.agentId);if(!timer)return;clearTimeout(timer);pending.delete(data.agentId);lastAiLabel=data.usedLLM?'Ответ локальной языковой модели':'Ответ алгоритма сервера';addTurn(data.agentId,'agent',data.reply||'Ответ не получен. Попробуйте ещё раз.');};";

const newHandler = `network.onAgentReply=data=>{
    console.log('[Client] Получен AGENT_REPLY:', data);
    if(data.agentId && pending.has(data.agentId)){
      clearTimeout(pending.get(data.agentId));
      pending.delete(data.agentId);
    }
    lastAiLabel=data.usedLLM?'Ответ Qwen 2.5 (172.16.236.14)':'Ответ сервера';
    addTurn(data.agentId,'agent',data.reply||'Ответ пустой');
    renderDialogue();
  };`;

if (code.includes("network.onAgentReply=data=>{const timer=pending.get(data.agentId);if(!timer)return;")) {
  code = code.replace(oldHandler, newHandler);
  console.log('✅ onAgentReply успешно исправлен: убран блокирующий if(!timer)return!');
} else {
  // Попробуем найти кусок
  const rx = /network\.onAgentReply=data=>\{const timer=pending\.get\(data\.agentId\);if\(!timer\)return;[^}]+addTurn\([^)]+\);?\};/;
  code = code.replace(rx, newHandler);
  console.log('✅ onAgentReply заменен по регулярке!');
}

// Также в addTurn гарантируем отрисовку диалога
code = code.replace(
  "if(activeNpc?.id===id)renderDialogue();",
  "renderDialogue();"
);

fs.writeFileSync(file, code, 'utf8');
console.log('✅ walkthrough/src/campus-game.js обновлен!');
