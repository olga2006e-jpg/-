import { AGENT_PERSONAS } from './personalities.js';
import { MemoryManager } from './memory.js';

export const getOllamaHost = () => process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
export const getOllamaModel = () => process.env.OLLAMA_MODEL || 'qwen2.5:3b';

export class AgentService {
  /**
   * Check Ollama connectivity and whether the requested model is pulled and ready.
   * Completely separated from query execution for health checks and /api/status.
   */
  static async checkOllamaHealth() {
    const host = getOllamaHost();
    const model = getOllamaModel();
    const status = {
      host,
      modelTarget: model,
      serviceAvailable: false,
      modelPresent: false,
      availableModels: [],
      error: null
    };

    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 2000);
      if (timeoutId && typeof timeoutId.unref === 'function') {
        timeoutId.unref();
      }

      const res = await fetch(`${host}/api/tags`, {
        signal: controller.signal
      });

      if (res.ok) {
        status.serviceAvailable = true;
        const data = await res.json();
        const models = Array.isArray(data.models) ? data.models.map(m => m.name) : [];
        status.availableModels = models;
        status.modelPresent = models.some(m =>
          m === model ||
          m.startsWith(`${model}:`) ||
          m.startsWith(model.split(':')[0])
        );
      } else {
        status.error = `HTTP ${res.status}`;
      }
    } catch (err) {
      status.serviceAvailable = false;
      status.error = err.name === 'AbortError' ? 'Connection timeout (2s)' : err.message;
    } finally {
      clearTimeout(timeoutId);
    }

    return status;
  }

  /**
   * Main interaction entry point with timeout, safe fallback, and adaptive state updates.
   */
  static async chat(username, agentId, userMessage) {
    const persona = AGENT_PERSONAS[agentId] || AGENT_PERSONAS.einstein;
    const { prompt, memory } = MemoryManager.buildPrompt(username, agentId, userMessage);

    let reply = '';
    let usedLLM = false;
    let provider = 'heuristic_rule_engine';
    const host = getOllamaHost();
    const model = getOllamaModel();

    // 1. Attempt local Ollama inference
    let timeoutId = null;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10s max
      if (timeoutId && typeof timeoutId.unref === 'function') {
        timeoutId.unref();
      }

      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 140
          }
        }),
        signal: controller.signal
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = (data.response || '').trim();
        if (rawText) {
          reply = rawText;
          usedLLM = true;
          provider = `ollama:${model}`;
          console.log(`[AI-Ollama] Response generated for ${username} by ${persona.name}`);
        }
      }
    } catch (err) {
      // Offline, unreachable, or timed out: fall back seamlessly without crashing
    } finally {
      clearTimeout(timeoutId);
    }

    // 2. Deterministic Adaptive Fallback (Heuristic Rule Engine)
    // NEVER calls itself an LLM! Considers question topic and memory.
    if (!reply) {
      reply = this.generateAdaptiveFallback(persona, memory, userMessage);
      usedLLM = false;
      provider = 'heuristic_rule_engine';
      console.log(`[AI-Engine] Adaptive rule response for ${username} by ${persona.name}`);
    }

    // 3. Save memory and dialogue history
    MemoryManager.recordResponse(username, agentId, userMessage, reply);
    const updatedMemory = MemoryManager.getContext(username, agentId);

    return {
      agentId,
      agentName: persona.name,
      reply,
      usedLLM,
      provider,
      knownFactsCount: (updatedMemory.factsKnown || []).length,
      discussedTopics: updatedMemory.discussedTopics || [],
      turnsCount: updatedMemory.turnsCount || 1
    };
  }

  /**
   * Local Rule Engine:
   * - Considers question keywords and topics
   * - Considers player memory and prior turns
   * - Does NOT call itself an LLM
   */
  static generateAdaptiveFallback(persona, memory, userMessage) {
    const knownSet = new Set(memory.factsKnown || []);
    const userLower = (userMessage || '').toLowerCase();

    // 1. Check if user is asking about a specific catalog fact
    for (const fact of persona.factsCatalog) {
      const keywords = [
        ...(fact.keywords || []),
        ...fact.title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      ];
      if (keywords.some(kw => userLower.includes(kw))) {
        if (knownSet.has(fact.id)) {
          return `Мы уже касались темы "${fact.title}", коллега ${memory.username}. Напомню суть: ${fact.text} Что еще из неизведанного тебя интересует?`;
        } else {
          return `Именно об этом я и хотел поведать! По поводу "${fact.title}": ${fact.text} Запомни это, знание пригодится у Врат!`;
        }
      }
    }

    // 2. Conversation progress prefix
    let prefix = '';
    if (memory.turnsCount === 0) {
      prefix = `Приветствую в стенах Академии, ${memory.username}! `;
    } else if (memory.turnsCount === 1) {
      prefix = `Рад продолжить наш научный диспут. `;
    } else {
      const last = memory.lastTopic ? ` После наших размышлений о «${memory.lastTopic}» ` : ' ';
      prefix = `Мы уже обсудили немало тайн.${last}Давай углубимся дальше. `;
    }

    // 3. Offer next unlearned fact
    const remainingFacts = persona.factsCatalog.filter(f => !knownSet.has(f.id));
    if (remainingFacts.length > 0) {
      const nextFact = remainingFacts[0];
      return `${prefix}Знаешь ли ты, что говорит наука о таком явлении, как «${nextFact.title}»? ${nextFact.text}`;
    }

    // 4. All core facts learned -> give relevant clue or thematic wisdom
    if (persona.clue) {
      return `${prefix}Все ключевые принципы мы с тобой уже разобрали. Не забывай мою подсказку к Вратам: «${persona.clue}». Команда ждет твоих открытий!`;
    }

    const fallbacks = persona.fallbackResponses || ['Знания вечны, пока жив хотя бы один ищущий разум.'];
    const idx = (memory.turnsCount || 0) % fallbacks.length;
    return `${prefix}${fallbacks[idx]}`;
  }
}
