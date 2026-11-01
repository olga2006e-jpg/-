/**
 * KonstantinNPC — процедурная Three.js 3D-модель Константина Юрьевича
 * Полный рост: голова, шея, торс, руки, кисти, ноги, обувь
 * Стиль: стройный молодой мужчина, тёмные волосы набок, синее поло в полоску
 *
 * Использование:
 *   import { KonstantinNPC } from './characters/konstantinNPC.js';
 *   const npc = new KonstantinNPC(scene);
 *   npc.group.position.set(0, 0, 8);
 *   // в цикле анимации:
 *   npc.update(delta);
 */

import * as THREE from 'three';

// ── Палитра цветов ──────────────────────────────────────────────────────────
const C = {
  skin:       0xf5cba7,   // светлая кожа
  skinDark:   0xe8b896,   // тень на коже
  hair:       0x2c1810,   // тёмно-коричневые волосы
  poloBase:   0x1a2744,   // тёмно-синяя основа поло
  poloStripe: 0x8aafd4,   // светло-синие полоски
  poloButton: 0xd0d8e8,   // пуговицы на воротнике
  collar:     0x162038,   // воротник-поло (чуть темнее)
  pants:      0x1a1a2e,   // тёмные брюки
  shoe:       0x111111,   // чёрная обувь
  shoeSole:   0x333333,   // подошва
  eyeWhite:   0xffffff,
  eyeIris:    0x3a2010,   // карие глаза
  eyePupil:   0x080808,
  brow:       0x2c1810,
  lip:        0xc08070,
};

// ── Вспомогательные функции ─────────────────────────────────────────────────
function mat(color, rough = 0.8, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

function box(w, h, d, color, rough) {
  const g = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(g, mat(color, rough));
}

function sphere(r, color, rough, wx = 1, wy = 1, wz = 1) {
  const g = new THREE.SphereGeometry(r, 16, 12);
  const m = new THREE.Mesh(g, mat(color, rough));
  m.scale.set(wx, wy, wz);
  return m;
}

function cyl(rTop, rBot, h, color, rough, segs = 12) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, segs);
  return new THREE.Mesh(g, mat(color, rough));
}

// ── Генерация текстуры полосок поло ─────────────────────────────────────────
function makeStripeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Тёмно-синий фон
  ctx.fillStyle = '#1a2744';
  ctx.fillRect(0, 0, 64, 256);

  // Светло-голубые горизонтальные полоски
  ctx.fillStyle = '#7aa8cc';
  const stripeH = 10, gap = 18;
  for (let y = 4; y < 256; y += gap) {
    ctx.fillRect(0, y, 64, stripeH);
  }

  // Тонкие белые линии
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let y = 4; y < 256; y += gap) {
    ctx.fillRect(0, y + 1, 64, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

// ── Основной класс ──────────────────────────────────────────────────────────
export class KonstantinNPC {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'KonstantinNPC';

    this._t = 0;                  // таймер анимации
    this._eyeL = null;
    this._eyeR = null;
    this._head = null;
    this._leftArm = null;
    this._rightArm = null;
    this._leftForearm = null;
    this._rightForearm = null;
    this._leftLeg = null;
    this._rightLeg = null;
    this._leftShin = null;
    this._rightShin = null;
    this._torso = null;
    this._bodyGroup = null;       // для анимации дыхания

    this._build();

    if (scene) scene.add(this.group);
  }

  // ── Построение модели ────────────────────────────────────────────────────
  _build() {
    const g = this.group;

    // Вся модель ~1.78 м: нижняя точка Y=0 (пол), верхняя ~1.78
    // Ноги: 0 → 0.90
    // Торс: 0.90 → 1.35
    // Голова: 1.43 → 1.78

    // ── ТЕЛО (группа для дыхания) ──────────────────────────────────────────
    this._bodyGroup = new THREE.Group();
    g.add(this._bodyGroup);

    // ── ОБУВЬ ──────────────────────────────────────────────────────────────
    this._buildShoes();

    // ── НОГИ ───────────────────────────────────────────────────────────────
    this._buildLegs();

    // ── ТОРС ───────────────────────────────────────────────────────────────
    this._buildTorso();

    // ── ШЕЯ ────────────────────────────────────────────────────────────────
    this._buildNeck();

    // ── ГОЛОВА ─────────────────────────────────────────────────────────────
    this._buildHead();

    // Сдвигаем всю модель чуть вверх чтобы ноги стояли на земле
    g.position.y = 0;
  }

  _buildShoes() {
    // Левый ботинок
    const shoeL = new THREE.Group();
    const soleL = box(0.14, 0.035, 0.30, C.shoeSole, 0.9);
    soleL.position.set(0, 0.0175, 0.025);
    const upperL = box(0.12, 0.07, 0.25, C.shoe, 0.9);
    upperL.position.set(0, 0.07, 0.010);
    // Носок
    const toeL = sphere(0.07, C.shoe, 0.9, 1.0, 0.55, 1.3);
    toeL.position.set(0, 0.055, 0.125);
    shoeL.add(soleL, upperL, toeL);
    shoeL.position.set(-0.105, 0, 0);
    this._bodyGroup.add(shoeL);

    // Правый ботинок
    const shoeR = shoeL.clone();
    shoeR.position.set(0.105, 0, 0);
    this._bodyGroup.add(shoeR);
  }

  _buildLegs() {
    const stripeTex = null; // брюки без текстуры

    // ── Бёдра (верхняя часть ноги) ──
    // Левое бедро
    const thighL = new THREE.Group();
    const thighMeshL = cyl(0.085, 0.075, 0.48, C.pants, 0.85);
    thighMeshL.position.y = 0.24;
    thighL.add(thighMeshL);
    thighL.position.set(-0.105, 0.52, 0);
    this._bodyGroup.add(thighL);
    this._leftLeg = thighL;

    // Правое бедро
    const thighR = new THREE.Group();
    const thighMeshR = cyl(0.085, 0.075, 0.48, C.pants, 0.85);
    thighMeshR.position.y = 0.24;
    thighR.add(thighMeshR);
    thighR.position.set(0.105, 0.52, 0);
    this._bodyGroup.add(thighR);
    this._rightLeg = thighR;

    // ── Голени ──
    const shinL = new THREE.Group();
    const shinMeshL = cyl(0.07, 0.055, 0.44, C.pants, 0.85);
    shinMeshL.position.y = 0.22;
    shinL.add(shinMeshL);
    shinL.position.set(-0.105, 0.07, 0);
    this._bodyGroup.add(shinL);
    this._leftShin = shinL;

    const shinR = new THREE.Group();
    const shinMeshR = cyl(0.07, 0.055, 0.44, C.pants, 0.85);
    shinMeshR.position.y = 0.22;
    shinR.add(shinMeshR);
    shinR.position.set(0.105, 0.07, 0);
    this._bodyGroup.add(shinR);
    this._rightShin = shinR;

    // ── Пах / низ торса (соединение) ──
    const crotch = box(0.24, 0.06, 0.17, C.pants, 0.85);
    crotch.position.set(0, 0.52, 0);
    this._bodyGroup.add(crotch);
  }

  _buildTorso() {
    // Брюки — верхняя часть (на уровне пояса)
    const waistBelt = box(0.27, 0.04, 0.18, 0x111122, 0.9);
    waistBelt.position.set(0, 0.91, 0);
    this._bodyGroup.add(waistBelt);

    // ── Торс (поло) ──
    // Рисуем торс через CylinderGeometry (слегка конический)
    const torsoMat = new THREE.MeshStandardMaterial({
      map: makeStripeTexture(),
      roughness: 0.85,
    });

    // Основной торс
    const torsoGeo = new THREE.CylinderGeometry(0.175, 0.165, 0.46, 14);
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.set(0, 1.16, 0);
    this._bodyGroup.add(torsoMesh);
    this._torso = torsoMesh;

    // Плечи (шире торса)
    const shoulderL = sphere(0.095, C.poloBase, 0.8, 1.1, 0.9, 1.0);
    shoulderL.position.set(-0.215, 1.35, 0);
    this._bodyGroup.add(shoulderL);

    const shoulderR = sphere(0.095, C.poloBase, 0.8, 1.1, 0.9, 1.0);
    shoulderR.position.set(0.215, 1.35, 0);
    this._bodyGroup.add(shoulderR);

    // ── РУКИ ──
    this._buildArms();

    // ── Низ поло (небольшой выступ вниз) ──
    const shirtBottom = cyl(0.168, 0.17, 0.05, C.poloBase, 0.85);
    shirtBottom.position.set(0, 0.925, 0);
    this._bodyGroup.add(shirtBottom);
  }

  _buildArms() {
    // ── Левая рука ──
    const armLGroup = new THREE.Group();
    armLGroup.position.set(-0.215, 1.35, 0);

    // Плечо / верхняя часть (короткий рукав поло)
    const upperArmL = cyl(0.065, 0.06, 0.155, C.poloBase, 0.85);
    upperArmL.position.set(0, -0.077, 0);
    upperArmL.rotation.z = 0.18; // небольшой наклон
    armLGroup.add(upperArmL);

    // Кожа — предплечье
    const foreArmL = cyl(0.052, 0.042, 0.26, C.skin, 0.75);
    foreArmL.position.set(-0.03, -0.265, 0);
    armLGroup.add(foreArmL);
    this._leftForearm = foreArmL;

    // Кисть левая
    const handL = this._makeHand('L');
    handL.position.set(-0.045, -0.42, 0);
    armLGroup.add(handL);

    this._bodyGroup.add(armLGroup);
    this._leftArm = armLGroup;

    // ── Правая рука ──
    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.215, 1.35, 0);

    const upperArmR = cyl(0.065, 0.06, 0.155, C.poloBase, 0.85);
    upperArmR.position.set(0, -0.077, 0);
    upperArmR.rotation.z = -0.18;
    armRGroup.add(upperArmR);

    const foreArmR = cyl(0.052, 0.042, 0.26, C.skin, 0.75);
    foreArmR.position.set(0.03, -0.265, 0);
    armRGroup.add(foreArmR);
    this._rightForearm = foreArmR;

    const handR = this._makeHand('R');
    handR.position.set(0.045, -0.42, 0);
    armRGroup.add(handR);

    this._bodyGroup.add(armRGroup);
    this._rightArm = armRGroup;
  }

  _makeHand(side) {
    const g = new THREE.Group();
    // Ладонь
    const palm = box(0.085, 0.095, 0.04, C.skin, 0.75);
    palm.position.y = -0.047;
    g.add(palm);

    // 4 пальца + большой
    const fingerPositions = [-0.030, -0.010, 0.010, 0.030];
    fingerPositions.forEach((x, i) => {
      const seg1 = cyl(0.008, 0.009, 0.045, C.skin, 0.75);
      seg1.position.set(x, -0.115, 0);
      g.add(seg1);
      const seg2 = cyl(0.007, 0.008, 0.035, C.skinDark, 0.8);
      seg2.position.set(x, -0.152, 0);
      g.add(seg2);
    });

    // Большой палец (сбоку)
    const thumb = cyl(0.009, 0.010, 0.040, C.skin, 0.75);
    thumb.position.set(side === 'L' ? -0.050 : 0.050, -0.070, 0.005);
    thumb.rotation.z = side === 'L' ? -0.6 : 0.6;
    g.add(thumb);

    return g;
  }

  _buildNeck() {
    const neck = cyl(0.055, 0.065, 0.10, C.skin, 0.7);
    neck.position.set(0, 1.42, 0);
    this._bodyGroup.add(neck);
  }

  _buildHead() {
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.58, 0);
    this._head = headGroup;

    // ── Основа головы (слегка вытянутый овал) ──
    const skull = sphere(0.155, C.skin, 0.7, 1.0, 1.08, 0.95);
    headGroup.add(skull);

    // ── Подбородок (заострённый) ──
    const chin = sphere(0.08, C.skin, 0.7, 0.7, 0.55, 0.75);
    chin.position.set(0, -0.115, 0.04);
    headGroup.add(chin);

    // ── Скулы ──
    const cheekL = sphere(0.07, C.skinDark, 0.75, 1.1, 0.8, 0.85);
    cheekL.position.set(-0.095, -0.02, 0.09);
    headGroup.add(cheekL);
    const cheekR = cheekL.clone();
    cheekR.position.x = 0.095;
    headGroup.add(cheekR);

    // ── Нос ──
    const noseBase = sphere(0.028, C.skinDark, 0.75, 1.0, 0.8, 1.2);
    noseBase.position.set(0, -0.005, 0.145);
    headGroup.add(noseBase);
    const noseTip = sphere(0.022, C.skin, 0.75);
    noseTip.position.set(0, -0.022, 0.162);
    headGroup.add(noseTip);
    const nostrilL = sphere(0.012, C.skinDark, 0.8);
    nostrilL.position.set(-0.020, -0.025, 0.155);
    headGroup.add(nostrilL);
    const nostrilR = nostrilL.clone();
    nostrilR.position.x = 0.020;
    headGroup.add(nostrilR);

    // ── Рот ──
    const mouth = box(0.06, 0.012, 0.01, C.lip, 0.9);
    mouth.position.set(0, -0.070, 0.148);
    headGroup.add(mouth);
    // Нижняя губа
    const lipLower = sphere(0.025, C.lip, 0.8, 1.2, 0.55, 0.8);
    lipLower.position.set(0, -0.080, 0.147);
    headGroup.add(lipLower);

    // ── Уши ──
    const earL = sphere(0.032, C.skinDark, 0.8, 0.55, 0.85, 0.45);
    earL.position.set(-0.155, 0.005, 0);
    headGroup.add(earL);
    const earR = earL.clone();
    earR.position.x = 0.155;
    headGroup.add(earR);

    // ── Глаза ──
    this._buildEyes(headGroup);

    // ── Брови ──
    this._buildBrows(headGroup);

    // ── Волосы ──
    this._buildHair(headGroup);

    // ── Воротник-поло ──
    this._buildCollar();

    this._bodyGroup.add(headGroup);
  }

  _buildEyes(parent) {
    const buildEye = (side) => {
      const g = new THREE.Group();
      const x = side === 'L' ? -0.052 : 0.052;

      // Глазное яблоко
      const white = sphere(0.033, C.eyeWhite, 0.3, 1.0, 0.9, 0.7);
      g.add(white);

      // Радужка
      const iris = sphere(0.022, C.eyeIris, 0.2, 1.0, 0.9, 0.4);
      iris.position.z = 0.016;
      g.add(iris);

      // Зрачок
      const pupil = sphere(0.012, C.eyePupil, 0.1, 1.0, 0.9, 0.4);
      pupil.position.z = 0.020;
      g.add(pupil);

      // Блик
      const glint = sphere(0.006, 0xffffff, 0.0, 1.0, 1.0, 0.4);
      glint.position.set(0.006, 0.006, 0.024);
      g.add(glint);

      // Верхнее веко (тёмная полоска)
      const lid = box(0.07, 0.010, 0.005, 0x3a2010, 0.9);
      lid.position.set(0, 0.022, 0.025);
      g.add(lid);

      g.position.set(x, 0.03, 0.135);
      g.rotation.y = side === 'L' ? -0.12 : 0.12;

      parent.add(g);
      return g;
    };

    this._eyeL = buildEye('L');
    this._eyeR = buildEye('R');
  }

  _buildBrows(parent) {
    // Левая бровь — изогнутая
    for (let i = 0; i < 5; i++) {
      const seg = box(0.016, 0.008, 0.005, C.brow, 0.85);
      const angle = (i - 2) * 0.12;
      seg.position.set(
        -0.05 + i * 0.014,
        0.072 + Math.abs(i - 2) * 0.003,
        0.140 + Math.abs(i - 2) * 0.002
      );
      seg.rotation.z = angle * 0.2;
      parent.add(seg);
    }
    // Правая бровь
    for (let i = 0; i < 5; i++) {
      const seg = box(0.016, 0.008, 0.005, C.brow, 0.85);
      seg.position.set(
        0.018 + i * 0.014,
        0.072 + Math.abs(i - 2) * 0.003,
        0.140 + Math.abs(i - 2) * 0.002
      );
      parent.add(seg);
    }
  }

  _buildHair(parent) {
    // ── Основная масса волос ──
    // Верх головы — тёмная шапка
    const topHair = sphere(0.155, C.hair, 0.9, 1.02, 0.65, 0.98);
    topHair.position.set(0, 0.095, -0.01);
    parent.add(topHair);

    // Лоб — зачёс вправо (несколько прядей)
    const strandData = [
      // [x, y, z, rotZ, scaleX, scaleY, scaleZ]
      [0.02, 0.155, 0.07,  0.3, 1.8, 0.6, 1.2],
      [0.05, 0.152, 0.09,  0.5, 1.5, 0.55, 1.0],
      [0.08, 0.145, 0.095, 0.7, 1.3, 0.5, 0.9],
      [-0.01, 0.15, 0.08, 0.1, 1.4, 0.55, 1.1],
    ];
    strandData.forEach(([x, y, z, rz, sx, sy, sz]) => {
      const strand = sphere(0.04, C.hair, 0.9, sx, sy, sz);
      strand.position.set(x, y, z);
      strand.rotation.z = rz;
      parent.add(strand);
    });

    // Виски — чуть короче
    const templeL = sphere(0.05, C.hair, 0.9, 0.6, 0.85, 0.7);
    templeL.position.set(-0.135, 0.06, 0.06);
    parent.add(templeL);

    const templeR = sphere(0.05, C.hair, 0.9, 0.6, 0.85, 0.7);
    templeR.position.set(0.135, 0.06, 0.06);
    parent.add(templeR);

    // Затылок
    const back = sphere(0.145, C.hair, 0.9, 1.0, 0.7, 1.0);
    back.position.set(0, 0.03, -0.11);
    parent.add(back);
  }

  _buildCollar() {
    // Воротник-поло прямо над торсом
    const collar = new THREE.Group();
    collar.position.set(0, 1.43, 0);
    this._bodyGroup.add(collar);

    // Основа воротника (трубка)
    const collarRing = cyl(0.072, 0.07, 0.06, C.collar, 0.85, 10);
    collarRing.position.y = 0.01;
    collar.add(collarRing);

    // Отворот воротника (два "лепестка")
    const flapL = box(0.055, 0.045, 0.015, C.collar, 0.85);
    flapL.position.set(-0.028, 0.04, 0.060);
    flapL.rotation.z = 0.25;
    flapL.rotation.y = 0.2;
    collar.add(flapL);

    const flapR = box(0.055, 0.045, 0.015, C.collar, 0.85);
    flapR.position.set(0.028, 0.04, 0.060);
    flapR.rotation.z = -0.25;
    flapR.rotation.y = -0.2;
    collar.add(flapR);

    // Пуговица
    const btn = sphere(0.008, C.poloButton, 0.4);
    btn.position.set(0, 0.005, 0.068);
    collar.add(btn);
  }

  // ── Анимация ─────────────────────────────────────────────────────────────
  update(delta, playerPosition = null) {
    this._t += delta;
    const t = this._t;

    // Дыхание — лёгкое масштабирование торса
    if (this._torso) {
      this._torso.scale.x = 1 + Math.sin(t * 1.1) * 0.012;
      this._torso.scale.z = 1 + Math.sin(t * 1.1) * 0.014;
    }

    // Лёгкое покачивание всей модели (idle swaying)
    this._bodyGroup.rotation.y = Math.sin(t * 0.6) * 0.04;
    this._bodyGroup.position.y = Math.sin(t * 0.9) * 0.008;

    // Руки — лёгкое движение в такт дыханию
    if (this._leftArm) {
      this._leftArm.rotation.z = 0.18 + Math.sin(t * 0.9) * 0.03;
    }
    if (this._rightArm) {
      this._rightArm.rotation.z = -0.18 - Math.sin(t * 0.9) * 0.03;
    }

    // Голова — поворот к игроку (если передана позиция)
    if (this._head && playerPosition) {
      const worldPos = new THREE.Vector3();
      this.group.getWorldPosition(worldPos);
      const dir = new THREE.Vector3()
        .subVectors(playerPosition, worldPos)
        .normalize();

      const targetYaw = Math.atan2(dir.x, dir.z);
      const currentYaw = this._head.rotation.y;
      // Плавный поворот, ограниченный ±60°
      const clampedYaw = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetYaw));
      this._head.rotation.y += (clampedYaw - currentYaw) * Math.min(delta * 2.5, 1);

      // Слабое подёргивание головы (idle)
      this._head.rotation.y += Math.sin(t * 0.7) * 0.005;
    } else if (this._head) {
      // Без игрока — лёгкий наклон головы
      this._head.rotation.y = Math.sin(t * 0.5) * 0.08;
      this._head.rotation.x = Math.sin(t * 0.4) * 0.04;
    }
  }

  // ── Утилиты ───────────────────────────────────────────────────────────────

  /** Устанавливает позицию в сцене */
  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    return this;
  }

  /** Поворот вокруг Y */
  setRotationY(rad) {
    this.group.rotation.y = rad;
    return this;
  }

  /** Удаляет из сцены */
  dispose() {
    if (this.scene) this.scene.remove(this.group);
  }
}
