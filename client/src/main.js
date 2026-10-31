import { soundEngine } from './audio.js';
import * as THREE from 'three';
import { GameScene } from './scene.js';
import { PlayerControls } from './controls.js';
import { ChunkManager } from './chunkManager.js';
import { NetworkClient } from './network.js';
import { UIManager } from './ui.js';
import { MinimapManager } from './minimap.js';

class GameApp {
  constructor() {
    this.container = document.getElementById('game-container');

    // 1. Scene & Renderer
    this.gameScene = new GameScene(this.container);

    // 2. Controls
    this.controls = new PlayerControls(this.gameScene.camera, this.gameScene.renderer.domElement, this.gameScene.scene);

    // 3. Network
    this.network = new NetworkClient(this.gameScene.scene);

    // 4. UI Manager
    this.ui = new UIManager();

    // 5. Chunk Manager (Strict <= 10% LRU Cache)
    this.chunkManager = new ChunkManager(
      this.gameScene.scene,
      this.network,
      (cacheStats) => this.ui.updateCacheMonitor(cacheStats)
    );
    this.controls.setChunkManager(this.chunkManager);

    // 6. Interactive Minimap & Campus Blueprint
    this.minimap = new MinimapManager();

    // Clock
    this.clock = new THREE.Clock();
    this.lastNetworkMoveTime = 0;
    this.myUsername = null;
    this.myColor = '#8be9fd';
    this.nearbyNpc = null;

    this.minimap.onModalStateChange = () => this.ui.syncModal();
    this.network.onConnectionError = message => {
      this.controls.enabled=false;
      this.chunkManager.pendingRequests.clear();
      this.network.sendQueue=[];
      this.ui.connectionError(message);
    };
    document.addEventListener('pointerlockchange',()=>document.body.classList.toggle('locked',Boolean(document.pointerLockElement)));
    this.wireCallbacks();
    this.setupKeyBindings();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  wireCallbacks() {
    // UI -> Game
    this.ui.onLogin = async (username, color, password, mode) => {
      this.myUsername = username;
      this.myColor = color;
      await this.login(username, color, password, mode);
    };

    this.ui.onSendChat = (text) => {
      this.network.sendChat(text);
    };

    this.ui.onSendDialogue = (agentId, text) => {
      this.network.sendAgentChat(agentId, text);
    };

    this.ui.onGateCodeSubmit = (code) => {
      this.network.sendGateCode(code);
    };
    this.ui.onToggleLantern = () => {
      if (this.controls && this.controls.playerBody) {
        const isOn = this.controls.playerBody.toggleLantern();
        this.ui.addNotification(isOn ? '💡 Фонарь зажжён' : '🌑 Фонарь погашен');
      }
    };

    this.ui.onModalStateChange = (isOpen) => {
      if (isOpen) {
        this.controls.enabled = false;
        this.controls.unlock();
      } else {
        this.controls.enabled = true;
      }
    };

    // Network -> Game
    this.network.onAuthSuccess = (msg) => {
      this.ui.loginSuccess();
      this.myUsername=msg.username;
      this.chunkManager.setWorldMeta(msg.totalWorldChunks, msg.maxClientCachePercent);
      if(msg.initialPosition && (Math.abs(msg.initialPosition.x)>35 || msg.initialPosition.z < -35 || msg.initialPosition.z>11)) msg.initialPosition={x:0,y:1.6,z:5,rotY:0};
      if (msg.initialPosition) {
        this.controls.setPosition(
          msg.initialPosition.x,
          1.6,
          msg.initialPosition.z,
          msg.initialPosition.rotY
        );
      }
      this.controls.enabled = true;
      this.chunkManager.forceReload();
      this.ui.updatePlayersList(this.myUsername, []);
      if (msg.inventory) {
        this.ui.updateInventory(msg.inventory);
      this.collectedIds=new Set(msg.inventory.map(i=>i.id));
      }
    };

    this.network.onChunkReceived = (chunk) => {
      this.chunkManager.loadChunkData(chunk);
      for(const id of this.collectedIds||[])this.chunkManager.hideArtifact(id);
    };

    this.network.onChatMessage = (msg) => {
      this.ui.addChatMessage(msg);
    };

    this.network.onAgentTyping = () => {
      this.ui.showAgentTyping();
    };

    this.network.onAgentReply = (replyData) => {
      this.ui.showAgentReply(replyData);
    };

    this.network.onPlayersListChanged = (remoteList) => {
      this.ui.updatePlayersList(this.myUsername, remoteList);
    };

    this.network.onItemCollected = (msg) => {
      soundEngine.playItemPickup();
      this.chunkManager.hideArtifact(msg.item.id);
      this.ui.addNotification(`✨ Вы подобрали: ${msg.item.name}! ${msg.item.clue || ''}`);
      this.ui.updateInventory(msg.inventory);
      this.collectedIds=new Set(msg.inventory.map(i=>i.id));
    };

    this.network.onNotification = (text) => {
      this.ui.addNotification(text);
    };

    this.network.onVictory = (msg) => {
      this.ui.closeAllModals();
      this.ui.showVictory(msg.message, msg.winner);
    };

    this.network.onCodeIncorrect = (msg) => {
      if (this.ui.safeStatusMsg) {
        this.ui.safeStatusMsg.textContent = `❌ ${msg.message}`;
      }
      this.ui.addNotification(`❌ ${msg.message}`);
    };
  }

  setupKeyBindings() {
    window.addEventListener('keydown', (e) => {
      if(document.activeElement?.matches('input,textarea')) return;
      // Toggle handheld brass lantern with [L]
      if (e.code === 'KeyL' && !this.ui.isModalOpen()) {
        if (this.controls && this.controls.playerBody) {
          const isOn = this.controls.playerBody.toggleLantern();
          this.ui.addNotification(isOn ? '💡 Фонарь зажжён' : '🌑 Фонарь погашен');
        }
      }

      if (e.code === 'KeyE' && !this.ui.isModalOpen()) {
        if (this.nearbyNpc) {
          this.ui.openDialogue(this.nearbyNpc);
        } else if (this.nearSafe) {
          this.ui.openSafeModal();

        }
      }
    });
  }
  async login(username, color, password = null, mode = 'login') {
    try {
      const endpoint = mode === 'register' ? '/api/register' : '/api/login';
      const body = { username, color };
      if (password && mode !== 'guest') {
        body.password = password;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Сервер отклонил запрос на вход');
      }
      if (data.success && data.token) {
        this.network.connect(data.token, username);
      } else {
        throw new Error('Не удалось получить токен авторизации');
      }
    } catch (err) {
      this.ui.connectionError(err.message || 'Ошибка подключения к серверу');
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Update controls
    this.controls.update(delta);
    const playerPos = this.controls.getPosition();

    // 2. Throttle network move messages (every 50ms = 20Hz)
    const now = performance.now();
    if (now - this.lastNetworkMoveTime > 50 && this.network.isConnected()) {
      this.network.sendMove(playerPos.x, playerPos.y, playerPos.z, playerPos.rotY);
      this.lastNetworkMoveTime = now;
    }

    // 3. Update chunk streaming (strict <= 10% cache enforcement)
    if(this.network.isConnected())this.chunkManager.updatePlayerPosition(playerPos.x, playerPos.z);
    this.chunkManager.animate(delta, elapsed, playerPos);

    // 4. Interpolate remote players
    this.network.interpolate(delta);

    // 5. Check NPC and architectural portal proximity
    if (this.controls.enabled && !this.ui.isModalOpen()) {
      const npc = this.chunkManager.getNearbyNpc(playerPos.x, playerPos.z, 3.5);
      if (npc !== this.nearbyNpc) {
        this.nearbyNpc = npc;
        if (npc) {
          this.ui.showInteractionPrompt(npc);
        } else {
          this.ui.hideInteractionPrompt();
        }
      }

      if (!this.nearbyNpc) {
        // A. Founders' Safe in Council Hall (Aud. 223) at (x = 0, z = -37.4)
        const distToSafe = Math.hypot(playerPos.x - 7, playerPos.z - 7);
        this.nearSafe = distToSafe < 3.8;

        if (this.nearSafe) {
          this.ui.showCustomPrompt('Открыть сейф основателей');

        } else {
          this.ui.hideInteractionPrompt();
        }
      }
    }

    this.gameScene.update(delta, elapsed);

    // 7. Update Minimap Radar & Location Badge
    const remoteList = Array.from(this.network.remotePlayers.values()).map(p => ({
      username: p.username,
      color: p.color,
      x: p.mesh.position.x,
      z: p.mesh.position.z
    }));
    this.minimap.update(playerPos, remoteList, Array.from(this.chunkManager.activeNpcs.values()), this.chunkManager.loadedChunks);

    // 7. Render 3D Scene
    this.gameScene.render();
  }
}

// Start on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
