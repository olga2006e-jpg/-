// server/ai/memory.js
import { evaluate } from 'mathjs';
import { db } from '../db.js';
import { personalities, AGENT_PERSONAS } from './personalities.js';

const memoryStore = new Map();

export const memory = {
  getNextFact(playerId, npcId, npcData) {
    const key = `${playerId}_${npcId}`;

    if (!memoryStore.has(key)) {
      memoryStore.set(key, {
        factsKnown: [],
        visitCount: 0,
        state: "STORY", // STORY, TASK, RIDDLE, DONE
        lastTaskQuestion: null
      });
    }

    const playerState = memoryStore.get(key);
    playerState.visitCount += 1;

    // Если мы уже в процессе проверки задачи или загадки, не двигаем факты!
    if (playerState.state === "TASK" || playerState.state === "RIDDLE") {
      return {
        type: playerState.state,
        text: playerState.lastTaskQuestion || "Жду твой ответ.",
        isWaitingForAnswer: true
      };
    }

    // Если все факты рассказаны
    if (playerState.factsKnown.length >= (npcData.facts ? npcData.facts.length : 0)) {
      // Если есть задача и мы её еще не задавали
      if (npcData.task && playerState.state !== "TASK_DONE") {
        playerState.state = "TASK";
        playerState.lastTaskQuestion = npcData.task.question;
        return {
          type: "TASK",
          text: `Мы обсудили теорию. Теперь проверка знаний! ${npcData.task.question}`
        };
      }

      // Если задачи нет или она решена — переходим к загадке
      playerState.state = "RIDDLE";
      playerState.lastTaskQuestion = npcData.riddle;
      return {
        type: "RIDDLE",
        text: `Ты отлично справляешься! Но чтобы пройти дальше, ответь на мою загадку: ${npcData.riddle}`,
        isLastFact: true
      };
    }

    // Рассказываем следующий факт
    let nextFactIndex = 0;
    while (playerState.factsKnown.includes(nextFactIndex)) {
      nextFactIndex++;
    }

    playerState.factsKnown.push(nextFactIndex);
    const factText = npcData.facts[nextFactIndex] || (npcData.factsCatalog && npcData.factsCatalog[nextFactIndex]?.text) || "";

    let finalText = factText;
    if (playerState.visitCount > 1) {
      finalText = `О, мы уже виделись! Давай продолжим. ${factText}`;
    }

    return {
      type: "STORY",
      text: finalText,
      factIndex: nextFactIndex
    };
  },

  // Проверка ответа
  checkAnswer(playerId, npcId, answer, npcData) {
    const key = `${playerId}_${npcId}`;
    const playerState = memoryStore.get(key);

    if (!playerState) return null;

    // Если мы не в режиме задачи/загадки, нечего проверять
    if (playerState.state !== "TASK" && playerState.state !== "RIDDLE") {
      return null;
    }

    // Извлекаем все числа из ответа игрока
    const numbers = answer.match(/-?\d+(\.\d+)?/g);

    // ВАЖНО: Если числа нет — возвращаем null! 
    // Это скажет серверу, что игрок просто задал вопрос, и его надо отправить в ИИ.
    if (!numbers) {
      return null;
    }

    const playerAnswer = parseFloat(numbers[numbers.length - 1]);

    // Проверка задачи
    if (playerState.state === "TASK" && npcData.task) {
      if (Math.abs(playerAnswer - npcData.task.answer) < 0.01) {
        playerState.state = "TASK_DONE"; // Задача решена
        return {
          isCorrect: true,
          message: `Абсолютно верно! Ты хорошо усвоил материал. Но это еще не всё: ${npcData.riddle}`
        };
      } else {
        return {
          isCorrect: false,
          message: `Неверно. Подумай еще раз. (Подсказка: перечитай теорию).`
        };
      }
    }

    // Проверка загадки
    if (playerState.state === "RIDDLE") {
      const correctRiddleAnswer = parseFloat(npcData.codeDigit);

      if (playerAnswer === correctRiddleAnswer) {
        playerState.state = "DONE";
        return {
          isCorrect: true,
          message: `Верно! Забирай свой фрагмент кода: ${npcData.codeDigit}. Теперь иди к другим призракам!`
        };
      } else {
        return {
          isCorrect: false,
          message: `Неверно. Подумай внимательно над загадкой.`
        };
      }
    }

    return null;
  },

  clear() {
    memoryStore.clear();
  }
};

// MemoryManager for backward compatibility and test verification
export class MemoryManager {
  static getContext(username, agentId) {
    return db.getAgentMemory(username, agentId);
  }

  static buildPrompt(username, agentId, userMessage) {
    const persona = personalities[agentId] || AGENT_PERSONAS[agentId] || personalities.einstein;
    const mem = db.getAgentMemory(username, agentId);

    const prompt = `${persona.systemPrompt}\nИгрок: "${userMessage}"\n${persona.name}:`;
    return { prompt, memory: mem, persona };
  }

  static recordResponse(username, agentId, userMessage, responseText) {
    const persona = personalities[agentId] || AGENT_PERSONAS[agentId] || personalities.einstein;

    db.updateAgentMemory(username, agentId, mem => {
      mem.turnsCount = (mem.turnsCount || 0) + 1;
      mem.history = mem.history || [];
      mem.history.push({ role: 'user', content: userMessage });
      mem.history.push({ role: 'agent', content: responseText });
      if (mem.history.length > 10) {
        mem.history = mem.history.slice(-10);
      }
      mem.lastTopic = userMessage.trim().slice(0, 60);
    });
  }
}
