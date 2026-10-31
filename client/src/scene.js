import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;

    // 1. Scene & Bauman GZ Indoor Lighting
    this.scene = new THREE.Scene();
    // Deep obsidian midnight purple-black background & dense eerie Halloween fog
    this.scene.background = new THREE.Color(0x05030a);
    this.scene.fog = new THREE.Fog(0x05030a, 15, 65);
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
    this.renderer.toneMappingExposure = 0.88;
    container.appendChild(this.renderer.domElement);
    // 4. Bright, warm lighting for Bauman GZ Halls
    this.setupBaumanLighting();
    this.setupSkyMoon();
    this.setupEtherealParticles();

    // 5. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupBaumanLighting() {
    // 1. Dark gothic nocturnal ambient illumination (moody shadows, silhouettes)
    const ambient = new THREE.AmbientLight(0x2d1d3d, 0.45);
    this.scene.add(ambient);

    // 2. Cool ghostly moonlight cutting through high windows
    const moonLight = new THREE.DirectionalLight(0x6b87b8, 0.55);
    moonLight.position.set(35, 65, 45);
    this.scene.add(moonLight);

    // 3. Low warm ember fill from distant fireplaces & torches
    const fillLight = new THREE.DirectionalLight(0xb85014, 0.3);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);

    // 4. Gothic hemisphere: deep occult purple ceiling, dark charred mahogany floor
    const hemiLight = new THREE.HemisphereLight(0x281938, 0x0f0914, 0.5);
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

  setupEtherealParticles() {
    const count = 450;
    this.particleCount = count;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    // Ethereal Halloween palette: pumpkin embers, spectral violet, ectoplasm green, harvest gold
    const palette = [
      new THREE.Color(0xff7518), // Pumpkin orange
      new THREE.Color(0xbd93f9), // Spectral violet
      new THREE.Color(0x50fa7b), // Radium ectoplasm green
      new THREE.Color(0xffb86c)  // Candle ember gold
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      speeds[i] = 0.25 + Math.random() * 0.45;

      const col = palette[i % palette.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleSpeeds = speeds;

    this.particleMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, this.particleMat);
    this.scene.add(this.particles);
  }

  update(delta, elapsed) {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const camPos = this.camera.position;

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 1] += this.particleSpeeds[i] * delta;
      positions[i * 3] += Math.sin(elapsed + i) * 0.02;

      if (positions[i * 3 + 1] > 14) {
        positions[i * 3 + 1] = 0.2;
      }

      const dx = positions[i * 3] - camPos.x;
      const dz = positions[i * 3 + 2] - camPos.z;
      if (Math.abs(dx) > 40) positions[i * 3] = camPos.x - Math.sign(dx) * 38;
      if (Math.abs(dz) > 40) positions[i * 3 + 2] = camPos.z - Math.sign(dz) * 38;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
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
