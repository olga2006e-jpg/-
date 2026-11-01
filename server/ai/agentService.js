// server/ai/agentService.js — Прямое подключение к Ollama (Qwen) на IP 172.16.236.14
import { personalities, AGENT_PERSONAS } from './personalities.js';
import { evaluate } from 'mathjs';
import { MemoryManager } from './memory.js';

export function classifyIntentActions(userText) {
  const lower = (userText || '').toLowerCase();
  const actions = [];
  if (lower.match(/застрял|помог|где искать|освети|маяк|свет|не вижу|темно|сейф|дорогу/)) {
    actions.push('SPAWN_LIGHT_BEAM');
  }
  if (lower.match(/портал|телепорт|перенеси|врата/)) {
    actions.push('SPAWN_PORTAL');
  }
  return actions;
}

export const getOllamaHost = () =>
  (process.env.OLLAMA_HOST || process.env.OLLAMA_URL || "http://172.16.236.14:11434").replace(/\/$/, '');

export const getOllamaModel = () =>
  process.env.OLLAMA_MODEL || "qwen2.5:0.5b";

export const BACKUP_OLLAMA_HOST = "http://127.0.0.1:11434";

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

/**
 * Прямой запрос к Qwen в Ollama
 */
async function fetchChat(host, model, npc, prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2200);

  try {
    const res = await fetch(`${host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        stream: false,
        messages: [
          { role: "system", content: npc.systemPrompt || "Ты бауманский преподаватель. Отвечай кратко, по делу и с характером." },
          { role: "user", content: prompt }
        ],
        options: { temperature: 0.7, num_predict: 100 }
      }),
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return (data.message?.content || data.response || "").trim();
  } finally {
    clearTimeout(timer);
  }
}

export async function askOllama(npc, prompt) {
  const host = getOllamaHost();
  const model = getOllamaModel();
  try {
    console.log(`[AI-Ollama] Запрос к ${host} (модель: ${model})...`);
    return await fetchChat(host, model, npc, prompt);
  } catch (errPrimary) {
    if (host !== BACKUP_OLLAMA_HOST) {
      try {
        console.log(`[AI-Ollama] Пробуем локальный хост ${BACKUP_OLLAMA_HOST}...`);
        return await fetchChat(BACKUP_OLLAMA_HOST, model, npc, prompt);
      } catch (errLocal) {}
    }
    throw errPrimary;
  }
}

function generateSmartFallback(npc, userText) {
  const lower = (userText || '').toLowerCase();
  const id = npc.id || '';

  if (lower.match(/привет|здравствуй|добрый день|салют/)) {
    if (id === 'kanev') return "Ты умеешь говорить? Ну, говори! Не молчи! Быстрее, к сути вопроса!";
    if (id === 'korshunov') return "О, привет! Слушай, а ты в бар не хочешь? После пар как раз обсудим микросервисы!";
    if (id === 'maslennikov') return "Почему вас не было на лекции Спиридонова? ОК, слушаю вас. И телефоны убрали!";
  }

  if (lower.match(/osi|уровн|сеть|tcp|udp|маск/)) {
    return "В модели OSI ровно 7 уровней. TCP гарантирует надёжность через 3-way handshake, а UDP — скорость. В маске /24 доступно 254 хоста.";
  }
  if (lower.match(/acid|cap|баз данных|бд/)) {
    return "В ACID буква 'A' — это атомарность ('всё или ничего'). По теореме CAP распределённая система гарантирует максимум 2 свойства из 3.";
  }
  if (lower.match(/предел|производн|матриц|детерминант/)) {
    return "Первый замечательный предел lim sin(x)/x = 1 при x -> 0. Производная e^(2x) равна 2*e^(2x). А матрица с det=0 — вырожденная!";
  }

  const pool = npc.greetingCatchphrases || npc.fallback || ["Слушаю вас внимательно. Задавайте вопрос по существу."];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateResponse(npcId, userText, context = "", contextType = "STORY") {
  const npc = personalities[npcId] || AGENT_PERSONAS[npcId];
  if (!npc) throw new Error("Персонаж не найден");

  // Математический мгновенный ответ
  const mathResult = trySolveMath(userText);
  if (mathResult && npcId !== 'kanev') {
    return { text: 'Точные вычисления выполняет Канев. Обратитесь к нему у входа.', source: 'routing', provider: 'mathjs', actions: [] };
  }
  if (mathResult) {
    return { text: `Верно! ${mathResult.expression} действительно равно ${mathResult.result}. С математикой порядок!`, source: "mathjs", provider: 'mathjs', actions: [] };
  }

  const fullPrompt = context ? `[Контекст: ${context}]\nСтудент спрашивает: ${userText}` : userText;

  try {
    const rawText = await askOllama(npc, fullPrompt);
    let { cleanText, actions } = extractActions(rawText);
    if (actions.length === 0) actions = classifyIntentActions(userText);
    if (!cleanText) cleanText = generateSmartFallback(npc, userText);

    console.log(`[AI-Ollama] Ответ от Qwen получен успешно!`);
    return {
      text: cleanText,
      source: "ollama",
      provider: `ollama:${getOllamaModel()}`,
      actions
    };
  } catch (error) {
    console.warn(`[AI-Fallback] ${error.message}. Включен встроенный ответ.`);
    const fallbackText = generateSmartFallback(npc, userText);
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
          m === model || m.startsWith(`${model}:`) || m.startsWith(model.split(':')[0])
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
      actions: res.actions || [],
      usedLLM: res.source === 'ollama',
      provider: res.provider,
      turnsCount: mem ? mem.turnsCount : 1
    };
  }
}
