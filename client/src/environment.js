import * as THREE from 'three';

// Shared materials and geometries for performance
const stoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2836,
  roughness: 0.85,
  metalness: 0.15
});

const pumpkinSkinMaterial = new THREE.MeshStandardMaterial({
  color: 0xd95b00,
  roughness: 0.6
});

const stemMaterial = new THREE.MeshStandardMaterial({
  color: 0x3d4a26,
  roughness: 0.9
});

const glowingMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa00
});

// Create text sprite for nametags
export function createNameTag(text, colorHex = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(10, 8, 20, 0.75)';
  ctx.roundRect(10, 10, 236, 44, 8);
  ctx.fill();

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(2.2, 0.55, 1);
  return sprite;
}

// 1. Halloween Jack-o-Lantern Pumpkin
export function createPumpkin(x, y, z, glowing = true) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Pumpkin body (squashed sphere)
  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 10);
  bodyGeo.scale(1.2, 0.9, 1.2);
  const body = new THREE.Mesh(bodyGeo, pumpkinSkinMaterial);
  body.castShadow = true;
  group.add(body);

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 6);
  const stem = new THREE.Mesh(stemGeo, stemMaterial);
  stem.position.set(0, 0.45, 0);
  stem.rotation.z = 0.2;
  group.add(stem);

  if (glowing) {
    // Carved eye slits
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.12, 0.05);
    const eyeLeft = new THREE.Mesh(eyeGeo, glowingMaterial);
    eyeLeft.position.set(-0.2, 0.1, 0.55);
    eyeLeft.rotation.z = 0.3;
    group.add(eyeLeft);

    const eyeRight = new THREE.Mesh(eyeGeo, glowingMaterial);
    eyeRight.position.set(0.2, 0.1, 0.55);
    eyeRight.rotation.z = -0.3;
    group.add(eyeRight);

    // Light inside pumpkin
    const pLight = new THREE.PointLight(0xff7700, 1.2, 6, 2);
    pLight.position.set(0, 0.2, 0.3);
    group.add(pLight);
  }

  return group;
}

// 2. Gothic Wall Torch
export function createTorch(x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Wooden stick
  const stickGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 6);
  const stickMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18 });
  const stick = new THREE.Mesh(stickGeo, stickMat);
  stick.rotation.x = Math.PI / 6;
  group.add(stick);

  // Flame
  const flameGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.set(0, 0.4, 0.15);
  group.add(flame);

  // Flickering point light
  const light = new THREE.PointLight(0xff8822, 1.8, 12, 1.5);
  light.position.set(0, 0.45, 0.2);
  group.add(light);

  group.userData = { light, baseIntensity: 1.8, timeOffset: Math.random() * 10 };
  return group;
}

// 3. Gothic Stone Pillar
export function createPillar(x, y, z, height = 6) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const colGeo = new THREE.CylinderGeometry(0.55, 0.65, height, 8);
  const col = new THREE.Mesh(colGeo, stoneMaterial);
  col.castShadow = true;
  col.receiveShadow = true;
  group.add(col);

  // Base capital
  const capGeo = new THREE.BoxGeometry(1.6, 0.4, 1.6);
  const topCap = new THREE.Mesh(capGeo, stoneMaterial);
  topCap.position.y = height / 2;
  group.add(topCap);

  const btmCap = new THREE.Mesh(capGeo, stoneMaterial);
  btmCap.position.y = -height / 2;
  group.add(btmCap);

  return group;
}

// 4. Tombstone
export function createTombstone(x, y, z, label = 'RIP') {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const stoneGeo = new THREE.BoxGeometry(1.0, 1.5, 0.3);
  const stone = new THREE.Mesh(stoneGeo, stoneMaterial);
  stone.castShadow = true;
  group.add(stone);

  const tag = createNameTag(label, '#a09cb0');
  tag.position.set(0, 1.1, 0);
  tag.scale.set(1.5, 0.4, 1);
  group.add(tag);

  return group;
}

// 5. Floor Tile
export function createFloorTile(x, y, z, width, depth, zoneType) {
  let floorColor = 0x161324;
  if (zoneType === 'observatory') floorColor = 0x121c2b;
  if (zoneType === 'crypt') floorColor = 0x241d13;
  if (zoneType === 'lab') floorColor = 0x12241b;

  const geo = new THREE.PlaneGeometry(width, depth);
  const mat = new THREE.MeshStandardMaterial({
    color: floorColor,
    roughness: 0.9,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  return mesh;
}

// 6. Other Player Avatar (Floating Hooded Ghost with Nametag)
export function createPlayerAvatar(username, colorHex = '#ff79c6') {
  const group = new THREE.Group();

  const color = new THREE.Color(colorHex);

  // Translucent ghostly cloak
  const ghostMat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.75,
    roughness: 0.3
  });

  // Ghost Head
  const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const head = new THREE.Mesh(headGeo, ghostMat);
  head.position.y = 0.9;
  group.add(head);

  // Glowing eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.92, 0.28);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.12, 0.92, 0.28);
  group.add(eyeL);
  group.add(eyeR);

  // Ghost Body / Tail
  const bodyGeo = new THREE.ConeGeometry(0.45, 1.1, 16);
  const body = new THREE.Mesh(bodyGeo, ghostMat);
  body.position.y = 0.3;
  body.rotation.x = Math.PI;
  group.add(body);

  // Floating nametag
  const nametag = createNameTag(username, colorHex);
  nametag.position.y = 1.6;
  group.add(nametag);

  // Ghostly aura point light
  const aura = new THREE.PointLight(color, 0.8, 4);
  aura.position.y = 0.8;
  group.add(aura);

  group.userData = {
    username,
    targetPos: new THREE.Vector3(),
    targetRotY: 0,
    timeOffset: Math.random() * 10
  };

  return group;
}

// 7. Ghost NPC (Einstein, Herodotus, Curie)
export function createGhostNPC(npcData) {
  const group = new THREE.Group();
  group.position.set(npcData.x, npcData.y, npcData.z);

  const auraColor = new THREE.Color(npcData.color);

  const npcMat = new THREE.MeshStandardMaterial({
    color: auraColor,
    emissive: auraColor,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.8,
    roughness: 0.2
  });

  // Head
  const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
  const head = new THREE.Mesh(headGeo, npcMat);
  head.position.y = 1.0;
  group.add(head);

  // Body
  const bodyGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.2, 16);
  const body = new THREE.Mesh(bodyGeo, npcMat);
  body.position.y = 0.4;
  group.add(body);

  // Special visual distinction
  if (npcData.id === 'einstein') {
    // Wild hair aura
    const hairGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      wireframe: true
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.1;
    group.add(hair);
  } else if (npcData.id === 'herodotus') {
    // Ancient scroll in hand
    const scrollGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0xeedda2 });
    const scroll = new THREE.Mesh(scrollGeo, scrollMat);
    scroll.position.set(0.4, 0.5, 0.3);
    scroll.rotation.z = Math.PI / 4;
    group.add(scroll);
  } else if (npcData.id === 'curie') {
    // Radioactive flask
    const flaskGeo = new THREE.OctahedronGeometry(0.2, 0);
    const flaskMat = new THREE.MeshBasicMaterial({ color: 0x50fa7b });
    const flask = new THREE.Mesh(flaskGeo, flaskMat);
    flask.position.set(0.4, 0.5, 0.3);
    group.add(flask);
  }

  // Floating Name / Role badge
  const nametag = createNameTag(npcData.name, npcData.color);
  nametag.position.y = 1.8;
  group.add(nametag);

  // Point light
  const light = new THREE.PointLight(auraColor, 1.5, 8);
  light.position.y = 1.0;
  group.add(light);

  group.userData = {
    npcData,
    baseY: npcData.y,
    timeOffset: Math.random() * 10
  };

  return group;
}
