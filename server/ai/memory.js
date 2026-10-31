import { db } from '../db.js';
import { AGENT_PERSONAS } from './personalities.js';

export class MemoryManager {
  static getContext(username, agentId) {
    return db.getAgentMemory(username, agentId);
  }

  static buildPrompt(username, agentId, userMessage) {
    const persona = AGENT_PERSONAS[agentId] || AGENT_PERSONAS.einstein;
    const memory = db.getAgentMemory(username, agentId);

    const knownFactIds = new Set(memory.factsKnown || []);
    const knownFactsList = persona.factsCatalog
      .filter(f => knownFactIds.has(f.id))
      .map(f => `• ${f.title}: ${f.text}`)
      .join('\n');

    const unknownFactsList = persona.factsCatalog
      .filter(f => !knownFactIds.has(f.id))
      .map(f => `• [Новая тема] ${f.title}: ${f.text}`)
      .join('\n');

    const historyExcerpt = (memory.history || [])
      .slice(-4)
      .map(h => `${h.role === 'user' ? 'Игрок' : persona.name}: ${h.content}`)
      .join('\n');

    const prompt = `${persona.systemPrompt}

ТЕКУЩИЙ КОНТЕКСТ ДИАЛОГА:
Имя игрока: ${username}
Уровень знакомства: ${memory.turnsCount === 0 ? 'Первая встреча' : `Разговор #${memory.turnsCount + 1}`}

ЧТО ИГРОК УЖЕ ЗНАЕТ (НЕ ПОВТОРЯТЬ!):
${knownFactsList || '(Пока ничего не обсуждали)'}

НОВЫЕ ТЕМЫ ДЛЯ РАСКРЫТИЯ:
${unknownFactsList || '(Все базовые факты изучены, отвечай на свободные вопросы)'}

${historyExcerpt ? `ПРЕДЫДУЩИЕ РЕПЛИКИ:\n${historyExcerpt}\n` : ''}
Игрок: "${userMessage}"
${persona.name}:`;

    return { prompt, memory, persona };
  }

  static recordResponse(username, agentId, userMessage, responseText) {
    const persona = AGENT_PERSONAS[agentId] || AGENT_PERSONAS.einstein;
    
    db.updateAgentMemory(username, agentId, mem => {
      mem.turnsCount = (mem.turnsCount || 0) + 1;
      mem.history = mem.history || [];
      mem.history.push({ role: 'user', content: userMessage });
      mem.history.push({ role: 'agent', content: responseText });
      if (mem.history.length > 8) {
        mem.history = mem.history.slice(-8);
      }

      // Only mark facts present in the answer; asking a question is not learning it.
      const lower = responseText.toLowerCase();
      mem.factsKnown = mem.factsKnown || [];
      for (const fact of persona.factsCatalog) {
        if (!mem.factsKnown.includes(fact.id) &&
            (lower.includes(fact.text.toLowerCase()) || lower.includes(fact.title.toLowerCase()))) {
          mem.factsKnown.push(fact.id);
        }
      }

      mem.lastTopic = userMessage.slice(0, 40);
    });
  }
}

// Compatible version of the team's STORY -> RIDDLE -> DONE state machine.
// Uses the existing server storage rather than a volatile Map.
export const memory = {
  getNextFact(playerId, npcId, npcData) {
    const persona=AGENT_PERSONAS[npcId];
    if(!persona)throw new Error('Персонаж не найден');
    const state=db.getAgentMemory(playerId,npcId);
    const next=persona.factsCatalog.find(f=>!state.factsKnown.includes(f.id));
    if(state.lessonState==='DONE')return {type:'DONE',text:'Вы уже решили мою загадку. Можем продолжить разговор по моему предмету.'};
    if(!next){
      db.updateAgentMemory(playerId,npcId,m=>{m.lessonState='RIDDLE';});
      return {type:'RIDDLE',text:`Мы уже обсудили основные темы. Теперь вопрос: ${persona.riddle}`,isLastFact:true};
    }
    db.updateAgentMemory(playerId,npcId,m=>{m.lessonState='STORY';});
    // Fact is recorded only after this text is actually returned by the service.
    return {type:'STORY',text:`${state.turnsCount?'Продолжим нашу беседу. ':''}${next.title}. ${next.text}`,factId:next.id};
  },
  checkRiddle(playerId,npcId,answer){
    const persona=AGENT_PERSONAS[npcId];
    const state=db.getAgentMemory(playerId,npcId);
    if(!persona||state.lessonState!=='RIDDLE')return {isCorrect:false,message:'Я пока не задавал вам загадку.'};
    const normalized=String(answer).trim().toLowerCase().replace(/[.!?]+$/,'');
    const words={'0':['ноль','нулю','zero'],'2':['два','две','вторая','второй'],'3':['три'],'7':['семь']};
    const isCorrect=normalized===persona.codeDigit||(words[persona.codeDigit]||[]).includes(normalized);
    if(isCorrect)db.updateAgentMemory(playerId,npcId,m=>{m.lessonState='DONE';});
    return {isCorrect,message:isCorrect?'Верно! Вы решили мою учебную загадку. Это отдельная задача, код сейфа ищите в четырёх предметах.':`Пока неверно. Попробуйте ещё раз: ${persona.riddle}`};
  }
};
