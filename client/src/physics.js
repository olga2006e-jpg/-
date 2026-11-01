// client/src/physics.js
// Interactive Prop Physics Engine with Inertia, Ballistics, Elastic Bouncing, and Door Hinges

import * as THREE from 'three';

/**
 * Physical Prop states
 */
export const PropState = {
  RESTING: 'RESTING',
  HELD: 'HELD',
  FLYING: 'FLYING',
  DOOR_OPENING: 'DOOR_OPENING',
  DOOR_CLOSING: 'DOOR_CLOSING'
};

/**
 * Represents a single physics-enabled object in the world
 */
export class PhysicalObject {
  constructor(options = {}) {
    this.id = options.id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.name = options.name || 'Физический объект';
    this.mesh = options.mesh || null;
    this.type = options.type || 'item'; // 'item', 'door', 'heavy_box'
    
    // Physics vectors
    this.position = this.mesh ? this.mesh.position : new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();
    
    // Physics parameters
    this.mass = options.mass || 1.0;
    this.restitution = options.restitution !== undefined ? options.restitution : 0.58; // Elasticity of bounce
    this.friction = options.friction !== undefined ? options.friction : 0.72; // Ground friction damping
    this.airDrag = options.airDrag !== undefined ? options.airDrag : 0.08;
    this.floorY = options.floorY !== undefined ? options.floorY : 0.15;
    this.radius = options.radius || 0.35;
    
    // Door/hinge specific parameters
    this.isDoor = options.type === 'door';
    this.doorPivot = options.doorPivot || new THREE.Vector3();
    this.doorCurrentAngle = 0;
    this.doorTargetAngle = 0;
    this.doorOpenAngle = options.doorOpenAngle || Math.PI * 0.48; // ~86 degrees
    this.doorSpeed = 3.5; // radians per second
    
    // Interaction state
    this.state = options.state || PropState.RESTING;
    this.heldBy = null;
    this.carrierOffset = options.carrierOffset || new THREE.Vector3(0.35, -0.28, -0.85); // Camera-relative offset
    
    // Callback when state settles
    this.onSettle = options.onSettle || null;
  }

  /**
   * Throw object forward with player inertia
   * @param {THREE.Vector3} origin - Starting point (usually camera position)
   * @param {THREE.Vector3} forward - Unit look direction vector
   * @param {THREE.Vector3} playerVelocity - Inertia of the running/walking player
   * @param {number} throwForce - Impulse magnitude
   */
  throw(origin, forward, playerVelocity = null, throwForce = 12.0) {
    this.state = PropState.FLYING;
    this.heldBy = null;
    
    if (this.mesh) {
      this.mesh.position.copy(origin);
      this.position.copy(origin);
    }
    
    // Base throw impulse: forward and slight upward ballistic arc
    const impulse = forward.clone().normalize().multiplyScalar(throwForce);
    impulse.y += 2.2; // Natural lob arc
    
    // Transfer player's movement inertia (if moving, prop flies faster!)
    if (playerVelocity) {
      impulse.addScaledVector(playerVelocity, 0.85);
    }
    
    this.velocity.copy(impulse);
    
    // Impart natural random spin when tumbling through the air
    this.angularVelocity.set(
      (Math.random() - 0.5) * 8.0,
      (Math.random() - 0.5) * 5.0,
      (Math.random() - 0.5) * 8.0
    );
  }

  /**
   * Pick up this object by a player
   */
  pickUp(username = 'player') {
    if (this.isDoor) return;
    this.state = PropState.HELD;
    this.heldBy = username;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
  }

  /**
   * Drop or place object gently on the floor
   */
  place(targetPos, targetRotY = 0) {
    this.state = PropState.RESTING;
    this.heldBy = null;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    
    if (this.mesh) {
      this.mesh.position.copy(targetPos);
      this.mesh.rotation.set(0, targetRotY, 0);
      this.position.copy(targetPos);
    }
  }

  /**
   * Toggle door open / closed
   */
  toggleDoor() {
    if (!this.isDoor) return;
    if (Math.abs(this.doorTargetAngle) < 0.1) {
      this.doorTargetAngle = this.doorOpenAngle;
      this.state = PropState.DOOR_OPENING;
    } else {
      this.doorTargetAngle = 0;
      this.state = PropState.DOOR_CLOSING;
    }
  }

  /**
   * Update physics step
   * @param {number} delta - Frame delta in seconds (clamped to <= 0.05)
   * @param {number} gravity - Gravity multiplier (e.g. 9.8)
   */
  update(delta, gravity = 9.8) {
    if (!this.mesh) return;

    // 1. Door Hinge Physics (Smooth angular slerp/spring)
    if (this.isDoor) {
      if (Math.abs(this.doorCurrentAngle - this.doorTargetAngle) > 0.005) {
        const step = Math.sign(this.doorTargetAngle - this.doorCurrentAngle) * this.doorSpeed * delta;
        if (Math.abs(step) > Math.abs(this.doorTargetAngle - this.doorCurrentAngle)) {
          this.doorCurrentAngle = this.doorTargetAngle;
        } else {
          this.doorCurrentAngle += step;
        }
        this.mesh.rotation.y = this.doorCurrentAngle;
      } else {
        this.state = PropState.RESTING;
      }
      return;
    }

    // 2. Held Object (Positioned relative to carrier)
    if (this.state === PropState.HELD) {
      // The parent carrier controller updates mesh position via updateHeld
      return;
    }

    // 3. Active Ballistic Physics & Elastic Bounces
    if (this.state === PropState.FLYING) {
      // Apply gravity
      this.velocity.y -= gravity * delta;
      
      // Apply air resistance
      const dragFactor = Math.max(0, 1 - this.airDrag * delta);
      this.velocity.x *= dragFactor;
      this.velocity.z *= dragFactor;
      
      // Integrate velocity into position
      this.mesh.position.addScaledVector(this.velocity, delta);
      this.position.copy(this.mesh.position);
      
      // Apply rotational tumbling in the air
      this.mesh.rotation.x += this.angularVelocity.x * delta;
      this.mesh.rotation.y += this.angularVelocity.y * delta;
      this.mesh.rotation.z += this.angularVelocity.z * delta;
      
      // Ground / Floor Plane Collision
      if (this.mesh.position.y <= this.floorY) {
        this.mesh.position.y = this.floorY;
        
        // Elastic rebound on vertical axis
        if (Math.abs(this.velocity.y) > 0.4) {
          this.velocity.y = -this.velocity.y * this.restitution;
          
          // Lateral friction deceleration on bounce contact
          this.velocity.x *= this.friction;
          this.velocity.z *= this.friction;
          
          // Angular velocity damping upon bounce
          this.angularVelocity.multiplyScalar(0.65);
        } else {
          // Object has lost vertical momentum — roll / slide to a stop
          this.velocity.y = 0;
          this.velocity.x *= Math.pow(0.1, delta * 3);
          this.velocity.z *= Math.pow(0.1, delta * 3);
          this.angularVelocity.multiplyScalar(Math.pow(0.05, delta * 2));
          
          // Settle into resting state
          if (this.velocity.lengthSq() < 0.04) {
            this.state = PropState.RESTING;
            this.velocity.set(0, 0, 0);
            this.angularVelocity.set(0, 0, 0);
            // Straighten upright slightly on ground
            this.mesh.rotation.x *= 0.5;
            this.mesh.rotation.z *= 0.5;
            if (typeof this.onSettle === 'function') {
              this.onSettle(this);
            }
          }
        }
      }
    }
  }
}

/**
 * Physics World Manager
 * Manages all physical objects, raycast interactions, throwing, and network synchronization
 */
export class PhysicsWorld {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.objects = new Map(); // id -> PhysicalObject
    this.gravity = options.gravity !== undefined ? options.gravity : 9.8;
    this.network = options.network || null;
    
    // Raycaster for pickup / door interaction
    this.raycaster = new THREE.Raycaster();
    this.interactionRange = options.interactionRange || 4.2; // meters
    
    // Currently held object by local player
    this.heldObject = null;
    
    // Create audio synthesizers for collision clatters
    this.setupCollisionAudio();
  }

  setNetwork(networkClient) {
    this.network = networkClient;
  }

  setupCollisionAudio() {
    // Lightweight Web Audio synth for prop clatter / thud
    this.audioCtx = null;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {}
  }

  playThudSound(volume = 0.25) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.audioCtx.currentTime + 0.09);
      
      gain.gain.setValueAtTime(volume * 0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  /**
   * Register a physical object
   */
  register(object) {
    this.objects.set(object.id, object);
    if (object.mesh && !object.mesh.parent && this.scene) {
      this.scene.add(object.mesh);
    }
    return object;
  }

  /**
   * Remove a physical object
   */
  unregister(id) {
    const obj = this.objects.get(id);
    if (obj) {
      if (obj.mesh && obj.mesh.parent) {
        obj.mesh.parent.remove(obj.mesh);
      }
      this.objects.delete(id);
    }
  }

  /**
   * Create an interactive door in the scene
   */
  createInteractiveDoor(id, position, rotationY = 0, width = 1.4, height = 2.4) {
    const doorGroup = new THREE.Group();
    doorGroup.position.copy(position);
    doorGroup.rotation.y = rotationY;

    // Wood slab
    const slabGeo = new THREE.BoxGeometry(width, height, 0.08);
    // Shift geometry so pivot is at the hinge edge (left side)
    slabGeo.translate(width / 2, height / 2, 0);
    
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.8,
      metalness: 0.1
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    doorGroup.add(slabMesh);

    // Brass door handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.18, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xffb86c, metalness: 0.9, roughness: 0.3 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(width * 0.82, height * 0.48, 0.07);
    doorGroup.add(handle);

    const doorObj = new PhysicalObject({
      id,
      name: `Дверь аудитории [${id}]`,
      mesh: doorGroup,
      type: 'door',
      doorOpenAngle: Math.PI * 0.5
    });

    doorGroup.userData = { physicalObject: doorObj };
    this.register(doorObj);
    return doorObj;
  }

  /**
   * Create a physics-enabled interactive prop (flask, book, crystal orb, lantern)
   */
  createInteractiveProp(id, typeName, position) {
    const propGroup = new THREE.Group();
    propGroup.position.copy(position);

    let mainMesh;
    let mass = 1.0;
    let restitution = 0.55;

    switch (typeName) {
      case 'pumpkin': {
        const skin=new THREE.MeshStandardMaterial({color:0xd77d2d,roughness:.75});
        mainMesh=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),skin);mainMesh.scale.set(1.15,.94,1.1);
        const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.13,7),new THREE.MeshStandardMaterial({color:0x647447}));stem.position.y=.29;stem.rotation.z=.2;mainMesh.add(stem);
        mass=1.4;restitution=.48;break;
      }
      case 'flask': {
        // Alchemical Glass Flask with glowing potion
        const bodyGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x50fa7b,
          transparent: true,
          opacity: 0.82,
          roughness: 0.1,
          metalness: 0.1,
          emissive: 0x1a5e2c,
          emissiveIntensity: 0.6
        });
        mainMesh = new THREE.Mesh(bodyGeo, glassMat);
        
        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.22, 12);
        const neck = new THREE.Mesh(neckGeo, glassMat);
        neck.position.y = 0.26;
        mainMesh.add(neck);
        
        mass = 0.8;
        restitution = 0.45;
        break;
      }

      case 'crystal_orb': {
        // Arcane floating energy orb
        const orbGeo = new THREE.DodecahedronGeometry(0.26, 1);
        const orbMat = new THREE.MeshStandardMaterial({
          color: 0xbd93f9,
          emissive: 0xbd93f9,
          emissiveIntensity: 0.85,
          roughness: 0.2,
          metalness: 0.8
        });
        mainMesh = new THREE.Mesh(orbGeo, orbMat);
        mass = 1.2;
        restitution = 0.75; // Bouncier!
        break;
      }

      case 'book': {
        // Leather-bound grimoire
        const bookGeo = new THREE.BoxGeometry(0.32, 0.08, 0.44);
        const bookMat = new THREE.MeshStandardMaterial({
          color: 0x8b3a3a,
          roughness: 0.9,
          metalness: 0.05
        });
        mainMesh = new THREE.Mesh(bookGeo, bookMat);
        
        // Gilded page edge trim
        const pageGeo = new THREE.BoxGeometry(0.30, 0.06, 0.42);
        const pageMat = new THREE.MeshStandardMaterial({ color: 0xffe6a3, roughness: 0.7 });
        const pages = new THREE.Mesh(pageGeo, pageMat);
        pages.position.x = 0.01;
        mainMesh.add(pages);
        
        mass = 1.5;
        restitution = 0.25; // Books don't bounce much
        break;
      }

      default: { // 'heavy_box' or crate
        const boxGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x8a6f4d, roughness: 0.85 });
        mainMesh = new THREE.Mesh(boxGeo, boxMat);
        mass = 3.5;
        restitution = 0.35;
        break;
      }
    }

    propGroup.add(mainMesh);

    const propObj = new PhysicalObject({
      id,
      name: `${typeName} (${id})`,
      mesh: propGroup,
      type: 'item',
      mass,
      restitution,
      floorY: 0.18,
      onSettle: () => {
        this.playThudSound(0.2);
      }
    });

    propGroup.userData = { physicalObject: propObj };
    this.register(propObj);
    return propObj;
  }

  /**
   * Find closest interactive object within player interaction range
   */
  findNearbyInteractable(camera, range = null) {
    const maxDist = range || this.interactionRange;
    const meshes = [];
    for (const obj of this.objects.values()) {
      if (obj.mesh && obj.state !== PropState.HELD) {
        meshes.push(obj.mesh);
      }
    }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0 && intersects[0].distance <= maxDist) {
      let curr = intersects[0].object;
      while (curr) {
        if (curr.userData && curr.userData.physicalObject) {
          return {
            object: curr.userData.physicalObject,
            distance: intersects[0].distance,
            point: intersects[0].point
          };
        }
        curr = curr.parent;
      }
    }

    // Secondary fallback: distance-based proximity
    const camPos = camera.position;
    let closest = null;
    let minD = maxDist;
    for (const obj of this.objects.values()) {
      if (obj.mesh && obj.state !== PropState.HELD) {
        const d = camPos.distanceTo(obj.mesh.position);
        if (d < minD) {
          minD = d;
          closest = { object: obj, distance: d };
        }
      }
    }

    return closest;
  }

  /**
   * Interact with what the player is looking at (Toggle door, pick up prop)
   */
  interact(camera, username = 'player') {
    // If player is already holding an object, put it down / place it
    if (this.heldObject) {
      this.dropHeldObject(camera);
      return { action: 'PLACED', object: this.heldObject };
    }

    const hit = this.findNearbyInteractable(camera);
    if (!hit) return null;

    const target = hit.object;

    // Door interaction: toggle swing
    if (target.isDoor) {
      target.toggleDoor();
      return { action: 'DOOR_TOGGLED', object: target };
    }

    // Item interaction: pick up
    target.pickUp(username);
    this.heldObject = target;

    if (this.network && typeof this.network.sendPropPickup === 'function') {
      this.network.sendPropPickup(target.id);
    }

    return { action: 'PICKED_UP', object: target };
  }

  /**
   * Throw the currently held object forward with physics and inertia
   */
  throwHeldObject(camera, playerVelocity = null, throwStrength = 14.0) {
    if (!this.heldObject) return null;

    const thrown = this.heldObject;
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);

    const startPos = camera.position.clone().addScaledVector(lookDir, 0.6);

    thrown.throw(startPos, lookDir, playerVelocity, throwStrength);
    this.heldObject = null;

    // Sync over network WebSocket if available
    if (this.network) {
      const payload = {
        type: 'PROP_THROW',
        propId: thrown.id,
        startPos: { x: startPos.x, y: startPos.y, z: startPos.z },
        velocity: { x: thrown.velocity.x, y: thrown.velocity.y, z: thrown.velocity.z }
      };
      if (typeof this.network.sendJson === 'function') {
        this.network.sendJson(payload);
      } else if (this.network.ws && this.network.ws.readyState === 1) {
        this.network.ws.send(JSON.stringify(payload));
      }
    }

    return thrown;
  }

  /**
   * Drop held object gently onto the ground in front of the player
   */
  dropHeldObject(camera) {
    if (!this.heldObject) return null;

    const dropped = this.heldObject;
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);

    const dropPos = camera.position.clone().addScaledVector(lookDir, 1.2);
    dropPos.y = Math.max(0.2, dropPos.y - 0.7);

    dropped.place(dropPos, camera.rotation.y);
    this.heldObject = null;

    if (this.network && typeof this.network.sendPropPlace === 'function') {
      this.network.sendPropPlace(dropped.id, dropPos.x, dropPos.y, dropPos.z, camera.rotation.y);
    }

    return dropped;
  }

  /**
   * Handle network message when another player threw an object
   */
  handleRemoteThrow(propId, startPos, velocity) {
    let prop = this.objects.get(propId);
    if (!prop) {
      // Spawn on-the-fly if not already present
      prop = this.createInteractiveProp(propId, 'crystal_orb', new THREE.Vector3(startPos.x, startPos.y, startPos.z));
    }
    
    if (prop && prop.mesh) {
      prop.state = PropState.FLYING;
      prop.heldBy = null;
      prop.mesh.position.set(startPos.x, startPos.y, startPos.z);
      prop.velocity.set(velocity.x, velocity.y, velocity.z);
      prop.angularVelocity.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    }
  }

  /**
   * Update all active physical objects in the world
   * @param {number} delta - Frame delta in seconds
   * @param {THREE.Camera} camera - Player camera (to pin held object)
   */
  update(delta, camera = null) {
    const clampedDelta = Math.min(delta, 0.05);

    // Update held object position relative to camera
    if (this.heldObject && camera && this.heldObject.mesh) {
      const offset = this.heldObject.carrierOffset;
      const targetPos = camera.position.clone();
      
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      
      camera.getWorldDirection(forward);
      right.crossVectors(forward, up).normalize();
      
      targetPos.addScaledVector(right, offset.x);
      targetPos.addScaledVector(up, offset.y);
      targetPos.addScaledVector(forward, -offset.z); // in front
      
      this.heldObject.mesh.position.copy(targetPos);
      this.heldObject.mesh.rotation.copy(camera.rotation);
      this.heldObject.position.copy(targetPos);
    }

    // Step physics for all objects
    for (const obj of this.objects.values()) {
      obj.update(clampedDelta, this.gravity);
    }
  }
}

