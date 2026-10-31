import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;

    // 1. Scene & Bauman GZ Indoor Lighting
    this.scene = new THREE.Scene();
    // Soft mystical twilight purple background with gentle atmospheric fog
    this.scene.background = new THREE.Color(0x19122c);
    this.scene.fog = new THREE.Fog(0x19122c, 32, 115);
    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 1.6, 10.5);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);
    // 4. Bright, warm lighting for Bauman GZ Halls
    this.setupBaumanLighting();
    this.setupSkyMoon();
    this.setupEtherealParticles();

    // 5. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupBaumanLighting() {
    // 1. Soft atmospheric ambient illumination across all collegiate architecture
    const ambient = new THREE.AmbientLight(0x9180ab, 1.1);
    this.scene.add(ambient);

    // 2. Clear cool moonlight angling through high Bauman windows
    const moonLight = new THREE.DirectionalLight(0xaad2fa, 1.1);
    moonLight.position.set(35, 65, 45);
    this.scene.add(moonLight);

    // 3. Warm golden fill light from gothic chandeliers & lanterns
    const fillLight = new THREE.DirectionalLight(0xffbe75, 0.85);
    fillLight.position.set(-30, 25, -30);
    this.scene.add(fillLight);

    // 4. Collegiate hemisphere: mystical night purple sky, warm polished floor
    const hemiLight = new THREE.HemisphereLight(0x7c6596, 0x4d3e34, 0.9);
    this.scene.add(hemiLight);
  }

  setupSkyMoon() {
    // Glowing Full Moon visible through high GZ windows
    const moonGeo = new THREE.SphereGeometry(7, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(70, 95, 80);
    this.scene.add(moon);

    const haloGeo = new THREE.SphereGeometry(9, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffb86c,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(moon.position);
    this.scene.add(halo);
  }

  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(255, 220, 160, 0.85)');
    grad.addColorStop(0.65, 'rgba(189, 147, 249, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }

  createMistTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(180, 160, 225, 0.28)');
    grad.addColorStop(0.45, 'rgba(110, 90, 165, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  setupEtherealParticles() {
    // 1. Swirling Halloween Embers & Fireflies
    const fireflyCount = 480;
    this.fireflyCount = fireflyCount;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);
    const fireflyColors = new Float32Array(fireflyCount * 3);
    const fireflySpeeds = new Float32Array(fireflyCount);

    const palette = [
      new THREE.Color(0xff8c20), // Warm Jack-o'-Lantern orange
      new THREE.Color(0xffd166), // Golden candle flame
      new THREE.Color(0xbd93f9), // Gothic spectral violet
      new THREE.Color(0x50fa7b)  // Radium alchemy green
    ];

    for (let i = 0; i < fireflyCount; i++) {
      fireflyPos[i * 3] = (Math.random() - 0.5) * 75;
      fireflyPos[i * 3 + 1] = 0.2 + Math.random() * 8.5;
      fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 75;
      fireflySpeeds[i] = 0.18 + Math.random() * 0.35;

      const col = palette[i % palette.length];
      fireflyColors[i * 3] = col.r;
      fireflyColors[i * 3 + 1] = col.g;
      fireflyColors[i * 3 + 2] = col.b;
    }

    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    fireflyGeo.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));
    this.fireflySpeeds = fireflySpeeds;

    this.fireflyMat = new THREE.PointsMaterial({
      size: 0.38,
      map: this.createGlowTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fireflies = new THREE.Points(fireflyGeo, this.fireflyMat);
    this.scene.add(this.fireflies);

    // 2. Low Ground Gothic Mist & Rolling Fog
    const mistCount = 140;
    this.mistCount = mistCount;
    const mistGeo = new THREE.BufferGeometry();
    const mistPos = new Float32Array(mistCount * 3);

    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3] = (Math.random() - 0.5) * 75;
      mistPos[i * 3 + 1] = 0.12 + Math.random() * 0.85; // Hugs floor
      mistPos[i * 3 + 2] = (Math.random() - 0.5) * 75;
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));

    this.mistMat = new THREE.PointsMaterial({
      size: 3.2,
      map: this.createMistTexture(),
      color: 0x9885c2,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.groundMist = new THREE.Points(mistGeo, this.mistMat);
    this.scene.add(this.groundMist);
  }

  update(delta, elapsed) {
    const camPos = this.camera.position;

    // 1. Animate breathing fireflies & embers
    if (this.fireflies) {
      const pos = this.fireflies.geometry.attributes.position.array;
      for (let i = 0; i < this.fireflyCount; i++) {
        pos[i * 3 + 1] += this.fireflySpeeds[i] * delta;
        pos[i * 3] += Math.sin(elapsed * 1.5 + i * 0.7) * 0.015;
        pos[i * 3 + 2] += Math.cos(elapsed * 1.2 + i * 0.5) * 0.015;

        if (pos[i * 3 + 1] > 9.0) {
          pos[i * 3 + 1] = 0.2;
        }

        // Keep centered around player exploration zone
        const dx = pos[i * 3] - camPos.x;
        const dz = pos[i * 3 + 2] - camPos.z;
        if (Math.abs(dx) > 36) pos[i * 3] = camPos.x - Math.sign(dx) * 34;
        if (Math.abs(dz) > 36) pos[i * 3 + 2] = camPos.z - Math.sign(dz) * 34;
      }
      this.fireflies.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Animate rolling ground mist
    if (this.groundMist) {
      const pos = this.groundMist.geometry.attributes.position.array;
      for (let i = 0; i < this.mistCount; i++) {
        pos[i * 3] += Math.cos(elapsed * 0.3 + i) * 0.008;
        pos[i * 3 + 2] += Math.sin(elapsed * 0.25 + i * 1.2) * 0.008;

        const dx = pos[i * 3] - camPos.x;
        const dz = pos[i * 3 + 2] - camPos.z;
        if (Math.abs(dx) > 36) pos[i * 3] = camPos.x - Math.sign(dx) * 34;
        if (Math.abs(dz) > 36) pos[i * 3 + 2] = camPos.z - Math.sign(dz) * 34;
      }
      this.groundMist.geometry.attributes.position.needsUpdate = true;
      if (this.mistMat) {
        this.mistMat.opacity = 0.24 + Math.sin(elapsed * 0.8) * 0.06;
      }
    }
  }
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
