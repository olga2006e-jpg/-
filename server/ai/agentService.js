import { AGENT_PERSONAS } from './personalities.js';
import { MemoryManager, memory as lessonMemory } from './memory.js';

export const getOllamaHost = () =>
  (process.env.OLLAMA_HOST || process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');

export const getOllamaModel = () =>
  process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';

export async function askOllama(persona, prompt) {
  const host = getOllamaHost();
  const model = getOllamaModel();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: persona.systemPrompt },
          { role: 'user', content: prompt }
        ],
        options: { temperature: 0.7, num_predict: 120 }
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    const text = data.message?.content?.trim();
    if (!text) throw new Error('Ollama returned an empty answer');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// Keep the interface used by the team's standalone service.
export async function generateResponse(npcId, userText, context = '') {
  const npc = AGENT_PERSONAS[npcId];
  if (!npc) throw new Error('Персонаж не найден');
  try {
    return {
      text: await askOllama(npc, context ? `${context}\nИгрок: ${userText}` : userText),
      source: 'ollama'
    };
  } catch {
    return {
      text: `${npc.factsCatalog[0].title}. ${npc.factsCatalog[0].text}`,
      source: 'fallback'
    };
  }
}

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
    if (!AGENT_PERSONAS[agentId]) throw new Error(`Unknown agent persona: "${agentId}"`);
    const { prompt, memory, persona } = MemoryManager.buildPrompt(username, agentId, userMessage);
    const model = getOllamaModel();

    let reply = '';
    let usedLLM = false;
    let provider = 'heuristic_rule_engine';

    if (memory.lessonState === 'RIDDLE') {
      reply = lessonMemory.checkRiddle(username, agentId, userMessage).message;
    } else if (
      persona.riddle &&
      memory.lessonState !== 'DONE' &&
      persona.factsCatalog.length > 0 &&
      persona.factsCatalog.every(f => memory.factsKnown.includes(f.id))
    ) {
      reply = lessonMemory.getNextFact(username, agentId, persona).text;
    } else {
      // Try local Ollama inference
      try {
        const text = await askOllama(persona, prompt);
        if (text) {
          reply = text;
          usedLLM = true;
          provider = `ollama:${model}`;
          console.log(`[AI-Ollama] Response generated for ${username} by ${persona.name}`);
        }
      } catch (err) {
        // Fall back gracefully
      }

      if (!usedLLM) {
        if (memory.lessonState === 'DONE') {
          const lower = userMessage.toLowerCase();
          const fact =
            persona.factsCatalog.find(f =>
              f.title.toLowerCase().split(/\s+/).some(w => w.length > 4 && lower.includes(w))
            ) || persona.factsCatalog[0];
          reply = `Загадку вы уже решили. Вернёмся к предмету: ${fact.title}. ${fact.text}`;
        } else if (persona.factsCatalog && persona.factsCatalog.length > 0 && persona.riddle) {
          reply = lessonMemory.getNextFact(username, agentId, persona).text;
        } else {
          reply = this.generateAdaptiveFallback(persona, memory, userMessage);
        }
        console.log(`[AI-Engine] Adaptive rule response for ${username} by ${persona.name}`);
      }
    }

    // Save memory and dialogue history
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
      turnsCount: updatedMemory.turnsCount || 1,
      lessonState: updatedMemory.lessonState || 'STORY'
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
    for (const fact of (persona.factsCatalog || [])) {
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
    const remainingFacts = (persona.factsCatalog || []).filter(f => !knownSet.has(f.id));
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
