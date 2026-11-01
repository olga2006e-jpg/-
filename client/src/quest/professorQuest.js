/**
 * professorQuest.js — Модуль квеста «Сдача сессии трем преподавателям»
 *
 * 3 преподавателя:
 * 1. Канев К.Ю. — строгий, требовательный, но справедливый ("Ты умеешь говорить? Ну, говори! Не молчи!", "Быстрее!")
 * 2. Коршунов В.М. — много знает, любит поболтать, зовет в бар ("А ты в бар не хочешь?", "Когда в бар пойдем?")
 * 3. Масленников — добрый в душе, но вредный и делает вид строгого ("Почему вас не было на лекции Спиридонова", "ОК", "Если я увижу, что вы пишете лекции Канева на моей лекции, я их сожгу")
 *
 * Цель:
 * Ответить на 3 вопроса каждого преподавателя -> получить 3 зачёта.
 * При сборе всех 3 зачётов: экран победы «Поздравляем! Вы прошли игру!»
 */

export const PROFESSORS = {
  kanev: {
    id: 'kanev',
    name: 'Канев Константин Юрьевич',
    role: 'Преподаватель сетей и ОС',
    avatar: '👔',
    badgeColor: '#4a90e2',
    traits: 'Строгий и требовательный, но справедливый. Ценит скорость и конкретику.',
    greetings: [
      'Ты умеешь говорить? Ну, говори! Не молчи!',
      'Быстрее! Время консультации идёт, вопросы не ждут!',
      'Так, тянуть резину не выйдет. Сразу к делу!',
      'Не мямли, формулируй мысль чётко и по протоколу.'
    ],
    questions: [
      {
        id: 1,
        text: 'Сколько уровней насчитывает эталонная модель взаимодействия открытых систем (OSI)?',
        options: ['4 уровня', '7 уровней', '5 уровней', '8 уровней'],
        correctIndex: 1,
        explanation: 'В модели OSI ровно 7 уровней: Физический, Канальный, Сетевой, Транспортный, Сеансовый, Представительный, Прикладной.',
        successPhrase: 'Верно. Хоть базу помнишь. Быстрее, следующий вопрос!',
        failPhrase: 'Ты умеешь говорить? Ну, говори! Не молчи! В OSI 7 уровней. Запоминай!'
      },
      {
        id: 2,
        text: 'Какой протокол транспортного уровня гарантирует надёжную доставку и порядок пакетов (с тройным рукопожатием)?',
        options: ['TCP', 'UDP', 'IP', 'ICMP'],
        correctIndex: 0,
        explanation: 'TCP (Transmission Control Protocol) устанавливает соединение через 3-way handshake и гарантирует доставку.',
        successPhrase: 'Точно, TCP. Не расслабляйся, финальный вопрос на зачёт!',
        failPhrase: 'Быстрее думай! UDP ничего не гарантирует, это задача TCP!'
      },
      {
        id: 3,
        text: 'Сколько реальных IP-адресов доступно для назначения хостам в сети с префиксом /24 (255.255.255.0)?',
        options: ['256', '254', '255', '128'],
        correctIndex: 1,
        explanation: 'Всего 256 адресов: адрес сети (0) и широковещательный broadcast (255) использовать нельзя, остаётся 254.',
        successPhrase: '254! Правильно. Минус адрес сети и broadcast. Справедливо, зачёт сдан!',
        failPhrase: '254 хоста! 256 минус сеть и бродкаст. Но ладно, на зачёт вытянул!'
      }
    ]
  },

  korshunov: {
    id: 'korshunov',
    name: 'Коршунов В.М.',
    role: 'Преподаватель архитектуры ПО и сетей',
    avatar: '🍻',
    badgeColor: '#f39c12',
    traits: 'Много знает, много рассказывает, любит общаться со студентами и постоянно зовёт в бар.',
    greetings: [
      'А ты в бар не хочешь?',
      'Когда в бар пойдём?',
      'О, привет! Слушай, а после пар когда в бар пойдём обсуждать микросервисы?',
      'Мне нужно знать абсолютно ВСЁ по этой теме! Давай во всех подробностях!'
    ],
    questions: [
      {
        id: 1,
        text: 'Что означает буква "A" (Atomicity) в принципах транзакций баз данных ACID?',
        options: ['Асинхронность', 'Атомарность (всё или ничего)', 'Авторизация', 'Адаптивность'],
        correctIndex: 1,
        explanation: 'Атомарность гарантирует, что транзакция либо выполняется полностью, либо не выполняется вовсе.',
        successPhrase: 'Красавчик! Либо вся транзакция прошла, либо откат! А ты в бар не хочешь отметить правильный ответ?',
        failPhrase: 'Эх, атомарность же! "Всё или ничего". Ну ничего, на следующем реабилитируешься!'
      },
      {
        id: 2,
        text: 'Сколько свойств из трёх (Согласованность, Доступность, Устойчивость к разделению) распределённая система может гарантировать по теореме CAP?',
        options: ['Все 3 свойства', 'Только 2 свойства', 'Только 1 свойство', 'Ни одного'],
        correctIndex: 1,
        explanation: 'Теорема CAP (Брюера) доказывает, что распределенная система может гарантировать максимум 2 из 3 свойств.',
        successPhrase: 'В яблочко! Только две! Когда в бар пойдём проектировать распределённое хранилище?',
        failPhrase: 'Только 2 из 3! CAP-теорема сурова. Ладно, давай финальный вопрос!'
      },
      {
        id: 3,
        text: 'Какой HTTP статус-код означает успешное создание нового ресурса на сервере (Created)?',
        options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
        correctIndex: 1,
        explanation: 'HTTP 201 Created указывает, что запрос был успешно обработан и привел к созданию ресурса.',
        successPhrase: '201 Created! Я впечатлён, ты реально шаришь во всём! Зачёт твой! Так что, когда в бар?',
        failPhrase: '201 Created! 200 — это просто ок. Но ты молодец, зачёт я тебе ставлю!'
      }
    ]
  },

  maslennikov: {
    id: 'maslennikov',
    name: 'Масленников',
    role: 'Преподаватель высшей математики',
    avatar: '📐',
    badgeColor: '#e74c3c',
    traits: 'Добрый и понимающий в душе, но делает вид, что очень строгий и вредный. Ревниво следит за списыванием.',
    greetings: [
      'Почему вас не было на лекции Спиридонова?',
      'ОК.',
      'Если я увижу, что вы пишете лекции Канева на моей лекции, я их сожгу!',
      'Телефон убрали! Списывать вздумали? Я всё вижу!'
    ],
    questions: [
      {
        id: 1,
        text: 'Чему равен первый замечательный предел: lim (x -> 0) [sin(x) / x]?',
        options: ['0', '1', 'Бесконечность', 'e'],
        correctIndex: 1,
        explanation: 'Первый замечательный предел равен 1. Это фундаментальный предел матанализа.',
        successPhrase: 'ОК. Первый замечательный предел помните. Глаза от шпаргалки подняли! Следующий вопрос.',
        failPhrase: 'Почему вас не было на лекции Спиридонова?! Предел равен единице! Без списывания!'
      },
      {
        id: 2,
        text: 'Чему равна производная функции f(x) = e^(2x)?',
        options: ['e^(2x)', '2 * e^(2x)', '2x * e^(2x)', 'e^x'],
        correctIndex: 1,
        explanation: 'По правилу дифференцирования сложной функции: (e^(kx))\' = k * e^(kx), поэтому 2 * e^(2x).',
        successPhrase: 'ОК. Производная взята верно. И не пишите там лекции Канева!',
        failPhrase: 'Если я увижу, что вы пишете лекции Канева на моей лекции, я их сожгу! Двойка выносится вперед: 2*e^(2x).'
      },
      {
        id: 3,
        text: 'Как называется квадратная матрица, определитель которой равен нулю?',
        options: ['Вырожденная (сингулярная)', 'Единичная', 'Диагональная', 'Ортогональная'],
        correctIndex: 0,
        explanation: 'Матрица с det(A) = 0 называется вырожденной (или сингулярной), у нее нет обратной матрицы.',
        successPhrase: 'ОК. Вырожденная матрица. Не ожидал. Вижу, что не списывали. Зачёт ставлю!',
        failPhrase: 'Вырожденная матрица! ОК, на первый раз прощаю. Зачёт так и быть поставлю!'
      }
    ]
  }
};

/**
 * Класс управления квестом преподавателей
 */
export class ProfessorQuestManager {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'bmstu_quest_state_v1';
    this.onStateChange = options.onStateChange || null;
    this.onVictory = options.onVictory || null;

    this.state = this._loadState();
  }

  _loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}

    return {
      credits: {
        kanev: false,
        korshunov: false,
        maslennikov: false
      },
      progress: {
        kanev: { currentQuestion: 0, correctCount: 0 },
        korshunov: { currentQuestion: 0, correctCount: 0 },
        maslennikov: { currentQuestion: 0, correctCount: 0 }
      },
      completed: false
    };
  }

  _saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {}
    if (this.onStateChange) this.onStateChange(this.getSummary());
  }

  /**
   * Сбросить весь прогресс квеста
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    this.state = this._loadState();
    if (this.onStateChange) this.onStateChange(this.getSummary());
  }

  /**
   * Получить случайную коронную фразу преподавателя
   */
  getRandomGreeting(profId) {
    const prof = PROFESSORS[profId];
    if (!prof) return 'Здравствуйте!';
    const list = prof.greetings;
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Открыть диалог с преподавателем.
   * Возвращает данные для отображения в UI:
   * - имя, статус зачета, фраза-приветствие, текущий вопрос (если еще не сдан зачет)
   */
  openDialog(profId) {
    const prof = PROFESSORS[profId];
    if (!prof) throw new Error(`Unknown professor: ${profId}`);

    const hasCredit = Boolean(this.state.credits[profId]);
    const greeting = this.getRandomGreeting(profId);
    const prog = this.state.progress[profId];

    if (hasCredit) {
      return {
        profId,
        professor: prof,
        hasCredit: true,
        greeting,
        message: `Зачёт уже получен! Вы успешно ответили на все вопросы ${prof.name}.`,
        currentQuestion: null,
        questionIndex: 3,
        totalQuestions: 3
      };
    }

    const qIndex = prog.currentQuestion;
    const question = prof.questions[qIndex] || null;

    return {
      profId,
      professor: prof,
      hasCredit: false,
      greeting,
      message: null,
      currentQuestion: question,
      questionIndex: qIndex,
      totalQuestions: prof.questions.length,
      correctCount: prog.correctCount
    };
  }

  /**
   * Отправить ответ на текущий вопрос преподавателя.
   * @param {string} profId ('kanev' | 'korshunov' | 'maslennikov')
   * @param {number} selectedOptionIndex индекс выбранного варианта (0..3)
   */
  submitAnswer(profId, selectedOptionIndex) {
    const prof = PROFESSORS[profId];
    if (!prof) throw new Error(`Unknown professor: ${profId}`);

    if (this.state.credits[profId]) {
      return {
        success: true,
        alreadyEarned: true,
        creditEarnedNow: false,
        message: 'У этого преподавателя зачёт уже сдан!'
      };
    }

    const prog = this.state.progress[profId];
    const qIndex = prog.currentQuestion;
    const question = prof.questions[qIndex];

    if (!question) {
      return { success: false, message: 'Вопрос не найден.' };
    }

    const isCorrect = selectedOptionIndex === question.correctIndex;
    let feedbackPhrase = isCorrect ? question.successPhrase : question.failPhrase;

    if (isCorrect) {
      prog.correctCount += 1;
    }

    if (isCorrect) prog.currentQuestion += 1;
    let creditEarnedNow = false;

    // Если студент ответил на 3 вопроса
    if (prog.currentQuestion >= prof.questions.length && prog.correctCount >= prof.questions.length) {
      this.state.credits[profId] = true;
      creditEarnedNow = true;
    }

    // Проверяем общую победу
    const isAllCreditsEarned = Object.values(this.state.credits).every(Boolean);
    let victoryNow = false;

    if (isAllCreditsEarned && !this.state.completed) {
      this.state.completed = true;
      victoryNow = true;
    }

    this._saveState();

    if (victoryNow && this.onVictory) {
      this.onVictory();
    }

    return {
      isCorrect,
      feedbackPhrase,
      explanation: question.explanation,
      creditEarnedNow,
      hasCredit: this.state.credits[profId],
      nextQuestion: prof.questions[prog.currentQuestion] || null,
      questionIndex: prog.currentQuestion,
      totalQuestions: prof.questions.length,
      isAllCreditsEarned,
      victoryNow
    };
  }

  /**
   * Сводка текущего состояния квеста
   */
  getSummary() {
    const credits = this.state.credits;
    const earnedCount = Object.values(credits).filter(Boolean).length;
    return {
      credits,
      earnedCount,
      totalRequired: 3,
      isCompleted: earnedCount === 3,
      professors: Object.keys(PROFESSORS).map(id => ({
        id,
        name: PROFESSORS[id].name,
        role: PROFESSORS[id].role,
        hasCredit: Boolean(credits[id])
      }))
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ГОТОВЫЙ UI-ВИДЖЕТ ДИАЛОГА И ПОБЕДЫ (Автономно монтируется в DOM)
// ─────────────────────────────────────────────────────────────────────────────

export class ProfessorQuestUI {
  constructor(questManager, container = document.body) {
    this.qm = questManager;
    this.container = container;
    this.activeProfId = null;

    this._injectStyles();
    this._createDOM();
    this._attachEvents();
  }

  _injectStyles() {
    if (document.getElementById('bmstu-quest-styles')) return;
    const style = document.createElement('style');
    style.id = 'bmstu-quest-styles';
    style.textContent = `
      .quest-hud {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(18, 20, 32, 0.92);
        border: 1px solid rgba(74, 144, 226, 0.35);
        border-radius: 12px;
        padding: 12px 18px;
        color: #f0f4f8;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        backdrop-filter: blur(8px);
        min-width: 220px;
      }
      .quest-hud h4 {
        margin: 0 0 8px 0;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #8bb4e7;
      }
      .quest-hud-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .quest-hud-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
      }
      .quest-badge {
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
      }
      .quest-badge.pending { background: #34495e; color: #bdc3c7; }
      .quest-badge.done { background: #27ae60; color: #fff; }

      /* Модальное окно диалога */
      .quest-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(8, 10, 18, 0.78);
        backdrop-filter: blur(6px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10001;
      }
      .quest-modal-backdrop.open { display: flex; }
      .quest-modal {
        background: #151928;
        border: 1px solid #334466;
        border-radius: 16px;
        width: 90%;
        max-width: 580px;
        padding: 24px;
        color: #fff;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        position: relative;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: questPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes questPop {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .quest-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 14px;
      }
      .quest-avatar { font-size: 32px; }
      .quest-title h3 { margin: 0; font-size: 18px; color: #f0f6fc; }
      .quest-title p { margin: 2px 0 0; font-size: 12px; color: #8a99ad; }
      .quest-close {
        position: absolute;
        top: 18px; right: 20px;
        background: none; border: none; color: #8a99ad;
        font-size: 22px; cursor: pointer;
      }
      .quest-close:hover { color: #fff; }
      .quest-speech {
        background: rgba(74, 144, 226, 0.08);
        border-left: 4px solid #4a90e2;
        padding: 12px 16px;
        border-radius: 4px;
        font-style: italic;
        font-size: 14px;
        margin-bottom: 18px;
        color: #cbd5e1;
      }
      .quest-question-text {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 14px;
        line-height: 1.4;
      }
      .quest-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;
      }
      .quest-option-btn {
        background: #20273d;
        border: 1px solid #334466;
        padding: 12px 16px;
        border-radius: 8px;
        color: #e2e8f0;
        text-align: left;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.15s ease;
      }
      .quest-option-btn:hover {
        background: #2d3756;
        border-color: #4a90e2;
        transform: translateX(4px);
      }
      .quest-feedback {
        margin-top: 12px;
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
        display: none;
      }
      .quest-feedback.correct {
        background: rgba(39, 174, 96, 0.15);
        border: 1px solid #27ae60;
        color: #2ecc71;
        display: block;
      }
      .quest-feedback.incorrect {
        background: rgba(231, 76, 60, 0.15);
        border: 1px solid #e74c3c;
        color: #ff7675;
        display: block;
      }
      .quest-btn-next {
        margin-top: 14px;
        width: 100%;
        padding: 12px;
        background: #3b82f6;
        border: none;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        font-size: 14px;
      }
      .quest-btn-next:hover { background: #2563eb; }

      /* Экран финальной победы */
      .quest-victory-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10, 14, 28, 0.92);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        text-align: center;
        padding: 20px;
      }
      .quest-victory-overlay.open { display: flex; }
      .quest-victory-card {
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 2px solid #fbbf24;
        border-radius: 20px;
        padding: 40px;
        max-width: 520px;
        box-shadow: 0 0 60px rgba(251, 191, 36, 0.35);
        animation: victoryGlow 1.5s infinite alternate ease-in-out;
      }
      @keyframes victoryGlow {
        from { box-shadow: 0 0 30px rgba(251, 191, 36, 0.2); }
        to { box-shadow: 0 0 60px rgba(251, 191, 36, 0.5); }
      }
      .quest-victory-title {
        font-size: 32px;
        font-weight: 800;
        color: #fef08a;
        margin-bottom: 12px;
      }
      .quest-victory-sub {
        font-size: 16px;
        color: #cbd5e1;
        margin-bottom: 24px;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }

  _createDOM() {
    // 1. HUD со статусом зачетов в правом углу
    this.hud = document.createElement('div');
    this.hud.className = 'quest-hud';
    this.hud.innerHTML = `
      <h4>Сессия (Зачёты)</h4>
      <ul class="quest-hud-list" id="quest-hud-items"></ul>
    `;
    this.container.appendChild(this.hud);

    // 2. Диалоговое окно
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.className = 'quest-modal-backdrop';
    this.modalBackdrop.innerHTML = `
      <div class="quest-modal">
        <button class="quest-close" id="quest-modal-close">&times;</button>
        <div class="quest-header">
          <div class="quest-avatar" id="quest-avatar">👨‍🏫</div>
          <div class="quest-title">
            <h3 id="quest-prof-name">Преподаватель</h3>
            <p id="quest-prof-role">Кафедра</p>
          </div>
        </div>
        <div class="quest-speech" id="quest-speech">«Цитата...»</div>
        <div id="quest-quiz-body">
          <div class="quest-question-text" id="quest-q-text">Вопрос...</div>
          <div class="quest-options" id="quest-options"></div>
          <div class="quest-feedback" id="quest-feedback"></div>
          <button class="quest-btn-next" id="quest-btn-next" style="display:none;">Продолжить</button>
        </div>
      </div>
    `;
    this.container.appendChild(this.modalBackdrop);

    // 3. Экран победы
    this.victoryOverlay = document.createElement('div');
    this.victoryOverlay.className = 'quest-victory-overlay';
    this.victoryOverlay.innerHTML = `
      <div class="quest-victory-card">
        <div style="font-size: 64px; margin-bottom: 10px;">🎓🏆</div>
        <div class="quest-victory-title">Поздравляем!<br>Вы прошли игру!</div>
        <div class="quest-victory-sub">
          Все 3 зачёта успешно получены!<br>
          Канев, Коршунов и Масленников расписались в зачётке.
        </div>
        <button class="quest-btn-next" id="quest-victory-close" style="width: auto; padding: 12px 32px;">Отлично!</button>
      </div>
    `;
    this.container.appendChild(this.victoryOverlay);

    this.updateHUD();
  }

  _attachEvents() {
    this.qm.onStateChange = () => this.updateHUD();
    this.qm.onVictory = () => this.showVictoryScreen();

    this.modalBackdrop.querySelector('#quest-modal-close').addEventListener('click', () => {
      this.closeModal();
    });

    this.victoryOverlay.querySelector('#quest-victory-close').addEventListener('click', () => {
      this.victoryOverlay.classList.remove('open');
    });
  }

  updateHUD() {
    const summary = this.qm.getSummary();
    const list = this.hud.querySelector('#quest-hud-items');
    list.innerHTML = '';

    summary.professors.forEach(p => {
      const li = document.createElement('li');
      li.className = 'quest-hud-item';
      li.innerHTML = `
        <span>${p.name.split(' ')[0]}</span>
        <span class="quest-badge ${p.hasCredit ? 'done' : 'pending'}">
          ${p.hasCredit ? '✓ Зачёт' : 'Не сдан'}
        </span>
      `;
      list.appendChild(li);
    });
  }

  /**
   * Открыть интерактивный диалог с преподавателем в UI
   */
  openDialog(profId) {
    this.activeProfId = profId;
    const data = this.qm.openDialog(profId);

    const prof = data.professor;
    this.modalBackdrop.querySelector('#quest-avatar').textContent = prof.avatar || '👨‍🏫';
    this.modalBackdrop.querySelector('#quest-prof-name').textContent = prof.name;
    this.modalBackdrop.querySelector('#quest-prof-role').textContent = prof.role;
    this.modalBackdrop.querySelector('#quest-speech').textContent = `«${data.greeting}»`;

    const quizBody = this.modalBackdrop.querySelector('#quest-quiz-body');
    const feedback = this.modalBackdrop.querySelector('#quest-feedback');
    const nextBtn = this.modalBackdrop.querySelector('#quest-btn-next');
    feedback.className = 'quest-feedback';
    feedback.style.display = 'none';
    nextBtn.style.display = 'none';

    if (data.hasCredit) {
      quizBody.innerHTML = `
        <div style="text-align: center; padding: 20px 0;">
          <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
          <h3 style="color:#2ecc71; margin-bottom: 6px;">Зачёт получен!</h3>
          <p style="color:#94a3b8; font-size: 14px;">${data.message}</p>
        </div>
      `;
    } else {
      this._renderQuestion(data.currentQuestion, data.questionIndex, data.totalQuestions);
    }

    this.modalBackdrop.classList.add('open');
  }

  _renderQuestion(question, qIdx, total) {
    const qText = this.modalBackdrop.querySelector('#quest-q-text');
    const optionsCont = this.modalBackdrop.querySelector('#quest-options');
    const feedback = this.modalBackdrop.querySelector('#quest-feedback');
    const nextBtn = this.modalBackdrop.querySelector('#quest-btn-next');

    feedback.style.display = 'none';
    feedback.className = 'quest-feedback';
    nextBtn.style.display = 'none';

    qText.textContent = `Вопрос ${qIdx + 1} из ${total}: ${question.text}`;
    optionsCont.innerHTML = '';

    question.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quest-option-btn';
      btn.textContent = `${['A', 'B', 'C', 'D'][idx]}) ${opt}`;
      btn.addEventListener('click', () => {
        this._handleAnswer(idx);
      });
      optionsCont.appendChild(btn);
    });
  }

  _handleAnswer(optionIndex) {
    const result = this.qm.submitAnswer(this.activeProfId, optionIndex);
    const optionsCont = this.modalBackdrop.querySelector('#quest-options');
    const feedback = this.modalBackdrop.querySelector('#quest-feedback');
    const nextBtn = this.modalBackdrop.querySelector('#quest-btn-next');

    // Блокируем кнопки после выбора
    optionsCont.querySelectorAll('button').forEach(b => b.disabled = true);

    feedback.className = `quest-feedback ${result.isCorrect ? 'correct' : 'incorrect'}`;
    feedback.innerHTML = `
      <strong>${result.isCorrect ? '✓ Верно!' : '✗ Неверно!'}</strong> ${result.feedbackPhrase}
      <div style="margin-top: 6px; font-size: 12px; opacity: 0.85;">${result.explanation}</div>
    `;
    feedback.style.display = 'block';

    if (result.creditEarnedNow) {
      nextBtn.textContent = '🎉 Зачёт сдан! Завершить диалог';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => {
        this.closeModal();
        if (result.isAllCreditsEarned) {
          this.showVictoryScreen();
        }
      };
    } else if (result.nextQuestion) {
      nextBtn.textContent = 'Следующий вопрос →';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => {
        this._renderQuestion(result.nextQuestion, result.questionIndex, result.totalQuestions);
      };
    }
  }

  closeModal() {
    this.modalBackdrop.classList.remove('open');
  }

  showVictoryScreen() {
    this.victoryOverlay.classList.add('open');
  }
}
