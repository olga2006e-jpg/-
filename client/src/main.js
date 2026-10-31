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

    this.wireCallbacks();
    this.setupKeyBindings();

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  wireCallbacks() {
    // UI -> Game
    this.ui.onLogin = async (username, color) => {
      this.myUsername = username;
      this.myColor = color;
      await this.login(username, color);
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
      this.chunkManager.setWorldMeta(msg.totalWorldChunks, msg.maxClientCachePercent);
      if (msg.initialPosition) {
        this.controls.setPosition(
          msg.initialPosition.x,
          msg.initialPosition.y,
          msg.initialPosition.z,
          msg.initialPosition.rotY
        );
      }
      this.controls.enabled = true;
      this.chunkManager.forceReload();
      this.ui.updatePlayersList(this.myUsername, []);
      if (msg.inventory) {
        this.ui.updateInventory(msg.inventory);
      }
    };

    this.network.onChunkReceived = (chunk) => {
      this.chunkManager.loadChunkData(chunk);
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
        } else if (this.nearElevator) {
          this.cycleElevatorFloor();
        }
      }
    });
  }
  goToFloor1() {
    soundEngine.playItemFound();
    this.controls.setPosition(0, 1.6, 5.5, 0);
    this.ui.addChatMessage('🏛️ Парадная лестница ГУК', 'Вы спустились в Центральный Вестибюль (1-й ЭТАЖ) — Гардероб, Музей & Турникеты', '#ffd700');
    this.chunkManager.forceReload();
  }

  goToFloor2() {
    soundEngine.playItemFound();
    this.controls.setPosition(-48, 1.6, -20, 0);
    this.ui.addChatMessage('🏛️ Парадная лестница ГУК', 'Вы поднялись на 2-й ЭТАЖ — Кафедра К5 (ИУ-5), Ауд. 227 (Канев) & Учёный Совет', '#8be9fd');
    this.chunkManager.forceReload();
  }

  goToFloor3() {
    soundEngine.playItemFound();
    this.controls.setPosition(48, 1.6, -20, 0);
    this.ui.addChatMessage('🔬 Верхняя лестница ГУК', 'Вы поднялись на 3-й ЭТАЖ — Лаборатории Фотоники и Лазеров, Мария Кюри', '#50fa7b');
    this.chunkManager.forceReload();
  }

  cycleElevatorFloor() {
    this.currentFloor = ((this.currentFloor || 1) % 3) + 1;
    if (this.currentFloor === 1) {
      this.goToFloor1();
    } else if (this.currentFloor === 2) {
      this.goToFloor2();
    } else if (this.currentFloor === 3) {
      this.goToFloor3();
    }
  }

  async login(username, color) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, color })
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.network.connect(data.token, username);
      }
    } catch (err) {
      console.error('[Login Error]', err);
      // Fallback direct connect
      this.network.connect('dev_token', username);
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
    if (now - this.lastNetworkMoveTime > 50 && this.network.ws) {
      this.network.sendMove(playerPos.x, playerPos.y, playerPos.z, playerPos.rotY);
      this.lastNetworkMoveTime = now;
    }

    // 3. Update chunk streaming (strict <= 10% cache enforcement)
    this.chunkManager.updatePlayerPosition(playerPos.x, playerPos.z);
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
        const distToSafe = Math.hypot(playerPos.x - 0, playerPos.z - (-37.4));
        this.nearSafe = distToSafe < 3.8;

        // B. Elevator proximity check at (x = 8.5, z = 3.5)
        const distToElevator = Math.hypot(playerPos.x - 8.5, playerPos.z - 3.5);
        this.nearElevator = distToElevator < 3.2;

        if (this.nearSafe) {
          this.ui.showCustomPrompt('🔒 [E] — Исследовать Сейф Основателей МГТУ (1830 г.)');
        } else if (this.nearElevator) {
          this.ui.showCustomPrompt('🛗 [E] — Вызвать Коллежский Лифт (1, 2, 3 этажи)');
        } else {
          this.ui.hideInteractionPrompt();
        }
      }
    }

    // 6. Update scene atmosphere (floating particles, breathing glow)

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
