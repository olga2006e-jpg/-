import * as THREE from 'three';
import {
  createFloorTile,
  createPillar,
  createPumpkin,
  createTorch,
  createTombstone,
  createTelescope,
  createObelisk,
  createBookshelf,
  createCauldron,
  createGhostNPC
} from './environment.js';

export const CHUNK_SIZE = 24;

export class ChunkManager {
  constructor(scene, network, onCacheChange) {
    this.scene = scene;
    this.network = network;
    this.onCacheChange = onCacheChange;

    this.totalWorldChunks = 100;
    this.maxCacheLimit = 10; // Exactly 10% of 100 chunks

    // Map: "cx,cz" -> { group: THREE.Group, data: ChunkObject, lastAccessed: number }
    this.loadedChunks = new Map();
    // Set: "cx,cz" of in-flight requests to avoid duplicate requests
    this.pendingRequests = new Set();

    this.currentChunkX = null;
    this.currentChunkZ = null;
    this.currentZoneName = 'Главный Зал';

    // List of active NPCs currently in scene
    this.activeNpcs = new Map(); // npcId -> THREE.Group
    this.animatedObjects = [];   // torches, pumpkins, npcs
  }

  setWorldMeta(totalChunks, maxCachePercent) {
    this.totalWorldChunks = totalChunks || 100;
    this.maxCacheLimit = Math.max(1, Math.floor(this.totalWorldChunks * (maxCachePercent / 100)));
    this.notifyCache();
  }

  notifyCache() {
    const loadedCount = this.loadedChunks.size;
    const cachePercent = ((loadedCount / this.totalWorldChunks) * 100).toFixed(1);
    const isPass = loadedCount <= this.maxCacheLimit;

    if (this.onCacheChange) {
      this.onCacheChange({
        totalChunks: this.totalWorldChunks,
        loadedCount,
        maxCacheLimit: this.maxCacheLimit,
        cachePercent,
        isPass,
        currentZone: this.currentZoneName
      });
    }
  }

  // Called each frame with player's world position (x, z)
  updatePlayerPosition(x, z) {
    const cx = Math.round(x / CHUNK_SIZE);
    const cz = Math.round(z / CHUNK_SIZE);

    if (cx !== this.currentChunkX || cz !== this.currentChunkZ) {
      this.currentChunkX = cx;
      this.currentChunkZ = cz;
      this.onPlayerEnterChunk(cx, cz);
    }
  }

  onPlayerEnterChunk(cx, cz) {
    // Current chunk + adjacent neighbors within 3x3 window (9 chunks <= 10 chunks budget)
    const neededCoords = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        neededCoords.push({ cx: cx + dx, cz: cz + dz });
      }
    }

    // Sort by distance to player (load center first)
    neededCoords.sort((a, b) => {
      const distA = Math.hypot(a.cx - cx, a.cz - cz);
      const distB = Math.hypot(b.cx - cx, b.cz - cz);
      return distA - distB;
    });

    // Request missing chunks up to cache capacity
    for (const coord of neededCoords) {
      const key = `${coord.cx},${coord.cz}`;
      if (!this.loadedChunks.has(key) && !this.pendingRequests.has(key)) {
        // Enforce cache limit BEFORE adding new chunk
        this.enforceCacheLimit(cx, cz);

        if (this.loadedChunks.size < this.maxCacheLimit) {
          this.pendingRequests.add(key);
          this.network.send({
            type: 'REQUEST_CHUNK',
            cx: coord.cx,
            cz: coord.cz
          });
        }
      } else if (this.loadedChunks.has(key)) {
        // Touch chunk access time
        this.loadedChunks.get(key).lastAccessed = Date.now();
      }
    }
  }

  // Strict LRU / Distance Eviction to guarantee <= 10%
  enforceCacheLimit(centerCx, centerCz) {
    while (this.loadedChunks.size >= this.maxCacheLimit) {
      // Find chunk farthest from current player chunk
      let maxDist = -1;
      let farthestKey = null;

      for (const [key, chunkEntry] of this.loadedChunks.entries()) {
        const [kcx, kcz] = key.split(',').map(Number);
        const dist = Math.hypot(kcx - centerCx, kcz - centerCz);
        if (dist > maxDist) {
          maxDist = dist;
          farthestKey = key;
        }
      }

      if (farthestKey) {
        this.unloadChunk(farthestKey);
      } else {
        break;
      }
    }
  }

  // Handle incoming chunk from server
  loadChunkData(chunkData) {
    const key = `${chunkData.cx},${chunkData.cz}`;
    this.pendingRequests.delete(key);

    // If already loaded, skip
    if (this.loadedChunks.has(key)) return;

    // Safety check against cache limit
    if (this.loadedChunks.size >= this.maxCacheLimit) {
      this.enforceCacheLimit(this.currentChunkX ?? 0, this.currentChunkZ ?? 0);
    }

    // Build 3D meshes for chunk
    const chunkGroup = new THREE.Group();
    chunkGroup.name = `Chunk_${key}`;

    for (const obj of chunkData.objects) {
      if (obj.type === 'floor') {
        const floor = createFloorTile(obj.x, obj.y, obj.z, obj.width, obj.depth, obj.zoneType);
        chunkGroup.add(floor);
      } else if (obj.type === 'pillar') {
        const pillar = createPillar(obj.x, obj.y, obj.z, obj.height);
        chunkGroup.add(pillar);
      } else if (obj.type === 'pumpkin') {
        const pumpkin = createPumpkin(obj.x, obj.y, obj.z, obj.glowing);
        chunkGroup.add(pumpkin);
        this.animatedObjects.push(pumpkin);
      } else if (obj.type === 'torch') {
        const torch = createTorch(obj.x, obj.y, obj.z);
        chunkGroup.add(torch);
        this.animatedObjects.push(torch);
      } else if (obj.type === 'tombstone') {
        const tomb = createTombstone(obj.x, obj.y, obj.z, obj.label);
        chunkGroup.add(tomb);
      } else if (obj.type === 'telescope') {
        chunkGroup.add(createTelescope(obj.x, obj.y, obj.z));
      } else if (obj.type === 'obelisk') {
        chunkGroup.add(createObelisk(obj.x, obj.y, obj.z, obj.label));
      } else if (obj.type === 'bookshelf') {
        chunkGroup.add(createBookshelf(obj.x, obj.y, obj.z));
      } else if (obj.type === 'cauldron') {
        chunkGroup.add(createCauldron(obj.x, obj.y, obj.z));
      }
    }

    // Handle NPCs in this chunk
    if (chunkData.npcs && chunkData.npcs.length > 0) {
      for (const npc of chunkData.npcs) {
        if (!this.activeNpcs.has(npc.id)) {
          const npcMesh = createGhostNPC(npc);
          chunkGroup.add(npcMesh);
          this.activeNpcs.set(npc.id, npcMesh);
          this.animatedObjects.push(npcMesh);
        }
      }
    }

    this.scene.add(chunkGroup);
    this.loadedChunks.set(key, {
      group: chunkGroup,
      data: chunkData,
      lastAccessed: Date.now()
    });

    if (chunkData.cx === this.currentChunkX && chunkData.cz === this.currentChunkZ) {
      this.currentZoneName = chunkData.zoneName;
    }

    this.notifyCache();
  }

  unloadChunk(key) {
    const entry = this.loadedChunks.get(key);
    if (!entry) return;

    const { group, data } = entry;

    // Remove active NPCs from registry if they were in this chunk
    if (data.npcs) {
      for (const npc of data.npcs) {
        this.activeNpcs.delete(npc.id);
      }
    }

    // Clean up from animated objects list
    this.animatedObjects = this.animatedObjects.filter(obj => !group.children.includes(obj));

    // Dispose all geometries and materials to avoid memory leaks
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    this.scene.remove(group);
    this.loadedChunks.delete(key);
    this.notifyCache();
  }

  // Update animated objects (flickering torches, bobbing ghosts)
  animate(delta, elapsed) {
    for (const obj of this.animatedObjects) {
      if (obj.userData?.light) {
        // Flickering torch
        const flicker = Math.sin(elapsed * 12 + obj.userData.timeOffset) * 0.25 + (Math.random() - 0.5) * 0.15;
        obj.userData.light.intensity = obj.userData.baseIntensity + flicker;
      }
      if (obj.userData?.npcData) {
        // Smooth bobbing ghost NPC
        obj.position.y = obj.userData.baseY + Math.sin(elapsed * 2.2 + obj.userData.timeOffset) * 0.18;
        // Pulsing spectral breathing glow
        if (obj.userData.npcMat) {
          obj.userData.npcMat.emissiveIntensity = 0.55 + Math.sin(elapsed * 2.8 + obj.userData.timeOffset) * 0.25;
        }
        if (obj.userData.light) {
          obj.userData.light.intensity = 1.4 + Math.sin(elapsed * 2.8 + obj.userData.timeOffset) * 0.35;
        }
      }
    }
  }
  // Find nearest NPC to player position
  getNearbyNpc(playerX, playerZ, maxDistance = 3.5) {
    let closestNpc = null;
    let closestDist = maxDistance;

    for (const [, npcMesh] of this.activeNpcs.entries()) {
      const npcData = npcMesh.userData.npcData;
      const dist = Math.hypot(npcData.x - playerX, npcData.z - playerZ);
      if (dist < closestDist) {
        closestDist = dist;
        closestNpc = npcData;
      }
    }

    return closestNpc;
  }
}
