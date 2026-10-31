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
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio <= 1,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
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
    this.particleSwayCos = new Float32Array(count);
    this.particleSwaySin = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.particleSwayCos[i] = Math.cos(i) * 0.02;
      this.particleSwaySin[i] = Math.sin(i) * 0.02;
    }
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

    // Avoid unnecessary math and GPU buffer updates if elapsed hasn't changed noticeably
    if (this._lastElapsed !== undefined && Math.abs(elapsed - this._lastElapsed) < 0.016) {
      return;
    }
    const dt = this._lastElapsed !== undefined ? (elapsed - this._lastElapsed) : delta;
    this._lastElapsed = elapsed;

    const positions = this.particles.geometry.attributes.position.array;
    const camPos = this.camera.position;
    const sinE = Math.sin(elapsed);
    const cosE = Math.cos(elapsed);

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      positions[idx + 1] += this.particleSpeeds[i] * dt;
      positions[idx] += this.particleSwayCos
        ? (sinE * this.particleSwayCos[i] + cosE * this.particleSwaySin[i])
        : Math.sin(elapsed + i) * 0.02;

      if (positions[idx + 1] > 14) {
        positions[idx + 1] = 0.2;
      }

      const dx = positions[idx] - camPos.x;
      const dz = positions[idx + 2] - camPos.z;
      if (Math.abs(dx) > 40) positions[idx] = camPos.x - Math.sign(dx) * 38;
      if (Math.abs(dz) > 40) positions[idx + 2] = camPos.z - Math.sign(dz) * 38;
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
