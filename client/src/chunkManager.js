import * as THREE from 'three';
import {
  createFloorTile,
  createCeiling,
  createPillar,
  createPumpkin,
  createTorch,
  createStreetLantern,
  createTelescope,
  createObelisk,
  createBookshelf,
  createWall,
  createDoor,
  createArch,
  createDeskRow,
  createBlackboard,
  createServerRack,
  createLaserBench,
  createCouncilTable,
  createTurnstile,
  createSignpost,
  createCeilingLamp,
  createGhostNPC,
  createArtifactMesh,
  createGrandStairs,
  createElevator,
  createBaumanBench,
  createRadiator,
  createBaumanCrest,
  createBust,
  createWardrobe,
  createLecturePodium,
  createCobweb,
  createScheduleBoard,
  createDeanNoticeBoard,
  createClock,
  createFireHoseCabinet,
  createFoodServiceCounter,
  createDiningTable,
  createWitchCauldron,
  createCafeteriaMenuBoard,
  createTeacherDesk,
  createFloatingCandle,
  createFoundersSafe,
  createTomeProp,
  createFlaskProp,
  createSkullProp,
  createCrystalProp,
  createCandelabraProp,
  createCauldron,
  createLightBeacon,
  createChaliceRelic
} from './environment.js';
import { soundEngine } from './audio.js';

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
    this.animatedObjects = [];   // torches, pumpkins, npcs, artifacts
    this.movableProps = new Map(); // propId -> THREE.Group
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

    const isFirstTime = this.currentChunkX === null || this.currentChunkZ === null || (this.loadedChunks.size === 0 && this.network.isConnected());
    if (isFirstTime) {
      this.currentChunkX = cx;
      this.currentChunkZ = cz;
      this.onPlayerEnterChunk(cx, cz);
      return;
    }

    // Hysteresis deadband: require player to cross at least 2.5m into the new chunk to avoid boundary flapping
    if (cx !== this.currentChunkX || cz !== this.currentChunkZ) {
      const oldOriginX = this.currentChunkX * CHUNK_SIZE;
      const oldOriginZ = this.currentChunkZ * CHUNK_SIZE;
      const distFromOldCenter = Math.hypot(x - oldOriginX, z - oldOriginZ);
      if (distFromOldCenter >= (CHUNK_SIZE / 2 + 2.5)) {
        this.currentChunkX = cx;
        this.currentChunkZ = cz;
        this.onPlayerEnterChunk(cx, cz);
      }
    }
  }

  forceReload() {
    this.pendingRequests.clear();
    this.currentChunkX = null;
    this.currentChunkZ = null;
    const cx = 0;
    const cz = this.currentChunkZ ?? 0;
    this.onPlayerEnterChunk(cx, cz);
  }

  // Return the optimal 10 chunks for the current wing so all corridors and sealing walls are 100% visible
  getWingCoords(cx, cz) {
    const coords=[];
    for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
      const x=cx+dx,z=cz+dz;
      if(x>=-5&&x<=4&&z>=-5&&z<=4)coords.push({cx:x,cz:z});
    }
    return coords;
  }

  onPlayerEnterChunk(cx, cz) {
    // Load the coherent 10-chunk set for the active wing (strictly <= 10 chunks budget)
    const neededCoords = this.getWingCoords(cx, cz);

    // Sort by distance to player (closest load first)
    neededCoords.sort((a, b) => {
      const distA = Math.hypot(a.cx - cx, a.cz - cz);
      const distB = Math.hypot(b.cx - cx, b.cz - cz);
      return distA - distB;
    });
    // Request missing chunks without premature eviction (only evict upon chunk arrival!)
    for (const coord of neededCoords) {
      const key = `${coord.cx},${coord.cz}`;
      if (!this.loadedChunks.has(key) && !this.pendingRequests.has(key)) {
        this.pendingRequests.add(key);
        this.network.send({
          type: 'REQUEST_CHUNK',
          cx: coord.cx,
          cz: coord.cz
        });
      } else if (this.loadedChunks.has(key)) {
        this.loadedChunks.get(key).lastAccessed = Date.now();
      }
    }
  }

  // Strict LRU / Distance Eviction to guarantee <= 10%
  enforceCacheLimit(centerCx, centerCz) {
    while (this.loadedChunks.size >= this.maxCacheLimit) {
      // Find chunk farthest from current player chunk, but NEVER unload active chunk!
      let maxDist = -1;
      let farthestKey = null;

      for (const [key, chunkEntry] of this.loadedChunks.entries()) {
        const [kcx, kcz] = key.split(',').map(Number);
        if (kcx === centerCx && kcz === centerCz) continue;
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
    if (!this.getWingCoords(this.currentChunkX ?? 0,this.currentChunkZ ?? 0).some(c=>c.cx===chunkData.cx&&c.cz===chunkData.cz)) return;

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
      } else if (obj.type === 'wall') {
        chunkGroup.add(createWall(obj.x, obj.y, obj.z, obj.width, obj.height, obj.depth, obj.rotY));
      } else if (obj.type === 'door') {
        const door = createDoor(obj.x, obj.y, obj.z, obj.rotY, obj.roomNumber, obj.label);
        chunkGroup.add(door);
        this.animatedObjects.push(door);
      } else if (obj.type === 'ceiling') {
        chunkGroup.add(createCeiling(obj.x, obj.y, obj.z, obj.width, obj.depth));
      } else if (obj.type === 'arch') {
        chunkGroup.add(createArch(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'desk_row') {
        chunkGroup.add(createDeskRow(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'blackboard') {
        chunkGroup.add(createBlackboard(obj.x, obj.y, obj.z, obj.rotY, obj.formulaType));
      } else if (obj.type === 'server_rack') {
        chunkGroup.add(createServerRack(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'laser_bench') {
        chunkGroup.add(createLaserBench(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'council_table') {
        chunkGroup.add(createCouncilTable(obj.x, obj.y, obj.z));
      } else if (obj.type === 'turnstile') {
        chunkGroup.add(createTurnstile(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'grand_stairs') {
        chunkGroup.add(createGrandStairs(obj.x, obj.y, obj.z));
      } else if (obj.type === 'elevator') {
        chunkGroup.add(createElevator(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'signpost') {
        chunkGroup.add(createSignpost(obj.x, obj.y, obj.z, obj.rotY, obj.text));
      } else if (obj.type === 'ceiling_lamp') {
        chunkGroup.add(createCeilingLamp(obj.x, obj.y, obj.z));
      } else if (obj.type === 'pillar') {
        const pillar = createPillar(obj.x, obj.y, obj.z, obj.height);
        chunkGroup.add(pillar);
      } else if (obj.type === 'pumpkin') {
        const pumpkin = createPumpkin(obj.x, obj.y, obj.z, obj.glowing);
        const propId = obj.id || `pumpkin_${obj.x}_${obj.z}`;
        pumpkin.userData.propId = propId;
        pumpkin.userData.label = obj.label || 'Тыква-фонарь';
        chunkGroup.add(pumpkin);
        this.animatedObjects.push(pumpkin);
        this.movableProps.set(propId, pumpkin);
      } else if (obj.type === 'torch') {
        const torch = createTorch(obj.x, obj.y, obj.z);
        chunkGroup.add(torch);
        this.animatedObjects.push(torch);
      } else if (obj.type === 'lantern' || obj.type === 'street_lantern') {
        const lantern = createStreetLantern(obj.x, obj.y, obj.z);
        chunkGroup.add(lantern);
        this.animatedObjects.push(lantern);
      } else if (obj.type === 'telescope') {
        chunkGroup.add(createTelescope(obj.x, obj.y, obj.z));
      } else if (obj.type === 'obelisk') {
        chunkGroup.add(createObelisk(obj.x, obj.y, obj.z, obj.label));
      } else if (obj.type === 'cauldron') {
        const cauldron = createCauldron(obj.x, obj.y, obj.z);
        chunkGroup.add(cauldron);
        this.animatedObjects.push(cauldron);
      } else if (obj.type === 'tome') {
        const tome = createTomeProp(obj.x, obj.y, obj.z, obj.rotY);
        const propId = obj.id || `tome_${obj.x}_${obj.z}`;
        tome.userData.propId = propId;
        tome.userData.label = obj.label || 'Гримуар';
        chunkGroup.add(tome);
        this.movableProps.set(propId, tome);
      } else if (obj.type === 'flask') {
        const flask = createFlaskProp(obj.x, obj.y, obj.z, obj.color);
        const propId = obj.id || `flask_${obj.x}_${obj.z}`;
        flask.userData.propId = propId;
        flask.userData.label = obj.label || 'Алхимическое зелье';
        chunkGroup.add(flask);
        this.animatedObjects.push(flask);
        this.movableProps.set(propId, flask);
      } else if (obj.type === 'skull') {
        const skull = createSkullProp(obj.x, obj.y, obj.z, obj.rotY);
        const propId = obj.id || `skull_${obj.x}_${obj.z}`;
        skull.userData.propId = propId;
        skull.userData.label = obj.label || 'Череп';
        chunkGroup.add(skull);
        this.movableProps.set(propId, skull);
      } else if (obj.type === 'crystal') {
        const crystal = createCrystalProp(obj.x, obj.y, obj.z, obj.color);
        const propId = obj.id || `crystal_${obj.x}_${obj.z}`;
        crystal.userData.propId = propId;
        crystal.userData.label = obj.label || 'Кристалл';
        chunkGroup.add(crystal);
        this.animatedObjects.push(crystal);
        this.movableProps.set(propId, crystal);
      } else if (obj.type === 'candelabra') {
        const candelabra = createCandelabraProp(obj.x, obj.y, obj.z);
        const propId = obj.id || `candelabra_${obj.x}_${obj.z}`;
        candelabra.userData.propId = propId;
        candelabra.userData.label = obj.label || 'Канделябр';
        chunkGroup.add(candelabra);
        this.animatedObjects.push(candelabra);
        this.movableProps.set(propId, candelabra);
      } else if (obj.type === 'artifact') {
        const artifact = createArtifactMesh(obj);
        chunkGroup.add(artifact);
        this.animatedObjects.push(artifact);
      } else if (obj.type === 'bench') {
        chunkGroup.add(createBaumanBench(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'radiator') {
        chunkGroup.add(createRadiator(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'bauman_crest') {
        chunkGroup.add(createBaumanCrest(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'bust') {
        chunkGroup.add(createBust(obj.x, obj.y, obj.z, obj.name));
      } else if (obj.type === 'wardrobe') {
        chunkGroup.add(createWardrobe(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'podium') {
        chunkGroup.add(createLecturePodium(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'cobweb') {
        chunkGroup.add(createCobweb(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'schedule_board') {
        chunkGroup.add(createScheduleBoard(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'dean_notice_board') {
        chunkGroup.add(createDeanNoticeBoard(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'clock') {
        chunkGroup.add(createClock(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'fire_cabinet') {
        chunkGroup.add(createFireHoseCabinet(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'food_counter') {
        chunkGroup.add(createFoodServiceCounter(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'dining_table') {
        chunkGroup.add(createDiningTable(obj.x, obj.y, obj.z));
      } else if (obj.type === 'witch_cauldron') {
        const cauldron = createWitchCauldron(obj.x, obj.y, obj.z);
        chunkGroup.add(cauldron);
        this.animatedObjects.push(cauldron);
      } else if (obj.type === 'cafeteria_menu') {
        chunkGroup.add(createCafeteriaMenuBoard(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'teacher_desk') {
        chunkGroup.add(createTeacherDesk(obj.x, obj.y, obj.z, obj.rotY));
      } else if (obj.type === 'floating_candle') {
        const fc = createFloatingCandle(obj.x, obj.y, obj.z);
        chunkGroup.add(fc);
        this.animatedObjects.push(fc);
      } else if (obj.type === 'founders_safe') {
        const safe = createFoundersSafe(obj.x, obj.y, obj.z, obj.rotY);
        chunkGroup.add(safe);
        this.animatedObjects.push(safe);
      } else if (obj.type === 'beacon') {
        const beacon = createLightBeacon(obj.x, obj.y, obj.z, obj.colorHex);
        chunkGroup.add(beacon);
        this.animatedObjects.push(beacon);
      } else if (obj.type === 'chalice') {
        const chalice = createChaliceRelic(obj.x, obj.y, obj.z, obj.label);
        const propId = obj.id || `chalice_${obj.x}_${obj.z}`;
        chalice.userData.propId = propId;
        chunkGroup.add(chalice);
        this.animatedObjects.push(chalice);
        this.movableProps.set(propId, chalice);
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

    // Pre-calculate comprehensive 3D AABB collision boxes for this chunk
    const collisionBoxes = [];
    for (const obj of chunkData.objects) {
      const rotY = obj.rotY || 0;
      const isRot = Math.abs(Math.sin(rotY)) > 0.5;
      const baseY = obj.y || 0;

      let w = 0, d = 0, h = 3.5;

      if (obj.type === 'wall') {
        w = isRot ? (obj.depth || 0.4) : (obj.width || 24);
        d = isRot ? (obj.width || 24) : (obj.depth || 0.4);
        h = obj.height || 5.0;
      } else if (obj.type === 'pillar') {
        w = 1.3; d = 1.3; h = obj.height || 5.0;
      } else if (obj.type === 'desk_row') {
        w = isRot ? 1.4 : 5.4; d = isRot ? 5.4 : 1.4; h = 1.2;
      } else if (obj.type === 'council_table') {
        w = isRot ? 3.6 : 8.2; d = isRot ? 8.2 : 3.6; h = 1.2;
      } else if (obj.type === 'laser_bench') {
        w = isRot ? 1.8 : 3.4; d = isRot ? 3.4 : 1.8; h = 1.4;
      } else if (obj.type === 'server_rack') {
        w = 1.4; d = 1.2; h = 2.4;
      } else if (obj.type === 'bookshelf') {
        w = isRot ? 0.9 : 2.8; d = isRot ? 2.8 : 0.9; h = 2.6;
      } else if (obj.type === 'podium') {
        w = 1.2; d = 1.0; h = 1.6;
      } else if (obj.type === 'teacher_desk') {
        w = isRot ? 1.6 : 2.8; d = isRot ? 2.8 : 1.6; h = 1.2;
      } else if (obj.type === 'bench') {
        w = isRot ? 0.9 : 2.6; d = isRot ? 2.6 : 0.9; h = 1.0;
      } else if (obj.type === 'bust') {
        w = 1.0; d = 1.0; h = 2.0;
      } else if (obj.type === 'radiator') {
        w = isRot ? 0.5 : 1.4; d = isRot ? 1.4 : 0.5; h = 1.0;
      } else if (obj.type === 'turnstile') {
        w = isRot ? 0.6 : 1.4; d = isRot ? 1.4 : 0.6; h = 1.2;
      } else if (obj.type === 'wardrobe') {
        w = isRot ? 1.2 : 8.0; d = isRot ? 8.0 : 1.2; h = 2.2;
      } else if (obj.type === 'food_counter') {
        w = isRot ? 1.4 : 10.2; d = isRot ? 10.2 : 1.4; h = 1.4;
      } else if (obj.type === 'dining_table') {
        w = 2.2; d = 1.2; h = 1.1;
      } else if (obj.type === 'witch_cauldron') {
        w = 1.4; d = 1.4; h = 1.2;
      } else if (obj.type === 'founders_safe') {
        w = isRot ? 1.4 : 2.4; d = isRot ? 2.4 : 1.4; h = 2.6;
      }

      if (w > 0) {
        collisionBoxes.push({
          minX: obj.x - w / 2,
          maxX: obj.x + w / 2,
          minZ: obj.z - d / 2,
          maxZ: obj.z + d / 2,
          minY: baseY - ((obj.type === "wall" || obj.type === "pillar") ? h / 2 : 0) - 0.2,
          maxY: baseY + ((obj.type === "wall" || obj.type === "pillar") ? h / 2 : h) + 0.2
        });
      }
    }

    this.scene.add(chunkGroup);
    this.loadedChunks.set(key, {
      group: chunkGroup,
      data: chunkData,
      collisionBoxes,
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

    // Dispose unique geometries and dynamic canvas textures (NEVER dispose shared global materials!)
    group.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of mats) {
          // Only dispose dynamic canvas textures, not static shared materials!
          if (m && m.map && m.map.isCanvasTexture) {
            m.map.dispose();
            m.dispose();
          }
        }
      }
    });

    this.scene.remove(group);
    this.loadedChunks.delete(key);
    this.notifyCache();
  }

  // Update animated objects (flickering torches, bobbing ghosts, rotating artifacts)
  animate(delta, elapsed, playerPos) {
    for (const obj of this.animatedObjects) {
      if (obj.userData?.light && Number.isFinite(obj.userData.baseIntensity)) {
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
          obj.userData.light.intensity = 1.6 + Math.sin(elapsed * 2.8 + obj.userData.timeOffset) * 0.45;
        }
        // Ethereal tail waving animation
        if (obj.userData.tailGroup) {
          obj.userData.tailGroup.rotation.x = Math.sin(elapsed * 3.2 + obj.userData.timeOffset) * 0.12;
          obj.userData.tailGroup.rotation.z = Math.cos(elapsed * 2.4 + obj.userData.timeOffset) * 0.08;
        }
        // Special animated props (halo, cube, crystal)
        if (obj.userData.specialProp) {
          if (obj.userData.npcData.id === 'akhmetova') {
            obj.userData.specialProp.rotation.z += delta * 0.8;
          } else if (obj.userData.npcData.id === 'korshunov') {
            obj.userData.specialProp.rotation.y += delta * 1.2;
            obj.userData.specialProp.rotation.x += delta * 0.6;
          } else if (obj.userData.specialProp.userData?.netCube) {
            obj.userData.specialProp.userData.netCube.rotation.y += delta * 1.5;
            obj.userData.specialProp.userData.netCube.rotation.x += delta * 0.8;
          }
        }
      }
      if (obj.userData?.isArtifact) {
        // Rotating & bobbing collectible artifact
        obj.rotation.y += delta * 1.5;
        obj.position.y = obj.userData.baseY + Math.sin(elapsed * 2.5 + obj.userData.timeOffset) * 0.12;
      }
      if (obj.userData?.isBeacon) {
        if (obj.userData.ring) {
          obj.userData.ring.rotation.z += delta * 0.45;
        }
        if (obj.userData.beam && obj.userData.beam.material) {
          obj.userData.beam.material.opacity = 0.32 + Math.sin(elapsed * 2.2) * 0.08;
        }
      }
      if (obj.userData?.isDoor && playerPos) {
        const dx = playerPos.x - obj.position.x;
        const dz = playerPos.z - obj.position.z;
        const dist = Math.hypot(dx, dz);

        // Door opens when player approaches within 4.2m
        const shouldOpen = dist < 4.2;
        obj.userData.targetAngle = shouldOpen ? -Math.PI * 0.48 : 0;

        const diff = obj.userData.targetAngle - obj.userData.hinge.rotation.y;
        if (Math.abs(diff) > 0.003) {
          obj.userData.hinge.rotation.y += diff * Math.min(1, delta * 5.0);
          if (shouldOpen && !obj.userData.isOpen) {
            obj.userData.isOpen = true;
            soundEngine.playDoorSound(true);
          } else if (!shouldOpen && obj.userData.isOpen) {
            obj.userData.isOpen = false;
            soundEngine.playDoorSound(false);
          }
        }
      }
      if (obj.userData?.isVault && obj.userData.wheelGroup) {
        obj.userData.wheelGroup.rotation.z += delta * 0.3;
      }
    }
  }
  // Hide collected artifact from 3D scene
  hideArtifact(itemId) {
    for (const obj of this.animatedObjects) {
      if (obj.userData?.isArtifact && obj.userData.itemId === itemId) {
        obj.visible = false;
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

  // Find closest movable prop within distance
  findNearbyMovableProp(playerPos, maxDistance = 2.8) {
    let closestProp = null;
    let closestDist = maxDistance;
    for (const prop of this.movableProps.values()) {
      if (prop.userData?.isHeld) continue;
      const dist = Math.hypot(prop.position.x - playerPos.x, prop.position.z - playerPos.z);
      if (dist < closestDist) {
        closestDist = dist;
        closestProp = prop;
      }
    }
    return closestProp;
  }

  setPropPosition(propId, x, y, z, rotY = 0) {
    const prop = this.movableProps.get(propId);
    if (prop) {
      prop.position.set(x, y, z);
      if (Number.isFinite(rotY)) prop.rotation.y = rotY;
      prop.visible = true;
      if (prop.userData) prop.userData.isHeld = false;
    }
  }

  setPropVisibility(propId, visible) {
    const prop = this.movableProps.get(propId);
    if (prop) {
      prop.visible = visible;
      if (prop.userData) prop.userData.isHeld = !visible;
    }
  }

  getMovableProp(propId) {
    return this.movableProps.get(propId);
  }

  // Ultra-fast collision box queries near the player (zero allocation per frame)
  getCollisionBoxes(px, pz, radius = 14, playerY = 1.6) {
    const boxes = [];
    for (const entry of this.loadedChunks.values()) {
      if (!entry.collisionBoxes) continue;
      for (const box of entry.collisionBoxes) {
        if (box.minY !== undefined && (playerY < box.minY || playerY > box.maxY)) continue;
        if (
          px + radius > box.minX && px - radius < box.maxX &&
          pz + radius > box.minZ && pz - radius < box.maxZ
        ) {
          boxes.push(box);
        }
      }
    }
    return boxes;
  }
}
