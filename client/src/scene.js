import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;

    // 1. Scene & Bauman GZ Indoor Lighting
    this.scene = new THREE.Scene();
    // Warm classical Bauman architectural background
    this.scene.background = new THREE.Color(0x1a1924);
    // Soft gentle indoor depth (no blind black fog!)
    this.scene.fog = new THREE.FogExp2(0x1a1924, 0.009);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 1.6, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Bright, warm lighting for Bauman GZ Halls
    this.setupBaumanLighting();
    this.setupSkyMoon();
    this.setupEtherealParticles();

    // 5. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupBaumanLighting() {
    // Ambient light: generous warm fill so EVERYTHING is visible
    const ambient = new THREE.AmbientLight(0xfff3e0, 1.4);
    this.scene.add(ambient);

    // Main hall chandeliers (directional downward warm white light)
    const mainLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    mainLight.position.set(20, 50, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 5;
    mainLight.shadow.camera.far = 140;
    mainLight.shadow.camera.left = -60;
    mainLight.shadow.camera.right = 60;
    mainLight.shadow.camera.top = 60;
    mainLight.shadow.camera.bottom = -60;
    mainLight.shadow.bias = -0.0003;
    mainLight.shadow.normalBias = 0.04;
    this.scene.add(mainLight);

    // Secondary fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.9);
    fillLight.position.set(-30, 40, -30);
    this.scene.add(fillLight);

    // Hemisphere light: warm ceiling, cool floor
    const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0x4a4759, 1.0);
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
