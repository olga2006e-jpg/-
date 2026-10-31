import { AGENT_PERSONAS } from './personalities.js';
import { MemoryManager, memory as lessonMemory } from './memory.js';

// OLLAMA_URL is supported for compatibility with the team's supplied service.
const OLLAMA_HOST = (process.env.OLLAMA_HOST || process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';

async function askOllama(persona, prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({model: OLLAMA_MODEL, stream: false,
        messages: [{role: 'system', content: persona.systemPrompt}, {role: 'user', content: prompt}],
        options: {temperature: 0.7, num_predict: 120}}),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    const text = data.message?.content?.trim();
    if (!text) throw new Error('Ollama returned an empty answer');
    return text;
  } finally { clearTimeout(timer); }
}

// Keep the interface used by the team's standalone service.
export async function generateResponse(npcId, userText, context = '') {
  const npc = AGENT_PERSONAS[npcId];
  if (!npc) throw new Error('Персонаж не найден');
  try {
    return {text: await askOllama(npc, context ? `${context}\nИгрок: ${userText}` : userText), source: 'ollama'};
  } catch {
    // Stateful fallback is selected by AgentService.chat, never by random chance.
    return {text: `${npc.factsCatalog[0].title}. ${npc.factsCatalog[0].text}`, source: 'fallback'};
  }
}

export class AgentService {
  static async chat(username, agentId, userMessage) {
    if (!AGENT_PERSONAS[agentId]) throw new Error('Персонаж не найден');
    const {prompt, memory, persona} = MemoryManager.buildPrompt(username, agentId, userMessage);
    let reply, usedLLM = false;
    if (memory.lessonState === 'RIDDLE') {
      reply = lessonMemory.checkRiddle(username, agentId, userMessage).message;
    } else if (persona.riddle && memory.lessonState !== 'DONE' &&
               persona.factsCatalog.every(f => memory.factsKnown.includes(f.id))) {
      reply = lessonMemory.getNextFact(username, agentId, persona).text;
    } else {
      const result = await generateResponse(agentId, userMessage, prompt);
      usedLLM = result.source === 'ollama';
      reply = result.text;
      if (!usedLLM) {
        if (memory.lessonState === 'DONE') {
          const lower = userMessage.toLowerCase();
          const fact = persona.factsCatalog.find(f => f.title.toLowerCase().split(/\s+/).some(w => w.length > 4 && lower.includes(w))) || persona.factsCatalog[0];
          reply = `Загадку вы уже решили. Вернёмся к предмету: ${fact.title}. ${fact.text}`;
        } else reply = lessonMemory.getNextFact(username, agentId, persona).text;
      }
    }
    MemoryManager.recordResponse(username, agentId, userMessage, reply);
    return {agentId, agentName: persona.name, reply, usedLLM,
      knownFactsCount: memory.factsKnown.length, turnsCount: memory.turnsCount,
      lessonState: memory.lessonState || 'STORY'};
  }
}
