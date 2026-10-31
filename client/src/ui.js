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

    // Login modal
    this.loginModal = document.getElementById('login-modal');
    this.loginForm = document.getElementById('login-form');
    this.usernameInput = document.getElementById('username-input');

    this.activeNpc = null;
    this.onSendChat = null;
    this.onSendDialogue = null;
    this.onLogin = null;
    this.onModalStateChange = null;

    this.setupListeners();
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
      if (text && this.onSendChat) {
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
        if (!this.dialogueModal.classList.contains('hidden')) {
          this.closeDialogue();
        }
        if (document.activeElement === this.chatInput) {
          this.chatInput.blur();
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
    return !this.loginModal.classList.contains('hidden') ||
           !this.dialogueModal.classList.contains('hidden');
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
    if (agentId === 'einstein') {
      return [
        'Почему замедляется время?',
        'В чем парадокс близнецов?',
        'Что такое E=mc²?',
        'Расскажи про гравитацию!'
      ];
    } else if (agentId === 'herodotus') {
      return [
        'Как разливается Нил?',
        'Кто строил пирамиды?',
        'В чем тайна мумий?',
        'Что удивило тебя в путешествиях?'
      ];
    } else if (agentId === 'curie') {
      return [
        'Как вы открыли радий?',
        'Что такое радиоактивность?',
        'Почему наука требует смелости?'
      ];
    }
    return ['Расскажи о себе', 'Где я нахожусь?'];
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
}
