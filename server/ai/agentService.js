export function classifyIntentActions(userText) {
  const lower = (userText || '').toLowerCase();
  const actions = [];
  if (lower.match(/застрял|помог|где искать|освети|маяк|свет|не вижу|темно|сейф|дорогу/)) {
    actions.push('SPAWN_LIGHT_BEAM');
  }
  if (lower.match(/сервер|стойк|датацентр|вычисли|компьютер|кластер/)) {
    actions.push('SPAWN_SERVER_RACK');
  }
  if (lower.match(/портал|телепорт|перенеси|врата/)) {
    actions.push('SPAWN_PORTAL');
  }
  return actions;
}

// server/ai/agentService.js
import { personalities, AGENT_PERSONAS } from './personalities.js';
import { evaluate } from 'mathjs';
import { MemoryManager } from './memory.js';

const DEFAULT_REMOTE_OLLAMA = "http://172.16.236.14:11434";
const LOCAL_OLLAMA = "http://127.0.0.1:11434";

export const getOllamaHost = () => {
  return (process.env.OLLAMA_URL || process.env.OLLAMA_HOST || DEFAULT_REMOTE_OLLAMA).replace(/\/$/, '');
};

export const getOllamaModel = () => {
  return process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
};

function trySolveMath(text) {
  const mathRegex = /[-+]?[0-9]*\.?[0-9]+(?:[\/\^\*\+\-][0-9\.]+)+/g;
  const matches = text.match(mathRegex);
  if (!matches) return null;
  try {
    return { expression: matches[0], result: evaluate(matches[0]).toString() };
  } catch (e) {
    return null;
  }
}

function extractActions(text) {
  const actionRegex = /\[ACTION:\s*([A-Z_]+)\]/g;
  const actions = [];
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    actions.push(match[1]);
  }
  const cleanText = text.replace(actionRegex, '').trim();
  return { cleanText, actions };
}

async function fetchChatFromHost(host, npc, finalPrompt) {
  const model = getOllamaModel();
  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: npc.systemPrompt },
        { role: "user", content: finalPrompt }
      ],
      stream: false,
      options: { temperature: 0.5, num_predict: 80 }
    })
  });

  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  return (data.message?.content || data.response || "").trim();
}

async function askOllama(npc, userText, contextType) {
  let moodPrompt = "";
  if (npc.mood === 'helpful') moodPrompt = "СИСТЕМНАЯ ИНСТРУКЦИЯ: Будь максимально полезен. Прямо намекни на цифру кода. ";
  else if (npc.mood === 'strict') moodPrompt = "СИСТЕМНАЯ ИНСТРУКЦИЯ: Будь строг. Не давай прямых ответов, заставляй думать. ";

  let promptPrefix = "";
  if (contextType === "TASK") promptPrefix = "Сейчас ты задаешь задачу. Не решай её. ";
  if (contextType === "RIDDLE") promptPrefix = "Сейчас ты загадываешь загадку. ";

  const finalPrompt = promptPrefix + moodPrompt + userText;
  const primaryHost = getOllamaHost();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      return await fetchChatFromHost(primaryHost, npc, finalPrompt);
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    // If remote host fails and differs from localhost, try localhost as backup
    if (primaryHost !== LOCAL_OLLAMA) {
      try {
        return await fetchChatFromHost(LOCAL_OLLAMA, npc, finalPrompt);
      } catch (localErr) {
        throw err;
      }
    }
    throw err;
  }
}

export async function generateResponse(npcId, userText, context = "", contextType = "STORY") {
  const npc = personalities[npcId] || AGENT_PERSONAS[npcId];
  if (!npc) throw new Error("Персонаж не найден");

  // МАГИЯ MATHJS: Мгновенный ответ без нейросети
  const mathResult = trySolveMath(userText);
  if (mathResult) {
    console.log(`[AI-Mathjs] Мгновенный ответ на ${mathResult.expression}`);
    return { 
      text: `Верно! ${mathResult.expression} действительно равно ${mathResult.result}. Ты отлично справляешься, мой юный математик!`, 
      source: "mathjs", 
      actions: [] 
    };
  }

  let fullPrompt = context ? `[Тема: ${context}] Игрок говорит: ${userText}` : userText;

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
    const rawText = await Promise.race([
      askOllama(npc, fullPrompt, contextType),
      timeoutPromise
    ]);

    // Извлекаем действия и очищаем текст
    let { cleanText, actions } = extractActions(rawText);
    if (actions.length === 0) actions = classifyIntentActions(userText);
    
    // === Если нейросеть написала только тег, подставляем текст ===
    if (!cleanText && actions.length > 0) {
      cleanText = "Я чувствую твою растерянность... Позволь мне помочь. Взгляни туда, куда укажет свет!";
    } else if (!cleanText) {
      cleanText = "Хм, мои мысли разбегаются... Задай вопрос еще раз!";
    }

    console.log(`[AI-Ollama] Response generated. Actions: [${actions.join(', ')}]`);
    return { text: cleanText, source: "ollama", actions };

  } catch (error) {
    console.warn(`[AI-Fallback] Ollama failed: ${error.message}. Using fallback.`);
    let fallbackText = "";
    const lower = userText.toLowerCase();

    // Contextual matching for heuristic fallback
    const matchingFact = (npc.facts || []).find(f => {
      const words = f.toLowerCase().split(/\s+/);
      return words.some(w => w.length > 3 && lower.includes(w));
    });

    if (matchingFact) {
      fallbackText = `Приветствую! По этому вопросу: ${matchingFact} В сетях TCP и модели OSI важен каждый уровень.`;
    } else {
      const fallbackList = npc.fallback || npc.fallbackResponses || ["Призрак задумался..."];
      fallbackText = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    }

    let actions = classifyIntentActions(userText);
    return { text: fallbackText, source: "fallback", actions };
  }
}

// AgentService class with health check and chat compatibility
export class AgentService {
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

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${host}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);

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
      status.error = err.message;
    }
    return status;
  }

  static async chat(username, agentId, userMessage) {
    const persona = personalities[agentId] || AGENT_PERSONAS[agentId];
    if (!persona) throw new Error(`Unknown persona ${agentId}`);

    const res = await generateResponse(agentId, userMessage);
    MemoryManager.recordResponse(username, agentId, userMessage, res.text);
    const mem = MemoryManager.getContext(username, agentId);

    return {
      agentId,
      agentName: persona.name,
      reply: res.text,
      usedLLM: res.source === 'ollama',
      provider: res.source === 'ollama' ? `ollama:${getOllamaModel()}` : 'heuristic_rule_engine',
      actions: res.actions || [],
      turnsCount: mem.turnsCount || 1,
      error: false
    };
  }
}
