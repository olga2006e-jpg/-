// Interactive Minimap & Campus Blueprint for BMSTU Main Academic Building (ГУК)
// Based on https://map.mf.bmstu.ru/

import { CHUNK_SIZE } from './chunkManager.js';

// Predefined landmark rooms for the building floorplan
export const BUILDING_ROOMS = [
  // Floor 2: Central, West & East Wings, Council
  { id: 'foyer', name: 'Центральный Вестибюль ГУК', code: 'ГУК-1', floor: 1, cx: 0, cz: 0, x: 0, z: 0, w: 22, h: 22, color: '#ed9337', icon: '🏛️' },
  { id: 'room-227', name: 'Кафедра К5: Преподавательская (А.И. Канев)', code: 'Ауд. 227', floor: 2, cx: -2, cz: 0, x: -48, z: 0, w: 20, h: 20, color: '#005a7a', icon: '💻' },
  { id: 'room-224', name: 'Кафедра К5: Методический кабинет & Сети', code: 'Ауд. 224', floor: 2, cx: -2, cz: -1, x: -48, z: -24, w: 20, h: 20, color: '#005a7a', icon: '🌐' },
  { id: 'room-225', name: 'Компьютерный класс веб-разработки (РИП)', code: 'Ауд. 225', floor: 2, cx: -3, cz: 0, x: -72, z: 0, w: 20, h: 20, color: '#005a7a', icon: '🖥️' },
  { id: 'room-223', name: 'Зал заседаний Учёного совета МГТУ', code: 'Ауд. 223', floor: 2, cx: 0, cz: 2, x: 0, z: 48, w: 22, h: 22, color: '#ff5555', icon: '⚖️' },
  { id: 'room-205', name: 'Кабинет Директора МФ МГТУ', code: 'Ауд. 205', floor: 2, cx: -1, cz: 2, x: -24, z: 48, w: 20, h: 20, color: '#ed9337', icon: '👔' },
  { id: 'room-208', name: 'Приёмная ректората', code: 'Ауд. 208', floor: 2, cx: 1, cz: 2, x: 24, z: 48, w: 20, h: 20, color: '#ed9337', icon: '📋' },
  { id: 'room-279', name: 'Лаборатория Фотоники & Лазеров (В.М. Коршунов)', code: 'Ауд. 279', floor: 2, cx: 2, cz: 0, x: 48, z: 0, w: 20, h: 20, color: '#50fa7b', icon: '🔬' },
  { id: 'room-275', name: 'Лаборатория люминесценции лантаноидов', code: 'Ауд. 275', floor: 2, cx: 2, cz: -1, x: 48, z: -24, w: 20, h: 20, color: '#50fa7b', icon: '✨' },
  { id: 'dep-k1', name: 'Кафедра К1 (Системы автоматического управления)', code: 'К1', floor: 2, cx: 3, cz: 0, x: 72, z: 0, w: 20, h: 20, color: '#50fa7b', icon: '⚙️' },
  { id: 'room-404', name: 'Поточная аудитория Матанализа ФН (Ф.Х. Ахметова)', code: 'Ауд. 404', floor: 4, cx: 0, cz: -2, x: 0, z: -48, w: 22, h: 22, color: '#bd93f9', icon: '📐' },
  { id: 'room-419', name: 'Поточная аудитория Высшей Математики', code: 'Ауд. 419', floor: 4, cx: -1, cz: -2, x: -24, z: -48, w: 20, h: 20, color: '#bd93f9', icon: '∫' },
  { id: 'library', name: 'Научная Библиотека & Читальный Зал', code: 'Библиотека', floor: 2, cx: 1, cz: -2, x: 24, z: -48, w: 20, h: 20, color: '#ffb86c', icon: '📚' },
  { id: 'museum', name: 'Музей Истории Инженерии (Геродот)', code: 'Музей', floor: 1, cx: -2, cz: 2, x: -48, z: 48, w: 22, h: 22, color: '#f1fa8c', icon: '📜' },
  { id: 'observatory', name: 'Высотная Астрономическая Обсерватория', code: 'Обсерватория', floor: 5, cx: 2, cz: 2, x: 48, z: 48, w: 22, h: 22, color: '#8be9fd', icon: '🔭' }
];

export class MinimapManager {
  constructor() {
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.locationBadge = document.getElementById('minimap-location-badge');
    this.zoomInBtn = document.getElementById('minimap-zoom-in');
    this.zoomOutBtn = document.getElementById('minimap-zoom-out');
    this.expandBtn = document.getElementById('minimap-expand-btn');

    // Full map modal elements
    this.mapModal = document.getElementById('map-modal');
    this.mapModalClose = document.getElementById('map-modal-close');
    this.fullMapCanvas = document.getElementById('full-map-canvas');
    this.fullMapCtx = this.fullMapCanvas ? this.fullMapCanvas.getContext('2d') : null;
    this.floorButtons = document.querySelectorAll('.floor-tab-btn');

    // Minimap state
    this.zoomLevel = 1.0; // 1.0 = close-up (radius 60m), 0.45 = whole building (240m)
    this.isFullMapOpen = false;
    this.currentFloor = 2; // Floor 2 by default (K5, Council, Photonics)

    // Current player state
    this.playerX = 0;
    this.playerZ = 0;
    this.playerRotY = 0;

    this.setupEvents();
  }

  setupEvents() {
    if (this.zoomInBtn) {
      this.zoomInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomLevel = Math.min(this.zoomLevel + 0.35, 1.8);
      });
    }

    if (this.zoomOutBtn) {
      this.zoomOutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomLevel = Math.max(this.zoomLevel - 0.35, 0.45);
      });
    }

    if (this.expandBtn) {
      this.expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openFullMap();
      });
    }

    if (this.mapModalClose) {
      this.mapModalClose.addEventListener('click', () => {
        this.closeFullMap();
      });
    }

    this.floorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.floorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFloor = parseInt(btn.dataset.floor, 10);
        this.renderFullMap();
      });
    });

    // Press 'M' key to toggle full building map
    window.addEventListener('keydown', (e) => {
      // Don't capture if user is typing in chat or input
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'KeyM') {
        if (this.isFullMapOpen) {
          this.closeFullMap();
        } else {
          this.openFullMap();
        }
      } else if (e.code === 'Escape' && this.isFullMapOpen) {
        this.closeFullMap();
      }
    });
  }

  openFullMap() {
    if (!this.mapModal) return;
    this.isFullMapOpen = true;
    this.mapModal.classList.remove('hidden');
    this.renderFullMap();
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  closeFullMap() {
    if (!this.mapModal) return;
    this.isFullMapOpen = false;
    this.mapModal.classList.add('hidden');
  }

  // Find room or corridor at coordinates (x, z)
  getLocationAt(x, z) {
    const cx = Math.round(x / CHUNK_SIZE);
    const cz = Math.round(z / CHUNK_SIZE);

    for (const room of BUILDING_ROOMS) {
      if (room.cx === cx && room.cz === cz) {
        return room;
      }
    }

    // Corridors & galleries
    if (cz === 0 && Math.abs(cx) <= 4) {
      return { name: 'Главная Поперечная Галерея (Коридор 2-го этажа)', code: 'Галерея-X', color: '#6272a4' };
    }
    if (cx === 0 && Math.abs(cz) <= 4) {
      return { name: 'Центральная Продольная Галерея ГУК', code: 'Галерея-Z', color: '#6272a4' };
    }
    if (cz === -2 && Math.abs(cx) <= 3) {
      return { name: 'Северный Коридор кафедр ФН', code: 'Коридор-ФН', color: '#bd93f9' };
    }
    if (cz === 2 && Math.abs(cx) <= 3) {
      return { name: 'Южный Коридор Директората и Учёного Совета', code: 'Коридор-Юг', color: '#ed9337' };
    }
    if ((cx === -1 || cx === 1) && (cz === -1 || cz === 1)) {
      return { name: 'Внутренний Дворик Кампуса (Сад МГТУ)', code: 'Дворик', color: '#50fa7b' };
    }

    return { name: 'Кампус МГТУ им. Баумана', code: 'ГУК', color: '#a09cb0' };
  }

  // Update loop called every animation frame
  update(playerPos, remotePlayers = [], activeNpcs = [], loadedChunks = new Set()) {
    if (!this.ctx || !this.canvas) return;

    this.playerX = playerPos.x;
    this.playerZ = playerPos.z;
    this.playerRotY = playerPos.rotY || 0;

    // 1. Update location badge
    const loc = this.getLocationAt(this.playerX, this.playerZ);
    if (this.locationBadge) {
      this.locationBadge.innerHTML = `<span style="color:${loc.color || '#8be9fd'}">📍 ${loc.name}</span>`;
    }

    // 2. Render 2D radar minimap
    this.renderMinimap(playerPos, remotePlayers, activeNpcs, loadedChunks);

    // 3. If full map modal is open, re-render it
    if (this.isFullMapOpen) {
      this.renderFullMap(remotePlayers, activeNpcs);
    }
  }

  renderMinimap(playerPos, remotePlayers, activeNpcs, loadedChunks) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;

    // Clear background
    ctx.fillStyle = '#0f0c1a';
    ctx.fillRect(0, 0, w, h);

    // Scale factor: world meters to canvas pixels
    // zoomLevel = 1.0 -> 1 meter = 1.6 pixels (view approx 130m)
    const scale = 1.6 * this.zoomLevel;

    ctx.save();
    // Center view around player
    ctx.translate(centerX, centerY);

    // Optional: Rotate minimap with player heading (fixed north is easier to read, so we keep north UP)
    // World coordinates: +X = East (right), +Z = South (down), -Z = North (up)
    const worldToScreenX = (wx) => (wx - this.playerX) * scale;
    const worldToScreenY = (wz) => (wz - this.playerZ) * scale;

    // Draw Chunks Grid and Highlight Loaded Chunks (<= 10% Cache Demonstration!)
    for (let cx = -5; cx < 5; cx++) {
      for (let cz = -5; cz < 5; cz++) {
        const chunkMinX = cx * CHUNK_SIZE - CHUNK_SIZE / 2;
        const chunkMinZ = cz * CHUNK_SIZE - CHUNK_SIZE / 2;

        const sx = worldToScreenX(chunkMinX);
        const sy = worldToScreenY(chunkMinZ);
        const sw = CHUNK_SIZE * scale;
        const sh = CHUNK_SIZE * scale;

        const key = `${cx},${cz}`;
        const isLoaded = loadedChunks.has(key);

        if (isLoaded) {
          ctx.fillStyle = 'rgba(80, 250, 123, 0.12)'; // Neon green glow for loaded chunks
          ctx.fillRect(sx, sy, sw, sh);
          ctx.strokeStyle = 'rgba(80, 250, 123, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sx, sy, sw, sh);
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, sw, sh);
        }
      }
    }

    // Draw Main Corridors
    ctx.fillStyle = 'rgba(98, 114, 164, 0.25)';
    // Horizontal Main Gallery
    ctx.fillRect(
      worldToScreenX(-96),
      worldToScreenY(-6),
      192 * scale,
      12 * scale
    );
    // Vertical Main Gallery
    ctx.fillRect(
      worldToScreenX(-6),
      worldToScreenY(-96),
      12 * scale,
      192 * scale
    );
    // North Parallel Corridor
    ctx.fillRect(
      worldToScreenX(-72),
      worldToScreenY(-54),
      144 * scale,
      12 * scale
    );
    // South Parallel Corridor
    ctx.fillRect(
      worldToScreenX(-72),
      worldToScreenY(42),
      144 * scale,
      12 * scale
    );

    // Draw Building Rooms
    for (const room of BUILDING_ROOMS) {
      const rx = worldToScreenX(room.x - room.w / 2);
      const ry = worldToScreenY(room.z - room.h / 2);
      const rw = room.w * scale;
      const rh = room.h * scale;

      // Room floor
      ctx.fillStyle = room.color + '26'; // 15% opacity hex
      ctx.fillRect(rx, ry, rw, rh);

      // Room border
      ctx.strokeStyle = room.color + '99';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, ry, rw, rh);

      // Room label (only if zoomed in enough)
      if (this.zoomLevel >= 0.75) {
        ctx.fillStyle = room.color;
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(room.code, rx + rw / 2, ry + rh / 2);
      }
    }

    // Draw NPCs / Professors
    const npcs = [
      { name: 'Канев (К5)', code: 'ИУ5', x: -48, z: 0, color: '#8be9fd' },
      { name: 'Ахметова (ФН)', code: 'ФН', x: 0, z: -48, color: '#ff79c6' },
      { name: 'Коршунов', code: 'ФОТ', x: 48, z: 0, color: '#50fa7b' },
      { name: 'Эйнштейн', code: 'ЭЙН', x: 0, z: -3, color: '#f1fa8c' },
      { name: 'Геродот', code: 'ИСТ', x: -48, z: 48, color: '#bd93f9' }
    ];

    for (const npc of npcs) {
      const nx = worldToScreenX(npc.x);
      const ny = worldToScreenY(npc.z);

      // Outer glow
      ctx.beginPath();
      ctx.arc(nx, ny, 6, 0, Math.PI * 2);
      ctx.fillStyle = npc.color;
      ctx.shadowColor = npc.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner dot
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Name tag
      ctx.fillStyle = npc.color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(npc.code, nx, ny - 9);
    }

    // Draw Remote Players
    for (const p of remotePlayers) {
      const px = worldToScreenX(p.x);
      const py = worldToScreenY(p.z);

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color || '#ff79c6';
      ctx.shadowColor = p.color || '#ff79c6';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#f8f8f2';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText((p.username || '').slice(0, 8), px, py - 7);
    }

    // Draw Local Player (Center with Direction Cone)
    ctx.save();
    // In Three.js: yaw = 0 points towards -Z (North)
    const angle = this.playerRotY;

    // Direction Field of View Wedge
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 24, -angle - Math.PI / 2 - 0.45, -angle - Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fillStyle = 'rgba(139, 233, 253, 0.25)';
    ctx.fill();

    // Player Direction Arrow
    ctx.rotate(-angle);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fillStyle = '#8be9fd';
    ctx.shadowColor = '#8be9fd';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.restore();

    // Radar circular vignette & compass
    ctx.strokeStyle = 'rgba(189, 147, 249, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Crosshair lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, h);
    ctx.moveTo(0, centerY); ctx.lineTo(w, centerY);
    ctx.stroke();

    // Compass North Indicator
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', centerX, 14);
  }

  // Full Screen Architectural Map (Floors 1-5 like https://map.mf.bmstu.ru/)
  renderFullMap(remotePlayers = [], activeNpcs = []) {
    if (!this.fullMapCtx || !this.fullMapCanvas) return;

    const ctx = this.fullMapCtx;
    const w = this.fullMapCanvas.width;
    const h = this.fullMapCanvas.height;

    // Dark blueprint background
    ctx.fillStyle = '#0d0f18';
    ctx.fillRect(0, 0, w, h);

    // Architectural grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const centerX = w / 2;
    const centerY = h / 2;
    const scale = 2.4; // Map scale factor

    const worldToFullX = (wx) => centerX + wx * scale;
    const worldToFullY = (wz) => centerY + wz * scale;

    // Title of Floor
    ctx.fillStyle = '#f8f8f2';
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.textAlign = 'left';
    ctx.fillText(`ГУК МГТУ ИМ. Н.Э. БАУМАНА • ЭТАЖ ${this.currentFloor}`, 25, 32);

    ctx.fillStyle = '#a09cb0';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('Интерактивный архитектурный план кампуса (map.mf.bmstu.ru)', 25, 52);

    // Draw Main Corridors for this floor
    ctx.fillStyle = 'rgba(98, 114, 164, 0.3)';
    ctx.fillRect(worldToFullX(-96), worldToFullY(-8), 192 * scale, 16 * scale);
    ctx.fillRect(worldToFullX(-8), worldToFullY(-96), 16 * scale, 192 * scale);
    ctx.fillRect(worldToFullX(-72), worldToFullY(-56), 144 * scale, 14 * scale);
    ctx.fillRect(worldToFullX(-72), worldToFullY(42), 144 * scale, 14 * scale);

    // Draw Courtyards
    for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cxw = cx * CHUNK_SIZE;
      const czw = cz * CHUNK_SIZE;
      ctx.fillStyle = 'rgba(80, 250, 123, 0.06)';
      ctx.fillRect(worldToFullX(cxw - 11), worldToFullY(czw - 11), 22 * scale, 22 * scale);
      ctx.strokeStyle = 'rgba(80, 250, 123, 0.2)';
      ctx.strokeRect(worldToFullX(cxw - 11), worldToFullY(czw - 11), 22 * scale, 22 * scale);
      ctx.fillStyle = 'rgba(80, 250, 123, 0.4)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Внутренний Двор', worldToFullX(cxw), worldToFullY(czw));
    }

    // Draw Rooms (Filtered or highlighted for current floor)
    for (const room of BUILDING_ROOMS) {
      const rx = worldToFullX(room.x - room.w / 2);
      const ry = worldToFullY(room.z - room.h / 2);
      const rw = room.w * scale;
      const rh = room.h * scale;

      const isCurrentFloor = (room.floor === this.currentFloor);

      ctx.fillStyle = isCurrentFloor ? (room.color + '33') : 'rgba(255, 255, 255, 0.03)';
      ctx.fillRect(rx, ry, rw, rh);

      ctx.strokeStyle = isCurrentFloor ? room.color : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isCurrentFloor ? 2 : 1;
      ctx.strokeRect(rx, ry, rw, rh);

      // Room title
      ctx.fillStyle = isCurrentFloor ? '#ffffff' : '#666677';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${room.icon || ''} ${room.code}`, rx + rw / 2, ry + rh / 2 - 4);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = isCurrentFloor ? room.color : '#555566';
      ctx.fillText(room.name.slice(0, 24), rx + rw / 2, ry + rh / 2 + 10);
    }

    // Draw Professors
    const npcs = [
      { name: 'А.И. Канев (К5)', x: -48, z: 0, color: '#8be9fd', floor: 2 },
      { name: 'Ф.Х. Ахметова (ФН)', x: 0, z: -48, color: '#ff79c6', floor: 4 },
      { name: 'В.М. Коршунов (ФОТ)', x: 48, z: 0, color: '#50fa7b', floor: 2 },
      { name: 'А. Эйнштейн', x: 0, z: -3, color: '#f1fa8c', floor: 1 },
      { name: 'Геродот', x: -48, z: 48, color: '#bd93f9', floor: 1 }
    ];

    for (const npc of npcs) {
      if (npc.floor === this.currentFloor || this.currentFloor === 2) {
        const nx = worldToFullX(npc.x);
        const ny = worldToFullY(npc.z);

        ctx.beginPath();
        ctx.arc(nx, ny, 8, 0, Math.PI * 2);
        ctx.fillStyle = npc.color;
        ctx.shadowColor = npc.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, nx, ny - 12);
      }
    }

    // Draw Remote Players
    for (const p of remotePlayers) {
      const px = worldToFullX(p.x);
      const py = worldToFullY(p.z);

      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.color || '#ff79c6';
      ctx.fill();

      ctx.fillStyle = '#f8f8f2';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.username || '', px, py - 9);
    }

    // Draw Player Live Position Marker
    const px = worldToFullX(this.playerX);
    const py = worldToFullY(this.playerZ);

    // Pulsing outer ring
    const pulse = (Date.now() % 1500) / 1500;
    ctx.beginPath();
    ctx.arc(px, py, 10 + pulse * 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(139, 233, 253, ${1 - pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center player dot
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#8be9fd';
    ctx.shadowColor = '#8be9fd';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // "ВЫ ЗДЕСЬ" label
    ctx.fillStyle = '#8be9fd';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◄ ВЫ ЗДЕСЬ ►', px, py + 22);

    // Legend at bottom
    ctx.fillStyle = 'rgba(18, 14, 33, 0.85)';
    ctx.fillRect(20, h - 50, w - 40, 40);
    ctx.strokeStyle = 'rgba(189, 147, 249, 0.3)';
    ctx.strokeRect(20, h - 50, w - 40, 40);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ed9337'; ctx.fillText('■ Администрация', 35, h - 26);
    ctx.fillStyle = '#005a7a'; ctx.fillText('■ Кафедра К5 (ИУ5)', 175, h - 26);
    ctx.fillStyle = '#50fa7b'; ctx.fillText('■ Фотоника / Лаборатории', 345, h - 26);
    ctx.fillStyle = '#bd93f9'; ctx.fillText('■ Высшая Математика (ФН)', 550, h - 26);
    ctx.fillStyle = '#a09cb0'; ctx.fillText('[Клавиша M / Esc — вернуться к 3D]', w - 300, h - 26);
  }
}
