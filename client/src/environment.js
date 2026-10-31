import * as THREE from 'three';

// Shared Bauman Collegiate Materials (Reused across instances for high performance)
const baumanMarbleColumnMat = new THREE.MeshStandardMaterial({
  color: 0xfbf8f3,
  roughness: 0.3,
  metalness: 0.05
});

const baumanGoldCapitalMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.3,
  metalness: 0.7
});

const wallPlasterMat = new THREE.MeshStandardMaterial({
  color: 0xf2ece4, // Warm classical Bauman cream plaster
  roughness: 0.75,
  metalness: 0.02
});

const baseboardMat = new THREE.MeshStandardMaterial({
  color: 0x422a1d, // Dark oak baseboard
  roughness: 0.6
});

const darkWoodDoorMat = new THREE.MeshStandardMaterial({
  color: 0x3d2719,
  roughness: 0.55
});

const deskWoodMat = new THREE.MeshStandardMaterial({
  color: 0xb5824c, // Classical school oak desk
  roughness: 0.6
});

const deskMetalMat = new THREE.MeshStandardMaterial({
  color: 0x33353b, // Metal desk legs
  roughness: 0.4,
  metalness: 0.6
});

const brassMetalMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.25,
  metalness: 0.85
});

const chromeMetalMat = new THREE.MeshStandardMaterial({
  color: 0xdddddd,
  roughness: 0.2,
  metalness: 0.95
});

const glassMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.35,
  roughness: 0.1
});

const pumpkinSkinMaterial = new THREE.MeshStandardMaterial({
  color: 0xd95b00,
  roughness: 0.5
});

const stemMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d4a26,
  roughness: 0.8
});

// 0a. Floating text billboard for NPC and Player nametags
export function createNameTag(text, colorHex = '#ffffff', bgColor = 'rgba(15, 12, 28, 0.85)') {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.roundRect(8, 8, 368, 56, 10);
  ctx.fill();

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 192, 36);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(3.0, 0.56, 1);
  return sprite;
}

// 0b. Solid 3D Flat Plaque Mesh for Doors, Walls, and Tables (NEVER cuts into geometry!)
export function createPlaqueMesh(text, colorHex = '#ffd700', bgColor = 'rgba(24, 18, 14, 0.98)', width = 1.35, height = 0.28) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // High-contrast polished background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  // Classical collegiate brass border
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 116);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(12, 12, 488, 104);

  // Corner decorative rivets
  const rivets = [[18, 18], [494, 18], [18, 110], [494, 110]];
  ctx.fillStyle = colorHex;
  for (const [rx, ry] of rivets) {
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Text
  ctx.font = 'bold 30px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const plaqueGeo = new THREE.PlaneGeometry(width, height);
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.3,
    metalness: 0.6,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  const mesh = new THREE.Mesh(plaqueGeo, plaqueMat);
  return mesh;
}

// 1. Classical University Wall with Baseboard
export function createWall(x, y, z, width, height, depth, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Plaster wall
  const wallGeo = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(wallGeo, wallPlasterMat);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // Oak baseboard at floor level
  const baseGeo = new THREE.BoxGeometry(width, 0.35, depth + 0.08);
  const baseboard = new THREE.Mesh(baseGeo, baseboardMat);
  baseboard.position.y = -height / 2 + 0.175;
  group.add(baseboard);

  return group;
}

// 2. Animated Collegiate Door with Frame and Swinging Hinge Leaf
export function createDoor(x, y, z, rotY = 0, roomNumber = '227', label = '') {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Frame Left Post
  const postGeo = new THREE.BoxGeometry(0.18, 2.7, 0.4);
  const leftPost = new THREE.Mesh(postGeo, baseboardMat);
  leftPost.position.set(-0.95, 0, 0);
  leftPost.castShadow = true;
  group.add(leftPost);

  // Frame Right Post
  const rightPost = new THREE.Mesh(postGeo, baseboardMat);
  rightPost.position.set(0.95, 0, 0);
  rightPost.castShadow = true;
  group.add(rightPost);

  // Frame Header Top Beam
  const headerGeo = new THREE.BoxGeometry(2.08, 0.22, 0.4);
  const header = new THREE.Mesh(headerGeo, baseboardMat);
  header.position.set(0, 1.35, 0);
  group.add(header);

  // Rotating Hinge Group (pivot at left frame post edge)
  const hinge = new THREE.Group();
  hinge.position.set(-0.86, 0, 0);
  group.add(hinge);

  // Door Leaf
  const leafWidth = 1.72;
  const leafHeight = 2.48;
  const leafDepth = 0.08;
  const leafGeo = new THREE.BoxGeometry(leafWidth, leafHeight, leafDepth);
  const leaf = new THREE.Mesh(leafGeo, darkWoodDoorMat);
  leaf.position.set(leafWidth / 2, 0, 0);
  leaf.castShadow = true;
  hinge.add(leaf);

  // Brass Handles (front and back)
  const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16);
  const handleFront = new THREE.Mesh(handleGeo, brassMetalMat);
  handleFront.rotation.z = Math.PI / 2;
  handleFront.position.set(leafWidth - 0.18, 0.0, 0.06);
  hinge.add(handleFront);

  const handleBack = handleFront.clone();
  handleBack.position.z = -0.06;
  hinge.add(handleBack);

  // Solid Brass Plaque with Room Number & Title (Mounted flush on front face of door leaf)
  const tagText = `${roomNumber} ${label ? '• ' + label.slice(0, 16) : ''}`;
  const plaque = createPlaqueMesh(tagText, '#ffd700', 'rgba(25, 18, 12, 0.98)', 1.32, 0.28);
  plaque.position.set(leafWidth / 2, 0.65, 0.045);
  hinge.add(plaque);

  // Back face plaque for when inside the room
  const backPlaque = createPlaqueMesh(tagText, '#ffd700', 'rgba(25, 18, 12, 0.98)', 1.32, 0.28);
  backPlaque.rotation.y = Math.PI;
  backPlaque.position.set(leafWidth / 2, 0.65, -0.045);
  hinge.add(backPlaque);
  group.userData = {
    isDoor: true,
    hinge,
    isOpen: false,
    currentAngle: 0,
    targetAngle: 0,
    roomNumber,
    label
  };

  return group;
}

// 2b. Collegiate Acoustic Ceiling
const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0xf5efe6,
  roughness: 0.85,
  metalness: 0.02
});

export function createCeiling(x, y, z, width, depth) {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geo, ceilingMat);
  mesh.rotation.x = Math.PI / 2; // Facing downward into room
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

// 3. Classical Arch Portal
export function createArch(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Left & right marble pillars
  const colGeo = new THREE.CylinderGeometry(0.4, 0.45, 5.0, 16);
  const leftCol = new THREE.Mesh(colGeo, baumanMarbleColumnMat);
  leftCol.position.set(-4.5, 0, 0);
  group.add(leftCol);

  const rightCol = new THREE.Mesh(colGeo, baumanMarbleColumnMat);
  rightCol.position.set(4.5, 0, 0);
  group.add(rightCol);

  // Arch Header Beam
  const beamGeo = new THREE.BoxGeometry(10.0, 0.7, 1.2);
  const beam = new THREE.Mesh(beamGeo, baumanGoldCapitalMat);
  beam.position.set(0, 2.5, 0);
  group.add(beam);

  return group;
}

// 4. University Lecture Desks & Benches
export function createDeskRow(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Tabletop
  const topGeo = new THREE.BoxGeometry(8.0, 0.1, 1.0);
  const top = new THREE.Mesh(topGeo, deskWoodMat);
  top.position.y = 0.8;
  top.castShadow = true;
  group.add(top);

  // Metal legs
  for (let i = -3.6; i <= 3.6; i += 2.4) {
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8);
    const leg = new THREE.Mesh(legGeo, deskMetalMat);
    leg.position.set(i, 0.4, 0);
    group.add(leg);
  }

  // Student Bench
  const benchGeo = new THREE.BoxGeometry(8.0, 0.08, 0.5);
  const bench = new THREE.Mesh(benchGeo, deskWoodMat);
  bench.position.set(0, 0.5, 0.9);
  group.add(bench);

  return group;
}

// 5. Lecture Chalkboard with Formulas
export function createBlackboard(x, y, z, rotY = 0, formulaType = 'math_analysis') {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Board wooden frame
  const frameGeo = new THREE.BoxGeometry(7.2, 2.6, 0.12);
  const frame = new THREE.Mesh(frameGeo, darkWoodDoorMat);
  group.add(frame);

  // Blackboard canvas texture with authentic formulas
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  // Dark green board surface
  ctx.fillStyle = '#1c2921';
  ctx.fillRect(0, 0, 1024, 384);

  // Subtle chalk dust
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * 1024, Math.random() * 384, Math.random() * 200, Math.random() * 40);
  }

  ctx.fillStyle = '#f0f0d8';
  ctx.font = 'bold 26px "Courier New", monospace';

  if (formulaType === 'rip_network') {
    ctx.fillText('МГТУ им. Н.Э. Баумана • Кафедра К5 (ИУ5)', 40, 50);
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText('СЕТИ: [Client: Three.js] <== WS / 20 Hz ==> [Server: Node.js]', 40, 110);
    ctx.fillText('TCP HANDSHAKE:  SYN (Seq=x) -> SYN-ACK -> ACK (Seq=x+1)', 40, 160);
    ctx.fillText('РИП: REST (CRUD, Idempotent) vs WebSocket (Streaming)', 40, 210);
    ctx.fillText('CACHE LIMIT: maxChunks = floor(totalChunks * 0.10) = 10', 40, 260);
    ctx.fillStyle = '#50fa7b';
    ctx.fillText('Статус проверки: OK <= 10% [ЗАЧЁТ ПОЛУЧЕН]', 40, 310);
  } else if (formulaType === 'photonics_stokes') {
    ctx.fillText('МГТУ им. Н.Э. Баумана • Лаборатория Фотоники ФН', 40, 50);
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText('ЗАКОН СТОКСА-ЛОММЕЛЯ:  λ_em > λ_abs  (E_em < E_abs)', 40, 110);
    ctx.fillText('ЛАНТАНОИДЫ:  Eu³⁺ (λ = 612 nm, КРАСНЫЙ),  Tb³⁺ (λ = 545 nm, ЗЕЛЕНЫЙ)', 40, 160);
    ctx.fillText('АНТЕННЫЙ ЭФФЕКТ: Лиганд (S₀ -> S₁) -> T₁ -> Редкоземельный ион', 40, 210);
    ctx.fillText('OLED: Рекомбинация экситонов в тонких пленках полимеров', 40, 260);
    ctx.fillStyle = '#8be9fd';
    ctx.fillText('Лазерная накачка: активна | Квантовый выход: 84%', 40, 310);
  } else {
    // Math Analysis
    ctx.fillText('МГТУ им. Н.Э. Баумана • Кафедра Высшей Математики ФН', 40, 50);
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText('ПРЕДЕЛ ПО КОШИ: ∀ε > 0 ∃δ > 0 : 0 < |x - x₀| < δ ⇒ |f(x) - A| < ε', 40, 110);
    ctx.fillText('1-Й ЗАМЕЧАТЕЛЬНЫЙ ПРЕДЕЛ:  lim(x→0) [sin(x) / x] = 1', 40, 160);
    ctx.fillText('ФОРМУЛА ТЕЙЛОРА: f(x) = ∑ [f^(k)(x₀)/k!] * (x - x₀)^k + o((x - x₀)^n)', 40, 210);
    ctx.fillText('ТЕОРЕМА НЬЮТОНА-ЛЕЙБНИЦА:  ∫[a, b] f(x) dx = F(b) - F(a)', 40, 260);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Рубежный контроль: Допуск к зачёту открыт!', 40, 310);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: texture });
  const boardGeo = new THREE.PlaneGeometry(6.9, 2.3);
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.z = 0.07;
  group.add(board);

  return group;
}

// 6. Server Rack with Blinking Activity LEDs
export function createServerRack(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // 19" Server rack cabinet
  const rackGeo = new THREE.BoxGeometry(1.4, 2.5, 1.1);
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x1f2129, roughness: 0.35, metalness: 0.85 });
  const rack = new THREE.Mesh(rackGeo, rackMat);
  rack.position.y = 1.25;
  rack.castShadow = true;
  group.add(rack);

  // Glass door
  const doorGeo = new THREE.BoxGeometry(1.2, 2.3, 0.05);
  const gDoor = new THREE.Mesh(doorGeo, glassMat);
  gDoor.position.set(0, 1.25, 0.56);
  group.add(gDoor);

  // Blinking Switch LEDs
  for (let i = 0; i < 5; i++) {
    const ledGeo = new THREE.BoxGeometry(1.0, 0.1, 0.05);
    const ledColor = i % 2 === 0 ? 0x50fa7b : 0x8be9fd;
    const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.5 + i * 0.4, 0.54);
    group.add(led);
  }

  // Cyan network light
  const cLight = new THREE.PointLight(0x8be9fd, 1.8, 8);
  cLight.position.set(0, 1.3, 0.8);
  group.add(cLight);

  return group;
}

// 7. Optics Laser Bench (Photonics Lab)
export function createLaserBench(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Optical breadboard table
  const tableGeo = new THREE.BoxGeometry(4.0, 0.25, 1.6);
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x555866, roughness: 0.2, metalness: 0.9 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.y = 0.9;
  group.add(table);

  // Heavy steel legs
  for (const dx of [-1.7, 1.7]) {
    for (const dz of [-0.6, 0.6]) {
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9);
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(dx, 0.45, dz);
      group.add(leg);
    }
  }

  // Laser emitter box
  const laserBoxGeo = new THREE.BoxGeometry(0.6, 0.3, 0.3);
  const laserBoxMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
  const laserBox = new THREE.Mesh(laserBoxGeo, laserBoxMat);
  laserBox.position.set(-1.4, 1.15, 0);
  group.add(laserBox);

  // Green Laser Beam
  const beamGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0, 1.15, 0);
  group.add(beam);

  // Optical Prism
  const prismGeo = new THREE.OctahedronGeometry(0.18, 0);
  const prismMat = new THREE.MeshBasicMaterial({ color: 0x8be9fd, wireframe: true });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  prism.position.set(1.3, 1.15, 0);
  group.add(prism);

  // Laser point light
  const pLight = new THREE.PointLight(0x50fa7b, 2.2, 6);
  pLight.position.set(1.3, 1.25, 0);
  group.add(pLight);

  return group;
}

// 8. Scientific Council Table & Chairs
export function createCouncilTable(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Large oval mahogany table
  const tableGeo = new THREE.CylinderGeometry(4.0, 4.0, 0.15, 32);
  tableGeo.scale(1.4, 1.0, 0.8);
  const mahoganyMat = new THREE.MeshStandardMaterial({ color: 0x3d1a11, roughness: 0.3, metalness: 0.1 });
  const table = new THREE.Mesh(tableGeo, mahoganyMat);
  table.position.y = 0.8;
  table.castShadow = true;
  group.add(table);

  // Table central base
  const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.8, 16);
  const base = new THREE.Mesh(baseGeo, mahoganyMat);
  base.position.y = 0.4;
  group.add(base);

  // Solid Brass Emblem of BMSTU in center of table (flat on tabletop)
  const emblem = createPlaqueMesh('МГТУ ИМ. Н.Э. БАУМАНА • УЧЁНЫЙ СОВЕТ', '#ffd700', 'rgba(40, 15, 10, 0.98)', 3.2, 0.65);
  emblem.rotation.x = -Math.PI / 2;
  emblem.position.set(0, 0.88, 0);
  group.add(emblem);

  return group;
}

// 9. University Entrance Turnstile (ГУК 1 этаж)
export function createTurnstile(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Steel body pedestal
  const bodyGeo = new THREE.BoxGeometry(0.35, 1.0, 0.9);
  const body = new THREE.Mesh(bodyGeo, chromeMetalMat);
  body.position.y = 0.5;
  group.add(body);

  // Card reader with green LED indicator
  const readerGeo = new THREE.BoxGeometry(0.18, 0.04, 0.18);
  const readerMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b });
  const reader = new THREE.Mesh(readerGeo, readerMat);
  reader.position.set(0, 1.03, 0.2);
  group.add(reader);

  // Chrome Tripod barrier arms
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const armGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.65);
    const arm = new THREE.Mesh(armGeo, chromeMetalMat);
    arm.position.set(0, 0.75, -0.2);
    arm.rotation.x = Math.PI / 4;
    arm.rotation.z = angle;
    group.add(arm);
  }

  return group;
}

// 10. Wall Direction Signpost
export function createSignpost(x, y, z, rotY = 0, text = 'Кафедра') {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Solid Oak Backing Board
  const boardGeo = new THREE.BoxGeometry(4.4, 0.65, 0.08);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.6 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.castShadow = true;
  group.add(board);

  // Brass Directional Plaque flush on board face
  const plaque = createPlaqueMesh(text, '#f1fa8c', 'rgba(12, 14, 26, 0.98)', 4.2, 0.52);
  plaque.position.set(0, 0, 0.045);
  group.add(plaque);

  return group;
}

// 11. Overhead Collegiate Ceiling Chandelier / Panel Lamp
export function createCeilingLamp(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Frosted brass lamp fixture
  const fixtureGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.3, 16);
  const fixtureMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
  const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
  group.add(fixture);

  // Frosted glass dome
  const glassDomeGeo = new THREE.SphereGeometry(0.7, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({ color: 0xfff4db });
  const dome = new THREE.Mesh(glassDomeGeo, domeMat);
  dome.rotation.x = Math.PI;
  dome.position.y = -0.15;
  group.add(dome);

  // Warm overhead interior room light
  const lampLight = new THREE.PointLight(0xfff1dc, 2.0, 18, 1.4);
  lampLight.position.set(0, -0.4, 0);
  group.add(lampLight);

  return group;
}

// 12. Halloween Jack-o-Lantern Pumpkin
export function createPumpkin(x, y, z, glowing = true) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const bodyGeo = new THREE.SphereGeometry(0.45, 12, 10);
  bodyGeo.scale(1.2, 0.9, 1.2);
  const body = new THREE.Mesh(bodyGeo, pumpkinSkinMaterial);
  body.castShadow = true;
  group.add(body);

  const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6);
  const stem = new THREE.Mesh(stemGeo, stemMaterial);
  stem.position.set(0, 0.42, 0);
  stem.rotation.z = 0.2;
  group.add(stem);

  if (glowing) {
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.18, 0.1, 0.5);
    eyeLeft.rotation.z = 0.3;
    group.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.18, 0.1, 0.5);
    eyeRight.rotation.z = -0.3;
    group.add(eyeRight);

    const pLight = new THREE.PointLight(0xff8800, 1.4, 7, 1.8);
    pLight.position.set(0, 0.25, 0.3);
    group.add(pLight);
  }

  return group;
}

// 13. Brass Wall Sconce Lantern
export function createTorch(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const bracketGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6);
  const bracket = new THREE.Mesh(bracketGeo, brassMetalMat);
  bracket.rotation.x = Math.PI / 4;
  group.add(bracket);

  const glassGeo = new THREE.OctahedronGeometry(0.2, 0);
  const gMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
  const glass = new THREE.Mesh(glassGeo, gMat);
  glass.position.set(0, 0.32, 0.2);
  group.add(glass);

  const light = new THREE.PointLight(0xffdf99, 1.8, 14, 1.2);
  light.position.set(0, 0.35, 0.25);
  group.add(light);

  group.userData = { light, baseIntensity: 1.8, timeOffset: Math.random() * 10 };
  return group;
}

// 14. Monumental Bauman White Marble Column
export function createPillar(x, y, z, height = 6) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const colGeo = new THREE.CylinderGeometry(0.55, 0.65, height, 16);
  const col = new THREE.Mesh(colGeo, baumanMarbleColumnMat);
  col.castShadow = true;
  col.receiveShadow = true;
  group.add(col);

  const capGeo = new THREE.BoxGeometry(1.6, 0.45, 1.6);
  const topCap = new THREE.Mesh(capGeo, baumanGoldCapitalMat);
  topCap.position.y = height / 2;
  group.add(topCap);

  const btmCap = new THREE.Mesh(capGeo, baumanMarbleColumnMat);
  btmCap.position.y = -height / 2;
  group.add(btmCap);

  return group;
}

// 15. Bookshelf
export function createBookshelf(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const shelfGeo = new THREE.BoxGeometry(2.4, 3.2, 0.6);
  const shelf = new THREE.Mesh(shelfGeo, darkWoodDoorMat);
  shelf.position.y = 1.6;
  group.add(shelf);

  const bookColors = [0x8b2500, 0x1c4587, 0x274e13, 0x4c1130];
  for (let r = 0; r < 3; r++) {
    for (let b = 0; b < 6; b++) {
      const bookGeo = new THREE.BoxGeometry(0.12, 0.45, 0.4);
      const bookMat = new THREE.MeshStandardMaterial({
        color: bookColors[(r * 6 + b) % bookColors.length]
      });
      const book = new THREE.Mesh(bookGeo, bookMat);
      book.position.set(-0.8 + b * 0.3, 0.6 + r * 0.9, 0.1);
      group.add(book);
    }
  }

  return group;
}

// 16. Telescope
export function createTelescope(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0);
    const leg = new THREE.Mesh(legGeo, darkWoodDoorMat);
    leg.position.set(Math.sin(angle) * 0.5, 0.9, Math.cos(angle) * 0.5);
    leg.rotation.z = Math.sin(angle) * 0.25;
    leg.rotation.x = Math.cos(angle) * 0.25;
    group.add(leg);
  }

  const tubeGeo = new THREE.CylinderGeometry(0.18, 0.24, 2.4, 12);
  const tube = new THREE.Mesh(tubeGeo, brassMetalMat);
  tube.position.set(0, 1.9, 0);
  tube.rotation.x = -Math.PI / 4;
  group.add(tube);

  return group;
}

// 17. Ancient Obelisk
export function createObelisk(x, y, z, label = 'Летопись') {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const obeliskGeo = new THREE.CylinderGeometry(0.3, 0.6, 3.5, 4);
  const obeliskMat = new THREE.MeshStandardMaterial({ color: 0x4a433a, roughness: 0.85 });
  const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
  obelisk.position.y = 1.75;
  obelisk.rotation.y = Math.PI / 4;
  group.add(obelisk);

  const tag = createNameTag(label, '#f1fa8c');
  tag.position.set(0, 3.6, 0);
  tag.scale.set(1.8, 0.45, 1);
  group.add(tag);

  return group;
}

// 18. Bauman Architectural Floor Tiles (Granite, Parquet, Linoleum, Lab Tile)
export function createFloorTile(x, y, z, width, depth, zoneType) {
  let floorColor = 0xd5cfc5;
  let roughness = 0.4;
  let metalness = 0.08;

  if (zoneType === 'foyer') {
    floorColor = 0xe8e2d8; // Polished marble foyer
    roughness = 0.25;
    metalness = 0.12;
  } else if (zoneType === 'council_hall' || zoneType === 'director_office') {
    floorColor = 0x5a3424; // Parquet
    roughness = 0.45;
  } else if (zoneType === 'math_lecture' || zoneType === 'lecture_hall') {
    floorColor = 0xba9b72; // Oak classroom parquet
    roughness = 0.5;
  } else if (zoneType === 'k5_office' || zoneType === 'k5_lab' || zoneType === 'computer_class') {
    floorColor = 0xcdd6df; // Tech lab linoleum
    roughness = 0.35;
  } else if (zoneType === 'photonics_lab' || zoneType === 'laser_lab') {
    floorColor = 0xcfe0d8; // Anti-static lab tiles
    roughness = 0.3;
  } else if (zoneType === 'courtyard' || zoneType === 'campus_grounds') {
    floorColor = 0x6e7069; // Pavement
    roughness = 0.85;
  }

  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness,
    metalness
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

// 19. Student Avatar with Nametag
export function createPlayerAvatar(username, colorHex = '#ff79c6') {
  const group = new THREE.Group();
  const color = new THREE.Color(colorHex);

  const ghostMat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.82,
    roughness: 0.2
  });

  const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const head = new THREE.Mesh(headGeo, ghostMat);
  head.position.y = 0.9;
  group.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.92, 0.28);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.12, 0.92, 0.28);
  group.add(eyeL);
  group.add(eyeR);

  const bodyGeo = new THREE.ConeGeometry(0.45, 1.1, 16);
  const body = new THREE.Mesh(bodyGeo, ghostMat);
  body.position.y = 0.3;
  body.rotation.x = Math.PI;
  group.add(body);

  const nametag = createNameTag(username, colorHex);
  nametag.position.y = 1.6;
  group.add(nametag);

  const aura = new THREE.PointLight(color, 1.0, 6);
  aura.position.y = 0.8;
  group.add(aura);

  group.userData = {
    username,
    ghostMat,
    aura,
    baseY: 0,
    targetX: 0,
    targetY: 1.6,
    targetZ: 0,
    targetRotY: 0,
    timeOffset: Math.random() * 10
  };

  return group;
}

// 20. Ghost NPC with specific BMSTU academic props
export function createGhostNPC(npcData) {
  const group = new THREE.Group();
  group.position.set(npcData.x, npcData.y, npcData.z);

  const auraColor = new THREE.Color(npcData.color);

  const npcMat = new THREE.MeshStandardMaterial({
    color: auraColor,
    emissive: auraColor,
    emissiveIntensity: 0.65,
    transparent: true,
    opacity: 0.85,
    roughness: 0.2
  });

  // Head
  const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const head = new THREE.Mesh(headGeo, npcMat);
  head.position.y = 1.0;
  group.add(head);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.13, 1.03, 0.32);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.13, 1.03, 0.32);
  group.add(eyeL);
  group.add(eyeR);

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 16);
  const body = new THREE.Mesh(bodyGeo, npcMat);
  body.position.y = 0.4;
  group.add(body);

  // Specific BMSTU Professor Attributes
  if (npcData.id === 'kanev') {
    // Anton Igorevich Kanev: Network Switch / Database Box
    const dbGeo = new THREE.BoxGeometry(0.4, 0.45, 0.3);
    const dbMat = new THREE.MeshStandardMaterial({
      color: 0x8be9fd,
      wireframe: true,
      emissive: 0x8be9fd,
      emissiveIntensity: 0.9
    });
    const dbBox = new THREE.Mesh(dbGeo, dbMat);
    dbBox.position.set(0.45, 0.65, 0.2);
    group.add(dbBox);
  } else if (npcData.id === 'akhmetova') {
    // Faniya Kharisovna Akhmetova: Math Analysis Blackboard with Integral loop
    const ringGeo = new THREE.TorusGeometry(0.28, 0.03, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 1.48, 0);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  } else if (npcData.id === 'korshunov') {
    // Vladislav Mikhailovich Korshunov: Optical laser / luminescent prism
    const prismGeo = new THREE.OctahedronGeometry(0.24, 0);
    const prismMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b, wireframe: true });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.set(0.45, 0.65, 0.2);
    group.add(prism);

    const beamLight = new THREE.PointLight(0x50fa7b, 2.0, 6);
    beamLight.position.set(0.45, 0.65, 0.2);
    group.add(beamLight);
  } else if (npcData.id === 'einstein') {
    // Einstein wild hair
    const hairGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.15;
    group.add(hair);
  } else if (npcData.id === 'herodotus') {
    // Ancient papyrus scroll
    const scrollGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0xeedda2 });
    const scroll = new THREE.Mesh(scrollGeo, scrollMat);
    scroll.position.set(0.4, 0.5, 0.3);
    scroll.rotation.z = Math.PI / 4;
    group.add(scroll);
  }

  // Floating Name / Role badge
  const nametag = createNameTag(npcData.name, npcData.color);
  nametag.position.y = 1.88;
  group.add(nametag);

  // Point light
  const light = new THREE.PointLight(auraColor, 1.8, 10);
  light.position.y = 1.0;
  group.add(light);

  group.userData = {
    npcData,
    npcMat,
    light,
    baseY: npcData.y,
    timeOffset: Math.random() * 10
  };

  return group;
}


// 8. Collectible Artifact Item
export function createArtifactMesh(item) {
  const group = new THREE.Group();
  group.position.set(item.x, item.y, item.z);

  let geom;
  let colorHex = 0xffd700;

  if (item.subType === 'hourglass') {
    geom = new THREE.CylinderGeometry(0.18, 0.18, 0.55, 8);
    colorHex = 0x8be9fd;
  } else if (item.subType === 'scroll') {
    geom = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    geom.rotateZ(Math.PI / 4);
    colorHex = 0xf1fa8c;
  } else if (item.subType === 'flask') {
    geom = new THREE.OctahedronGeometry(0.25, 0);
    colorHex = 0x50fa7b;
  } else {
    geom = new THREE.TorusGeometry(0.2, 0.08, 8, 16);
    colorHex = 0xff79c6;
  }

  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  group.add(mesh);

  // Floating label with item icon and name
  const nametag = createNameTag(`${item.icon || '✨'} ${item.name}`, `#${colorHex.toString(16).padStart(6, '0')}`);
  nametag.position.y = 0.8;
  group.add(nametag);

  // Soft glowing point light
  const pLight = new THREE.PointLight(colorHex, 1.2, 5);
  pLight.position.y = 0.2;
  group.add(pLight);

  group.userData = {
    isArtifact: true,
    itemId: item.id,
    baseY: item.y,
    timeOffset: Math.random() * 5
  };

  return group;
}
