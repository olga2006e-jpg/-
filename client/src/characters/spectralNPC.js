/**
 * SpectralProfessorNPC — Процедурный спектральный призрак преподавателя
 * Идеально подходит под мистический лор «Ночи в Бауманке» (Haunted Academy):
 * - Полупрозрачное светящееся тело (эмиссионный шейдер)
 * - Парящая мантия / силуэт с волнообразной анимацией подола
 * - Светящиеся спектральные глаза
 * - Парящие вокруг магические глифы/формулы и частицы
 * - Плавная левитация по высоте
 */

import * as THREE from 'three';

const PROF_THEMES = {
  kanev: {
    name: 'Призрак Канева А.И.',
    auraColor: 0x38bdf8,      // Неоновый синий (сети/ОС)
    coreColor: 0x0284c7,
    eyeColor: 0xbae6fd,
    symbol: '⚡',
    itemType: 'packet'        // Парящий дата-пакет/куб
  },
  korshunov: {
    name: 'Призрак Коршунова В.М.',
    auraColor: 0xfbbf24,      // Тёплый янтарный (бар/эрудиция)
    coreColor: 0xd97706,
    eyeColor: 0xfef08a,
    symbol: '🍺',
    itemType: 'mug'
  },
  maslennikov: {
    name: 'Призрак Масленникова',
    auraColor: 0xa855f7,      // Мистический фиолетовый (матанализ)
    coreColor: 0x7e22ce,
    eyeColor: 0xf3e8ff,
    symbol: '∫',
    itemType: 'integral'
  }
};

export class SpectralProfessorNPC {
  constructor(profId = 'kanev', scene = null) {
    this.profId = profId;
    this.theme = PROF_THEMES[profId] || PROF_THEMES.kanev;
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = `SpectralNPC_${profId}`;

    this._t = Math.random() * 10;
    this._particles = [];
    this._rings = [];

    this._build();

    if (scene) scene.add(this.group);
  }

  _build() {
    const t = this.theme;

    // ── 1. Внутреннее светящееся ядро (Торс/Мантия) ──────────────────────────
    const bodyMat = new THREE.MeshStandardMaterial({
      color: t.coreColor,
      emissive: t.auraColor,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.78,
      roughness: 0.2,
      metalness: 0.1
    });

    // Парящая сужающаяся мантия (конус без нижнего дна)
    const robeGeo = new THREE.CylinderGeometry(0.24, 0.08, 1.1, 24, 8, true);
    this.robe = new THREE.Mesh(robeGeo, bodyMat);
    this.robe.position.y = 1.05;
    this.group.add(this.robe);

    // Внутренний мягкий ореол света
    this.light = new THREE.PointLight(t.auraColor, 1.8, 5);
    this.light.position.set(0, 1.3, 0);
    this.group.add(this.light);

    // ── 2. Голова-сфера с капюшоном ──────────────────────────────────────────
    const headMat = new THREE.MeshStandardMaterial({
      color: t.coreColor,
      emissive: t.auraColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });

    this.head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 20), headMat);
    this.head.position.set(0, 1.62, 0);
    this.group.add(this.head);

    // Капюшон (полусфера вокруг головы)
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: t.coreColor,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65), hoodMat);
    hood.position.set(0, 1.63, -0.02);
    this.group.add(hood);

    // ── 3. Светящиеся спектральные глаза ─────────────────────────────────────
    const eyeMat = new THREE.MeshBasicMaterial({ color: t.eyeColor });
    const eyeGeo = new THREE.SphereGeometry(0.026, 12, 12);

    this.eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeL.position.set(-0.065, 1.63, 0.16);
    this.eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeR.position.set(0.065, 1.63, 0.16);
    this.group.add(this.eyeL, this.eyeR);

    // ── 4. Парящие спектральные кольца у основания (дымка/портал) ───────────
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: t.auraColor,
        transparent: true,
        opacity: 0.35 - i * 0.08,
        wireframe: true
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.35 + i * 0.12, 0.008, 8, 32), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.45 + i * 0.18;
      this.group.add(ring);
      this._rings.push(ring);
    }

    // ── 5. Орбитальные светящиеся руны/частицы ────────────────────────────────
    const partMat = new THREE.MeshBasicMaterial({ color: t.eyeColor });
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), partMat);
      this.group.add(p);
      this._particles.push({ mesh: p, angle: (i / 6) * Math.PI * 2, speed: 0.8 + i * 0.15, radius: 0.55 + (i % 2) * 0.15, yBase: 1.1 + (i % 3) * 0.25 });
    }
  }

  update(delta, playerPos = null) {
    this._t += delta;
    const t = this._t;

    // Плавная мистическая левитация по высоте
    this.group.position.y = Math.sin(t * 1.5) * 0.09;

    // Дыхание ауры и пульсация света
    if (this.light) {
      this.light.intensity = 1.6 + Math.sin(t * 3.0) * 0.4;
    }
    if (this.robe) {
      this.robe.rotation.y = Math.sin(t * 0.6) * 0.08;
    }

    // Вращение колец тумана
    this._rings.forEach((r, idx) => {
      r.rotation.z = t * (0.4 + idx * 0.2) * (idx % 2 === 0 ? 1 : -1);
      r.scale.setScalar(1 + Math.sin(t * 2 + idx) * 0.06);
    });

    // Орбитальные частицы вокруг призрака
    this._particles.forEach(p => {
      p.angle += delta * p.speed;
      p.mesh.position.x = Math.cos(p.angle) * p.radius;
      p.mesh.position.z = Math.sin(p.angle) * p.radius;
      p.mesh.position.y = p.yBase + Math.sin(t * 2 + p.angle) * 0.08;
      p.mesh.rotation.y += delta * 2;
      p.mesh.rotation.x += delta * 1.5;
    });

    // Поворот головы и глаз в сторону игрока
    if (playerPos && this.head) {
      const worldPos = new THREE.Vector3();
      this.group.getWorldPosition(worldPos);
      const dir = new THREE.Vector3().subVectors(playerPos, worldPos).normalize();
      const targetYaw = Math.atan2(dir.x, dir.z);
      this.group.rotation.y += (targetYaw - this.group.rotation.y) * Math.min(delta * 2.0, 1.0);
    }
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    return this;
  }
}
