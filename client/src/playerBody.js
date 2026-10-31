import * as THREE from 'three';

/**
 * First-person player viewmodel:
 * 1. Warm vintage brass hurricane lantern in right hand (casts soft golden glow forward)
 * 2. Authentic BMSTU student record book («Зачётка») in left hand
 * 3. Visible torso, coat, and stepping boots when looking down
 * 4. Realistic rhythmic walking bob and sway for true grounded presence
 */
export class PlayerBody {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    this.walkCycle = 0;
    this.swayCycle = 0;
    this.lanternEnabled = true;

    // Viewmodel root attached directly to camera
    this.viewmodel = new THREE.Group();
    this.camera.add(this.viewmodel);

    // Build the hands, lantern, and student items
    this.setupLanternHand();
    this.setupRecordBookHand();

    // Body parts visible when looking down
    this.setupLowerBody();
  }

  setupLanternHand() {
    this.lanternArmGroup = new THREE.Group();
    // Positioned in front-right of the player's view
    this.lanternArmGroup.position.set(0.38, -0.32, -0.65);
    this.lanternArmGroup.rotation.set(0.08, -0.15, -0.05);

    // 1. Student dark wool coat sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.42, 12);
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1a1824, // dark navy-charcoal coat
      roughness: 0.85,
      metalness: 0.1
    });
    const sleeve = new THREE.Mesh(sleeveGeo, coatMat);
    sleeve.rotation.x = Math.PI / 2.3;
    sleeve.position.set(0.08, -0.08, 0.22);
    this.lanternArmGroup.add(sleeve);

    // 2. Leather glove holding lantern handle
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f, // warm dark leather
      roughness: 0.65,
      metalness: 0.2
    });
    const handGeo = new THREE.BoxGeometry(0.07, 0.065, 0.09);
    const hand = new THREE.Mesh(handGeo, gloveMat);
    hand.position.set(0.03, -0.01, 0.05);
    this.lanternArmGroup.add(hand);

    // 3. Vintage Brass Hurricane Lantern
    this.lanternGroup = new THREE.Group();
    this.lanternGroup.position.set(0, -0.12, 0);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc9933b, // vintage polished brass
      roughness: 0.35,
      metalness: 0.85
    });

    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.6,
      metalness: 0.5
    });

    // Wire handle
    const handleGeo = new THREE.TorusGeometry(0.075, 0.007, 8, 16, Math.PI);
    const handle = new THREE.Mesh(handleGeo, ironMat);
    handle.rotation.z = Math.PI;
    handle.position.set(0, 0.16, 0);
    this.lanternGroup.add(handle);

    // Lantern top cap / chimney
    const capGeo = new THREE.ConeGeometry(0.08, 0.06, 12);
    const cap = new THREE.Mesh(capGeo, brassMat);
    cap.position.y = 0.12;
    this.lanternGroup.add(cap);

    const topRingGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.03, 12);
    const topRing = new THREE.Mesh(topRingGeo, brassMat);
    topRing.position.y = 0.08;
    this.lanternGroup.add(topRing);

    // Glass cylinder
    const glassGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0;
    this.lanternGroup.add(glass);

    // Vertical protective brass wire cage
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.14, 6);
      const wire = new THREE.Mesh(wireGeo, brassMat);
      wire.position.set(Math.cos(angle) * 0.062, 0, Math.sin(angle) * 0.062);
      this.lanternGroup.add(wire);
    }

    // Lantern brass base
    const baseGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.045, 16);
    const base = new THREE.Mesh(baseGeo, brassMat);
    base.position.y = -0.09;
    this.lanternGroup.add(base);

    // Inner glowing candle with flame
    const candleGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.06, 10);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xfff5e1, roughness: 0.5 });
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.y = -0.04;
    this.lanternGroup.add(candle);

    const flameGeo = new THREE.ConeGeometry(0.014, 0.035, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    this.flameMesh = new THREE.Mesh(flameGeo, flameMat);
    this.flameMesh.position.y = 0;
    this.lanternGroup.add(this.flameMesh);

    // Dynamic point light casting warm illumination ahead
    this.lanternLight = new THREE.PointLight(0xffb35c, 3.2, 24, 1.2);
    this.lanternLight.position.set(0, 0.02, 0);
    this.lanternGroup.add(this.lanternLight);

    this.lanternArmGroup.add(this.lanternGroup);
    this.viewmodel.add(this.lanternArmGroup);
  }

  setupRecordBookHand() {
    this.bookArmGroup = new THREE.Group();
    // Positioned in lower-left of the view
    this.bookArmGroup.position.set(-0.35, -0.34, -0.62);
    this.bookArmGroup.rotation.set(0.12, 0.22, 0.08);

    // 1. Left sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.38, 12);
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x1a1824,
      roughness: 0.85,
      metalness: 0.1
    });
    const sleeve = new THREE.Mesh(sleeveGeo, coatMat);
    sleeve.rotation.x = Math.PI / 2.3;
    sleeve.position.set(-0.06, -0.08, 0.2);
    this.bookArmGroup.add(sleeve);

    // 2. Left glove
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x3d2b1f,
      roughness: 0.65,
      metalness: 0.2
    });
    const handGeo = new THREE.BoxGeometry(0.07, 0.06, 0.08);
    const hand = new THREE.Mesh(handGeo, gloveMat);
    hand.position.set(-0.02, -0.01, 0.04);
    this.bookArmGroup.add(hand);

    // 3. Authentic BMSTU Student Record Book («Зачётная книжка»)
    this.bookGroup = new THREE.Group();
    this.bookGroup.position.set(0.04, 0.02, -0.04);
    this.bookGroup.rotation.set(-0.25, 0.15, -0.15);

    // Blue leatherette cover
    const coverGeo = new THREE.BoxGeometry(0.12, 0.016, 0.16);
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x1b3b6f, // classic Soviet/Russian dark blue vinyl
      roughness: 0.45,
      metalness: 0.15
    });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    this.bookGroup.add(cover);

    // Gold embossed crest & title plaque
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1b3b6f';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText('МГТУ им. Н.Э. БАУМАНА', 128, 48);
    ctx.font = '16px monospace';
    ctx.fillText('ЗАЧЁТНАЯ КНИЖКА', 128, 80);
    ctx.font = '12px monospace';
    ctx.fillText('Студент ИУ-5 • 2026', 128, 104);

    const texture = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(0.11, 0.07);
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, 0.009, 0);
    this.bookGroup.add(label);

    this.bookArmGroup.add(this.bookGroup);
    this.viewmodel.add(this.bookArmGroup);
  }

  setupLowerBody() {
    this.lowerBody = new THREE.Group();
    // Offset below camera
    this.lowerBody.position.set(0, -0.75, 0.05);

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x161420,
      roughness: 0.85
    });

    // Student warm coat / jacket visible when pitching down
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.55, 12);
    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.position.set(0, -0.1, 0.12);
    this.lowerBody.add(torso);

    // Student leather belt
    const beltGeo = new THREE.CylinderGeometry(0.26, 0.27, 0.05, 12);
    const beltMat = new THREE.MeshStandardMaterial({ color: 0x241711, roughness: 0.5 });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, -0.28, 0.12);
    this.lowerBody.add(belt);

    // Legs / Boots
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x111015,
      roughness: 0.4,
      metalness: 0.2
    });

    this.leftLeg = new THREE.Group();
    this.rightLeg = new THREE.Group();

    for (const [legGroup, lx] of [[this.leftLeg, -0.14], [this.rightLeg, 0.14]]) {
      legGroup.position.set(lx, -0.35, 0.08);

      const legGeo = new THREE.CylinderGeometry(0.08, 0.075, 0.45, 10);
      const legMesh = new THREE.Mesh(legGeo, coatMat);
      legMesh.position.y = -0.2;
      legGroup.add(legMesh);

      // Boot shoe
      const shoeGeo = new THREE.BoxGeometry(0.11, 0.1, 0.22);
      const shoe = new THREE.Mesh(shoeGeo, bootMat);
      shoe.position.set(0, -0.42, 0.06);
      legGroup.add(shoe);

      this.lowerBody.add(legGroup);
    }

    this.viewmodel.add(this.lowerBody);
  }

  update(delta, isMoving, pitch = 0) {
    const time = performance.now() * 0.001;

    // 1. Natural breathing & gentle swaying
    const breath = Math.sin(time * 2.2) * 0.006;
    this.lanternArmGroup.position.y = -0.32 + breath;
    this.bookArmGroup.position.y = -0.34 + breath * 0.7;

    // Flame flicker in lantern
    if (this.lanternLight) {
      const flicker = Math.sin(time * 18.0) * 0.18 + Math.cos(time * 31.0) * 0.1;
      this.lanternLight.intensity = 3.2 + flicker;
    }

    // 2. Walking bob and step cadence
    if (isMoving) {
      this.walkCycle += delta * 7.5; // step frequency

      const bobY = Math.abs(Math.sin(this.walkCycle)) * 0.032;
      const swayX = Math.cos(this.walkCycle) * 0.024;
      const rotZ = Math.cos(this.walkCycle) * 0.04;

      this.lanternArmGroup.position.x = 0.38 + swayX * 0.6;
      this.lanternArmGroup.position.y = -0.32 - bobY + breath;
      this.lanternGroup.rotation.z = rotZ;
      this.lanternGroup.rotation.x = Math.sin(this.walkCycle) * 0.08;

      this.bookArmGroup.position.x = -0.35 - swayX * 0.5;
      this.bookArmGroup.position.y = -0.34 - bobY * 0.8 + breath;
      this.bookGroup.rotation.z = -0.15 - rotZ * 0.6;

      // Leg step swinging
      this.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.45;
      this.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.45;
    } else {
      // Smoothly return legs and arms to idle
      this.leftLeg.rotation.x *= 0.85;
      this.rightLeg.rotation.x *= 0.85;
      this.lanternGroup.rotation.z *= 0.9;
      this.lanternGroup.rotation.x *= 0.9;
      this.bookGroup.rotation.z = -0.15;
    }

    // 3. Lower body visibility based on camera pitch
    // If looking straight or up (pitch > -0.2), lower body is transparent/pushed back
    // If looking down towards feet (pitch < -0.3), lower body is clearly visible!
    const lookDownFactor = THREE.MathUtils.clamp((-pitch - 0.15) / 0.7, 0, 1);
    this.lowerBody.visible = lookDownFactor > 0.05;
    if (this.lowerBody.visible) {
      // Counteract camera pitch partially so your body feels anchored below your neck
      this.lowerBody.position.z = 0.05 - lookDownFactor * 0.18;
      this.lowerBody.position.y = -0.75 + lookDownFactor * 0.1;
    }
  }

  toggleLantern() {
    this.lanternEnabled = !this.lanternEnabled;
    this.lanternLight.visible = this.lanternEnabled;
    this.flameMesh.visible = this.lanternEnabled;
    return this.lanternEnabled;
  }
}
