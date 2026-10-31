import { AGENT_PERSONAS } from './personalities.js';
import { MemoryManager } from './memory.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

export class AgentService {
  static async chat(username, agentId, userMessage) {
    const { prompt, memory, persona } = MemoryManager.buildPrompt(username, agentId, userMessage);

    let reply = '';
    let usedLLM = false;

    // 1. Try local Ollama inference
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 120
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        reply = (data.response || '').trim();
        if (reply) {
          usedLLM = true;
          console.log(`[AI-Ollama] Response generated for ${username} by ${persona.name}`);
        }
      }
    } catch (err) {
      // Ollama not reachable or timed out -> fallback smoothly
      // Do not log spam, keep terse
    }

    // 2. Adaptive fallback engine if Ollama was unreachable
    if (!reply) {
      reply = this.generateAdaptiveFallback(persona, memory, userMessage);
      console.log(`[AI-Engine] Adaptive rule response for ${username} by ${persona.name}`);
    }

    // 3. Save memory and state
    MemoryManager.recordResponse(username, agentId, userMessage, reply);

    return {
      agentId,
      agentName: persona.name,
      reply,
      usedLLM,
      knownFactsCount: (memory.factsKnown || []).length,
      turnsCount: (memory.turnsCount || 0) + 1
    };
  }

  static generateAdaptiveFallback(persona, memory, userMessage) {
    const knownSet = new Set(memory.factsKnown || []);
    const remainingFacts = persona.factsCatalog.filter(f => !knownSet.has(f.id));

    // Acknowledge repetition if player already talked a lot
    let prefix = '';
    if (memory.turnsCount === 0) {
      prefix = 'Приветствую! ';
    } else if (memory.turnsCount === 1) {
      prefix = 'Рад продолжить наш разговор. ';
    } else if (memory.turnsCount > 2) {
      prefix = `Мы уже обсудили немало тайн, ${memory.username}. `;
    }

    if (remainingFacts.length > 0) {
      const nextFact = remainingFacts[0];
      return `${prefix}Знаешь ли ты: ${nextFact.title}? ${nextFact.text} Что ты об этом думаешь?`;
    }

    // If all facts learned
    const rand = persona.fallbackResponses[Math.floor(Math.random() * persona.fallbackResponses.length)];
    return `${prefix}${rand}`;
  }
}
