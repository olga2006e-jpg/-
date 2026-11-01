import { db } from '../db.js';
import { AGENT_PERSONAS } from './personalities.js';

/**
 * In-Memory Ephemeral Dialogue Session Cache:
 * - Keeps only recent conversational turns in RAM while the player is active
 * - Automatically prunes inactive dialogue sessions after TTL (5 minutes)
 * - Zero disk I/O for dialogue turns, preventing SQLite database from accumulating raw chat transcripts
 */
export class SessionDialogueCache {
  static sessions = new Map();
  static TTL_MS = 5 * 60 * 1000; // 5 minutes of inactivity frees RAM

  static getKey(username, agentId) {
    return `${username}:${agentId}`;
  }

  static getRecent(username, agentId, maxUtterances = 4) {
    const key = this.getKey(username, agentId);
    const session = this.sessions.get(key);
    if (!session) return [];
    session.lastActive = Date.now();
    return session.utterances.slice(-maxUtterances);
  }

  static addTurn(username, agentId, userMessage, agentMessage) {
    const key = this.getKey(username, agentId);
    let session = this.sessions.get(key);
    if (!session) {
      session = { utterances: [], lastActive: Date.now() };
      this.sessions.set(key, session);
    }
    session.lastActive = Date.now();
    session.utterances.push({ role: 'user', content: userMessage });
    session.utterances.push({ role: 'agent', content: agentMessage });
    // Retain only last 6 utterances (3 conversational turns) for prompt context
    if (session.utterances.length > 6) {
      session.utterances = session.utterances.slice(-6);
    }
  }

  static clear(username, agentId = null) {
    if (agentId) {
      this.sessions.delete(this.getKey(username, agentId));
    } else {
      for (const key of this.sessions.keys()) {
        if (key.startsWith(`${username}:`)) {
          this.sessions.delete(key);
        }
      }
    }
  }

  static pruneExpired() {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now - session.lastActive > this.TTL_MS) {
        this.sessions.delete(key);
      }
    }
  }
}

// Background periodic cleanup for idle sessions
const pruneTimer = setInterval(() => SessionDialogueCache.pruneExpired(), 60000);
if (pruneTimer && typeof pruneTimer.unref === 'function') {
  pruneTimer.unref();
}

export class MemoryManager {
  static getContext(username, agentId) {
    return db.getAgentMemory(username, agentId);
  }

  static buildPrompt(username, agentId, userMessage) {
    const persona = AGENT_PERSONAS[agentId] || AGENT_PERSONAS.einstein;
    const memory = db.getAgentMemory(username, agentId);

    const knownFactIds = new Set(memory.factsKnown || []);
    const knownFactsList = (persona.factsCatalog || [])
      .filter(f => knownFactIds.has(f.id))
      .map(f => `• ${f.title}: ${f.text}`)
      .join('\n');

    const unknownFactsList = (persona.factsCatalog || [])
      .filter(f => !knownFactIds.has(f.id))
      .map(f => `• [Новая тема] ${f.title}: ${f.text}`)
      .join('\n');

    // Get dialogue context from fast in-memory sliding window cache (0 SQLite disk I/O)
    const activeUtterances = SessionDialogueCache.getRecent(username, agentId, 4);
    const historyExcerpt = activeUtterances
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

    // 1. Record in-memory active dialogue session (fast RAM, auto-expires on idle)
    SessionDialogueCache.addTurn(username, agentId, userMessage, responseText);

    // 2. Persist ONLY compact state (facts learned, quest progression, turns count) to SQLite
    db.updateAgentMemory(username, agentId, mem => {
      mem.turnsCount = (mem.turnsCount || 0) + 1;
      // Never store bulky conversational transcripts in SQLite!
      mem.history = [];

      // Only mark facts present in the answer; asking a question is not learning it.
      const lower = responseText.toLowerCase();
      mem.factsKnown = mem.factsKnown || [];
      mem.discussedTopics = mem.discussedTopics || [];

      for (const fact of (persona.factsCatalog || [])) {
        if (!mem.factsKnown.includes(fact.id) &&
            (lower.includes(fact.text.toLowerCase()) || lower.includes(fact.title.toLowerCase()))) {
          mem.factsKnown.push(fact.id);
          if (!mem.discussedTopics.includes(fact.title)) {
            mem.discussedTopics.push(fact.title);
          }
        }
      }

      mem.lastTopic = userMessage.trim().slice(0, 60);
    });
  }
}

// Compatible version of the team's STORY -> RIDDLE -> DONE state machine.
// Uses existing server storage rather than a volatile Map.
export const memory = {
  getNextFact(playerId, npcId, npcData) {
    const persona = AGENT_PERSONAS[npcId];
    if (!persona) throw new Error('Персонаж не найден');
    const state = db.getAgentMemory(playerId, npcId);
    const next = (persona.factsCatalog || []).find(f => !state.factsKnown.includes(f.id));
    if (state.lessonState === 'DONE') {
      return { type: 'DONE', text: 'Вы уже решили мою загадку. Можем продолжить разговор по моему предмету.' };
    }
    if (!next) {
      db.updateAgentMemory(playerId, npcId, m => { m.lessonState = 'RIDDLE'; });
      return { type: 'RIDDLE', text: `Мы уже обсудили основные темы. Теперь вопрос: ${persona.riddle}`, isLastFact: true };
    }
    db.updateAgentMemory(playerId, npcId, m => { m.lessonState = 'STORY'; });
    return { type: 'STORY', text: `${state.turnsCount ? 'Продолжим нашу беседу. ' : ''}${next.title}. ${next.text}`, factId: next.id };
  },

  checkRiddle(playerId, npcId, answer) {
    const persona = AGENT_PERSONAS[npcId];
    const state = db.getAgentMemory(playerId, npcId);
    if (!persona || state.lessonState !== 'RIDDLE') {
      return { isCorrect: false, message: 'Я пока не задавал вам загадку.' };
    }
    const normalized = String(answer).trim().toLowerCase().replace(/[.!?]+$/, '');
    const words = {
      '0': ['ноль', 'нулю', 'zero'],
      '2': ['два', 'две', 'вторая', 'второй'],
      '3': ['три'],
      '7': ['семь']
    };
    const isCorrect = normalized === persona.codeDigit || (words[persona.codeDigit] || []).includes(normalized);
    if (isCorrect) {
      db.updateAgentMemory(playerId, npcId, m => { m.lessonState = 'DONE'; });
    }
    return {
      isCorrect,
      message: isCorrect
        ? 'Верно! Вы решили мою учебную загадку. Это отдельная задача, код сейфа ищите в четырёх предметах.'
        : `Пока неверно. Попробуйте ещё раз: ${persona.riddle}`
    };
  }
};
