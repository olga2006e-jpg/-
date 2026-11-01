// server/ai/agentService.js
import { personalities, AGENT_PERSONAS } from './personalities.js';
import { evaluate } from 'mathjs';
import { MemoryManager } from './memory.js';

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

const LOCAL_OLLAMA = "http://127.0.0.1:11434";

let cachedHost = null;
let cachedModel = null;
let lastEnvHost = null;
let lastDetectionTime = 0;

/**
 * Автоматически находит работающий Ollama-сервер и доступную модель.
 * Сначала проверяет переданный OLLAMA_HOST / OLLAMA_URL (если есть), затем localhost.
 * Если модель qwen2.5:0.5b отсутствует, автоматически выбирает любую доступную модель.
 */
export async function detectActiveOllama() {
  const currentEnvHost = process.env.OLLAMA_URL || process.env.OLLAMA_HOST || null;
  const now = Date.now();

  // Если изменился OLLAMA_HOST в процессе (например в тестах) — сбрасываем кэш
  if (currentEnvHost !== lastEnvHost) {
    cachedHost = null;
    cachedModel = null;
    lastEnvHost = currentEnvHost;
  } else if (cachedHost && (now - lastDetectionTime < 15000)) {
    return { host: cachedHost, model: cachedModel };
  }

  const candidateHosts = [];
  if (currentEnvHost) candidateHosts.push(currentEnvHost.replace(/\/$/, ''));
  if (!candidateHosts.includes(LOCAL_OLLAMA)) candidateHosts.push(LOCAL_OLLAMA);

  const preferredModel = process.env.OLLAMA_MODEL || "qwen2.5:0.5b";

  for (const host of candidateHosts) {
    try {
      const res = await fetch(`${host}/api/tags`, {
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) {
        const data = await res.json();
        const models = Array.isArray(data.models) ? data.models.map(m => m.name) : [];
        if (models.length > 0) {
          const match = models.find(m =>
            m === preferredModel ||
            m.startsWith(preferredModel) ||
            m.startsWith(preferredModel.split(':')[0])
          );
          cachedModel = match || models[0];
          cachedHost = host;
          lastDetectionTime = now;
          console.log(`[AI-Detector] Найдена активная Ollama на ${cachedHost} с моделью "${cachedModel}"`);
          return { host: cachedHost, model: cachedModel };
        }
      }
    } catch (e) {
      // Хост недоступен, пробуем следующий
    }
  }

  cachedHost = null;
  cachedModel = null;
  lastDetectionTime = now;
  return { host: null, model: null };
}

export const getOllamaHost = () => {
  return cachedHost || process.env.OLLAMA_URL || process.env.OLLAMA_HOST || LOCAL_OLLAMA;
};

export const getOllamaModel = () => {
  return cachedModel || process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
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

async function fetchChatFromHost(host, model, npc, finalPrompt) {
  const response = await fetch(`${host}/api/chat`, {
    signal: AbortSignal.timeout(4500),
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
  const { host, model } = await detectActiveOllama();
  if (!host || !model) {
    throw new Error("Ollama недоступна локально или в сети");
  }

  let moodPrompt = "";
  if (npc.mood === 'helpful') moodPrompt = "СИСТЕМНАЯ ИНСТРУКЦИЯ: Будь максимально полезен. Прямо намекни на цифру кода. ";
  else if (npc.mood === 'strict') moodPrompt = "СИСТЕМНАЯ ИНСТРУКЦИЯ: Будь строг. Не давай прямых ответов, заставляй думать. ";

  let promptPrefix = "";
  if (contextType === "TASK") promptPrefix = "Сейчас ты задаешь задачу. Не решай её. ";
  if (contextType === "RIDDLE") promptPrefix = "Сейчас ты загадываешь загадку. ";

  const finalPrompt = promptPrefix + moodPrompt + userText;
  const text = await fetchChatFromHost(host, model, npc, finalPrompt);
  return { text, model };
}

/**
 * Интеллектуальный эвристический генератор ответов,
 * если на ноутбуке не запущена LLM (работает мгновенно и соответствует характеру препода)
 */
function generateSmartHeuristicResponse(npc, userText) {
  const lower = (userText || '').toLowerCase();
  const id = npc.id || '';

  // 1. Проверка на приветствие
  if (lower.match(/привет|здравствуй|добрый день|салют|хай/)) {
    if (id === 'kanev') {
      return "Ты умеешь говорить? Ну, говори! Не молчи! Время консультации идёт, сразу к сути!";
    }
    if (id === 'korshunov') {
      return "О, привет! Слушай, а ты в бар не хочешь? После пар как раз обсудим микросервисы и распределенные системы!";
    }
    if (id === 'maslennikov') {
      return "Почему вас не было на лекции Спиридонова? ОК, слушаю ваш вопрос. И телефоны убрали!";
    }
  }

  // 2. Тематические ответы по ключевым словам предметов
  if (lower.match(/osi|уровн|сеть|tcp|udp|ip|маск/)) {
    return "Транспортный уровень модели OSI (TCP и UDP) гарантирует надёжность через 3-way handshake или скорость. В подсети /24 доступно 254 полезных хоста.";
  }
  if (lower.match(/acid|cap|баз данных|бд|транзакц|http|201/)) {
    return "В ACID буква 'A' — это атомарность ('всё или ничего'). По теореме CAP распределённая система гарантирует максимум 2 свойства из 3. А код 201 Created подтверждает создание ресурса!";
  }
  if (lower.match(/предел|производн|матриц|детерминант|спиридонов/)) {
    return "Первый замечательный предел lim sin(x)/x = 1 при x -> 0. Производная e^(2x) равна 2*e^(2x). А матрица с нулевым определителем называется вырожденной!";
  }

  // 3. Подбор по фактам персонажа
  const matchingFact = (npc.facts || []).find(f => {
    const words = f.toLowerCase().split(/\s+/);
    return words.some(w => w.length > 3 && lower.includes(w));
  });
  if (matchingFact) {
    return `${matchingFact} Запомните это для сдачи зачёта!`;
  }

  // 4. Случайная характерная реплика преподавателя
  const pool = npc.greetingCatchphrases || npc.fallback || ["Слушаю вас внимательно. Задавайте вопрос по существу."];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateResponse(npcId, userText, context = "", contextType = "STORY") {
  const npc = personalities[npcId] || AGENT_PERSONAS[npcId];
  if (!npc) throw new Error("Персонаж не найден");

  const mathResult = trySolveMath(userText);
  if (mathResult && npcId !== 'kanev') {
    return {
      text: 'Точные вычисления выполняет Канев. Обратитесь к нему у входа.',
      source: 'routing',
      provider: 'mathjs',
      actions: []
    };
  }
  if (mathResult) {
    return {
      text: `Верно! ${mathResult.expression} действительно равно ${mathResult.result}. С математикой порядок!`,
      source: "mathjs",
      provider: 'mathjs',
      actions: []
    };
  }

  let fullPrompt = context ? `[Тема: ${context}] Игрок говорит: ${userText}` : userText;

  try {
    const { text: rawText, model: usedModel } = await askOllama(npc, fullPrompt, contextType);

    let { cleanText, actions } = extractActions(rawText);
    if (actions.length === 0) actions = classifyIntentActions(userText);

    if (!cleanText && actions.length > 0) {
      cleanText = "Я слышу вас. Взгляните туда, куда укажет свет!";
    } else if (!cleanText) {
      cleanText = generateSmartHeuristicResponse(npc, userText);
    }

    console.log(`[AI-Ollama] Ответ сгенерирован LLM (${usedModel}). Действия: [${actions.join(', ')}]`);
    return {
      text: cleanText,
      source: "ollama",
      provider: `ollama:${usedModel}`,
      actions
    };

  } catch (error) {
    console.warn(`[AI-Fallback] Ollama недоступна (${error.message}). Включен мгновенный встроенный движок персонажа.`);
    const fallbackText = generateSmartHeuristicResponse(npc, userText);
    const actions = classifyIntentActions(userText);
    return {
      text: fallbackText,
      source: "fallback",
      provider: "heuristic_rule_engine",
      actions
    };
  }
}

export class AgentService {
  static async checkOllamaHealth() {
    const { host, model } = await detectActiveOllama();
    return {
      host: host || LOCAL_OLLAMA,
      modelTarget: model || process.env.OLLAMA_MODEL || "qwen2.5:0.5b",
      serviceAvailable: Boolean(host),
      modelPresent: Boolean(model),
      availableModels: model ? [model] : [],
      error: host ? null : "Ollama не запущена локально (включен встроенный эвристический движок)"
    };
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
      actions: res.actions || [],
      usedLLM: res.source === 'ollama',
      provider: res.provider,
      turnsCount: mem ? mem.turnsCount : 1
    };
  }
}
