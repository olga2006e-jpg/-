// client/src/reactiveMobs.js
// Large-scale Reactive Ambient NPCs (Bats, Spectral Cats, Shadow Students)
// Procedurally constructed with Three.js primitives for zero asset-load dependency and 60 FPS performance.

import * as THREE from 'three';

export const MobType = {
  BAT: 'BAT',
  CAT: 'CAT',
  SHADOW_STUDENT: 'SHADOW_STUDENT'
};

/**
 * Base Reactive Mob
 */
export class ReactiveMob {
  constructor(data) {
    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.basePos = new THREE.Vector3(data.x, data.y, data.z);
    this.pos = this.basePos.clone();
    this.chunkX = data.chunkX;
    this.chunkZ = data.chunkZ;
    this.state = data.state || 'IDLE';
    
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);
    this.group.userData = { mob: this };
    
    this.elapsed = Math.random() * 50;
    this.speed = data.speed || 1.8;
    this.radius = data.radius || 4.0;
    this.fleeTimer = 0;
  }

  update(delta, playerPos, playerState = {}) {
    this.elapsed += delta;
  }
}

/**
 * 1. Reactive Bat (Летучая мышь)
 * Flies in swirling paths under the ceiling; wings flap; flees upward when player approaches with light.
 */
export class ReactiveBat extends ReactiveMob {
  constructor(data) {
    super(data);
    this.center = this.basePos.clone();
    this.angle = Math.random() * Math.PI * 2;
    this.flightRadius = data.radius || 4.0;
    this.verticalOffset = 0;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f1d2b, roughness: 0.9 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x2d2a3d, side: THREE.DoubleSide, roughness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff5555 });

    // Torso
    const bodyGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.group.add(body);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.04, 0.05, 0.16);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.04, 0.05, 0.16);
    this.group.add(eyeL);
    this.group.add(eyeR);

    // Left Wing (Articulated at shoulder)
    this.wingLeftPivot = new THREE.Group();
    this.wingLeftPivot.position.set(-0.08, 0.04, 0.02);
    const wingGeoL = new THREE.PlaneGeometry(0.38, 0.22);
    wingGeoL.translate(-0.19, 0, 0);
    const wingL = new THREE.Mesh(wingGeoL, wingMat);
    this.wingLeftPivot.add(wingL);
    this.group.add(this.wingLeftPivot);

    // Right Wing (Articulated at shoulder)
    this.wingRightPivot = new THREE.Group();
    this.wingRightPivot.position.set(0.08, 0.04, 0.02);
    const wingGeoR = new THREE.PlaneGeometry(0.38, 0.22);
    wingGeoR.translate(0.19, 0, 0);
    const wingR = new THREE.Mesh(wingGeoR, wingMat);
    this.wingRightPivot.add(wingR);
    this.group.add(this.wingRightPivot);
  }

  update(delta, playerPos, playerState = {}) {
    super.update(delta, playerPos, playerState);

    const distToPlayer = playerPos ? this.group.position.distanceTo(playerPos) : 999;
    
    // React to player proximity or lantern light
    if (distToPlayer < 4.2 || (playerState.lanternOn && distToPlayer < 7.0)) {
      this.state = 'FLEE';
      this.fleeTimer = 2.5; // Flee for 2.5 seconds
    }

    if (this.fleeTimer > 0) {
      this.fleeTimer -= delta;
      // Fly up towards high vaulted ceiling
      this.verticalOffset = Math.min(2.5, this.verticalOffset + delta * 2.8);
      // Flap wings rapidly (22 Hz)
      const flap = Math.sin(this.elapsed * 24.0) * 0.95;
      this.wingLeftPivot.rotation.z = flap;
      this.wingRightPivot.rotation.z = -flap;
      this.angle += delta * 4.0;
    } else {
      this.state = 'CIRCLE';
      this.verticalOffset = Math.max(0, this.verticalOffset - delta * 0.8);
      // Standard cruising wing flap (12 Hz)
      const flap = Math.sin(this.elapsed * 12.0) * 0.65;
      this.wingLeftPivot.rotation.z = flap;
      this.wingRightPivot.rotation.z = -flap;
      this.angle += delta * this.speed * 0.45;
    }

    // Trajectory calculation
    const currentRadius = this.state === 'FLEE' ? this.flightRadius * 1.3 : this.flightRadius;
    const nx = this.center.x + Math.cos(this.angle) * currentRadius;
    const nz = this.center.z + Math.sin(this.angle) * currentRadius;
    const ny = this.center.y + this.verticalOffset + Math.sin(this.elapsed * 2.0) * 0.25;

    // Orient facing forward along tangent
    const tangent = new THREE.Vector3(-Math.sin(this.angle), 0, Math.cos(this.angle));
    this.group.position.set(nx, ny, nz);
    this.group.lookAt(nx + tangent.x, ny + tangent.y, nz + tangent.z);
  }
}

/**
 * 2. Reactive Spectral Cat (Призрачная кошка)
 * Sits quietly; dynamically turns head to track the player; wags tail; startles if player sprints.
 */
export class ReactiveSpectralCat extends ReactiveMob {
  constructor(data) {
    super(data);
    this.furColor = data.furColor || '#1f1a30';
    this.eyeColor = data.eyeColor || '#50fa7b';
    this.isStartled = false;

    // Materials
    const furMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.furColor),
      roughness: 0.85,
      metalness: 0.1
    });
    const eyeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.eyeColor)
    });
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xff79c6 });

    // Torso (Loaf posture)
    const bodyGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.52, 10);
    bodyGeo.rotateZ(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.position.y = 0.18;
    this.group.add(body);

    // Front paws
    const pawGeo = new THREE.BoxGeometry(0.08, 0.06, 0.14);
    const pawL = new THREE.Mesh(pawGeo, furMat);
    pawL.position.set(-0.09, 0.04, 0.22);
    const pawR = new THREE.Mesh(pawGeo, furMat);
    pawR.position.set(0.09, 0.04, 0.22);
    this.group.add(pawL);
    this.group.add(pawR);

    // Head Pivot Group (Can independently lookAt player!)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.35, 0.24);
    this.group.add(this.headGroup);

    // Head sphere
    const headGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const headMesh = new THREE.Mesh(headGeo, furMat);
    this.headGroup.add(headMesh);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.06, 0.12, 4);
    const earL = new THREE.Mesh(earGeo, furMat);
    earL.position.set(-0.08, 0.14, 0.01);
    earL.rotation.z = 0.2;
    const earR = new THREE.Mesh(earGeo, furMat);
    earR.position.set(0.08, 0.14, 0.01);
    earR.rotation.z = -0.2;
    this.headGroup.add(earL);
    this.headGroup.add(earR);

    // Glowing Cat Eyes
    const catEyeGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const catEyeL = new THREE.Mesh(catEyeGeo, eyeMat);
    catEyeL.position.set(-0.05, 0.02, 0.12);
    const catEyeR = new THREE.Mesh(catEyeGeo, eyeMat);
    catEyeR.position.set(0.05, 0.02, 0.12);
    this.headGroup.add(catEyeL);
    this.headGroup.add(catEyeR);

    // Pink nose
    const noseGeo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.01, 0.14);
    this.headGroup.add(nose);

    // Articulated Tail
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.12, -0.25);
    const tailGeo = new THREE.CylinderGeometry(0.035, 0.02, 0.36, 6);
    tailGeo.rotateX(-Math.PI / 3);
    tailGeo.translate(0, 0.12, -0.08);
    const tail = new THREE.Mesh(tailGeo, furMat);
    this.tailGroup.add(tail);
    this.group.add(this.tailGroup);

    if (data.rotY) this.group.rotation.y = data.rotY;
  }

  update(delta, playerPos, playerState = {}) {
    super.update(delta, playerPos, playerState);

    const distToPlayer = playerPos ? this.group.position.distanceTo(playerPos) : 999;

    // React to player running or throwing nearby
    if (distToPlayer < 2.5 && playerState.isSprinting) {
      this.isStartled = true;
      this.fleeTimer = 2.0;
    }

    if (this.fleeTimer > 0) {
      this.fleeTimer -= delta;
      // Arch back / crouch low
      this.group.scale.y = 0.85;
      // Fast tail swishing
      this.tailGroup.rotation.y = Math.sin(this.elapsed * 16.0) * 0.7;
    } else {
      this.isStartled = false;
      this.group.scale.y = 1.0;
      // Gentle lazy tail swishing
      this.tailGroup.rotation.y = Math.sin(this.elapsed * 2.2) * 0.35;
    }

    // Dynamic Head-Tracking: Turn head to face the approaching player
    if (playerPos && distToPlayer < 7.5) {
      // Calculate angle from cat head to player in world space
      const worldHeadPos = new THREE.Vector3();
      this.headGroup.getWorldPosition(worldHeadPos);
      
      const dirToPlayer = playerPos.clone().sub(worldHeadPos).normalize();
      
      // Convert to local space of the cat body
      const invMat = this.group.matrixWorld.clone().invert();
      const localDir = dirToPlayer.applyEuler(new THREE.Euler(0, -this.group.rotation.y, 0));
      
      // Clamp head turn angle to natural feline neck limits (-75 to +75 degrees)
      const yaw = Math.max(-1.3, Math.min(1.3, Math.atan2(localDir.x, localDir.z)));
      const pitch = Math.max(-0.4, Math.min(0.5, -localDir.y));
      
      this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, yaw, delta * 6.0);
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, pitch, delta * 6.0);
    } else {
      // Return head to relaxed forward posture
      this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, 0, delta * 3.0);
      this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0, delta * 3.0);
    }
  }
}

/**
 * 3. Reactive Shadow Student (Тень студента)
 * Wanders collegiate halls carrying a floating spectral tome; stops and turns to face speaking players.
 */
export class ReactiveShadowStudent extends ReactiveMob {
  constructor(data) {
    super(data);
    this.pathRadius = data.pathRadius || 6.0;
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.targetRotY = data.rotY || 0;

    // Spectral Robe Material (Dark silhouette with glowing cyan/purple rim)
    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x18152e,
      roughness: 0.85,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88
    });
    const bookMat = new THREE.MeshStandardMaterial({
      color: 0x8b3a3a,
      roughness: 0.6
    });
    const runePageMat = new THREE.MeshBasicMaterial({
      color: 0x8be9fd
    });

    // Torso & Robe
    const robeGeo = new THREE.ConeGeometry(0.38, 1.65, 12);
    robeGeo.translate(0, 0.82, 0);
    const robe = new THREE.Mesh(robeGeo, robeMat);
    this.group.add(robe);

    // Hood / Head
    const hoodGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const hood = new THREE.Mesh(hoodGeo, robeMat);
    hood.position.y = 1.72;
    this.group.add(hood);

    // Glowing mysterious eyes inside shadow hood
    const eyeGeo = new THREE.PlaneGeometry(0.04, 0.015);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x8be9fd, side: THREE.DoubleSide });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.06, 1.72, 0.2);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.06, 1.72, 0.2);
    this.group.add(eyeL);
    this.group.add(eyeR);

    // Floating Levitation Grimoire
    this.bookGroup = new THREE.Group();
    this.bookGroup.position.set(0, 1.15, 0.48);

    const coverGeo = new THREE.BoxGeometry(0.28, 0.05, 0.38);
    const cover = new THREE.Mesh(coverGeo, bookMat);
    this.bookGroup.add(cover);

    const pageGeo = new THREE.BoxGeometry(0.26, 0.04, 0.36);
    const pages = new THREE.Mesh(pageGeo, runePageMat);
    pages.position.y = 0.01;
    this.bookGroup.add(pages);

    this.group.add(this.bookGroup);
  }

  update(delta, playerPos, playerState = {}) {
    super.update(delta, playerPos, playerState);

    const distToPlayer = playerPos ? this.group.position.distanceTo(playerPos) : 999;
    
    // React to conversation / chat or close proximity
    const playerIsTalking = Boolean(playerState.isChatting || playerState.recentChat);
    const isNearby = distToPlayer < 4.5;

    // Levitate and bob the spectral textbook
    this.bookGroup.position.y = 1.15 + Math.sin(this.elapsed * 3.0) * 0.05;
    this.bookGroup.rotation.x = 0.2 + Math.sin(this.elapsed * 1.8) * 0.08;

    if (playerIsTalking && isNearby) {
      // 1. REACTION TO CONVERSATION: Stop walking and turn completely to face the speaker!
      this.state = 'LISTENING';
      const lookVec = playerPos.clone().sub(this.group.position);
      this.targetRotY = Math.atan2(lookVec.x, lookVec.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotY, delta * 4.0);

      // Slightly raise book in reverence
      this.bookGroup.position.y = 1.25;
    } else if (isNearby) {
      // 2. REACTION TO NEARBY PLAYER: Pause wandering and turn gaze towards player
      this.state = 'OBSERVING';
      const lookVec = playerPos.clone().sub(this.group.position);
      this.targetRotY = Math.atan2(lookVec.x, lookVec.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotY, delta * 2.5);
    } else {
      // 3. AMBIENT WANDERING: Glide gently along circular patrol path
      this.state = 'WANDER';
      this.patrolAngle += delta * 0.15;
      
      const targetX = this.basePos.x + Math.cos(this.patrolAngle) * this.pathRadius;
      const targetZ = this.basePos.z + Math.sin(this.patrolAngle) * this.pathRadius;
      
      const tangentX = -Math.sin(this.patrolAngle);
      const tangentZ = Math.cos(this.patrolAngle);
      this.targetRotY = Math.atan2(tangentX, tangentZ);
      
      this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, targetX, delta * 1.5);
      this.group.position.z = THREE.MathUtils.lerp(this.group.position.z, targetZ, delta * 1.5);
      this.group.position.y = this.basePos.y + Math.sin(this.elapsed * 1.5) * 0.04; // Gentle ghost hover
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetRotY, delta * 2.0);
    }
  }
}

/**
 * Reactive Mobs Manager
 * Manages the population of all 40+ ambient mobs, chunk loading, and frame updates
 */
export class ReactiveMobsManager {
  constructor(scene) {
    this.scene = scene;
    this.mobs = new Map(); // id -> ReactiveMob
    this.clock = new THREE.Clock();
  }

  /**
   * Spawn a mob into the 3D scene
   */
  spawnMob(data) {
    if (this.mobs.has(data.id)) return this.mobs.get(data.id);

    let mob = null;
    switch (data.type) {
      case MobType.BAT:
        mob = new ReactiveBat(data);
        break;
      case MobType.CAT:
        mob = new ReactiveSpectralCat(data);
        break;
      case MobType.SHADOW_STUDENT:
        mob = new ReactiveShadowStudent(data);
        break;
      default:
        console.warn(`[ReactiveMobs] Unknown mob type: ${data.type}`);
        return null;
    }

    this.mobs.set(data.id, mob);
    this.scene.add(mob.group);
    return mob;
  }

  /**
   * Load mobs array (e.g. from server chunk or server/mobs.js)
   */
  loadMobs(mobsList) {
    if (!Array.isArray(mobsList)) return;
    for (const mobData of mobsList) {
      this.spawnMob(mobData);
    }
  }

  /**
   * Remove mob by id
   */
  removeMob(id) {
    const mob = this.mobs.get(id);
    if (mob) {
      this.scene.remove(mob.group);
      this.mobs.delete(id);
    }
  }

  /**
   * Update all active mobs
   * @param {number} delta - Frame delta
   * @param {THREE.Vector3} playerPosition - Current player position in world
   * @param {Object} playerState - { isSprinting, lanternOn, isChatting, recentChat }
   */
  update(delta = null, playerPosition = null, playerState = {}) {
    const d = delta !== null ? delta : this.clock.getDelta();
    for (const mob of this.mobs.values()) {
      mob.update(d, playerPosition, playerState);
    }
  }
}

