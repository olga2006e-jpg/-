import { soundEngine } from './audio.js';
const $ = id => document.getElementById(id);
const node = (tag, text, className = '') => {
    const el = document.createElement(tag);
    el.textContent = text;
    el.className = className;
    return el;
};
export class UIManager {
    constructor() {
        this.loginModal = $('login-modal');
        this.dialogueModal = $('dialogue-modal');
        this.mapModal = $('map-modal');
        this.chatInput = $('chat-input');
        this.safeStatusMsg = $('safe-status-msg');
        this.activeNpc = null;
        this.histories = new Map();
        this.inventory = [];
        this.waiting = new Set();
        $('login-form').addEventListener('submit', e => {
            e.preventDefault();
            const name = $('username-input').value.trim();
            if (!name)
                return;
            this.setLoginBusy(true);
            this.onLogin?.(name, document.querySelector('[name="avatar-color"]:checked').value);
        });
        $('chat-form').addEventListener('submit', e => {
            e.preventDefault();
            const text = this.chatInput.value.trim();
            if (!text)
                return;
            if (/^\d{4}$/.test(text) || text.startsWith('/code '))
                this.onGateCodeSubmit?.(text.replace('/code ', '').trim());
            else
                this.onSendChat?.(text);
            this.chatInput.value = '';
            this.chatInput.blur();
            this.syncModal();
        });
        this.chatInput.addEventListener('focus', () => this.onModalStateChange?.(true));
        this.chatInput.addEventListener('blur', () => this.syncModal());
        $('dialogue-form').addEventListener('submit', e => {
            e.preventDefault();
            const text = $('dialogue-input').value.trim();
            if (!text || !this.activeNpc || this.waiting.has(this.activeNpc.id))
                return;
            this.addDialogueTurn('user', 'Вы', text);
            this.waiting.add(this.activeNpc.id);
            this.showAgentTyping();
            this.onSendDialogue?.(this.activeNpc.id, text);
            $('dialogue-input').value = '';
        });
        for (const [button, modal] of [['dialogue-close', 'dialogue-modal'], ['inventory-close', 'inventory-modal'], ['safe-modal-close', 'safe-modal'], ['victory-close', 'victory-modal']])
            $(button).onclick = () => this.closeModal(modal);
        $('inventory-button').onclick = () => this.openModal('inventory-modal');
        $('open-safe').onclick = () => this.openSafeModal();
        $('lantern-button').onclick = () => this.onToggleLantern?.();
        $('safe-form').onsubmit = e => {
            e.preventDefault();
            this.safeStatusMsg.textContent = 'Проверяем код…';
            this.onGateCodeSubmit?.($('safe-code').value);
        };
        window.addEventListener('keydown', e => {
            const typing = document.activeElement?.matches('input,textarea');
            if (e.code === 'Escape') {
                this.closeAllModals();
                this.chatInput.blur();
            }
            if (e.code === 'Enter' && !typing && !this.isModalOpen()) {
                e.preventDefault();
                this.chatInput.focus();
            }
            if (e.code === 'KeyJ' && !typing && !this.isModalOpen())
                this.openModal('inventory-modal');
        });
    }
    setLoginBusy(busy, message = '') {
        $('login-submit').disabled = busy;
        $('login-submit').textContent = busy ? 'Подключаемся…' : 'Войти в павильон →';
        $('login-status').textContent = message;
    }
    loginSuccess() {
        this.setLoginBusy(false);
        this.loginModal.classList.add('hidden');
        document.body.classList.remove('before-login');
        $('connection-status').textContent = 'В локальной сети';
    }
    connectionError(message) {
        this.loginModal.classList.remove('hidden');
        document.body.classList.add('before-login');
        this.closeAllModals();
        this.setLoginBusy(false, message);
        $('connection-status').textContent = 'Нет соединения';
        this.onModalStateChange?.(true);
    }
    syncModal() {
        this.onModalStateChange?.(this.isModalOpen() || document.activeElement === this.chatInput);
    }
    isModalOpen() {
        return Boolean(document.querySelector('.modal-overlay:not(.hidden)'));
    }
    openModal(id) {
        this.closeAllModals();
        $(id).classList.remove('hidden');
        this.syncModal();
        $(id).querySelector('input,button')?.focus();
    }
    closeModal(id) {
        document.activeElement?.blur();
        $(id).classList.add('hidden');
        this.syncModal();
    }
    closeAllModals() {
        document.activeElement?.blur();
        document.querySelectorAll('.modal-overlay:not(#login-modal)').forEach(el => el.classList.add('hidden'));
        this.syncModal();
    }
    updateCacheMonitor({ totalChunks, loadedCount, maxCacheLimit, cachePercent, isPass, currentZone }) {
        $('metric-total-chunks').textContent = totalChunks;
        $('metric-loaded-chunks').textContent = `${loadedCount} / ${maxCacheLimit}`;
        $('metric-cache-percent').textContent = `${cachePercent}%`;
        $('metric-badge').textContent = isPass ? 'Лимит секторов соблюдён' : 'Лимит секторов превышен';
        $('metric-badge').className = `metric-badge ${isPass ? 'pass' : 'warn'}`;
        $('metric-zone').textContent = currentZone;
    }
    updatePlayersList(name, players) {
        $('players-list').replaceChildren();
        for (const p of [{ username: name, color: '#ddbd81' }, ...players]) {
            const row = node('div', '', 'player-item'), dot = node('span', '', 'player-dot');
            dot.style.backgroundColor = p.color;
            row.append(dot, node('span', p.username + (p.username === name ? ' · вы' : '')));
            $('players-list').append(row);
        }
    }
    showInteractionPrompt(npc) {
        $('prompt-text').textContent = `Поговорить · ${npc.name}`;
        $('interaction-prompt').style.display = 'flex';
    }
    showCustomPrompt(text) {
        $('prompt-text').textContent = text;
        $('interaction-prompt').style.display = 'flex';
    }
    hideInteractionPrompt() {
        $('interaction-prompt').style.display = 'none';
    }
    openDialogue(npc) {
        this.activeNpc = npc;
        $('dialogue-name').textContent = npc.name;
        $('dialogue-role').textContent = npc.role;
        $('dialogue-history').replaceChildren();
        $('ai-mode').textContent = 'Задайте вопрос по теме собеседника';
        if (!this.histories.has(npc.id))
            this.histories.set(npc.id, [{ role: 'agent', speaker: npc.name, text: npc.greeting }]);
        for (const turn of this.histories.get(npc.id))
            this.renderTurn(turn);
        $('dialogue-typing').classList.toggle('hidden', !this.waiting.has(npc.id));
        $('quick-questions').replaceChildren();
        for (const q of this.getQuickSuggestions(npc.id)) {
            const b = node('button', q, 'quick-btn');
            b.type = 'button';
            b.onclick = () => {
                $('dialogue-input').value = q;
                $('dialogue-form').requestSubmit();
            };
            $('quick-questions').append(b);
        }
        this.openModal('dialogue-modal');
        $('dialogue-input').focus();
        soundEngine.playGhostChime();
    }
    closeDialogue() {
        this.closeModal('dialogue-modal');
    }
    renderTurn({ role, speaker, text }) {
        const el = node('div', '', `dialogue-turn ${role}`);
        el.append(node('div', speaker, 'turn-speaker'), node('div', text, 'turn-text'));
        $('dialogue-history').append(el);
        const body = document.querySelector('.dialogue-body');
        body.scrollTop = body.scrollHeight;
    }
    addDialogueTurn(role, speaker, text) {
        const turn = { role, speaker, text };
        if (this.activeNpc) {
            const h = this.histories.get(this.activeNpc.id) || [];
            h.push(turn);
            this.histories.set(this.activeNpc.id, h.slice(-40));
        }
        this.renderTurn(turn);
    }
    showAgentTyping() {
        if (this.activeNpc && this.waiting.has(this.activeNpc.id))
            $('dialogue-typing').classList.remove('hidden');
    }
    showAgentReply(data) {
        this.waiting.delete(data.agentId);
        if (data.agentId !== this.activeNpc?.id) {
            const h = this.histories.get(data.agentId) || [];
            h.push({ role: 'agent', speaker: data.agentName, text: data.reply });
            this.histories.set(data.agentId, h.slice(-40));
            return;
        }
        $('dialogue-typing').classList.add('hidden');
        this.addDialogueTurn('agent', data.agentName || this.activeNpc.name, data.reply);
        $('ai-mode').textContent = data.error ? 'Ошибка ответа. Попробуйте ещё раз.' : data.usedLLM ? 'Ответ локальной языковой модели' : 'Ответ локального алгоритма';
    }
    getQuickSuggestions(id) {
        return ({ kanev: ['Как работает WebSocket?', 'Как устроена клиент-серверная архитектура?'], akhmetova: ['Что такое предел функции?', 'Объясните формулу Тейлора'], korshunov: ['Почему вещества светятся?', 'Как работает OLED?'], einstein: ['Что означает E=mc²?', 'Почему замедляется время?'], herodotus: ['Кто строил пирамиды?', 'Что древние знали о механике?'] })[id] || ['Расскажите о своём предмете'];
    }
    addChatMessage({ sender, text }) {
        const row = node('div', '', 'chat-msg');
        row.append(node('span', `${sender}: `, 'chat-author'), node('span', text));
        this.appendChat(row);
    }
    appendChat(row) {
        const log = $('chat-messages');
        log.append(row);
        while (log.children.length > 40)
            log.firstChild.remove();
        log.scrollTop = log.scrollHeight;
    }
    addNotification(text) {
        this.appendChat(node('div', text, 'chat-msg notification'));
    }
    showVictory(message) {
        $('victory-message').textContent = message;
        this.openModal('victory-modal');
        soundEngine.playVictoryFanfare();
    }
    openSafeModal() {
        this.safeStatusMsg.textContent = '';
        $('safe-code').value = '';
        this.openModal('safe-modal');
        $('safe-code').focus();
    }
    updateInventory(items) {
        this.inventory = items;
        const unique = [...new Map(items.map(i => [i.id, i])).values()];
        $('inventory-count').textContent = `${Math.min(unique.length, 4)} / 4`;
        $('quest-progress').value = Math.min(unique.length, 4);
        $('inventory-list').replaceChildren();
        if (!unique.length)
            $('inventory-list').append(node('p', 'Пока нет находок. Ищите светящиеся предметы в холле и трёх лабораториях.'));
        for (const item of unique) {
            const el = node('div', '', 'inventory-item');
            el.append(node('h3', item.name), node('p', item.clue || 'Подсказка найдена.'));
            $('inventory-list').append(el);
        }
    }
}
