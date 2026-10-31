import * as THREE from 'three';

// Shared Bauman Collegiate Materials (Reused across instances for high performance)
const baumanMarbleColumnMat = new THREE.MeshStandardMaterial({
  color: 0x8e829d, // Refined classical marble column
  roughness: 0.35,
  metalness: 0.1
});

const baumanGoldCapitalMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.3,
  metalness: 0.7
});

const wallPlasterMat = new THREE.MeshStandardMaterial({
  color: 0x766c82, // Warm collegiate stone plaster, clearly visible
  roughness: 0.75,
  metalness: 0.02
});

const baseboardMat = new THREE.MeshStandardMaterial({
  color: 0x3d271a, // Dark rich polished oak
  roughness: 0.5,
  metalness: 0.05,
  polygonOffset: true,
  polygonOffsetFactor: -1.0,
  polygonOffsetUnits: -2.0
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
export function createNameTag(text, colorHex = '#ffffff', bgColor = 'rgba(10, 16, 24, 0.78)') {
  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 56;
  const ctx = canvas.getContext('2d');

  // Sleek compact pill badge with subtle glassmorphism
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(4, 4, 272, 48, 24);
  ctx.fill();

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  let fontSize = 18;
  ctx.font = `600 ${fontSize}px "Segoe UI", -apple-system, sans-serif`;
  while (ctx.measureText(text).width > 244 && fontSize > 11) {
    ctx.font = `600 ${--fontSize}px "Segoe UI", -apple-system, sans-serif`;
  }
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 140, 28);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(1.05, 0.21, 1);
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

// 1. Classical University Wall with Clean Non-Z-Fighting Baseboard
export function createWall(x, y, z, width, height, depth, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Plaster wall
  const wallGeo = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(wallGeo, wallPlasterMat);
  group.add(wall);

  // Add oak baseboard ONLY for walls that rest on the floor (never for top transoms above doors!)
  const isRestingOnFloor = (y - height / 2) < 0.35 && height >= 3.5;
  if (isRestingOnFloor) {
    const baseHeight = 0.32;
    // Baseboard MUST be thicker than the wall's thickness to protrude 5cm into rooms on both sides
    let baseW, baseD;
    if (width >= depth) {
      // Wall runs along X-axis; thickness is along Z-axis
      baseW = width;
      baseD = depth + 0.10;
    } else {
      // Wall runs along Z-axis; thickness is along X-axis
      baseW = width + 0.10;
      baseD = depth;
    }
    const baseGeo = new THREE.BoxGeometry(baseW, baseHeight, baseD);
    const baseboard = new THREE.Mesh(baseGeo, baseboardMat);
    baseboard.position.y = -height / 2 + baseHeight / 2;
    group.add(baseboard);
  }
  return group;
}

// 2. Animated Collegiate Door with Frame and Swinging Hinge Leaf
export function createDoor(x, y, z, rotY = 0, roomNumber = '227', label = '') {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Frame Left Post (depth 0.48 so it projects 4cm past wall plaster to eliminate z-fighting)
  const postGeo = new THREE.BoxGeometry(0.18, 2.7, 0.48);
  const leftPost = new THREE.Mesh(postGeo, baseboardMat);
  leftPost.position.set(-0.95, 0, 0);
  group.add(leftPost);

  // Frame Right Post
  const rightPost = new THREE.Mesh(postGeo, baseboardMat);
  rightPost.position.set(0.95, 0, 0);
  group.add(rightPost);

  // Frame Header Top Beam
  const headerGeo = new THREE.BoxGeometry(2.08, 0.22, 0.48);
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
  color: 0x443b52, // Warm vaulted ceiling
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

  // Warm overhead gothic chandelier
  const lampLight = new THREE.PointLight(0xffbe73, 1.85, 20, 1.3);
  lampLight.position.set(0, -0.4, 0);
  group.add(lampLight);
}

// 12. Authentic Carved Halloween Jack-o-Lantern Pumpkin
export function createPumpkin(x, y, z, glowing = true) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const bodyGeo = new THREE.SphereGeometry(0.48, 14, 12);
  bodyGeo.scale(1.2, 0.92, 1.15);
  const body = new THREE.Mesh(bodyGeo, pumpkinSkinMaterial);
  group.add(body);

  const stemGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.24, 6);
  const stem = new THREE.Mesh(stemGeo, stemMaterial);
  stem.position.set(0, 0.44, 0);
  stem.rotation.z = 0.25;
  group.add(stem);

  if (glowing) {
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffdd33 });
    // Triangular carved eyes
    const eyeGeo = new THREE.ConeGeometry(0.08, 0.06, 3);
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.18, 0.12, 0.52);
    eyeLeft.rotation.x = Math.PI / 2;
    eyeLeft.rotation.z = 0.2;
    group.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.18, 0.12, 0.52);
    eyeRight.rotation.x = Math.PI / 2;
    eyeRight.rotation.z = -0.2;
    group.add(eyeRight);

    // Carved nose
    const noseGeo = new THREE.ConeGeometry(0.05, 0.05, 3);
    const nose = new THREE.Mesh(noseGeo, eyeMat);
    nose.position.set(0, 0.02, 0.55);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);

    // Carved jagged toothy mouth
    const mouthGeo = new THREE.BoxGeometry(0.36, 0.08, 0.06);
    const mouth = new THREE.Mesh(mouthGeo, eyeMat);
    mouth.position.set(0, -0.14, 0.51);
    group.add(mouth);

    // Warm flickering candle point light
    const pLight = new THREE.PointLight(0xff7700, 2.2, 9, 1.6);
    pLight.position.set(0, 0.2, 0.35);
    group.add(pLight);

    group.userData = { light: pLight, baseIntensity: 2.2, timeOffset: Math.random() * 10, isMovable: true, label: 'Тыква-фонарь' };
  } else {
    group.userData = { isMovable: true, label: 'Тыква' };
  }

  return group;
}

// 21. Authentic Bauman Oak Corridor Bench (Знаменитая бауманская дубовая скамья)
export function createBaumanBench(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  for (const lx of [-1.1, 1.1]) {
    const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.5);
    const leg = new THREE.Mesh(legGeo, deskMetalMat);
    leg.position.set(lx, 0.25, 0);
    group.add(leg);
  }

  const seatGeo = new THREE.BoxGeometry(2.4, 0.06, 0.55);
  const seat = new THREE.Mesh(seatGeo, deskWoodMat);
  seat.position.set(0, 0.48, 0);
  group.add(seat);

  const backGeo = new THREE.BoxGeometry(2.4, 0.45, 0.05);
  const back = new THREE.Mesh(backGeo, deskWoodMat);
  back.position.set(0, 0.85, -0.25);
  group.add(back);

  return group;
}

// 22. Authentic Soviet Cast-Iron Radiator (Чугунная батарея отопления ГУК)
export function createRadiator(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const numSections = 8;
  const sectionMat = new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.6, metalness: 0.5 });

  for (let i = 0; i < numSections; i++) {
    const secGeo = new THREE.BoxGeometry(0.08, 0.75, 0.22);
    const sec = new THREE.Mesh(secGeo, sectionMat);
    sec.position.set(-0.45 + i * 0.12, 0.45, 0);
    group.add(sec);
  }

  for (const py of [0.15, 0.75]) {
    const pipeGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8);
    const pipe = new THREE.Mesh(pipeGeo, sectionMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, py, 0);
    group.add(pipe);
  }

  return group;
}

// 23. Monumental Bronze Coat of Arms of BMSTU (Герб МГТУ им. Н.Э. Баумана)
export function createBaumanCrest(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const shieldGeo = new THREE.CylinderGeometry(1.4, 1.2, 0.15, 8);
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xc8963e, roughness: 0.35, metalness: 0.8 });
  const shield = new THREE.Mesh(shieldGeo, bronzeMat);
  shield.rotation.x = Math.PI / 2;
  group.add(shield);

  const crestPlaque = createPlaqueMesh('МГТУ им. Н.Э. БАУМАНА • МУЖЕСТВО, ВОЛЯ, ТРУД И УПОРСТВО', '#ffd700', 'rgba(25, 15, 10, 0.98)', 4.2, 0.45);
  crestPlaque.position.set(0, -1.1, 0.1);
  group.add(crestPlaque);

  return group;
}

// 24. Classical Marble Bust on Granite Pedestal (Бюст Н.Э. Баумана / С.П. Королёва)
export function createBust(x, y, z, name = 'Н.Э. Бауман') {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const pedMat = new THREE.MeshStandardMaterial({ color: 0x5a2d28, roughness: 0.3, metalness: 0.2 });
  const pedGeo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
  const ped = new THREE.Mesh(pedGeo, pedMat);
  ped.position.y = 0.7;
  group.add(ped);

  const bustMat = new THREE.MeshStandardMaterial({ color: 0xded8ce, roughness: 0.35, metalness: 0.1 });
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.45, 0.35);
  const torso = new THREE.Mesh(torsoGeo, bustMat);
  torso.position.y = 1.55;
  group.add(torso);

  const headGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const head = new THREE.Mesh(headGeo, bustMat);
  head.position.y = 1.95;
  group.add(head);

  const plaque = createPlaqueMesh(name, '#ffd700', 'rgba(20, 15, 10, 0.98)', 0.85, 0.22);
  plaque.position.set(0, 0.95, 0.37);
  group.add(plaque);

  return group;
}

// 25. Large Student Wardrobe / Coat Check (Студенческий Гардероб ГУК №1)
export function createWardrobe(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const counterGeo = new THREE.BoxGeometry(8.0, 1.0, 0.7);
  const counter = new THREE.Mesh(counterGeo, darkWoodDoorMat);
  counter.position.set(0, 0.5, 0);
  group.add(counter);

  const sign = createPlaqueMesh('🧥 ГАРДЕРОБ ГУК №1 • СЕКТОР А (КУРТКИ И ПЛАЩИ)', '#ffd700', 'rgba(25, 15, 10, 0.98)', 4.2, 0.35);
  sign.position.set(0, 1.15, 0.36);
  group.add(sign);

  for (let hx = -3.2; hx <= 3.2; hx += 1.6) {
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
    const post = new THREE.Mesh(postGeo, brassMetalMat);
    post.position.set(hx, 1.1, -1.2);
    group.add(post);

    const crossGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8);
    const cross = new THREE.Mesh(crossGeo, brassMetalMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(hx, 2.1, -1.2);
    group.add(cross);
  }

  return group;
}

// 26. Classical Lecturer Podium / Rostrum (Кафедра лектора)
export function createLecturePodium(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const bodyGeo = new THREE.BoxGeometry(0.9, 1.25, 0.65);
  const body = new THREE.Mesh(bodyGeo, darkWoodDoorMat);
  body.position.y = 0.625;
  group.add(body);

  const shelfGeo = new THREE.BoxGeometry(0.95, 0.06, 0.7);
  const shelf = new THREE.Mesh(shelfGeo, deskWoodMat);
  shelf.position.set(0, 1.25, 0);
  shelf.rotation.x = 0.2;
  group.add(shelf);

  const micGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
  const mic = new THREE.Mesh(micGeo, brassMetalMat);
  mic.position.set(-0.25, 1.45, -0.1);
  mic.rotation.x = -0.3;
  group.add(mic);

  return group;
}

// 27. Spooky Halloween Cobweb
export function createCobweb(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const webGeo = new THREE.PlaneGeometry(1.6, 1.6);
  const webMat = new THREE.MeshBasicMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: 0.35,
    wireframe: true,
    side: THREE.DoubleSide
  });
  const web = new THREE.Mesh(webGeo, webMat);
  web.rotation.y = Math.PI / 4;
  web.position.y = 0.8;
  group.add(web);

  return group;
}
// 28. Large Glazed BMSTU Schedule Board (Стенд расписания занятий факультета ИУ)
export function createScheduleBoard(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const frameGeo = new THREE.BoxGeometry(3.6, 2.2, 0.12);
  const frame = new THREE.Mesh(frameGeo, darkWoodDoorMat);
  frame.position.y = 1.6;
  group.add(frame);

  const boardGeo = new THREE.BoxGeometry(3.4, 2.0, 0.05);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.3 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 1.6, 0.05);
  group.add(board);

  const header = createPlaqueMesh('📋 РАСПИСАНИЕ ЗАНЯТИЙ • ФАКУЛЬТЕТ ИУ • СЕМЕСТР 5', '#ffd700', 'rgba(15, 20, 30, 0.98)', 3.2, 0.28);
  header.position.set(0, 2.45, 0.09);
  group.add(header);

  return group;
}

// 29. Dean's Notice Board with Retake Lists (Доска объявлений деканата • ХВОСТОВКА)
export function createDeanNoticeBoard(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const frameGeo = new THREE.BoxGeometry(2.8, 1.8, 0.1);
  const frame = new THREE.Mesh(frameGeo, darkWoodDoorMat);
  frame.position.y = 1.6;
  group.add(frame);

  const header = createPlaqueMesh('⚠️ ДЕКАНАТ ИУ • СПИСКИ НА ОТЧИСЛЕНИЕ И ПЕРЕСДАЧИ', '#ff5555', 'rgba(40, 15, 15, 0.98)', 2.6, 0.26);
  header.position.set(0, 2.25, 0.07);
  group.add(header);

  return group;
}

// 30. Vintage Soviet Wall Clock (Круглые часы «Стрела» под сводами коридоров)
export function createClock(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const rimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 24);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const dialGeo = new THREE.CircleGeometry(0.40, 24);
  const dialMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const dial = new THREE.Mesh(dialGeo, dialMat);
  dial.position.z = 0.045;
  group.add(dial);

  const hHandGeo = new THREE.BoxGeometry(0.03, 0.22, 0.01);
  const handMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const hHand = new THREE.Mesh(hHandGeo, handMat);
  hHand.position.set(0.05, 0.08, 0.05);
  hHand.rotation.z = -0.5;
  group.add(hHand);

  const mHandGeo = new THREE.BoxGeometry(0.02, 0.32, 0.01);
  const mHand = new THREE.Mesh(mHandGeo, handMat);
  mHand.position.set(-0.06, 0.12, 0.052);
  mHand.rotation.z = 0.8;
  group.add(mHand);

  return group;
}

// 31. Soviet Wall Fire Hose Cabinet (Пожарный шкаф ПК-1)
export function createFireHoseCabinet(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const boxGeo = new THREE.BoxGeometry(0.65, 0.85, 0.25);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.4 });
  const box = new THREE.Mesh(boxGeo, boxMat);
  box.position.y = 1.35;
  group.add(box);

  const label = createPlaqueMesh('ПК-1 • ОП-5', '#ffffff', 'rgba(180, 20, 20, 0.98)', 0.5, 0.18);
  label.position.set(0, 1.45, 0.14);
  group.add(label);

  return group;
}
// 32. BMSTU Cafeteria Food Service Counter («Кафедра Питания» — Раздаточная линия)
export function createFoodServiceCounter(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Stainless steel counter base (10m long, 1.1m high, 1.2m deep)
  const baseGeo = new THREE.BoxGeometry(10.0, 1.05, 1.2);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x889098, metalness: 0.8, roughness: 0.25 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.525;
  group.add(base);

  // Tubular stainless steel tray slide rails in front
  for (const railY of [0.82, 0.90]) {
    const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 9.8, 8);
    const rail = new THREE.Mesh(railGeo, chromeMetalMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, railY, 0.75);
    group.add(rail);
  }

  // Glass sneeze guard on top
  const glassGeo = new THREE.BoxGeometry(9.6, 0.6, 0.05);
  const guard = new THREE.Mesh(glassGeo, glassMat);
  guard.position.set(0, 1.45, 0.2);
  group.add(guard);

  // Steam table wells (мармиты с первыми и вторыми блюдами)
  for (let bx = -3.6; bx <= 1.0; bx += 1.5) {
    const wellGeo = new THREE.BoxGeometry(1.1, 0.15, 0.8);
    const wellMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.7, roughness: 0.3 });
    const well = new THREE.Mesh(wellGeo, wellMat);
    well.position.set(bx, 1.1, -0.1);
    group.add(well);

    const lidGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    const lid = new THREE.Mesh(lidGeo, brassMetalMat);
    lid.rotation.z = Math.PI / 2;
    lid.position.set(bx, 1.22, -0.1);
    group.add(lid);
  }

  // Pastry display: trays with buns and sausages in dough (сосиски в тесте)
  for (let px = 2.2; px <= 3.8; px += 1.4) {
    const trayGeo = new THREE.BoxGeometry(1.0, 0.05, 0.7);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    tray.position.set(px, 1.1, -0.1);
    group.add(tray);

    for (let bx = -0.3; bx <= 0.3; bx += 0.3) {
      const bunGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.24, 8);
      const bunMat = new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.8 });
      const bun = new THREE.Mesh(bunGeo, bunMat);
      bun.rotation.x = Math.PI / 2;
      bun.position.set(px + bx, 1.16, -0.1);
      group.add(bun);
    }
  }

  // Soviet Cash register «Ока» at the exit
  const cashGeo = new THREE.BoxGeometry(0.65, 0.45, 0.55);
  const cashMat = new THREE.MeshStandardMaterial({ color: 0x2e3b4e, roughness: 0.5 });
  const cash = new THREE.Mesh(cashGeo, cashMat);
  cash.position.set(4.4, 1.3, -0.1);
  group.add(cash);

  // Monumental illuminated banner
  const banner = createPlaqueMesh(
    '🍴 КАФЕДРА ПИТАНИЯ МГТУ ИМ. Н.Э. БАУМАНА • СТОЛОВАЯ ГУК №1',
    '#ffd700',
    'rgba(25, 20, 15, 0.98)',
    6.4,
    0.52
  );
  banner.position.set(0, 2.5, 0);
  group.add(banner);

  return group;
}

// 33. Cafeteria Dining Table with Chairs, Trays & Jack-o'-Lantern
export function createDiningTable(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Table top (2.0m x 1.0m)
  const topGeo = new THREE.BoxGeometry(2.0, 0.06, 1.0);
  const topMat = new THREE.MeshStandardMaterial({ color: 0xe8dfcf, roughness: 0.4 });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 0.75;
  group.add(top);

  // 4 chrome tubular legs
  for (const lx of [-0.85, 0.85]) {
    for (const lz of [-0.38, 0.38]) {
      const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8);
      const leg = new THREE.Mesh(legGeo, chromeMetalMat);
      leg.position.set(lx, 0.375, lz);
      group.add(leg);
    }
  }

  // 4 cafeteria chairs
  for (const cx of [-0.6, 0.6]) {
    for (const cz of [-0.8, 0.8]) {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(cx, 0, cz);
      chairGroup.rotation.y = cz < 0 ? 0 : Math.PI;

      const seatGeo = new THREE.BoxGeometry(0.42, 0.04, 0.42);
      const seat = new THREE.Mesh(seatGeo, darkWoodDoorMat);
      seat.position.y = 0.45;
      chairGroup.add(seat);

      const backGeo = new THREE.BoxGeometry(0.42, 0.35, 0.04);
      const back = new THREE.Mesh(backGeo, darkWoodDoorMat);
      back.position.set(0, 0.72, -0.19);
      chairGroup.add(back);

      group.add(chairGroup);
    }
  }

  // Jack-o'-Lantern on table center with flickering warm glow
  const pumpkin = createPumpkin(0, 0.78, 0, true);
  pumpkin.scale.set(0.65, 0.65, 0.65);
  group.add(pumpkin);

  return group;
}

// 34. Bubbling Halloween Witch Cauldron for Cafeteria
export function createWitchCauldron(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Heavy cast-iron cauldron
  const cGeo = new THREE.SphereGeometry(0.7, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const cMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8, metalness: 0.5 });
  const cauldron = new THREE.Mesh(cGeo, cMat);
  cauldron.rotation.x = Math.PI;
  cauldron.position.y = 0.7;
  group.add(cauldron);

  // Glowing radioactive-green bubbling stew
  const stewGeo = new THREE.CircleGeometry(0.62, 16);
  const stewMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b });
  const stew = new THREE.Mesh(stewGeo, stewMat);
  stew.rotation.x = -Math.PI / 2;
  stew.position.y = 0.68;
  group.add(stew);

  const greenLight = new THREE.PointLight(0x50fa7b, 2.2, 10, 1.2);
  greenLight.position.set(0, 1.0, 0);
  group.add(greenLight);

  // Skull ladle handle sticking out
  const ladleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6);
  const ladle = new THREE.Mesh(ladleGeo, darkWoodDoorMat);
  ladle.rotation.z = 0.4;
  ladle.position.set(0.2, 0.9, 0);
  group.add(ladle);

  group.userData = { light: greenLight, baseIntensity: 2.2, timeOffset: Math.random() * 10 };
  return group;
}

// 35. Authentic Cafeteria Price Menu Board
export function createCafeteriaMenuBoard(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const boardGeo = new THREE.BoxGeometry(3.6, 2.4, 0.08);
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x1c2430, roughness: 0.3 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = 1.8;
  group.add(board);

  const header = createPlaqueMesh(
    '📋 МЕНЮ СТОЛОВОЙ: БОРЩ 45р • СОСИСКА В ТЕСТЕ 50р • КОМПОТ 18р',
    '#50fa7b',
    'rgba(15, 25, 20, 0.98)',
    3.4,
    0.35
  );
  header.position.set(0, 2.7, 0.06);
  group.add(header);

  const sub = createPlaqueMesh(
    '🎃 СПЕЦИАЛЬНОЕ БЛЮДО: ВЕДЬМИНСКИЙ СУП ДЛЯ ЗАКРЫТИЯ СЕССИИ — БЕСПЛАТНО!',
    '#ffb86c',
    'rgba(30, 20, 15, 0.98)',
    3.4,
    0.32
  );
  sub.position.set(0, 2.25, 0.06);
  group.add(sub);

  return group;
}

// 36. Teacher's Desk (Преподавательский стол Канева с лабами, телефоном и ноутбуком)
export function createTeacherDesk(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Massive dark oak desk with panel moldings
  const deskGeo = new THREE.BoxGeometry(2.6, 0.8, 1.4);
  const desk = new THREE.Mesh(deskGeo, darkWoodDoorMat);
  desk.position.y = 0.4;
  group.add(desk);

  // Green leather writing pad
  const padGeo = new THREE.BoxGeometry(1.2, 0.02, 0.8);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.7 });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(0, 0.81, 0.1);
  group.add(pad);

  // 1. Famous BMSTU Banker's Emerald Desk Lamp (Зелёная профессорская лампа)
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-0.95, 0.82, -0.35);

  const lampBaseGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.04, 16);
  const lampBrassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 });
  const lampBase = new THREE.Mesh(lampBaseGeo, lampBrassMat);
  lampGroup.add(lampBase);

  const lampPoleGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.36, 8);
  const lampPole = new THREE.Mesh(lampPoleGeo, lampBrassMat);
  lampPole.position.set(0, 0.2, 0);
  lampGroup.add(lampPole);

  const shadeGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.26, 12, 1, false, 0, Math.PI);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x0f5132, // emerald green glass
    roughness: 0.2,
    emissive: 0x198754,
    emissiveIntensity: 0.45
  });
  const shade = new THREE.Mesh(shadeGeo, shadeMat);
  shade.rotation.z = Math.PI / 2;
  shade.position.set(0, 0.38, 0);
  lampGroup.add(shade);

  const lampLight = new THREE.PointLight(0xfffaaa, 2.2, 5, 1.8);
  lampLight.position.set(0, 0.32, 0.05);
  lampGroup.add(lampLight);
  group.add(lampGroup);

  // 2. Open BMSTU Student Record Book («Зачётная книжка») on the desk
  const zachetkaGeo = new THREE.BoxGeometry(0.24, 0.02, 0.18);
  const zachetkaMat = new THREE.MeshStandardMaterial({ color: 0x1b3b6f, roughness: 0.5 });
  const zachetka = new THREE.Mesh(zachetkaGeo, zachetkaMat);
  zachetka.position.set(-0.35, 0.82, 0.2);
  zachetka.rotation.y = 0.25;
  group.add(zachetka);

  const zachetkaLabel = createPlaqueMesh('ЗАЧЁТКА МГТУ', '#ffd700', 'rgba(15, 30, 60, 0.98)', 0.22, 0.14);
  zachetkaLabel.rotation.x = -Math.PI / 2;
  zachetkaLabel.position.set(-0.35, 0.835, 0.2);
  zachetkaLabel.rotation.z = -0.25;
  group.add(zachetkaLabel);

  // 3. Laptop with glowing screen
  const laptopBaseGeo = new THREE.BoxGeometry(0.35, 0.02, 0.25);
  const laptopMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
  const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopMat);
  laptopBase.position.set(0.12, 0.82, 0.05);
  group.add(laptopBase);

  const screenGeo = new THREE.BoxGeometry(0.35, 0.24, 0.02);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x8be9fd }); // Cyan glowing code
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0.12, 0.95, -0.07);
  screen.rotation.x = -0.2;
  group.add(screen);

  // 4. Stacks of student lab reports with red marks
  const papersGeo = new THREE.BoxGeometry(0.25, 0.18, 0.35);
  const papersMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const papers = new THREE.Mesh(papersGeo, papersMat);
  papers.position.set(-0.85, 0.90, 0.2);
  group.add(papers);

  const redMark = createPlaqueMesh('НЕЗАЧЁТ!', '#ff5555', 'rgba(60, 10, 10, 0.95)', 0.3, 0.12);
  redMark.position.set(-0.85, 1.0, 0.2);
  group.add(redMark);

  // 5. Soviet rotary desk phone
  const phoneGeo = new THREE.BoxGeometry(0.22, 0.12, 0.22);
  const phoneMat = new THREE.MeshStandardMaterial({ color: 0xdcd0c0, roughness: 0.5 });
  const phone = new THREE.Mesh(phoneGeo, phoneMat);
  phone.position.set(0.85, 0.87, 0.25);
  group.add(phone);

  // 6. Glass in silver BMSTU podstakannik
  const glassGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.14, 8);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0.85, 0.88, -0.25);
  group.add(glass);

  const podGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.09, 8);
  const pod = new THREE.Mesh(podGeo, chromeMetalMat);
  pod.position.set(0.85, 0.855, -0.25);
  group.add(pod);

  // 7. Jack-o'-Lantern on the corner
  const pumpkin = createPumpkin(0.9, 0.81, -0.45, true);
  pumpkin.scale.set(0.55, 0.55, 0.55);
  group.add(pumpkin);
}

// 37. Floating Gothic Halloween Candles
export function createFloatingCandle(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const candleGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.35, 8);
  const candleMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.6 });
  const candle = new THREE.Mesh(candleGeo, candleMat);
  group.add(candle);

  const flameGeo = new THREE.SphereGeometry(0.03, 8, 6);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 0.2;
  group.add(flame);

  const light = new THREE.PointLight(0xffaa00, 1.2, 5, 1.5);
  light.position.y = 0.25;
  group.add(light);

  group.userData = { light, baseIntensity: 1.2, timeOffset: Math.random() * 10, baseY: y };
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

  const light = new THREE.PointLight(0xffdf99, 2.2, 16, 1.2);
  light.position.set(0, 0.35, 0.25);
  group.add(light);

  group.userData = { light, baseIntensity: 2.2, timeOffset: Math.random() * 10 };
  return group;
}

// 13b. Ornate Standing Gothic Street / Hall Lantern Post
export function createStreetLantern(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // 1. Heavy stone/iron base
  const baseGeo = new THREE.CylinderGeometry(0.35, 0.5, 0.3, 8);
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x221c2b, roughness: 0.6, metalness: 0.7 });
  const base = new THREE.Mesh(baseGeo, ironMat);
  base.position.y = 0.15;
  group.add(base);

  // 2. Tall fluted lamppost
  const postGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.6, 12);
  const post = new THREE.Mesh(postGeo, ironMat);
  post.position.y = 1.45;
  group.add(post);

  // 3. Ornate brass collar & arm
  const collarGeo = new THREE.TorusGeometry(0.14, 0.035, 8, 16);
  const collar = new THREE.Mesh(collarGeo, brassMetalMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 2.75;
  group.add(collar);

  // 4. Lantern cage (octagonal / hexagonal)
  const cageGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.5, 6);
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x181220, roughness: 0.4, metalness: 0.85 });
  const cage = new THREE.Mesh(cageGeo, cageMat);
  cage.position.y = 3.0;
  group.add(cage);

  // 5. Glowing amber glass housing
  const glassGeo = new THREE.CylinderGeometry(0.21, 0.15, 0.42, 6);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xffe48f, transparent: true, opacity: 0.88 });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 3.0;
  group.add(glass);

  // 6. Point Light illuminating the surrounding area
  const light = new THREE.PointLight(0xffdf80, 2.8, 20, 1.2);
  light.position.set(0, 3.0, 0);
  group.add(light);

  group.userData = { light, baseIntensity: 2.8, timeOffset: Math.random() * 10 };
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
const stairMarbleMat = new THREE.MeshStandardMaterial({
  color: 0xf0ece4,
  roughness: 0.25,
  metalness: 0.1
});

const redCarpetMat = new THREE.MeshStandardMaterial({
  color: 0x991824, // Crimson red velvet
  roughness: 0.85
});

// 14b. Authentic BMSTU Grand Collegiate Staircase (Парадная лестница ГУК)
export function createGrandStairs(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const numSteps = 20;
  const stepWidth = 6.4;
  const stepDepth = 0.5;
  const stepHeight = 0.20; // 20 steps * 0.20m = 4.0m total rise
  const carpetWidth = 3.6;

  // 1. Classical Marble Steps with Red Carpet Runner climbing up to y = 4.0m
  for (let i = 0; i < numSteps; i++) {
    const stepY = i * stepHeight + stepHeight / 2;
    const stepZ = 1.0 - i * stepDepth;

    // Marble tread
    const treadGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
    const tread = new THREE.Mesh(treadGeo, stairMarbleMat);
    tread.position.set(0, stepY, stepZ);
    group.add(tread);

    // Red carpet runner over center
    const carpetGeo = new THREE.BoxGeometry(carpetWidth, 0.03, stepDepth + 0.02);
    const carpet = new THREE.Mesh(carpetGeo, redCarpetMat);
    carpet.position.set(0, stepY + stepHeight / 2 + 0.015, stepZ);
    group.add(carpet);
  }

  // 2. Monumental 2nd Floor Mezzanine Gallery (y = 4.0m, width = 23m, depth = 7.5m)
  const landingY = numSteps * stepHeight; // 4.0m
  const mezW = 23.0;
  const mezD = 7.4;
  const mezZ = -8.2; // Spans from z = -4.5 to z = -11.9

  const mezGeo = new THREE.BoxGeometry(mezW, 0.35, mezD);
  const mezFloor = new THREE.Mesh(mezGeo, stairMarbleMat);
  mezFloor.position.set(0, landingY - 0.175, mezZ);
  group.add(mezFloor);

  // Red velvet carpet across the center
  const mezCarpetGeo = new THREE.BoxGeometry(carpetWidth, 0.03, mezD);
  const mezCarpet = new THREE.Mesh(mezCarpetGeo, redCarpetMat);
  mezCarpet.position.set(0, landingY + 0.015, mezZ);
  group.add(mezCarpet);

  // Cross-walkway red carpet connecting West and East 2nd floor wings
  const crossCarpetGeo = new THREE.BoxGeometry(mezW - 2, 0.03, 2.4);
  const crossCarpet = new THREE.Mesh(crossCarpetGeo, redCarpetMat);
  crossCarpet.position.set(0, landingY + 0.016, -7.0);
  group.add(crossCarpet);
  // 3. Brass Balustrades along 2nd Floor Mezzanine Overlooking 1st Floor Foyer
  for (const side of [-1, 1]) {
    const balustradeW = 8.0;
    const balustradeX = side * (3.4 + balustradeW / 2);
    const balGeo = new THREE.CylinderGeometry(0.045, 0.045, balustradeW, 8);
    const bal = new THREE.Mesh(balGeo, brassMetalMat);
    bal.rotation.z = Math.PI / 2;
    bal.position.set(balustradeX, landingY + 0.95, -4.5);
    group.add(bal);

    // Decorative marble balusters
    for (let bx = -3.5; bx <= 3.5; bx += 1.4) {
      const balusterGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8);
      const baluster = new THREE.Mesh(balusterGeo, stairMarbleMat);
      baluster.position.set(balustradeX + bx, landingY + 0.45, -4.5);
      group.add(baluster);
    }
  }

  // Handrails along the stair sides
  const totalStairDepth = numSteps * stepDepth;
  const railSlopeAngle = Math.atan2(landingY, totalStairDepth);
  const railLength = Math.hypot(landingY, totalStairDepth);

  for (const side of [-1, 1]) {
    const railX = side * (stepWidth / 2 - 0.15);

    // Handrail beam
    const railGeo = new THREE.CylinderGeometry(0.045, 0.045, railLength, 12);
    const rail = new THREE.Mesh(railGeo, brassMetalMat);
    rail.position.set(railX, landingY / 2 + 0.85, 1.0 - totalStairDepth / 2 + stepDepth / 2);
    rail.rotation.x = railSlopeAngle;
    group.add(rail);

    // Bottom decorative pedestal with glowing brass urn
    const pedGeo = new THREE.BoxGeometry(0.5, 1.1, 0.5);
    const ped = new THREE.Mesh(pedGeo, stairMarbleMat);
    ped.position.set(railX, 0.55, 1.0 + stepDepth / 2);
    group.add(ped);

    const urnGeo = new THREE.SphereGeometry(0.2, 12, 8);
    const urnMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.2 });
    const urn = new THREE.Mesh(urnGeo, urnMat);
    urn.position.set(railX, 1.25, 1.0 + stepDepth / 2);
    group.add(urn);
  }

  // 4. Classical Neoclassical Columns on 2nd Floor Mezzanine
  const col1 = createPillar(-6.5, landingY + 2.5, -8.0, 5.0);
  const col2 = createPillar(6.5, landingY + 2.5, -8.0, 5.0);
  group.add(col1);
  group.add(col2);

  // 5. Monumental Portal Archway to 2nd Floor Grand Gallery (Кафедра К5, Ауд. 227)
  const portalArch = createArch(0, landingY + 2.5, -11.7, 0);
  group.add(portalArch);

  const signPlaque = createPlaqueMesh(
    '🏛️ 2 ЭТАЖ • ВХОД В ГАЛЕРЕЮ КАФЕДР И АУДИТОРИЙ (К5, УЧЁНЫЙ СОВЕТ)',
    '#ffd700',
    'rgba(28, 18, 12, 0.98)',
    5.0,
    0.48
  );
  signPlaque.position.set(0, landingY + 4.2, -11.5);
  group.add(signPlaque);

  // 6. Upper Marble Staircases climbing from 2nd Floor up to 3rd Floor (y = 2.4m -> y = 4.8m)
  const numSteps3 = 10;
  const stepHeight3 = 0.24;
  const stepDepth3 = 0.45;
  const stairWidth3 = 3.2;

  for (const side of [-1, 1]) {
    const stairX3 = side * 8.5;
    for (let i = 0; i < numSteps3; i++) {
      const stepY = landingY + i * stepHeight3 + stepHeight3 / 2;
      const stepZ = -6.0 - i * stepDepth3;

      const tGeo = new THREE.BoxGeometry(stairWidth3, stepHeight3, stepDepth3);
      const tMesh = new THREE.Mesh(tGeo, stairMarbleMat);
      tMesh.position.set(stairX3, stepY, stepZ);
      group.add(tMesh);

      // Red carpet runner
      const cGeo = new THREE.BoxGeometry(stairWidth3 - 0.6, 0.03, stepDepth3 + 0.02);
      const cMesh = new THREE.Mesh(cGeo, redCarpetMat);
      cMesh.position.set(stairX3, stepY + stepHeight3 / 2 + 0.015, stepZ);
      group.add(cMesh);
    }

    // Top 3rd floor landing
    const topY = landingY + numSteps3 * stepHeight3; // 4.8m
    const topGeo = new THREE.BoxGeometry(stairWidth3 + 0.6, 0.35, 2.4);
    const topMesh = new THREE.Mesh(topGeo, stairMarbleMat);
    topMesh.position.set(stairX3, topY - 0.175, -10.8);
    group.add(topMesh);

    // Archway to 3rd floor
    const arch3 = createArch(stairX3, topY + 2.5, -11.7, 0);
    group.add(arch3);

    const plaque3 = createPlaqueMesh(
      '🔬 3 ЭТАЖ • ЛАБОРАТОРИИ ФОТОНИКИ (МАРИЯ КЮРИ)',
      '#50fa7b',
      'rgba(15, 25, 20, 0.98)',
      3.6,
      0.38
    );
    plaque3.position.set(stairX3, topY + 3.8, -11.5);
    group.add(plaque3);
  }

  return group;
}
// 14c. Classical Bauman Collegiate Elevator (Коллежский Лифт ГУК)
export function createElevator(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Brass cage enclosure
  const cageGeo = new THREE.BoxGeometry(2.6, 3.2, 2.6);
  const cageWireGeo = new THREE.WireframeGeometry(cageGeo);
  const cageLines = new THREE.LineSegments(cageWireGeo, new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 2 }));
  cageLines.position.y = 1.6;
  group.add(cageLines);

  // Solid roof and floor
  const capGeo = new THREE.BoxGeometry(2.7, 0.2, 2.7);
  const roof = new THREE.Mesh(capGeo, brassMetalMat);
  roof.position.y = 3.2;
  group.add(roof);

  const btm = new THREE.Mesh(capGeo, darkWoodDoorMat);
  btm.position.y = 0.1;
  group.add(btm);

  // Corner brass pillars
  for (const cx of [-1.25, 1.25]) {
    for (const cz of [-1.25, 1.25]) {
      const colGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
      const col = new THREE.Mesh(colGeo, brassMetalMat);
      col.position.set(cx, 1.6, cz);
      group.add(col);
    }
  }

  // Warm ceiling indicator lamp
  const lamp = new THREE.PointLight(0xffdf99, 1.6, 8);
  lamp.position.set(0, 2.9, 0);
  group.add(lamp);

  // Floor indicator dial over elevator entrance
  const dialPlaque = createPlaqueMesh('🛗 ЛИФТ ГУК • ЭТАЖИ [1 • 2 • 3 • 4 • 5]', '#ffd700', 'rgba(28, 18, 12, 0.98)', 2.4, 0.36);
  dialPlaque.position.set(0, 3.45, 1.35);
  group.add(dialPlaque);

  group.userData = { isElevator: true };
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

  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');
  const palette=zoneType==='foyer'?['#545d59','#626b65']:zoneType==='k5_lab'?['#455760','#4c6068']:zoneType==='photonics_lab'?['#495e55','#53685e']:['#65594d','#706353'];
  for(let tx=0;tx<8;tx++)for(let tz=0;tz<8;tz++){
    ctx.fillStyle=palette[(tx+tz)%2];ctx.fillRect(tx*64,tz*64,64,64);
    ctx.strokeStyle='#ffffff0a';ctx.strokeRect(tx*64+.5,tz*64+.5,63,63);
  }
  ctx.strokeStyle='#d2bb83';ctx.lineWidth=2;ctx.strokeRect(20,20,472,472);
  ctx.strokeStyle='#d2bb8355';ctx.strokeRect(25,25,462,462);
  if(zoneType==='foyer'){
    ctx.fillStyle='#263e41';ctx.fillRect(218,0,76,512);ctx.fillRect(0,218,512,76);
    ctx.strokeStyle='#cbb47e88';ctx.lineWidth=2;ctx.strokeRect(218,0,76,512);ctx.strokeRect(0,218,512,76);
    ctx.beginPath();ctx.arc(256,256,78,0,Math.PI*2);ctx.fillStyle='#263e41';ctx.fill();ctx.strokeStyle='#cbb47e';ctx.stroke();
    ctx.fillStyle='#ddbd81';ctx.font='70px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Б',256,259);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const geo=new THREE.PlaneGeometry(width,depth);
  const mat=new THREE.MeshStandardMaterial({map:texture,roughness:.72,metalness:.04});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;
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
  nametag.position.y = 1.35;
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

  // Ethereal translucent ghost material with rich rim lighting
  const ghostMat = new THREE.MeshStandardMaterial({
    color: auraColor,
    emissive: auraColor,
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.88,
    roughness: 0.2,
    metalness: 0.15
  });

  // --- 1. Ethereal Sculpted Ghost Body ---
  const bodyGroup = new THREE.Group();

  // Torso
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.65, 14);
  const torso = new THREE.Mesh(torsoGeo, ghostMat);
  torso.position.y = 0.55;
  bodyGroup.add(torso);

  // Shoulders & Mantle
  const shoulderGeo = new THREE.BoxGeometry(0.66, 0.14, 0.32);
  const shoulder = new THREE.Mesh(shoulderGeo, ghostMat);
  shoulder.position.y = 0.82;
  bodyGroup.add(shoulder);

  // Undulating Ghost Tail (3 tapering segments sweeping backwards)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.28, 0);

  const tailSeg1Geo = new THREE.CylinderGeometry(0.32, 0.24, 0.38, 12);
  const tailSeg1 = new THREE.Mesh(tailSeg1Geo, ghostMat);
  tailSeg1.position.y = -0.15;
  tailGroup.add(tailSeg1);

  const tailSeg2Geo = new THREE.CylinderGeometry(0.24, 0.14, 0.32, 12);
  const tailSeg2 = new THREE.Mesh(tailSeg2Geo, ghostMat);
  tailSeg2.position.set(0, -0.42, -0.06);
  tailSeg2.rotation.x = -0.22;
  tailGroup.add(tailSeg2);

  const tailSeg3Geo = new THREE.ConeGeometry(0.14, 0.35, 12);
  const tailSeg3 = new THREE.Mesh(tailSeg3Geo, ghostMat);
  tailSeg3.position.set(0, -0.68, -0.16);
  tailSeg3.rotation.x = -0.45;
  tailGroup.add(tailSeg3);

  bodyGroup.add(tailGroup);
  group.add(bodyGroup);

  // --- 2. Sculpted Head & Expressive Facial Features ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.06, 0);

  const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const head = new THREE.Mesh(headGeo, ghostMat);
  head.scale.set(1.0, 1.15, 1.05);
  headGroup.add(head);

  // Stylized Expressive Glowing Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111122 });

  for (const ex of [-0.11, 0.11]) {
    // Sclera / eye glow
    const eyeGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(ex, 0.05, 0.28);
    eye.scale.set(1.0, 0.9, 0.6);
    headGroup.add(eye);

    // Dark focus pupil
    const pupilGeo = new THREE.SphereGeometry(0.024, 6, 6);
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.set(ex, 0.05, 0.315);
    headGroup.add(pupil);
  }

  // --- 3. Distinct Character Silhouettes & Academic Costumes ---
  let specialProp = null;

  if (npcData.id === 'bufetchitsa') {
    // 🍴 КЛАВДИЯ ПЕТРОВНА (ТЁТЯ КЛАВА): Буфетчица ГУК
    // 1. Pleated Chef's / Baker's Toque (Белый колпак)
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.28, 0);

    const toqueBandGeo = new THREE.CylinderGeometry(0.28, 0.29, 0.12, 16);
    const toqueMat = new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.6 });
    const toqueBand = new THREE.Mesh(toqueBandGeo, toqueMat);
    hatGroup.add(toqueBand);

    const toqueCrownGeo = new THREE.CylinderGeometry(0.36, 0.28, 0.35, 16);
    const toqueCrown = new THREE.Mesh(toqueCrownGeo, toqueMat);
    toqueCrown.position.y = 0.22;
    hatGroup.add(toqueCrown);

    const toqueTopGeo = new THREE.SphereGeometry(0.36, 12, 8);
    const toqueTop = new THREE.Mesh(toqueTopGeo, toqueMat);
    toqueTop.position.y = 0.38;
    toqueTop.scale.set(1.0, 0.35, 1.0);
    hatGroup.add(toqueTop);
    headGroup.add(hatGroup);

    // 2. Wire-frame spectacles
    const glassesGeo = new THREE.TorusGeometry(0.065, 0.009, 6, 14);
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9 });
    for (const gx of [-0.11, 0.11]) {
      const gLens = new THREE.Mesh(glassesGeo, glassesMat);
      gLens.position.set(gx, 0.05, 0.30);
      headGroup.add(gLens);
    }
    const bridgeGeo = new THREE.BoxGeometry(0.06, 0.01, 0.01);
    const bridge = new THREE.Mesh(bridgeGeo, glassesMat);
    bridge.position.set(0, 0.05, 0.30);
    headGroup.add(bridge);

    // 3. Cheerful rosy cheeks
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff6688, transparent: true, opacity: 0.65 });
    for (const cx of [-0.18, 0.18]) {
      const cheekGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const cheek = new THREE.Mesh(cheekGeo, cheekMat);
      cheek.position.set(cx, -0.04, 0.24);
      headGroup.add(cheek);
    }

    // 4. Crisp White Apron with front pocket
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xfbfbfb, roughness: 0.7 });
    const apronGeo = new THREE.BoxGeometry(0.44, 0.55, 0.04);
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(0, 0.52, 0.17);
    bodyGroup.add(apron);

    // Wooden spoon in apron pocket
    const spoonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
    const spoonMat = new THREE.MeshStandardMaterial({ color: 0xc19a6b, roughness: 0.7 });
    const spoon = new THREE.Mesh(spoonGeo, spoonMat);
    spoon.position.set(0.12, 0.65, 0.2);
    spoon.rotation.z = -0.3;
    bodyGroup.add(spoon);

    // 5. Holding a serving tray with steaming fresh Сосиска в тесте!
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, 0.52, 0.42);

    const trayGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 20);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.85, roughness: 0.2 });
    const tray = new THREE.Mesh(trayGeo, trayMat);
    trayGroup.add(tray);

    // Golden-brown glazed сосиска в тесте
    const sosiskaGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10);
    const sosiskaMat = new THREE.MeshStandardMaterial({ color: 0xc47b2b, roughness: 0.5 });
    const sosiska = new THREE.Mesh(sosiskaGeo, sosiskaMat);
    sosiska.rotation.x = Math.PI / 2;
    sosiska.position.set(-0.06, 0.04, 0);
    trayGroup.add(sosiska);

    // Ketchup zig-zag line
    const ketchupGeo = new THREE.BoxGeometry(0.02, 0.01, 0.18);
    const ketchupMat = new THREE.MeshBasicMaterial({ color: 0xcc1111 });
    const ketchup = new THREE.Mesh(ketchupGeo, ketchupMat);
    ketchup.position.set(-0.06, 0.09, 0);
    trayGroup.add(ketchup);

    // Porcelain tea cup with steaming tea
    const cupGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.08, 10);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(0.14, 0.05, 0);
    trayGroup.add(cup);

    group.add(trayGroup);
    specialProp = trayGroup;

  } else if (npcData.id === 'einstein') {
    // 🧠 АЛЬБЕРТ ЭЙНШТЕЙН
    // 1. Iconic wild voluminous white curly hair
    const hairGroup = new THREE.Group();
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      emissive: 0xeeeeee,
      emissiveIntensity: 0.3
    });

    const hairPositions = [
      [0, 0.28, -0.05, 0.26],
      [-0.24, 0.18, 0, 0.22],
      [0.24, 0.18, 0, 0.22],
      [-0.26, -0.02, -0.05, 0.2],
      [0.26, -0.02, -0.05, 0.2],
      [0, 0.22, -0.22, 0.24],
      [-0.18, 0.08, -0.2, 0.2],
      [0.18, 0.08, -0.2, 0.2],
      [0, -0.12, -0.22, 0.18]
    ];
    for (const [hx, hy, hz, hr] of hairPositions) {
      const puffGeo = new THREE.DodecahedronGeometry(hr, 1);
      const puff = new THREE.Mesh(puffGeo, hairMat);
      puff.position.set(hx, hy, hz);
      hairGroup.add(puff);
    }
    headGroup.add(hairGroup);

    // 2. Thick bushy white mustache
    const stacheGeo = new THREE.BoxGeometry(0.24, 0.06, 0.07);
    const stache = new THREE.Mesh(stacheGeo, hairMat);
    stache.position.set(0, -0.08, 0.3);
    headGroup.add(stache);

    // 3. Tweed wool vest with buttons
    const vestGeo = new THREE.BoxGeometry(0.52, 0.52, 0.35);
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x5a4638, roughness: 0.85 });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 0.55, 0.02);
    bodyGroup.add(vest);

    // 4. Blackboard slate showing E = mc²
    const slateGroup = new THREE.Group();
    slateGroup.position.set(0.42, 0.6, 0.25);
    slateGroup.rotation.set(0.1, -0.4, 0.2);

    const slateFrameGeo = new THREE.BoxGeometry(0.46, 0.34, 0.03);
    const slateFrameMat = new THREE.MeshStandardMaterial({ color: 0x6e4a2e, roughness: 0.7 });
    const slateFrame = new THREE.Mesh(slateFrameGeo, slateFrameMat);
    slateGroup.add(slateFrame);

    const slateBoard = createPlaqueMesh('E = mc²', '#ffd700', 'rgba(15, 30, 20, 0.98)', 0.4, 0.28);
    slateBoard.position.set(0, 0, 0.02);
    slateGroup.add(slateBoard);
    group.add(slateGroup);
    specialProp = slateGroup;

  } else if (npcData.id === 'kanev') {
    // 💻 АНТОН ИГОРЕВИЧ КАНЕВ: Кафедра К5 (ИУ-5)
    // 1. Modern academic dark-rim rectangular glasses
    const glassesGeo = new THREE.BoxGeometry(0.12, 0.06, 0.02);
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x111115, metalness: 0.8, roughness: 0.2 });
    for (const gx of [-0.11, 0.11]) {
      const gRim = new THREE.Mesh(glassesGeo, glassesMat);
      gRim.position.set(gx, 0.05, 0.30);
      headGroup.add(gRim);
    }
    const bridgeGeo = new THREE.BoxGeometry(0.06, 0.012, 0.015);
    const bridge = new THREE.Mesh(bridgeGeo, glassesMat);
    bridge.position.set(0, 0.05, 0.30);
    headGroup.add(bridge);

    // 2. Neat dark hair side-part
    const hairGeo = new THREE.BoxGeometry(0.62, 0.16, 0.58);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221c18, roughness: 0.6 });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.25, -0.02);
    headGroup.add(hair);

    // 3. Dark suit blazer, white collared shirt, and red tie
    const suitGeo = new THREE.BoxGeometry(0.56, 0.58, 0.36);
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1a2130, roughness: 0.65 });
    const suit = new THREE.Mesh(suitGeo, suitMat);
    suit.position.set(0, 0.55, 0.02);
    bodyGroup.add(suit);

    const tieGeo = new THREE.BoxGeometry(0.06, 0.35, 0.02);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 });
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 0.58, 0.21);
    bodyGroup.add(tie);

    // 4. BMSTU Lanyard badge hanging from neck
    const badge = createPlaqueMesh('ИУ-5 • КАНЕВ', '#8be9fd', 'rgba(10, 25, 45, 0.98)', 0.24, 0.12);
    badge.position.set(0, 0.38, 0.21);
    bodyGroup.add(badge);

    // 5. Holding an illuminated slim laptop with rotating 3D network node cube
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(0.35, 0.55, 0.32);
    laptopGroup.rotation.set(0.1, -0.3, 0.05);

    const lBaseGeo = new THREE.BoxGeometry(0.32, 0.018, 0.24);
    const lMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.8 });
    const lBase = new THREE.Mesh(lBaseGeo, lMat);
    laptopGroup.add(lBase);

    const lScreenGeo = new THREE.BoxGeometry(0.32, 0.22, 0.015);
    const lScreenMat = new THREE.MeshBasicMaterial({ color: 0x8be9fd }); // Cyan code
    const lScreen = new THREE.Mesh(lScreenGeo, lScreenMat);
    lScreen.position.set(0, 0.11, -0.11);
    lScreen.rotation.x = -0.25;
    laptopGroup.add(lScreen);

    // Floating 3D network cube rotating above the laptop
    const cubeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const cubeMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b, wireframe: true });
    const netCube = new THREE.Mesh(cubeGeo, cubeMat);
    netCube.position.set(0, 0.24, 0);
    laptopGroup.add(netCube);
    laptopGroup.userData = { netCube };

    group.add(laptopGroup);
    specialProp = laptopGroup;

  } else if (npcData.id === 'curie') {
    // 🧪 МАРИЯ КЮРИ: Лаборатория Радиохимии
    // 1. Edwardian updo chignon with silver comb
    const bunGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3a2820, roughness: 0.7 });
    const bun = new THREE.Mesh(bunGeo, hairMat);
    bun.position.set(0, 0.22, -0.22);
    headGroup.add(bun);

    // 2. High-neck dark emerald vintage dress with lace collar
    const laceGeo = new THREE.TorusGeometry(0.24, 0.03, 6, 16);
    const laceMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
    const lace = new THREE.Mesh(laceGeo, laceMat);
    lace.rotation.x = Math.PI / 2;
    lace.position.y = 0.82;
    bodyGroup.add(lace);

    // 3. Holding two chemical Erlenmeyer flasks with glowing Radium solution
    const flaskGroup = new THREE.Group();
    flaskGroup.position.set(0.32, 0.55, 0.28);

    const flaskBaseGeo = new THREE.ConeGeometry(0.09, 0.18, 12);
    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x50fa7b,
      emissive: 0x50fa7b,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.85
    });
    const flask = new THREE.Mesh(flaskBaseGeo, flaskMat);
    flaskGroup.add(flask);

    const neckGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8);
    const neck = new THREE.Mesh(neckGeo, flaskMat);
    neck.position.y = 0.12;
    flaskGroup.add(neck);

    const radiumLight = new THREE.PointLight(0x50fa7b, 2.2, 7);
    radiumLight.position.set(0, 0.08, 0);
    flaskGroup.add(radiumLight);

    group.add(flaskGroup);
    specialProp = flaskGroup;

  } else if (npcData.id === 'herodotus') {
    // 📜 ГЕРОДОТ ГАЛИКАРНАССКИЙ: Отец Истории
    // 1. Golden laurel wreath crown
    const wreathGeo = new THREE.TorusGeometry(0.32, 0.025, 6, 24);
    const wreathMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.25 });
    const wreath = new THREE.Mesh(wreathGeo, wreathMat);
    wreath.rotation.x = Math.PI / 2;
    wreath.position.y = 0.18;
    headGroup.add(wreath);

    // 2. Classical curly philosopher beard
    const beardGeo = new THREE.ConeGeometry(0.18, 0.28, 10);
    const beardMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.8 });
    const beard = new THREE.Mesh(beardGeo, beardMat);
    beard.rotation.x = -0.2;
    beard.position.set(0, -0.18, 0.22);
    headGroup.add(beard);

    // 3. Greek toga / himation draped across chest with golden fibula brooch
    const fibulaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
    const fibula = new THREE.Mesh(fibulaGeo, wreathMat);
    fibula.position.set(-0.2, 0.82, 0.18);
    fibula.rotation.x = Math.PI / 2;
    bodyGroup.add(fibula);

    // 4. Wide open papyrus scroll
    const scrollGroup = new THREE.Group();
    scrollGroup.position.set(0.32, 0.55, 0.28);
    scrollGroup.rotation.set(0.2, -0.3, 0.1);

    const scroll = createPlaqueMesh('📜 ИСТОРИЯ • НИЛ & ПИРАМИДЫ', '#5c3a1e', 'rgba(240, 230, 200, 0.98)', 0.52, 0.32);
    scrollGroup.add(scroll);
    group.add(scrollGroup);
    specialProp = scrollGroup;

  } else if (npcData.id === 'akhmetova') {
    // 📐 ФАНИЯ ХАРИСОВНА АХМЕТОВА: Математический Анализ ФН
    // 1. Elegant silk neck scarf
    const scarfGeo = new THREE.TorusGeometry(0.22, 0.035, 6, 16);
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xd63384, roughness: 0.5 });
    const scarf = new THREE.Mesh(scarfGeo, scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.82;
    bodyGroup.add(scarf);

    // 2. Cat-eye professorial glasses
    const glassesGeo = new THREE.BoxGeometry(0.12, 0.05, 0.02);
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, metalness: 0.5 });
    for (const gx of [-0.11, 0.11]) {
      const gLens = new THREE.Mesh(glassesGeo, glassesMat);
      gLens.position.set(gx, 0.05, 0.30);
      headGroup.add(gLens);
    }

    // 3. Rotating Golden Halo of Calculus Integrals
    const ringGeo = new THREE.TorusGeometry(0.48, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    ring.position.y = 1.35;
    group.add(ring);
    specialProp = ring;

  } else if (npcData.id === 'korshunov') {
    // ⚡ ВЛАДИСЛАВ МИХАЙЛОВИЧ КОРШУНОВ: Лазерная Фотоника
    // 1. Laser safety goggles pushed up on forehead
    const goggleGeo = new THREE.BoxGeometry(0.36, 0.09, 0.14);
    const goggleMat = new THREE.MeshStandardMaterial({ color: 0xff7700, roughness: 0.3, metalness: 0.4 });
    const goggles = new THREE.Mesh(goggleGeo, goggleMat);
    goggles.position.set(0, 0.22, 0.22);
    headGroup.add(goggles);

    // 2. Crystal prism with lasers
    const prismGeo = new THREE.OctahedronGeometry(0.22, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: 0x50fa7b,
      wireframe: true,
      emissive: 0x50fa7b,
      emissiveIntensity: 0.9
    });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.position.set(0.38, 0.6, 0.24);
    group.add(prism);

    const prismLight = new THREE.PointLight(0x50fa7b, 2.4, 8);
    prismLight.position.set(0.38, 0.6, 0.24);
    group.add(prismLight);
    specialProp = prism;
  }

  group.add(headGroup);

  // Floating Name / Role badge
  const nametag = createNameTag(npcData.name, npcData.color);
  nametag.position.y = 1.55;
  group.add(nametag);

  // Spectral point light
  const light = new THREE.PointLight(auraColor, 2.0, 10);
  light.position.y = 1.0;
  group.add(light);

  group.userData = {
    npcData,
    npcMat: ghostMat,
    bodyGroup,
    tailGroup,
    headGroup,
    specialProp,
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
  nametag.position.y = 0.55;
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

// 40. Monumental Vault: Founders' Safe of 1830 (Сейф Основателей МГТУ)
export function createFoundersSafe(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1c1a24,
    roughness: 0.45,
    metalness: 0.85
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.9
  });

  // Safe Main Vault Body (width 2.4m, height 2.6m, depth 1.4m)
  const bodyGeo = new THREE.BoxGeometry(2.4, 2.6, 1.4);
  const body = new THREE.Mesh(bodyGeo, ironMat);
  body.position.y = 1.3;
  group.add(body);

  // Vault Door Outer Frame
  const frameGeo = new THREE.BoxGeometry(2.1, 2.3, 0.12);
  const frame = new THREE.Mesh(frameGeo, ironMat);
  frame.position.set(0, 1.3, 0.71);
  group.add(frame);

  // Heavy Vault Door Face
  const doorGeo = new THREE.BoxGeometry(1.85, 2.05, 0.1);
  const door = new THREE.Mesh(doorGeo, ironMat);
  door.position.set(0, 1.3, 0.77);
  group.add(door);

  // Massive Brass Combination Wheel in the center
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0, 1.3, 0.84);

  const rimGeo = new THREE.TorusGeometry(0.38, 0.035, 8, 24);
  const rim = new THREE.Mesh(rimGeo, brassMat);
  wheelGroup.add(rim);

  const hubGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 16);
  const hub = new THREE.Mesh(hubGeo, brassMat);
  hub.rotation.x = Math.PI / 2;
  wheelGroup.add(hub);

  // 4 Brass Spokes
  for (let i = 0; i < 4; i++) {
    const spokeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.76, 8);
    const spoke = new THREE.Mesh(spokeGeo, brassMat);
    spoke.rotation.z = (i * Math.PI) / 4;
    wheelGroup.add(spoke);
  }
  group.add(wheelGroup);

  // Golden Inscribed Plaque on Vault Architrave
  const plaque = createPlaqueMesh('СЕЙФ ОСНОВАТЕЛЕЙ МГТУ • 1830 ГОД', '#ffd700', 'rgba(25, 15, 10, 0.98)', 2.2, 0.35);
  plaque.position.set(0, 2.75, 0.71);
  group.add(plaque);

  // 4 Mystical Stage Indicator Runes
  const runes = [
    { label: '⏳ ВРЕМЯ', color: '#f1fa8c', x: -0.65 },
    { label: '📜 ИСТОРИЯ', color: '#bd93f9', x: -0.22 },
    { label: '🧪 РАДИЙ', color: '#50fa7b', x: 0.22 },
    { label: '💻 СЕТИ', color: '#8be9fd', x: 0.65 }
  ];

  for (const r of runes) {
    const rBadge = createPlaqueMesh(r.label, r.color, 'rgba(10, 15, 25, 0.95)', 0.38, 0.18);
    rBadge.position.set(r.x, 2.15, 0.83);
    group.add(rBadge);

    // Glowing LED dot
    const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(r.color) });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(r.x, 2.32, 0.84);
    group.add(dot);
  }

  // Soft Golden Divine Radiance
  const vLight = new THREE.PointLight(0xffd700, 2.5, 9);
  vLight.position.set(0, 1.5, 1.2);
  group.add(vLight);

  group.userData = {
    isVault: true,
    wheelGroup,
    light: vLight
  };

  return group;
}

// 41. Ancient Mystical Tome / Grimoire Prop
export function createTomeProp(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Cover
  const coverGeo = new THREE.BoxGeometry(0.36, 0.07, 0.26);
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x421b2a, roughness: 0.6, metalness: 0.2 });
  const cover = new THREE.Mesh(coverGeo, coverMat);
  group.add(cover);

  // Pages inside
  const pagesGeo = new THREE.BoxGeometry(0.33, 0.05, 0.23);
  const pagesMat = new THREE.MeshStandardMaterial({ color: 0xeadbb6, roughness: 0.9 });
  const pages = new THREE.Mesh(pagesGeo, pagesMat);
  pages.position.set(0.01, 0, 0);
  group.add(pages);

  // Gold corner protectors & spine
  const spineGeo = new THREE.BoxGeometry(0.04, 0.075, 0.265);
  const spineMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.x = -0.17;
  group.add(spine);

  group.userData = { isMovable: true, label: 'Гримуар' };
  return group;
}

// 42. Glowing Alchemical Flask / Potion Prop
export function createFlaskProp(x, y, z, color = 0x50fa7b) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Glass flask body
  const bodyGeo = new THREE.SphereGeometry(0.18, 12, 10);
  const glassMat = new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.85 });
  const body = new THREE.Mesh(bodyGeo, glassMat);
  body.position.y = 0.18;
  group.add(body);

  // Flask neck & cork
  const neckGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.16, 8);
  const neck = new THREE.Mesh(neckGeo, glassMat);
  neck.position.y = 0.34;
  group.add(neck);

  const corkGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.08, 8);
  const corkMat = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8 });
  const cork = new THREE.Mesh(corkGeo, corkMat);
  cork.position.y = 0.44;
  group.add(cork);

  // Internal magical radiance
  const pLight = new THREE.PointLight(color, 1.2, 5);
  pLight.position.y = 0.2;
  group.add(pLight);

  group.userData = { isMovable: true, label: 'Алхимическое зелье', light: pLight, baseIntensity: 1.2, timeOffset: Math.random() * 5 };
  return group;
}

// 43. Gothic Bone / Crystal Skull Prop
export function createSkullProp(x, y, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;

  // Cranium
  const craniumGeo = new THREE.SphereGeometry(0.16, 12, 10);
  craniumGeo.scale(1.0, 1.1, 1.25);
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xdfd8c8, roughness: 0.5 });
  const cranium = new THREE.Mesh(craniumGeo, boneMat);
  cranium.position.y = 0.2;
  group.add(cranium);

  // Jaw
  const jawGeo = new THREE.BoxGeometry(0.12, 0.08, 0.14);
  const jaw = new THREE.Mesh(jawGeo, boneMat);
  jaw.position.set(0, 0.08, 0.08);
  group.add(jaw);

  // Glowing eye sockets
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xbd93f9 });
  const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
  for (const ex of [-0.05, 0.05]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(ex, 0.2, 0.18);
    group.add(eye);
  }

  group.userData = { isMovable: true, label: 'Череп' };
  return group;
}

// 44. Faceted Mana Crystal Cluster Prop
export function createCrystalProp(x, y, z, color = 0xbd93f9) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Brass stand
  const standGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.06, 8);
  const standMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 });
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = 0.03;
  group.add(stand);

  // Crystal
  const crystalGeo = new THREE.OctahedronGeometry(0.18, 0);
  crystalGeo.scale(0.8, 1.5, 0.8);
  const crystalMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.2, metalness: 0.7 });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 0.24;
  group.add(crystal);

  const cLight = new THREE.PointLight(color, 1.2, 6);
  cLight.position.y = 0.24;
  group.add(cLight);

  group.userData = { isMovable: true, label: 'Кристалл', light: cLight, baseIntensity: 1.2, timeOffset: Math.random() * 5 };
  return group;
}

// 45. Triple Gothic Table Candelabra Prop
export function createCandelabraProp(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.75 });
  const stemGeo = new THREE.CylinderGeometry(0.03, 0.08, 0.45, 8);
  const stem = new THREE.Mesh(stemGeo, brassMat);
  stem.position.y = 0.22;
  group.add(stem);

  // 3 branches
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xfffbee, roughness: 0.8 });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
  const candleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6);
  const flameGeo = new THREE.ConeGeometry(0.02, 0.05, 6);

  for (const ox of [-0.14, 0, 0.14]) {
    const candle = new THREE.Mesh(candleGeo, waxMat);
    candle.position.set(ox, 0.48, 0);
    group.add(candle);

    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(ox, 0.59, 0);
    group.add(flame);
  }

  const light = new THREE.PointLight(0xffdf88, 1.8, 10, 1.4);
  light.position.set(0, 0.6, 0);
  group.add(light);

  group.userData = { isMovable: true, label: 'Канделябр', light, baseIntensity: 1.8, timeOffset: Math.random() * 10 };
  return group;
}

// 46. Cast-iron Witch Cauldron
export function createCauldron(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f1b26, roughness: 0.7, metalness: 0.8 });
  const potGeo = new THREE.SphereGeometry(0.42, 12, 10);
  potGeo.scale(1.2, 0.8, 1.2);
  const pot = new THREE.Mesh(potGeo, ironMat);
  pot.position.y = 0.35;
  group.add(pot);

  const brewGeo = new THREE.CircleGeometry(0.38, 12);
  const brewMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b });
  const brew = new THREE.Mesh(brewGeo, brewMat);
  brew.rotation.x = -Math.PI / 2;
  brew.position.y = 0.52;
  group.add(brew);

  const pLight = new THREE.PointLight(0x50fa7b, 1.5, 6);
  pLight.position.y = 0.6;
  group.add(pLight);

  group.userData = { light: pLight, baseIntensity: 1.5, timeOffset: Math.random() * 10 };
  return group;
}
