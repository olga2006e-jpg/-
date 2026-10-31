import * as THREE from 'three';

// Shared Bauman GZ Classical Materials
const baumanMarbleColumnMat = new THREE.MeshStandardMaterial({
  color: 0xf5efe6,
  roughness: 0.35,
  metalness: 0.05
});

const baumanGoldCapitalMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.3,
  metalness: 0.7
});

const darkWoodDoorMat = new THREE.MeshStandardMaterial({
  color: 0x422a1d,
  roughness: 0.6
});

const brassMetalMat = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.3,
  metalness: 0.8
});

const blackboardMat = new THREE.MeshStandardMaterial({
  color: 0x1e2820,
  roughness: 0.9
});

const pumpkinSkinMaterial = new THREE.MeshStandardMaterial({
  color: 0xd95b00,
  roughness: 0.5
});

const stemMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d4a26,
  roughness: 0.8
});

// Create text sprite for nametags and classroom signs
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

// 1. Halloween Jack-o-Lantern Pumpkin
export function createPumpkin(x, y, z, glowing = true) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 10);
  bodyGeo.scale(1.2, 0.9, 1.2);
  const body = new THREE.Mesh(bodyGeo, pumpkinSkinMaterial);
  body.castShadow = true;
  group.add(body);

  const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 6);
  const stem = new THREE.Mesh(stemGeo, stemMaterial);
  stem.position.set(0, 0.45, 0);
  stem.rotation.z = 0.2;
  group.add(stem);

  if (glowing) {
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.2, 0.1, 0.55);
    eyeLeft.rotation.z = 0.3;
    group.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.2, 0.1, 0.55);
    eyeRight.rotation.z = -0.3;
    group.add(eyeRight);

    const pLight = new THREE.PointLight(0xff8800, 1.4, 7, 1.8);
    pLight.position.set(0, 0.25, 0.3);
    group.add(pLight);
  }

  return group;
}

// 2. Brass Wall Sconce Lantern (Bauman Classic Chandelier/Sconce)
export function createTorch(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Brass bracket
  const bracketGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
  const bracket = new THREE.Mesh(bracketGeo, brassMetalMat);
  bracket.rotation.x = Math.PI / 4;
  group.add(bracket);

  // Glass lantern lantern
  const glassGeo = new THREE.OctahedronGeometry(0.22, 0);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 0.35, 0.2);
  group.add(glass);

  // Bright warm white/amber sconce light
  const light = new THREE.PointLight(0xffdf99, 2.0, 16, 1.2);
  light.position.set(0, 0.4, 0.25);
  group.add(light);

  group.userData = { light, baseIntensity: 2.0, timeOffset: Math.random() * 10 };
  return group;
}

// 3. Monumental Bauman White Marble Column
export function createPillar(x, y, z, height = 6) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Column shaft with subtle fluting
  const colGeo = new THREE.CylinderGeometry(0.55, 0.65, height, 16);
  const col = new THREE.Mesh(colGeo, baumanMarbleColumnMat);
  col.castShadow = true;
  col.receiveShadow = true;
  group.add(col);

  // Classical Capital (Top)
  const capGeo = new THREE.BoxGeometry(1.6, 0.45, 1.6);
  const topCap = new THREE.Mesh(capGeo, baumanGoldCapitalMat);
  topCap.position.y = height / 2;
  group.add(topCap);

  // Base (Bottom)
  const btmCap = new THREE.Mesh(capGeo, baumanMarbleColumnMat);
  btmCap.position.y = -height / 2;
  group.add(btmCap);

  return group;
}

// 4. Bauman Memorial Plaque / Door with Sign
export function createTombstone(x, y, z, label = 'Кафедра') {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Wooden door frame
  const doorGeo = new THREE.BoxGeometry(1.4, 2.6, 0.15);
  const door = new THREE.Mesh(doorGeo, darkWoodDoorMat);
  door.castShadow = true;
  group.add(door);

  // Brass Door plaque
  const plaque = createNameTag(label, '#ffd700', 'rgba(20, 15, 10, 0.9)');
  plaque.position.set(0, 0.5, 0.12);
  plaque.scale.set(1.5, 0.35, 1);
  group.add(plaque);

  return group;
}

// 5. Astronomical Telescope (Einstein Observatory)
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

// 6. Ancient Obelisk (History Museum)
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

// 7. Bookshelf / Library Stack
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

// 8. Server Rack / Network Router (Kanev IU-5 Lab)
export function createCauldron(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // 19" Server rack cabinet
  const rackGeo = new THREE.BoxGeometry(1.2, 2.2, 1.0);
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x22242b, roughness: 0.4, metalness: 0.8 });
  const rack = new THREE.Mesh(rackGeo, rackMat);
  rack.position.y = 1.1;
  group.add(rack);

  // Blinking green/cyan switch LEDs
  for (let i = 0; i < 4; i++) {
    const ledGeo = new THREE.BoxGeometry(0.9, 0.1, 0.05);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0.5 + i * 0.35, 0.52);
    group.add(led);
  }

  // Cyan server glow light
  const cLight = new THREE.PointLight(0x8be9fd, 1.8, 8);
  cLight.position.set(0, 1.2, 0.8);
  group.add(cLight);

  return group;
}

// 9. Bauman Marble & Granite Floor Tiles (High visibility!)
export function createFloorTile(x, y, z, width, depth, zoneType) {
  // Noble classical Bauman GZ palette: light cream, sand and granite
  let floorColor = 0xd5cfc5;
  if (zoneType === 'circus') floorColor = 0xe8e2d8;     // Polished marble in Circus
  if (zoneType === 'math_hall') floorColor = 0xe0d7cc;  // FN math auditorium
  if (zoneType === 'dev_lab') floorColor = 0xd2dbe3;    // IU5 computer lab
  if (zoneType === 'algo_class') floorColor = 0xd6e2d5; // Physics / photonics lab
  if (zoneType === 'crypt') floorColor = 0xdcd5c9;

  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.4,  // Polished stone reflection
    metalness: 0.08
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

// 10. Student Avatar with Nametag
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

// 11. Ghost NPC with specific BMSTU academic props
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
    const boardGeo = new THREE.BoxGeometry(0.6, 0.4, 0.05);
    const board = new THREE.Mesh(boardGeo, blackboardMat);
    board.position.set(0.45, 0.7, 0.2);
    group.add(board);

    const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 24);
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
