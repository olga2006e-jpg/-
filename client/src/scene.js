import * as THREE from 'three';

export class GameScene {
  constructor(container) {
    this.container = container;

    // 1. Scene & Spooky Halloween Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0814); // Deep nocturnal gothic violet-black
    this.scene.fog = new THREE.FogExp2(0x0a0814, 0.032);

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

    // 4. Atmospheric Halloween Lighting
    this.setupLighting();

    // 5. Handle Resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient light: dim purple eerie wash
    const ambient = new THREE.AmbientLight(0x281e3d, 0.9);
    this.scene.add(ambient);

    // Directional light: Moon light breaking through clouds
    const moonLight = new THREE.DirectionalLight(0x6a75a8, 0.7);
    moonLight.position.set(20, 40, 20);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 100;
    moonLight.shadow.camera.left = -40;
    moonLight.shadow.camera.right = 40;
    moonLight.shadow.camera.top = 40;
    moonLight.shadow.camera.bottom = -40;
    this.scene.add(moonLight);

    // Distant subtle ground light
    const hemiLight = new THREE.HemisphereLight(0x42385c, 0x05040a, 0.4);
    this.scene.add(hemiLight);
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
