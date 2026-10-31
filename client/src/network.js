import * as THREE from 'three';
import { createPlayerAvatar } from './environment.js';

export class NetworkClient {
  constructor(scene) {
    this.scene = scene;
    this.ws = null;
    this.token = null;
    this.myUsername = null;

    // Remote players: username -> { mesh: THREE.Group, targetX, targetY, targetZ, targetRotY }
    this.remotePlayers = new Map();

    // Callbacks
    this.onAuthSuccess = null;
    this.onChunkReceived = null;
    this.onChatMessage = null;
    this.onAgentReply = null;
    this.onAgentTyping = null;
    this.onPlayersListChanged = null;
  }

  connect(token, myUsername) {
    this.token = token;
    this.myUsername = myUsername;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WS] Connected. Sending AUTH...');
      this.send({ type: 'AUTH', token: this.token });
    };

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      this.handleMessage(msg);
    };

    this.ws.onclose = () => {
      console.warn('[WS] Connection closed.');
    };

    this.ws.onerror = (err) => {
      console.error('[WS Error]', err);
    };
  }

  send(msgObj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msgObj));
    }
  }

  sendMove(x, y, z, rotY) {
    this.send({ type: 'MOVE', x, y, z, rotY });
  }

  sendChat(text) {
    this.send({ type: 'CHAT', text });
  }

  sendAgentChat(agentId, text) {
    this.send({ type: 'AGENT_CHAT', agentId, text });
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'AUTH_SUCCESS':
        console.log('[WS] Auth successful! Total chunks:', msg.totalWorldChunks);
        if (this.onAuthSuccess) this.onAuthSuccess(msg);
        break;

      case 'PLAYERS_SYNC':
        this.updateRemotePlayers(msg.players);
        break;

      case 'PLAYER_JOINED':
        this.getOrCreateRemotePlayer(msg.player.username, msg.player.color);
        this.notifyPlayerList();
        break;

      case 'PLAYER_LEFT':
        this.removeRemotePlayer(msg.username);
        this.notifyPlayerList();
        break;

      case 'CHUNK_DATA':
        if (this.onChunkReceived) this.onChunkReceived(msg.chunk);
        break;

      case 'CHAT_MESSAGE':
        if (this.onChatMessage) this.onChatMessage(msg);
        break;

      case 'AGENT_TYPING':
        if (this.onAgentTyping) this.onAgentTyping(msg.agentId);
        break;

      case 'AGENT_REPLY':
        if (this.onAgentReply) this.onAgentReply(msg);
        break;
    }
  }

  getOrCreateRemotePlayer(username, color) {
    if (username === this.myUsername) return null;

    if (!this.remotePlayers.has(username)) {
      const mesh = createPlayerAvatar(username, color);
      this.scene.add(mesh);
      const state = {
        mesh,
        username,
        color,
        targetX: 0,
        targetY: 1.6,
        targetZ: 0,
        targetRotY: 0
      };
      this.remotePlayers.set(username, state);
      return state;
    }
    return this.remotePlayers.get(username);
  }

  removeRemotePlayer(username) {
    const entry = this.remotePlayers.get(username);
    if (entry) {
      this.scene.remove(entry.mesh);
      entry.mesh.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
      this.remotePlayers.delete(username);
    }
  }

  updateRemotePlayers(playersList) {
    for (const p of playersList) {
      if (p.username === this.myUsername) continue;

      const player = this.getOrCreateRemotePlayer(p.username, p.color);
      if (player) {
        player.targetX = p.x;
        player.targetY = p.y;
        player.targetZ = p.z;
        player.targetRotY = p.rotY;
      }
    }
    this.notifyPlayerList();
  }

  // Smooth interpolation in animation loop
  interpolate(delta) {
    const lerpFactor = Math.min(1.0, delta * 15);

    for (const [, p] of this.remotePlayers.entries()) {
      p.mesh.position.x = THREE.MathUtils.lerp(p.mesh.position.x, p.targetX, lerpFactor);
      p.mesh.position.y = THREE.MathUtils.lerp(p.mesh.position.y, p.targetY, lerpFactor);
      p.mesh.position.z = THREE.MathUtils.lerp(p.mesh.position.z, p.targetZ, lerpFactor);
      p.mesh.rotation.y = THREE.MathUtils.lerp(p.mesh.rotation.y, p.targetRotY, lerpFactor);
    }
  }

  notifyPlayerList() {
    if (this.onPlayersListChanged) {
      const list = Array.from(this.remotePlayers.values()).map(p => ({
        username: p.username,
        color: p.color
      }));
      this.onPlayersListChanged(list);
    }
  }
}
