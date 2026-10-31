import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;

    // 1. Scene & Spooky Halloween Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0814); // Deep nocturnal gothic violet-black
    this.scene.fog = new THREE.FogExp2(0x0a0814, 0.035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 1.6, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Atmospheric Halloween Lighting & Sky
    this.setupLighting();
    this.setupSkyMoon();
    this.setupEtherealParticles();

    // 5. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient light: eerie purple wash
    const ambient = new THREE.AmbientLight(0x2d1f47, 0.95);
    this.scene.add(ambient);

    // Directional light: Silvery moon light
    const moonLight = new THREE.DirectionalLight(0x7986cb, 0.85);
    moonLight.position.set(25, 45, 25);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 5;
    moonLight.shadow.camera.far = 120;
    moonLight.shadow.camera.left = -50;
    moonLight.shadow.camera.right = 50;
    moonLight.shadow.camera.top = 50;
    moonLight.shadow.camera.bottom = -50;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Distant subtle ground light
    const hemiLight = new THREE.HemisphereLight(0x514073, 0x07050d, 0.5);
    this.scene.add(hemiLight);
  }

  setupSkyMoon() {
    // Glowing Full Moon in sky
    const moonGeo = new THREE.SphereGeometry(6, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d1,
      transparent: true,
      opacity: 0.95
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(60, 90, 70);
    this.scene.add(moon);

    // Moon halo glow
    const haloGeo = new THREE.SphereGeometry(7.5, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xbd93f9,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(moon.position);
    this.scene.add(halo);
  }

  setupEtherealParticles() {
    // 500 floating mystical motes / spectral embers
    const count = 500;
    this.particleCount = count;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleSpeeds = speeds;

    // Glowing particle material
    this.particleMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xbd93f9,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, this.particleMat);
    this.scene.add(this.particles);
  }

  update(delta, elapsed) {
    if (!this.particles) return;

    // Gently drift particles around player
    const positions = this.particles.geometry.attributes.position.array;
    const camPos = this.camera.position;

    for (let i = 0; i < this.particleCount; i++) {
      // Float upward gently
      positions[i * 3 + 1] += this.particleSpeeds[i] * delta;
      // Sway horizontally
      positions[i * 3] += Math.sin(elapsed + i) * 0.02;

      // Wrap if too high
      if (positions[i * 3 + 1] > 14) {
        positions[i * 3 + 1] = 0.2;
      }

      // Keep particles centered around camera area
      const dx = positions[i * 3] - camPos.x;
      const dz = positions[i * 3 + 2] - camPos.z;
      if (Math.abs(dx) > 40) positions[i * 3] = camPos.x - Math.sign(dx) * 38;
      if (Math.abs(dz) > 40) positions[i * 3 + 2] = camPos.z - Math.sign(dz) * 38;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;

    // Breathing particle opacity
    this.particleMat.opacity = 0.5 + Math.sin(elapsed * 2) * 0.2;
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
