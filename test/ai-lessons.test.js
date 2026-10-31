import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-ai-'));
process.env.GAME_DATA_DIR = testDirectory;
process.env.OLLAMA_HOST = 'http://127.0.0.1:1';
const { AgentService } = await import('../server/ai/agentService.js');
const { AGENT_PERSONAS } = await import('../server/ai/personalities.js');
const { db } = await import('../server/db.js');

test.after(() => {
  // Delete only the file this suite creates, then its empty temporary directory.
  fs.unlinkSync(path.join(testDirectory, 'gameState.json'));
  fs.rmdirSync(testDirectory);
});

test('offline lessons remember facts, reject wrong riddles, and survive reload', async () => {
  const persona = AGENT_PERSONAS.kanev;
  for (let i = 0; i < persona.factsCatalog.length; i++) {
    const result = await AgentService.chat('Ada', 'kanev', 'Продолжим');
    assert.equal(result.usedLLM, false);
    assert.equal(result.knownFactsCount, i + 1);
    assert.equal(result.turnsCount, i + 1);
    assert(result.reply.includes(persona.factsCatalog[i].text));
  }
  const riddle = await AgentService.chat('Ada', 'kanev', 'Дальше');
  assert.equal(riddle.lessonState, 'RIDDLE');
  assert(riddle.reply.includes(persona.riddle));
  const wrong = await AgentService.chat('Ada', 'kanev', '999');
  assert.equal(wrong.lessonState, 'RIDDLE');
  assert(wrong.reply.includes('неверно'));
  const correct = await AgentService.chat('Ada', 'kanev', '7');
  assert.equal(correct.lessonState, 'DONE');
  assert(correct.reply.includes('Верно'));
  db.data.agentMemory = {};
  db.load();
  assert.equal(db.getAgentMemory('Ada', 'kanev').lessonState, 'DONE');
  const other = await AgentService.chat('Grace', 'kanev', 'Здравствуйте');
  assert.equal(other.knownFactsCount, 1);
  assert.equal(other.turnsCount, 1);
  const otherNPC = await AgentService.chat('Ada', 'akhmetova', 'Здравствуйте');
  assert.equal(otherNPC.knownFactsCount, 1);
  assert.equal(otherNPC.turnsCount, 1);
});

test('Ollama chat response retains frontend protocol and actual source', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert(url.endsWith('/api/chat'));
      assert(options.signal instanceof AbortSignal);
      const body = JSON.parse(options.body);
      assert.equal(body.stream, false);
      assert(body.messages[0].content.includes('Эйнштейна'));
      return { ok: true, json: async () => ({message: {content: 'Это ответ тестовой модели.'}}) };
    };
    const result = await AgentService.chat('LLMTest', 'einstein', 'Что такое время?');
    assert.equal(result.usedLLM, true);
    assert.equal(result.reply, 'Это ответ тестовой модели.');
    assert.equal(result.turnsCount, 1);
    assert.equal(result.knownFactsCount, 0);
  } finally { globalThis.fetch = originalFetch; }
});
