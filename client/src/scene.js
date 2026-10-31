import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;

    // 1. Scene & Bauman GZ Indoor Lighting
    this.scene = new THREE.Scene();
    // Deep gothic midnight purple-black background & creeping Halloween fog
    this.scene.background = new THREE.Color(0x0c0817);
    this.scene.fog = new THREE.Fog(0x0c0817, 45, 120);
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
    this.renderer.toneMappingExposure = 1.35;
    container.appendChild(this.renderer.domElement);
    // 4. Bright, warm lighting for Bauman GZ Halls
    this.setupBaumanLighting();
    this.setupSkyMoon();
    this.setupEtherealParticles();

    // 5. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupBaumanLighting() {
    // 1. Warm gothic collegiate ambient illumination (balanced visibility with mystery)
    const ambient = new THREE.AmbientLight(0x40315a, 0.95);
    this.scene.add(ambient);

    // 2. Cool silver-cyan moonlight angling through high Bauman windows
    const moonLight = new THREE.DirectionalLight(0x8cd4ff, 1.2);
    moonLight.position.set(35, 65, 45);
    this.scene.add(moonLight);

    // 3. Warm golden interior fill from university chandeliers
    const fillLight = new THREE.DirectionalLight(0xffa857, 0.7);
    fillLight.position.set(-30, 30, -30);
    this.scene.add(fillLight);

    // 4. Collegiate hemisphere: violet gothic ceiling, warm dark mahogany floor
    const hemiLight = new THREE.HemisphereLight(0x523d78, 0x221834, 0.85);
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
    const count = 350;
    this.particleCount = count;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      speeds[i] = 0.2 + Math.random() * 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleSpeeds = speeds;

    this.particleMat = new THREE.PointsMaterial({
      size: 0.14,
      color: 0xffb86c, // Warm golden dust motes
      transparent: true,
      opacity: 0.75,
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
