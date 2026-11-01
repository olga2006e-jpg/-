// client/src/animatedProps.js
// Multi-part Hierarchical 3D Animated Objects & Agent World Mutation Handlers

import * as THREE from 'three';

/**
 * Base class for multi-part animated 3D props
 */
export class AnimatedProp {
  constructor(options = {}) {
    this.id = options.id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.name = options.name || 'Animated Prop';
    this.root = new THREE.Group();
    if (options.position) this.root.position.copy(options.position);
    if (options.rotation) this.root.rotation.copy(options.rotation);
    if (options.scale) this.root.scale.copy(options.scale);
    
    this.parts = {};
    this.elapsed = Math.random() * 100; // Phase offset
  }

  update(delta, time) {
    this.elapsed += delta;
  }

  addToScene(scene) {
    if (scene && !this.root.parent) {
      scene.add(this.root);
    }
  }

  removeFromScene(scene) {
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}

/**
 * 1. Grandfather Clock (Старинные напольные часы)
 * Multi-part: Cabinet, swinging pendulum, 2 interlocking counter-rotating gears, hour & minute hands.
 */
export class GrandfatherClock extends AnimatedProp {
  constructor(position, rotationY = 0) {
    super({ name: 'Старинные Напольные Часы Бауманки', position });
    this.root.rotation.y = rotationY;

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.7, metalness: 0.1 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 });
    const dialMat = new THREE.MeshStandardMaterial({ color: 0xf5f0db, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xaad2fa, transparent: true, opacity: 0.35, roughness: 0.1 });

    // 1.1 Wooden Cabinet Base & Column
    const baseGeo = new THREE.BoxGeometry(0.9, 0.4, 0.6);
    const baseMesh = new THREE.Mesh(baseGeo, woodMat);
    baseMesh.position.y = 0.2;
    this.root.add(baseMesh);

    const bodyGeo = new THREE.BoxGeometry(0.75, 2.2, 0.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, woodMat);
    bodyMesh.position.y = 1.5;
    this.root.add(bodyMesh);

    // Glass display cutout window for pendulum & gears
    const glassGeo = new THREE.PlaneGeometry(0.5, 1.2);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, 1.4, 0.26);
    this.root.add(glassMesh);

    // 1.2 Pendulum (Pivot at top, swinging harmonic oscillation)
    const pendulumPivot = new THREE.Group();
    pendulumPivot.position.set(0, 1.9, 0.1);
    
    const rodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.85, 8);
    const rodMesh = new THREE.Mesh(rodGeo, brassMat);
    rodMesh.position.y = -0.42;
    pendulumPivot.add(rodMesh);

    const bobGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
    const bobMesh = new THREE.Mesh(bobGeo, brassMat);
    bobMesh.rotation.x = Math.PI / 2;
    bobMesh.position.y = -0.85;
    pendulumPivot.add(bobMesh);

    this.root.add(pendulumPivot);
    this.parts.pendulumPivot = pendulumPivot;

    // 1.3 Interlocking Counter-Rotating Gears
    const gearGeo1 = new THREE.CylinderGeometry(0.14, 0.14, 0.03, 12);
    const gearMesh1 = new THREE.Mesh(gearGeo1, brassMat);
    gearMesh1.rotation.x = Math.PI / 2;
    gearMesh1.position.set(-0.11, 1.6, 0.08);
    this.root.add(gearMesh1);
    this.parts.gear1 = gearMesh1;

    const gearGeo2 = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 10);
    const gearMesh2 = new THREE.Mesh(gearGeo2, brassMat);
    gearMesh2.rotation.x = Math.PI / 2;
    gearMesh2.position.set(0.11, 1.6, 0.08);
    this.root.add(gearMesh2);
    this.parts.gear2 = gearMesh2;

    // 1.4 Clock Face and Rotating Hands
    const faceGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24);
    const faceMesh = new THREE.Mesh(faceGeo, dialMat);
    faceMesh.rotation.x = Math.PI / 2;
    faceMesh.position.set(0, 2.25, 0.26);
    this.root.add(faceMesh);

    // Minute Hand
    const minuteHandGeo = new THREE.BoxGeometry(0.02, 0.22, 0.01);
    minuteHandGeo.translate(0, 0.1, 0.01);
    const handMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const minuteHand = new THREE.Mesh(minuteHandGeo, handMat);
    minuteHand.position.set(0, 2.25, 0.29);
    this.root.add(minuteHand);
    this.parts.minuteHand = minuteHand;

    // Hour Hand
    const hourHandGeo = new THREE.BoxGeometry(0.03, 0.14, 0.01);
    hourHandGeo.translate(0, 0.06, 0.015);
    const hourHand = new THREE.Mesh(hourHandGeo, handMat);
    hourHand.position.set(0, 2.25, 0.29);
    this.root.add(hourHand);
    this.parts.hourHand = hourHand;
  }

  update(delta, time) {
    super.update(delta, time);

    // Harmonic pendulum swing: theta(t) = A * sin(omega * t)
    if (this.parts.pendulumPivot) {
      this.parts.pendulumPivot.rotation.z = Math.sin(this.elapsed * 3.2) * 0.24;
    }

    // Interlocking gears rotate in opposite directions
    if (this.parts.gear1) {
      this.parts.gear1.rotation.z += delta * 0.8;
    }
    if (this.parts.gear2) {
      this.parts.gear2.rotation.z -= delta * (0.8 * (14 / 10)); // Gear ratio
    }

    // Hands rotation
    if (this.parts.minuteHand) {
      this.parts.minuteHand.rotation.z -= delta * 0.5; // Smooth clock turn
    }
    if (this.parts.hourHand) {
      this.parts.hourHand.rotation.z -= delta * (0.5 / 12);
    }
  }
}

/**
 * 2. Observatory Telescope (Астрономический телескоп на поворотном штативе)
 * Multi-part: Tripod base, rotating azimuth turret, tilting elevation tube, spinning focus dials, lens glow.
 */
export class ObservatoryTelescope extends AnimatedProp {
  constructor(position, rotationY = 0) {
    super({ name: 'Обсерваторный Телескоп', position });
    this.root.rotation.y = rotationY;

    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3a3d45, roughness: 0.5, metalness: 0.7 });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x8be9fd,
      emissive: 0x3d7099,
      emissiveIntensity: 0.7,
      roughness: 0.1
    });

    // 2.1 Tripod Base (3 angled brass legs)
    const legGeo = new THREE.CylinderGeometry(0.04, 0.02, 1.6, 8);
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(Math.cos(angle) * 0.45, 0.75, Math.sin(angle) * 0.45);
      leg.rotation.z = Math.cos(angle) * 0.28;
      leg.rotation.x = -Math.sin(angle) * 0.28;
      this.root.add(leg);
    }

    // 2.2 Azimuth Rotating Turret (Pivots horizontally)
    const turret = new THREE.Group();
    turret.position.y = 1.5;
    this.root.add(turret);
    this.parts.turret = turret;

    const turretMountGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16);
    const turretMount = new THREE.Mesh(turretMountGeo, brassMat);
    turret.add(turretMount);

    // 2.3 Elevation Tube Assembly (Tilts vertically on pitch axis)
    const tubeAssembly = new THREE.Group();
    tubeAssembly.position.y = 0.25;
    turret.add(tubeAssembly);
    this.parts.tubeAssembly = tubeAssembly;

    // Main brass telescope barrel
    const barrelGeo = new THREE.CylinderGeometry(0.14, 0.18, 2.2, 16);
    const barrel = new THREE.Mesh(barrelGeo, brassMat);
    barrel.rotation.x = Math.PI / 2;
    tubeAssembly.add(barrel);

    // Front objective ring & glowing lens
    const objectiveGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    const objective = new THREE.Mesh(objectiveGeo, steelMat);
    objective.rotation.x = Math.PI / 2;
    objective.position.z = 1.1;
    tubeAssembly.add(objective);

    const lensGeo = new THREE.CircleGeometry(0.17, 16);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.z = 1.17;
    tubeAssembly.add(lens);
    this.parts.lens = lens;

    // Eyepiece at back
    const eyepieceGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.35, 12);
    const eyepiece = new THREE.Mesh(eyepieceGeo, brassMat);
    eyepiece.rotation.x = Math.PI / 2;
    eyepiece.position.z = -1.25;
    tubeAssembly.add(eyepiece);

    // Rotating focus dial on the side
    const dialGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const dial = new THREE.Mesh(dialGeo, steelMat);
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.16, 0, -0.6);
    tubeAssembly.add(dial);
    this.parts.focusDial = dial;
  }

  update(delta, time) {
    super.update(delta, time);

    // Slowly sweep azimuth looking across the night sky
    if (this.parts.turret) {
      this.parts.turret.rotation.y = Math.sin(this.elapsed * 0.18) * 0.75;
    }

    // Gently bob elevation looking up at constellations
    if (this.parts.tubeAssembly) {
      this.parts.tubeAssembly.rotation.x = -0.38 + Math.sin(this.elapsed * 0.35) * 0.18;
    }

    // Auto-focus wheel spins smoothly
    if (this.parts.focusDial) {
      this.parts.focusDial.rotation.x += delta * 1.5;
    }

    // Lens subtle glow pulse
    if (this.parts.lens && this.parts.lens.material) {
      const pulse = 0.6 + Math.sin(this.elapsed * 2.5) * 0.3;
      this.parts.lens.material.emissiveIntensity = pulse;
    }
  }
}

/**
 * 3. Arcane Gyroscope (Мистический гироскоп / Оррери)
 * Multi-part: 3 concentric gimbal brass rings rotating on 3 independent orthogonal axes, plus levitating core.
 */
export class ArcaneGyroscope extends AnimatedProp {
  constructor(position) {
    super({ name: 'Арканный Гироскоп Знаний', position });

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffb86c, roughness: 0.25, metalness: 0.9 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xbd93f9, roughness: 0.3, metalness: 0.8 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x8be9fd, roughness: 0.2, metalness: 0.85 });

    // Pedestal stand
    const standGeo = new THREE.CylinderGeometry(0.1, 0.35, 1.2, 16);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x282a36, roughness: 0.7 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = 0.6;
    this.root.add(stand);

    // Gimbal Center Anchor
    const gimbalCenter = new THREE.Group();
    gimbalCenter.position.y = 1.45;
    this.root.add(gimbalCenter);

    // Ring 1: Outer ring (rotates around Z-axis)
    const ring1Geo = new THREE.TorusGeometry(0.65, 0.025, 12, 32);
    const ring1 = new THREE.Mesh(ring1Geo, goldMat);
    gimbalCenter.add(ring1);
    this.parts.ring1 = ring1;

    // Ring 2: Middle ring (rotates around X-axis)
    const ring2Geo = new THREE.TorusGeometry(0.52, 0.025, 12, 32);
    const ring2 = new THREE.Mesh(ring2Geo, copperMat);
    ring1.add(ring2);
    this.parts.ring2 = ring2;

    // Ring 3: Inner ring (rotates around Y-axis)
    const ring3Geo = new THREE.TorusGeometry(0.40, 0.025, 12, 32);
    const ring3 = new THREE.Mesh(ring3Geo, cyanMat);
    ring2.add(ring3);
    this.parts.ring3 = ring3;

    // Floating Levitating Core (Octahedron crystal)
    const coreGeo = new THREE.OctahedronGeometry(0.16, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x50fa7b,
      emissive: 0x50fa7b,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.5
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    gimbalCenter.add(core);
    this.parts.core = core;
  }

  update(delta, time) {
    super.update(delta, time);

    // 3 Orthogonal rotations on gimbal rings
    if (this.parts.ring1) {
      this.parts.ring1.rotation.z += delta * 0.9;
    }
    if (this.parts.ring2) {
      this.parts.ring2.rotation.x += delta * 1.35;
    }
    if (this.parts.ring3) {
      this.parts.ring3.rotation.y += delta * 1.8;
    }

    // Core levitation & scale breath
    if (this.parts.core) {
      this.parts.core.position.y = Math.sin(this.elapsed * 4.0) * 0.06;
      this.parts.core.rotation.y += delta * 2.2;
      this.parts.core.rotation.x += delta * 1.1;
      
      const s = 1.0 + Math.sin(this.elapsed * 5.0) * 0.12;
      this.parts.core.scale.set(s, s, s);
    }
  }
}

/**
 * 4. Academic Server Rack (Серверная стойка с мигающими светодиодами)
 * Multi-part: Server chassis, 12 individual pulsing status LEDs, spinning cooling fans.
 */
export class AnimatedServerRack extends AnimatedProp {
  constructor(position, rotationY = 0) {
    super({ name: 'Серверная Стойка Лаборатории ИИ', position });
    this.root.rotation.y = rotationY;

    // Chassis frame
    const frameGeo = new THREE.BoxGeometry(0.9, 2.2, 0.8);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x191a21, roughness: 0.6, metalness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.1;
    this.root.add(frame);

    // Front acrylic tinted panel
    const doorGeo = new THREE.PlaneGeometry(0.8, 2.0);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x44475a, transparent: true, opacity: 0.45 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.1, 0.41);
    this.root.add(door);

    // Status LED arrays (blinking activity lights)
    this.leds = [];
    const ledGeo = new THREE.BoxGeometry(0.04, 0.02, 0.02);
    const colors = [0x50fa7b, 0x8be9fd, 0xffb86c, 0xff79c6];

    for (let shelf = 0; shelf < 6; shelf++) {
      const y = 0.4 + shelf * 0.28;
      for (let col = 0; col < 4; col++) {
        const x = -0.28 + col * 0.18;
        const color = colors[(shelf + col) % colors.length];
        const ledMat = new THREE.MeshBasicMaterial({ color });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(x, y, 0.39);
        this.root.add(led);
        this.leds.push({
          mesh: led,
          baseColor: color,
          frequency: 2.0 + Math.random() * 8.0,
          phase: Math.random() * 10
        });
      }
    }

    // 2 Back Exhaust Fans
    this.fans = [];
    const fanGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 6);
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x6272a4 });
    for (let f = 0; f < 2; f++) {
      const fan = new THREE.Mesh(fanGeo, fanMat);
      fan.rotation.x = Math.PI / 2;
      fan.position.set(0, 0.8 + f * 0.7, -0.41);
      this.root.add(fan);
      this.fans.push(fan);
    }
  }

  update(delta, time) {
    super.update(delta, time);

    // Blink LEDs dynamically
    for (const led of this.leds) {
      const on = Math.sin(this.elapsed * led.frequency + led.phase) > 0.15;
      led.mesh.visible = on;
    }

    // Spin cooling fans rapidly
    for (const fan of this.fans) {
      fan.rotation.z += delta * 15.0;
    }
  }
}

/**
 * 5. World Mutation Visual FX Handler
 * Renders changes made by AI Agents or Admin in the 3D scene:
 * - SPAWN_LIGHT_BEAM: Sky-piercing beacon of light
 * - SPAWN_SERVER_RACK: Academic computing node
 * - SPAWN_PORTAL: Ethereal teleportation ring
 * - WEATHER_MUTATION: Dynamic scene fog & illumination change
 */
export class WorldMutationHandler {
  constructor(scene) {
    this.scene = scene;
    this.activeMutations = new Map(); // id -> THREE.Object3D
  }

  /**
   * Handle incoming mutation event from server
   */
  handleMutation(mutation) {
    const { mutationType, x = 0, y = 0, z = 0, author, message, id } = mutation;
    console.log(`[WorldMutation] Applying ${mutationType} at (${x}, ${y}, ${z}) by ${author}`);

    switch (mutationType) {
      case 'SPAWN_LIGHT_BEAM':
        return this.spawnLightBeam(id || `beam_${Date.now()}`, new THREE.Vector3(x, y, z));
      case 'SPAWN_SERVER_RACK':
        return this.spawnServerRack(id || `rack_${Date.now()}`, new THREE.Vector3(x, y, z));
      case 'SPAWN_PORTAL':
        return this.spawnPortal(id || `portal_${Date.now()}`, new THREE.Vector3(x, y, z));
      case 'CLEAR_MUTATIONS':
        this.clearAll();
        return null;
      default:
        console.warn(`[WorldMutation] Unknown mutation type: ${mutationType}`);
        return null;
    }
  }

  /**
   * Spawn a towering celestial light beacon
   */
  spawnLightBeam(id, position) {
    if (this.activeMutations.has(id)) {
      this.removeMutation(id);
    }

    const beamGroup = new THREE.Group();
    beamGroup.position.copy(position);

    // Core luminous cylinder (height 45m)
    const beamGeo = new THREE.CylinderGeometry(0.65, 1.2, 45, 16, 1, true);
    beamGeo.translate(0, 22.5, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x8be9fd,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamGroup.add(beamMesh);

    // Inner bright core
    const innerGeo = new THREE.CylinderGeometry(0.25, 0.35, 45, 12, 1, true);
    innerGeo.translate(0, 22.5, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    beamGroup.add(innerMesh);

    // Concentric ground rune rings
    const runeGeo = new THREE.RingGeometry(1.2, 2.8, 32);
    runeGeo.rotateX(-Math.PI / 2);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xbd93f9,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const runeMesh = new THREE.Mesh(runeGeo, runeMat);
    runeMesh.position.y = 0.05;
    beamGroup.add(runeMesh);

    // PointLight illumination at base
    const light = new THREE.PointLight(0x8be9fd, 3.5, 25);
    light.position.y = 2.5;
    beamGroup.add(light);

    this.scene.add(beamGroup);
    this.activeMutations.set(id, {
      root: beamGroup,
      update: (delta, time) => {
        beamMesh.rotation.y += delta * 0.45;
        runeMesh.rotation.y -= delta * 0.35;
        beamMat.opacity = 0.5 + Math.sin(time * 3.0) * 0.2;
      }
    });

    return beamGroup;
  }

  /**
   * Spawn interactive server rack
   */
  spawnServerRack(id, position) {
    if (this.activeMutations.has(id)) {
      this.removeMutation(id);
    }
    const rack = new AnimatedServerRack(position);
    rack.addToScene(this.scene);
    this.activeMutations.set(id, rack);
    return rack;
  }

  /**
   * Spawn glowing portal ring
   */
  spawnPortal(id, position) {
    if (this.activeMutations.has(id)) {
      this.removeMutation(id);
    }

    const portalGroup = new THREE.Group();
    portalGroup.position.copy(position);

    // Swirling portal torus
    const torusGeo = new THREE.TorusGeometry(1.6, 0.15, 16, 32);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xff79c6,
      emissive: 0xbd93f9,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.position.y = 1.8;
    portalGroup.add(torus);

    // Portal vortex disk
    const discGeo = new THREE.CircleGeometry(1.45, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x50fa7b,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = 1.8;
    portalGroup.add(disc);

    this.scene.add(portalGroup);
    this.activeMutations.set(id, {
      root: portalGroup,
      update: (delta, time) => {
        torus.rotation.z += delta * 1.8;
        disc.rotation.z -= delta * 2.5;
        discMat.opacity = 0.6 + Math.sin(time * 4) * 0.25;
      }
    });

    return portalGroup;
  }

  removeMutation(id) {
    const mut = this.activeMutations.get(id);
    if (mut) {
      const root = mut.root || mut;
      if (root.parent) root.parent.remove(root);
      this.activeMutations.delete(id);
    }
  }

  clearAll() {
    for (const [id] of this.activeMutations.entries()) {
      this.removeMutation(id);
    }
  }

  update(delta, time) {
    for (const mut of this.activeMutations.values()) {
      if (typeof mut.update === 'function') {
        mut.update(delta, time);
      }
    }
  }
}

/**
 * Animated Props Manager
 * Coordinates all multi-part models and mutations in the scene
 */
export class AnimatedPropsManager {
  constructor(scene) {
    this.scene = scene;
    this.props = new Map();
    this.mutationHandler = new WorldMutationHandler(scene);
    this.clock = new THREE.Clock();
  }

  add(prop) {
    this.props.set(prop.id, prop);
    prop.addToScene(this.scene);
    return prop;
  }

  remove(id) {
    const p = this.props.get(id);
    if (p) {
      p.removeFromScene(this.scene);
      this.props.delete(id);
    }
  }

  /**
   * Spawn default academic animated curiosities across campus
   */
  spawnDefaultCampusProps() {
    // 1. Grandfather Clock in Central Foyer
    const clock = new GrandfatherClock(new THREE.Vector3(3.5, 0, 8.5), -Math.PI / 4);
    this.add(clock);

    // 2. Observatory Telescope near balcony window
    const telescope = new ObservatoryTelescope(new THREE.Vector3(-4.2, 0, 11.2), Math.PI / 3);
    this.add(telescope);

    // 3. Arcane Gyroscope in Founder's Library / Vault
    const gyro = new ArcaneGyroscope(new THREE.Vector3(7.0, 0, 7.0));
    this.add(gyro);

    // 4. Server Rack near Computer Lab
    const rack = new AnimatedServerRack(new THREE.Vector3(-7.5, 0, 4.0), Math.PI / 2);
    this.add(rack);
  }

  update(delta = null) {
    const d = delta !== null ? delta : this.clock.getDelta();
    const t = this.clock.getElapsedTime();

    for (const prop of this.props.values()) {
      prop.update(d, t);
    }

    this.mutationHandler.update(d, t);
  }
}

