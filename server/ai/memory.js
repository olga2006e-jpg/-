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

      // Automatically register any facts whose keywords appear in response or message
      const lower = (responseText + ' ' + userMessage).toLowerCase();
      mem.factsKnown = mem.factsKnown || [];
      for (const fact of persona.factsCatalog) {
        if (!mem.factsKnown.includes(fact.id)) {
          const titleWords = fact.title.toLowerCase().split(' ');
          const matches = titleWords.some(w => w.length > 3 && lower.includes(w));
          if (matches) {
            mem.factsKnown.push(fact.id);
          }
        }
      }

      // If no new facts triggered but conversation progressed, unlock sequentially
      if (mem.factsKnown.length < persona.factsCatalog.length && Math.random() > 0.4) {
        const nextFact = persona.factsCatalog.find(f => !mem.factsKnown.includes(f.id));
        if (nextFact) mem.factsKnown.push(nextFact.id);
      }

      mem.lastTopic = userMessage.slice(0, 40);
    });
  }
}
