import { soundEngine } from './audio.js';

export class UIManager {
  constructor() {
    // Cache monitor elements
    this.totalChunksEl = document.getElementById('metric-total-chunks');
    this.loadedChunksEl = document.getElementById('metric-loaded-chunks');
    this.cachePercentEl = document.getElementById('metric-cache-percent');
    this.badgeEl = document.getElementById('metric-badge');
    this.zoneEl = document.getElementById('metric-zone');

    // Players list
    this.playersListEl = document.getElementById('players-list');

    // Interaction prompt
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('prompt-text');

    // Chat
    this.chatContainer = document.getElementById('chat-container');
    this.chatMessagesEl = document.getElementById('chat-messages');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');

    // Dialogue modal
    this.dialogueModal = document.getElementById('dialogue-modal');
    this.dialogueNameEl = document.getElementById('dialogue-name');
    this.dialogueRoleEl = document.getElementById('dialogue-role');
    this.dialogueHistoryEl = document.getElementById('dialogue-history');
    this.dialogueTypingEl = document.getElementById('dialogue-typing');
    this.dialogueCloseBtn = document.getElementById('dialogue-close');
    this.quickQuestionsEl = document.getElementById('quick-questions');
    this.dialogueForm = document.getElementById('dialogue-form');
    this.dialogueInput = document.getElementById('dialogue-input');

    // Modals
    this.mapModal = document.getElementById('map-modal');
    this.questModal = document.getElementById('quest-modal');
    this.cafeteriaModal = document.getElementById('cafeteria-modal');
    this.zachetkaModal = document.getElementById('zachetka-modal');
    this.safeModal = document.getElementById('safe-modal');
    this.safeModalClose = document.getElementById('safe-modal-close');
    this.safeDigitEls = [0, 1, 2, 3].map(i => document.getElementById(`safe-digit-${i}`));
    this.safeStatusMsg = document.getElementById('safe-status-msg');
    this.currentSafeDigits = '';

    // Nav pill buttons
    this.navBtnQuest = document.getElementById('nav-btn-quest');
    this.navBtnCafeteria = document.getElementById('nav-btn-cafeteria');
    this.navBtnZachetka = document.getElementById('nav-btn-zachetka');
    this.navBtnLantern = document.getElementById('nav-btn-lantern');

    this.questModalClose = document.getElementById('quest-modal-close');
    this.cafeteriaModalClose = document.getElementById('cafeteria-modal-close');
    this.zachetkaModalClose = document.getElementById('zachetka-modal-close');

    // Login modal
    this.loginModal = document.getElementById('login-modal');
    this.loginForm = document.getElementById('login-form');
    this.usernameInput = document.getElementById('username-input');

    this.activeNpc = null;
    this.onSendChat = null;
    this.onSendDialogue = null;
    this.onLogin = null;
    this.onModalStateChange = null;
    this.onGateCodeSubmit = null;
    this.onToggleLantern = null;

    this.setupListeners();
    this.setupNewModals();
  }

  setupListeners() {
    // Login submit
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = this.usernameInput.value.trim();
      const colorRadio = document.querySelector('input[name="avatar-color"]:checked');
      const color = colorRadio ? colorRadio.value : '#8be9fd';

      if (username && this.onLogin) {
        this.loginModal.classList.add('hidden');
        this.onLogin(username, color);
      }
    });

    // Chat submit
    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.chatInput.value.trim();
      if (!text) return;

      // Allow entering quest gate code directly in chat
      if (text.startsWith('/code ') || text.startsWith('/gate ') || text.match(/^\d{4}$/)) {
        const code = text.replace(/^\/(code|gate)\s*/, '').trim();
        if (this.onGateCodeSubmit) {
          this.onGateCodeSubmit(code);
        }
        this.addNotification(`Попытка ввода кода Врат: "${code}"...`);
        this.chatInput.value = '';
        this.chatInput.blur();
        return;
      }

      if (this.onSendChat) {
        this.onSendChat(text);
        this.chatInput.value = '';
      }
      this.chatInput.blur();
    });

    // Focus chat on Enter
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' && !this.isModalOpen()) {
        if (document.activeElement !== this.chatInput) {
          this.chatInput.focus();
          e.preventDefault();
        }
      }
      if (e.code === 'Escape') {
        this.closeAllModals();
        if (document.activeElement === this.chatInput) {
          this.chatInput.blur();
        }
      }
      // Quick key shortcuts when not typing in inputs
      const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
      if (!isInput) {
        if (e.code === 'KeyJ') {
          this.toggleQuestModal();
        } else if (e.code === 'KeyB') {
          this.toggleZachetkaModal();
        }
      }
    });

    // Dialogue submit
    this.dialogueForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dialogueInput.value.trim();
      if (text && this.activeNpc && this.onSendDialogue) {
        this.addDialogueTurn('user', 'Вы', text);
        this.onSendDialogue(this.activeNpc.id, text);
        this.dialogueInput.value = '';
        this.dialogueTypingEl.classList.remove('hidden');
        this.dialogueHistoryEl.scrollTop = this.dialogueHistoryEl.scrollHeight;
      }
    });

    // Dialogue close
    this.dialogueCloseBtn.addEventListener('click', () => {
      this.closeDialogue();
    });
  }

  isModalOpen() {
    const isMapOpen = this.mapModal && !this.mapModal.classList.contains('hidden');
    const isQuestOpen = this.questModal && !this.questModal.classList.contains('hidden');
    const isCafeteriaOpen = this.cafeteriaModal && !this.cafeteriaModal.classList.contains('hidden');
    const isZachetkaOpen = this.zachetkaModal && !this.zachetkaModal.classList.contains('hidden');
    const isSafeOpen = this.safeModal && !this.safeModal.classList.contains('hidden');

    return !this.loginModal.classList.contains('hidden') ||
           !this.dialogueModal.classList.contains('hidden') ||
           Boolean(isMapOpen) ||
           Boolean(isQuestOpen) ||
           Boolean(isCafeteriaOpen) ||
           Boolean(isZachetkaOpen) ||
           Boolean(isSafeOpen);
  }

  setupNewModals() {
    // Nav bar buttons
    if (this.navBtnQuest) {
      this.navBtnQuest.addEventListener('click', () => this.toggleQuestModal());
    }
    if (this.navBtnCafeteria) {
      this.navBtnCafeteria.addEventListener('click', () => this.toggleCafeteriaModal());
    }
    if (this.navBtnZachetka) {
      this.navBtnZachetka.addEventListener('click', () => this.toggleZachetkaModal());
    }
    if (this.navBtnLantern) {
      this.navBtnLantern.addEventListener('click', () => {
        if (this.onToggleLantern) this.onToggleLantern();
      });
    }

    // Modal close buttons
    if (this.questModalClose) {
      this.questModalClose.addEventListener('click', () => this.closeQuestModal());
    }
    if (this.cafeteriaModalClose) {
      this.cafeteriaModalClose.addEventListener('click', () => this.closeCafeteriaModal());
    }
    if (this.zachetkaModalClose) {
      this.zachetkaModalClose.addEventListener('click', () => this.closeZachetkaModal());
    }
    if (this.safeModalClose) {
      this.safeModalClose.addEventListener('click', () => this.closeSafeModal());
    }

    // Safe Keypad listeners
    const keypadBtns = document.querySelectorAll('.safe-keypad .keypad-btn[data-key]');
    keypadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const digit = btn.dataset.key;
        if (this.currentSafeDigits.length < 4) {
          this.currentSafeDigits += digit;
          soundEngine.playTypingBlip();
          this.renderSafeDigits();
        }
      });
    });

    const safeClearBtn = document.getElementById('safe-btn-clear');
    if (safeClearBtn) {
      safeClearBtn.addEventListener('click', () => {
        this.currentSafeDigits = '';
        soundEngine.playDoorSound(false);
        this.renderSafeDigits();
        if (this.safeStatusMsg) this.safeStatusMsg.textContent = 'Код сброшен. Введите 4 цифры шифра...';
      });
    }

    const safeEnterBtn = document.getElementById('safe-btn-enter');
    if (safeEnterBtn) {
      safeEnterBtn.addEventListener('click', () => {
        if (this.currentSafeDigits.length !== 4) {
          if (this.safeStatusMsg) this.safeStatusMsg.textContent = '⚠️ Необходимо ввести ровно 4 цифры!';
          return;
        }
        if (this.onGateCodeSubmit) {
          this.onGateCodeSubmit(this.currentSafeDigits);
          if (this.safeStatusMsg) this.safeStatusMsg.textContent = `Проверка кода: "${this.currentSafeDigits}"...`;
        }
      });
    }
    const orderBtns = document.querySelectorAll('.order-btn');
    orderBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemType = e.target.dataset.item;
        soundEngine.playItemFound();

        if (itemType === 'sosiska') {
          this.addChatMessage('🍴 Тётя Клава', '«Держи горячую сосиску в тесте, деточка! С пылу с жару! Сил придаст перед рубежным контролем!»', '#ffb86c');
          this.addNotification('🌭 Получено: Сосиска в тесте «Хэллоуинская»');
        } else if (itemType === 'tea') {
          this.addChatMessage('🍴 Тётя Клава', '«Вот горячий чаёк с лимоном в подстаканнике! Согреет в ночных коридорах!»', '#ffb86c');
          this.addNotification('🍵 Получено: Чай с сахаром и лимоном');
        } else if (itemType === 'borscht') {
          this.addChatMessage('🍴 Тётя Клава', '«Наваристый студенческий борщ! Ясность ума +15!»', '#ffb86c');
          this.addNotification('🥣 Получено: Студенческий борщ со сметаной');
        } else if (itemType === 'witch_soup') {
          this.addChatMessage('🍴 Тётя Клава', '«Хи-хи! Ведьминский суп из бурлящего котла! Теперь никакой зачёт не страшен!»', '#50fa7b');
          this.addNotification('🎃 Получено: Ведьминский суп сессии (Автозачёт!)');
        }
      });
    });
  }

  toggleQuestModal() {
    if (!this.questModal) return;
    const isHidden = this.questModal.classList.contains('hidden');
    this.closeAllModals();
    if (isHidden) {
      this.questModal.classList.remove('hidden');
      if (this.onModalStateChange) this.onModalStateChange(true);
    }
  }

  closeQuestModal() {
    if (this.questModal) this.questModal.classList.add('hidden');
    if (this.onModalStateChange) this.onModalStateChange(this.isModalOpen());
  }

  toggleCafeteriaModal() {
    if (!this.cafeteriaModal) return;
    const isHidden = this.cafeteriaModal.classList.contains('hidden');
    this.closeAllModals();
    if (isHidden) {
      this.cafeteriaModal.classList.remove('hidden');
      if (this.onModalStateChange) this.onModalStateChange(true);
    }
  }

  closeCafeteriaModal() {
    if (this.cafeteriaModal) this.cafeteriaModal.classList.add('hidden');
    if (this.onModalStateChange) this.onModalStateChange(this.isModalOpen());
  }

  toggleZachetkaModal() {
    if (!this.zachetkaModal) return;
    const isHidden = this.zachetkaModal.classList.contains('hidden');
    this.closeAllModals();
    if (isHidden) {
      this.zachetkaModal.classList.remove('hidden');
      if (this.onModalStateChange) this.onModalStateChange(true);
    }
  }

  closeZachetkaModal() {
    if (this.zachetkaModal) this.zachetkaModal.classList.add('hidden');
    if (this.onModalStateChange) this.onModalStateChange(this.isModalOpen());
  }

  renderSafeDigits() {
    for (let i = 0; i < 4; i++) {
      if (this.safeDigitEls[i]) {
        this.safeDigitEls[i].textContent = this.currentSafeDigits[i] || '-';
      }
    }
  }

  openSafeModal() {
    if (!this.safeModal) return;
    this.closeAllModals();
    this.currentSafeDigits = '';
    this.renderSafeDigits();
    if (this.safeStatusMsg) this.safeStatusMsg.textContent = 'Введите 4 цифры шифра, найденные у призраков...';
    this.safeModal.classList.remove('hidden');
    soundEngine.playDoorSound(true);
    if (this.onModalStateChange) this.onModalStateChange(true);
  }

  closeSafeModal() {
    if (this.safeModal) this.safeModal.classList.add('hidden');
    if (this.onModalStateChange) this.onModalStateChange(this.isModalOpen());
  }

  toggleSafeModal() {
    if (!this.safeModal) return;
    if (this.safeModal.classList.contains('hidden')) {
      this.openSafeModal();
    } else {
      this.closeSafeModal();
    }
  }
  closeAllModals() {
    if (this.dialogueModal && !this.dialogueModal.classList.contains('hidden')) {
      this.closeDialogue();
    }
    if (this.mapModal) this.mapModal.classList.add('hidden');
    if (this.questModal) this.questModal.classList.add('hidden');
    if (this.cafeteriaModal) this.cafeteriaModal.classList.add('hidden');
    if (this.zachetkaModal) this.zachetkaModal.classList.add('hidden');
    if (this.safeModal) this.safeModal.classList.add('hidden');
    if (this.onModalStateChange) this.onModalStateChange(this.isModalOpen());
  }

  // Update Cache Monitor HUD
  updateCacheMonitor({ totalChunks, loadedCount, maxCacheLimit, cachePercent, isPass, currentZone }) {
    if (this.totalChunksEl) this.totalChunksEl.textContent = totalChunks;
    if (this.loadedChunksEl) this.loadedChunksEl.textContent = `${loadedCount} / ${maxCacheLimit}`;
    if (this.cachePercentEl) this.cachePercentEl.textContent = `${cachePercent}%`;

    if (this.badgeEl) {
      if (isPass) {
        this.badgeEl.className = 'metric-badge pass';
        this.badgeEl.textContent = `ЛИМИТ: ≤ 10% [СОБЛЮДЕНО ✅]`;
      } else {
        this.badgeEl.className = 'metric-badge warn';
        this.badgeEl.textContent = `ЛИМИТ: ПРЕВЫШЕНИЕ ⚠️`;
      }
    }

    if (this.zoneEl && currentZone) {
      this.zoneEl.textContent = `Зона: ${currentZone}`;
    }
  }

  // Update Online Players List
  updatePlayersList(myUsername, remotePlayers) {
    if (!this.playersListEl) return;
    this.playersListEl.innerHTML = '';

    // Self
    const selfItem = document.createElement('div');
    selfItem.className = 'player-item';
    selfItem.innerHTML = `<span class="player-dot" style="background: #fff"></span> <span>${myUsername} (Вы)</span>`;
    this.playersListEl.appendChild(selfItem);

    // Remotes
    for (const p of remotePlayers) {
      const item = document.createElement('div');
      item.className = 'player-item';
      item.innerHTML = `<span class="player-dot" style="background: ${p.color}"></span> <span>${p.username}</span>`;
      this.playersListEl.appendChild(item);
    }
  }

  // Interaction Prompt
  showInteractionPrompt(npcData) {
    this.activeNpc = npcData;
    this.promptTextEl.textContent = `Поговорить: ${npcData.name}`;
    this.promptEl.style.display = 'flex';
  }
  showCustomPrompt(text) {
    this.promptTextEl.textContent = text;
    this.promptEl.style.display = 'flex';
  }

  hideInteractionPrompt() {
    this.activeNpc = null;
    this.promptEl.style.display = 'none';
  }

  // Dialogue Modal
  openDialogue(npcData) {
    this.activeNpc = npcData;
    this.dialogueNameEl.textContent = npcData.name;
    this.dialogueRoleEl.textContent = npcData.role;
    this.dialogueHistoryEl.innerHTML = '';
    this.dialogueTypingEl.classList.add('hidden');

    // Add initial greeting
    this.addDialogueTurn('agent', npcData.name, npcData.greeting);

    // Setup quick questions
    this.quickQuestionsEl.innerHTML = '';
    const suggestions = this.getQuickSuggestions(npcData.id);
    for (const q of suggestions) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-btn';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        this.dialogueInput.value = q;
        this.dialogueForm.dispatchEvent(new Event('submit'));
      });
      this.quickQuestionsEl.appendChild(btn);
    }

    this.dialogueModal.classList.remove('hidden');
    soundEngine.playGhostChime();
    if (this.onModalStateChange) this.onModalStateChange(true);
    setTimeout(() => this.dialogueInput.focus(), 50);
  }

  closeDialogue() {
    this.dialogueModal.classList.add('hidden');
    if (this.onModalStateChange) this.onModalStateChange(false);
  }

  addDialogueTurn(role, speaker, text) {
    const turn = document.createElement('div');
    turn.className = `dialogue-turn ${role}`;
    turn.innerHTML = `
      <div class="turn-speaker">${speaker}</div>
      <div class="turn-text">${text}</div>
    `;
    this.dialogueHistoryEl.appendChild(turn);
    this.dialogueHistoryEl.scrollTop = this.dialogueHistoryEl.scrollHeight;
  }

  showAgentReply(replyData) {
    this.dialogueTypingEl.classList.add('hidden');
    const speaker = replyData.agentName || (this.activeNpc ? this.activeNpc.name : 'Призрак');
    this.addDialogueTurn('agent', speaker, replyData.reply);
    soundEngine.playGhostChime();
  }

  showAgentTyping() {
    this.dialogueTypingEl.classList.remove('hidden');
    this.dialogueHistoryEl.scrollTop = this.dialogueHistoryEl.scrollHeight;
  }

  getQuickSuggestions(agentId) {
    if (agentId === 'kanev') {
      return [
        'Объясните трёхстороннее рукопожатие TCP',
        'В чем разница WebSocket и HTTP Long Polling?',
        'Как устроена клиент-серверная архитектура в РИП?',
        'Поставьте допуск к лабе по РИП!'
      ];
    } else if (agentId === 'akhmetova') {
      return [
        'Сформулируйте предел функции по Коши (ε - δ)',
        'Как доказать первый замечательный предел?',
        'В чем суть формулы Тейлора?',
        'Объясните формулу Ньютона-Лейбница'
      ];
    } else if (agentId === 'korshunov') {
      return [
        'В чем суть закона Стокса в люминесценции?',
        'Почему европий и тербий светятся в темноте?',
        'Как работает антенный эффект в фотонике?',
        'Объясните принцип работы OLED-эмиттеров'
      ];
    } else if (agentId === 'einstein') {
      return [
        'Почему замедляется время в Бауманке?',
        'В чем парадокс близнецов?',
        'Что такое E=mc²?',
        'Расскажи про искривление пространства!'
      ];
    } else if (agentId === 'herodotus') {
      return [
        'Кто строил пирамиды в Египте?',
        'Как разливается Нил?',
        'Что древние знали о механике?',
        'Что удивило тебя в путешествиях?'
      ];
    }
    return ['Здравствуйте! Вы примете у нас зачёт?', 'Где мы находимся?'];
  }

  // Chat Log
  addChatMessage({ sender, text }) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = `<span class="chat-author" style="color: #ffb86c">${sender}:</span> <span>${text}</span>`;
    this.chatMessagesEl.appendChild(msg);
    this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;

    // Prune old chat entries in DOM
    if (this.chatMessagesEl.children.length > 40) {
      this.chatMessagesEl.removeChild(this.chatMessagesEl.children[0]);
    }
  }

  addNotification(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg notification';
    msg.innerHTML = `<span style="color: #50fa7b; font-weight: bold;">[Квест]</span> <span>${text}</span>`;
    this.chatMessagesEl.appendChild(msg);
    this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
  }

  showVictory(message, winner) {
    soundEngine.playVictoryFanfare();
    const banner = document.createElement('div');
    banner.style.position = 'fixed';
    banner.style.top = '50%';
    banner.style.left = '50%';
    banner.style.transform = 'translate(-50%, -50%)';
    banner.style.background = 'radial-gradient(circle at center, rgba(35, 20, 60, 0.98), rgba(10, 5, 25, 0.99))';
    banner.style.border = '3px solid #ffd700';
    banner.style.borderRadius = '20px';
    banner.style.padding = '35px 50px';
    banner.style.color = '#fff';
    banner.style.textAlign = 'center';
    banner.style.zIndex = '999999';
    banner.style.boxShadow = '0 0 60px rgba(255, 215, 0, 0.7), inset 0 0 30px rgba(255, 215, 0, 0.2)';
    banner.innerHTML = `
      <div style="font-size: 64px; margin-bottom: 15px; animation: bounce 1s infinite alternate;">🏆✨📜</div>
      <h1 style="font-family: 'Cinzel', serif; font-size: 34px; color: #ffd700; margin: 0 0 12px 0; text-shadow: 0 0 20px rgba(255,215,0,0.8);">СЕЙФ ОСНОВАТЕЛЕЙ МГТУ ОТКРЫТ!</h1>
      <div style="font-size: 20px; font-weight: bold; color: #50fa7b; margin-bottom: 12px;">Код: 2327 • Золотая Зачётка 1830 года спасена!</div>
      <p style="font-size: 16px; line-height: 1.6; color: #f8f8f2; max-width: 550px; margin: 0 auto;">${message}</p>
      <div style="margin-top: 15px; font-size: 14px; color: #bd93f9;">Все зачёты и лабораторные работы автоматически зачтены автоматом!</div>
      <button id="close-victory-btn" style="margin-top: 25px; padding: 12px 30px; background: linear-gradient(135deg, #ffd700, #ffb86c); border: none; border-radius: 10px; color: #1c1a24; font-size: 16px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(255,215,0,0.4);">Продолжить триумфальное шествие</button>
    `;
    banner.querySelector('#close-victory-btn').onclick = () => banner.remove();
    document.body.appendChild(banner);
  }

  updateInventory(items) {
    console.log('[Inventory updated]', items);
  }
}
