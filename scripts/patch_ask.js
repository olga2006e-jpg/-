import fs from 'fs';
import path from 'path';

const file = path.resolve('d:/rip-2026/hackathon/walkthrough/src/campus-game.js');
let content = fs.readFileSync(file, 'utf8');

// Заменяем строку с блокировкой quiz в ask
const targetPiece = "if(quiz){toast('Выберите вариант ответа в карточке задания.');return;}";
const replacePiece = "quiz=false; // переключаем из режима квиза в свободный диалог с ИИ";

if (content.includes(targetPiece)) {
  content = content.replace(targetPiece, replacePiece);
  console.log('✅ Убрана блокировка ввода при квизе');
}

// Заменяем pending return
content = content.replace(
  "if(pending.has(npc.id))return;addTurn(npc.id,'user',text);",
  "if(pending.has(npc.id)){clearTimeout(pending.get(npc.id));pending.delete(npc.id);}addTurn(npc.id,'user',text);"
);

// Разблокируем кнопку отправки
content = content.replace(
  "send.disabled=pending.has(npc.id);",
  "send.disabled=false;"
);

fs.writeFileSync(file, content, 'utf8');
console.log('✅ campus-game.js успешно обновлен!');
