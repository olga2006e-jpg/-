import { soundEngine } from './audio.js';
import * as THREE from 'three';
import { GameScene } from './scene.js';
import { PlayerControls } from './controls.js';
import { ChunkManager } from './chunkManager.js';
import { NetworkClient } from './network.js';
import { UIManager } from './ui.js';
import { MinimapManager } from './minimap.js';
import { PhysicsWorld } from './physics.js';
import { AnimatedPropsManager } from './animatedProps.js';
import { ReactiveMobsManager } from './reactiveMobs.js';

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

    // 7. Interactive Physics, Animated Props & Reactive Mobs
    this.physics = new PhysicsWorld(this.gameScene.scene);
    this.physics.setNetwork(this.network);
    this.animatedProps = new AnimatedPropsManager(this.gameScene.scene);
    this.animatedProps.spawnDefaultCampusProps();
    this.reactiveMobs = new ReactiveMobsManager(this.gameScene.scene);

    // Clock
    this.clock = new THREE.Clock();
    this.lastNetworkMoveTime = 0;
    this.myUsername = null;
    this.myColor = '#8be9fd';
    this.nearbyNpc = null;
    this.heldProp = null;
    this.nearbyProp = null;
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
    this.setupTelemetryAndMobs();

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
      if (this.controls.setPlayerInfo) {
        this.controls.setPlayerInfo(this.myUsername, this.myColor || msg.color);
      }
      this.chunkManager.setWorldMeta(msg.totalWorldChunks, msg.maxClientCachePercent);
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
      if (Array.isArray(msg.movedProps)) {
        for (const m of msg.movedProps) {
          if (m.isHeld) {
            this.chunkManager.setPropVisibility(m.id, false);
          } else {
            this.chunkManager.setPropPosition(m.id, m.x, m.y, m.z, m.rotY);
          }
        }
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

    this.network.onPropPickedUp = ({ propId, username }) => {
      this.chunkManager.setPropVisibility(propId, false);
      this.ui.addNotification(`Исследователь ${username} поднял предмет`);
    };

    this.network.onPropPlaced = ({ propId, x, y, z, rotY, username }) => {
      this.chunkManager.setPropPosition(propId, x, y, z, rotY);
      if (username !== this.myUsername) {
        soundEngine.playPropPlace();
        this.ui.addNotification(`Исследователь ${username} переставил предмет`);
      }
    };

    this.network.onWorldMutation = (mutation) => {
      this.animatedProps.mutationHandler.handleMutation(mutation);
      if (mutation.message) {
        this.ui.addNotification(mutation.message);
      }
    };

    this.network.onPropThrown = (msg) => {
      this.physics.handleRemoteThrow(msg.propId, msg.startPos, msg.velocity);
    };

    this.network.onWorldSettingsChanged = (settings) => {
      if (settings.fogDensity !== undefined && this.gameScene.scene.fog) {
        this.gameScene.scene.fog.far = Math.max(30, 115 / settings.fogDensity);
      }
      if (settings.gravity !== undefined) {
        this.physics.gravity = 9.8 * settings.gravity;
      }
    };

    this.network.onPong = (msg) => {
      if (msg.clientTime) {
        this.currentPing = Math.round(Date.now() - msg.clientTime);
      }
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
        } else {
          this.physics.interact(this.gameScene.camera, this.myUsername);
        }
      }

      // Throw held object with [F] with inertia & ballistic arc
      if (e.code === 'KeyF' && !this.ui.isModalOpen()) {
        const vel = this.controls.velocity || new THREE.Vector3();
        this.physics.throwHeldObject(this.gameScene.camera, vel, 14.0);
      }

      // Pick up or place movable prop with [G]
      if (e.code === 'KeyG' && !this.ui.isModalOpen()) {
        const playerPos = this.controls.getPosition();
        if (this.heldProp) {
          // Place currently carried prop in front of player
          const camDir = new THREE.Vector3();
          this.gameScene.camera.getWorldDirection(camDir);
          const px = Number((playerPos.x + camDir.x * 1.5).toFixed(2));
          const pz = Number((playerPos.z + camDir.z * 1.5).toFixed(2));
          const py = Number((this.heldProp.origY || 0.35).toFixed(2));
          const rotY = Number(this.controls.camera.rotation.y.toFixed(2));

          this.heldProp.mesh.position.set(px, py, pz);
          this.heldProp.mesh.rotation.y = rotY;
          if (this.heldProp.mesh.userData) this.heldProp.mesh.userData.isHeld = false;

          this.network.sendPropPlace(this.heldProp.id, px, py, pz, rotY);
          soundEngine.playPropPlace();
          this.ui.addNotification(`📦 Вы поставили: ${this.heldProp.label}`);
          this.heldProp = null;
        } else if (this.nearbyProp) {
          // Pick up nearby prop
          const propId = this.nearbyProp.userData.propId;
          const label = this.nearbyProp.userData.label || 'предмет';
          const origY = this.nearbyProp.position.y;
          this.heldProp = {
            id: propId,
            mesh: this.nearbyProp,
            label,
            origY
          };
          if (this.nearbyProp.userData) this.nearbyProp.userData.isHeld = true;

          this.network.sendPropPickup(propId);
          soundEngine.playItemPickup();
          this.ui.addNotification(`✋ Вы взяли: ${label}`);
          this.nearbyProp = null;
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

  setupTelemetryAndMobs() {
    const defaultMobs = [
      { id: 'bat_01', type: 'BAT', name: 'Призрачный нетопырь', x: 2, y: 4.2, z: 5, radius: 4.5, speed: 2.2 },
      { id: 'bat_02', type: 'BAT', name: 'Призрачный нетопырь', x: -3, y: 4.5, z: 8, radius: 3.8, speed: 2.0 },
      { id: 'bat_03', type: 'BAT', name: 'Призрачный нетопырь', x: 0, y: 4.4, z: -15, radius: 5.0, speed: 2.5 },
      { id: 'bat_04', type: 'BAT', name: 'Призрачный нетопырь', x: 6, y: 4.6, z: -20, radius: 4.0, speed: 2.1 },
      { id: 'bat_05', type: 'BAT', name: 'Пещерный нетопырь', x: -18, y: 4.3, z: 4, radius: 3.5, speed: 1.9 },
      { id: 'bat_06', type: 'BAT', name: 'Пещерный нетопырь', x: 16, y: 4.5, z: -2, radius: 4.2, speed: 2.3 },
      { id: 'bat_07', type: 'BAT', name: 'Архивный нетопырь', x: -44, y: 4.6, z: 3, radius: 3.0, speed: 2.4 },
      { id: 'bat_08', type: 'BAT', name: 'Архивный нетопырь', x: -50, y: 4.4, z: -20, radius: 4.8, speed: 2.0 },
      { id: 'bat_09', type: 'BAT', name: 'Спектральный нетопырь', x: 45, y: 4.5, z: -22, radius: 4.0, speed: 2.5 },
      { id: 'bat_10', type: 'BAT', name: 'Спектральный нетопырь', x: 70, y: 4.7, z: -25, radius: 3.6, speed: 2.2 },
      { id: 'bat_11', type: 'BAT', name: 'Высотный нетопырь', x: 22, y: 4.8, z: -46, radius: 5.2, speed: 2.6 },
      { id: 'bat_12', type: 'BAT', name: 'Высотный нетопырь', x: -26, y: 4.5, z: -50, radius: 4.4, speed: 2.1 },
      { id: 'bat_13', type: 'BAT', name: 'Хэллоуинский нетопырь', x: 4, y: 4.3, z: 20, radius: 3.9, speed: 2.3 },
      { id: 'bat_14', type: 'BAT', name: 'Хэллоуинский нетопырь', x: -20, y: 4.6, z: 22, radius: 4.1, speed: 1.8 },
      { id: 'bat_15', type: 'BAT', name: 'Хэллоуинский нетопырь', x: 18, y: 4.4, z: 18, radius: 4.5, speed: 2.2 },
      { id: 'cat_01', type: 'CAT', name: 'Кот Учёный', x: 4.5, y: 0.15, z: 6.2, rotY: 0.5, furColor: '#1a1829', eyeColor: '#50fa7b' },
      { id: 'cat_02', type: 'CAT', name: 'Тайный кот', x: -5.0, y: 0.15, z: 4.0, rotY: 1.2, furColor: '#2b213a', eyeColor: '#ffb86c' },
      { id: 'cat_03', type: 'CAT', name: 'Кот кафедры ИУ-5', x: 2.5, y: 0.15, z: -18.0, rotY: 3.14, furColor: '#161324', eyeColor: '#8be9fd' },
      { id: 'cat_04', type: 'CAT', name: 'Кот кафедры ИУ-5', x: -46.0, y: 0.15, z: -26.0, rotY: 0.8, furColor: '#211c33', eyeColor: '#50fa7b' },
      { id: 'cat_05', type: 'CAT', name: 'Буфетный кот', x: 21.0, y: 0.15, z: -3.5, rotY: 2.1, furColor: '#ffb86c', eyeColor: '#50fa7b' },
      { id: 'cat_06', type: 'CAT', name: 'Буфетный кот', x: 26.5, y: 0.15, z: 2.0, rotY: -0.4, furColor: '#2d2440', eyeColor: '#ff79c6' },
      { id: 'cat_07', type: 'CAT', name: 'Музейный кот', x: -51.0, y: 0.15, z: -2.0, rotY: 1.5, furColor: '#181528', eyeColor: '#f1fa8c' },
      { id: 'cat_08', type: 'CAT', name: 'Лабораторный кот', x: 50.5, y: 0.15, z: -21.0, rotY: -1.2, furColor: '#1f1a30', eyeColor: '#50fa7b' },
      { id: 'cat_09', type: 'CAT', name: 'Радиевый кот', x: 74.0, y: 0.15, z: -22.5, rotY: 0.2, furColor: '#1b2a26', eyeColor: '#50fa7b' },
      { id: 'cat_10', type: 'CAT', name: 'Обсерваторный кот', x: 26.0, y: 0.15, z: -45.0, rotY: 2.7, furColor: '#171426', eyeColor: '#8be9fd' },
      { id: 'cat_11', type: 'CAT', name: 'Математический кот', x: -22.0, y: 0.15, z: -46.5, rotY: -2.2, furColor: '#281c38', eyeColor: '#ff79c6' },
      { id: 'cat_12', type: 'CAT', name: 'Коридорный кот', x: -20.5, y: 0.15, z: 2.5, rotY: 0.0, furColor: '#1e1b2e', eyeColor: '#ffb86c' },
      { id: 'cat_13', type: 'CAT', name: 'Коридорный кот', x: -2.0, y: 0.15, z: 22.0, rotY: -1.0, furColor: '#191629', eyeColor: '#50fa7b' },
      { id: 'cat_14', type: 'CAT', name: 'Привратный кот', x: 20.0, y: 0.15, z: 16.0, rotY: 1.8, furColor: '#26203a', eyeColor: '#8be9fd' },
      { id: 'cat_15', type: 'CAT', name: 'Привратный кот', x: -18.0, y: 0.15, z: 20.0, rotY: -0.6, furColor: '#181525', eyeColor: '#50fa7b' },
      { id: 'shadow_01', type: 'SHADOW_STUDENT', name: 'Тень первокурсника', x: 1.0, y: 0.0, z: 12.0, pathRadius: 6.0 },
      { id: 'shadow_02', type: 'SHADOW_STUDENT', name: 'Тень дипломника', x: -4.0, y: 0.0, z: -14.0, pathRadius: 8.0 },
      { id: 'shadow_03', type: 'SHADOW_STUDENT', name: 'Призрак лаборанта', x: -16.0, y: 0.0, z: -2.0, pathRadius: 5.0 },
      { id: 'shadow_04', type: 'SHADOW_STUDENT', name: 'Призрак старосты', x: 18.0, y: 0.0, z: 6.0, pathRadius: 7.0 },
      { id: 'shadow_05', type: 'SHADOW_STUDENT', name: 'Тень отличника', x: -42.0, y: 0.0, z: -22.0, pathRadius: 6.5 },
      { id: 'shadow_06', type: 'SHADOW_STUDENT', name: 'Тень физика', x: 44.0, y: 0.0, z: -25.0, pathRadius: 7.5 },
      { id: 'shadow_07', type: 'SHADOW_STUDENT', name: 'Тень химика', x: 68.0, y: 0.0, z: -21.0, pathRadius: 5.5 },
      { id: 'shadow_08', type: 'SHADOW_STUDENT', name: 'Тень астронома', x: 20.0, y: 0.0, z: -44.0, pathRadius: 6.0 },
      { id: 'shadow_09', type: 'SHADOW_STUDENT', name: 'Тень математика', x: -20.0, y: 0.0, z: -47.0, pathRadius: 6.5 },
      { id: 'shadow_10', type: 'SHADOW_STUDENT', name: 'Тень библиотекаря', x: -46.0, y: 0.0, z: -4.0, pathRadius: 5.0 }
    ];

    this.reactiveMobs.loadMobs(defaultMobs);

    this.physics.createInteractiveProp('prop_flask_blue', 'flask', new THREE.Vector3(1.5, 0.2, 9.0));
    this.physics.createInteractiveProp('prop_orb_arcane', 'crystal_orb', new THREE.Vector3(-1.8, 0.2, 8.5));
    this.physics.createInteractiveProp('prop_book_grimoire', 'book', new THREE.Vector3(0.5, 0.2, 11.0));

    setInterval(() => {
      if (this.network && this.network.isConnected()) {
        const fps = this.currentFps || 60;
        const ping = this.currentPing || 16;
        const loaded = this.chunkManager.loadedChunks ? this.chunkManager.loadedChunks.size : 0;
        const memoryMB = (typeof performance !== 'undefined' && performance.memory)
          ? Math.round(performance.memory.usedJSHeapSize / 1048576)
          : 64;
        this.network.sendTelemetry(fps, ping, loaded, memoryMB);
      }
    }, 2000);
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

      if (this.heldProp) {
        // Smoothly position carried prop in front of camera view
        const camDir = new THREE.Vector3();
        this.gameScene.camera.getWorldDirection(camDir);
        const holdPos = this.gameScene.camera.position.clone().add(camDir.clone().multiplyScalar(1.4));
        holdPos.y -= 0.3;
        this.heldProp.mesh.position.copy(holdPos);
        this.heldProp.mesh.rotation.y = this.controls.camera.rotation.y;
        this.ui.showCustomPrompt(`Поставить ${this.heldProp.label}`, 'G');
      } else if (!this.nearbyNpc) {
        // A. Founders' Safe in Council Hall
        const distToSafe = Math.hypot(playerPos.x - 7, playerPos.z - 7);
        this.nearSafe = distToSafe < 3.8;

        if (this.nearSafe) {
          this.ui.showCustomPrompt('Открыть сейф основателей', 'E');
        } else {
          // B. Movable Prop Proximity
          const prop = this.chunkManager.findNearbyMovableProp(playerPos, 2.5);
          this.nearbyProp = prop;
          if (prop) {
            this.ui.showCustomPrompt(`Взять ${prop.userData.label || 'предмет'}`, 'G');
          } else {
            this.ui.hideInteractionPrompt();
          }
        }
      }
    }

    this.gameScene.update(delta, elapsed);

    // 6. Step physics, animated props, and reactive mobs
    this.frameCount = (this.frameCount || 0) + 1;
    this.fpsTimer = (this.fpsTimer || 0) + delta;
    if (this.fpsTimer >= 1.0) {
      this.currentFps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      this.network.sendPing();
    }

    if (this.physics) {
      this.physics.update(delta, this.gameScene.camera);
    }
    if (this.animatedProps) {
      this.animatedProps.update(delta);
    }
    if (this.reactiveMobs) {
      this.reactiveMobs.update(delta, playerPos, {
        isSprinting: Boolean(this.controls && this.controls.isSprinting),
        lanternOn: Boolean(this.controls && this.controls.playerBody && this.controls.playerBody.lanternActive),
        isChatting: Boolean(document.activeElement?.matches('input,textarea'))
      });
    }

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
