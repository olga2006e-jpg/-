// World Generator: 100 chunks (10x10 grid from -5 to +4)
// Total world chunks: 100.
// Rule: Client can cache AT MOST 10 chunks (10% of total world).

export const TOTAL_CHUNKS_X = 10;
export const TOTAL_CHUNKS_Z = 10;
export const TOTAL_WORLD_CHUNKS = TOTAL_CHUNKS_X * TOTAL_CHUNKS_Z; // 100
export const CHUNK_SIZE = 24; // 24 units wide

// Define static NPCs with their locations
export const NPCS = [
  {
    id: 'einstein',
    name: 'Альберт Эйнштейн (Призрак)',
    role: 'Физик-теоретик',
    chunkX: 0,
    chunkZ: 0,
    x: 0,
    y: 0.8,
    z: 2,
    color: '#8be9fd',
    dialogueTopic: 'relativity',
    greeting: 'Приветствую, юный коллега! Пространство и время здесь сплелись в узел... Задавай вопрос о времени, гравитации или свете!'
  },
  {
    id: 'herodotus',
    name: 'Геродот Галикарнасский (Призрак)',
    role: 'Отец Истории',
    chunkX: -2,
    chunkZ: 2,
    x: -48,
    y: 0.8,
    z: 48,
    color: '#f1fa8c',
    dialogueTopic: 'egypt',
    greeting: 'Здравствуй, странник! Я — Геродот. В этой вечной ночи я помню разливы Нила и тайны пирамид. О чем тебе поведать?'
  },
  {
    id: 'curie',
    name: 'Мария Кюри (Призрак)',
    role: 'Первооткрывательница радия',
    chunkX: 2,
    chunkZ: -2,
    x: 48,
    y: 0.8,
    z: -48,
    color: '#50fa7b',
    dialogueTopic: 'radiation',
    greeting: 'Будь осторожен со свечением во тьме! Это не магия Хэллоуина, а энергия атома. Что ты хочешь узнать о распаде материи?'
  }
];

// Zone types based on chunk coordinates
function getZoneType(cx, cz) {
  if (cx === 0 && cz === 0) return { name: 'Обсерватория Эйнштейна', type: 'observatory' };
  if (cx === -2 && cz === 2) return { name: 'Египетский Склеп Геродота', type: 'crypt' };
  if (cx === 2 && cz === -2) return { name: 'Радиоактивная Лаборатория Кюри', type: 'lab' };
  const dist = Math.abs(cx) + Math.abs(cz);
  if (dist <= 2) return { name: 'Главный Готический Зал', type: 'hall' };
  if (cx > 0 && cz > 0) return { name: 'Забытая Библиотека', type: 'library' };
  if (cx < 0 && cz < 0) return { name: 'Кладбище Забытых Гипотез', type: 'graveyard' };
  if (cx < 0 && cz > 0) return { name: 'Катакомбы Древностей', type: 'catacombs' };
  return { name: 'Мрачный Внутренний Двор', type: 'courtyard' };
}

// Deterministic pseudo-random number for chunk decoration
function hash2(x, z) {
  let h = (x * 374761393 + z * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// Generate static chunk payload
export function generateChunk(cx, cz) {
  const zone = getZoneType(cx, cz);
  const chunkId = `chunk_${cx}_${cz}`;
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;

  const objects = [];

  // Floor plate
  objects.push({
    type: 'floor',
    x: originX,
    y: 0,
    z: originZ,
    width: CHUNK_SIZE,
    depth: CHUNK_SIZE,
    zoneType: zone.type
  });

  // Pillars at corners
  const half = CHUNK_SIZE / 2 - 1;
  const corners = [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half]
  ];
  for (const [ox, oz] of corners) {
    objects.push({
      type: 'pillar',
      x: originX + ox,
      y: 3,
      z: originZ + oz,
      height: 6
    });
  }

  // Zone specific objects
  const seed = hash2(cx, cz);
  if (zone.type === 'graveyard') {
    // Tombstones
    objects.push({ type: 'tombstone', x: originX - 4, y: 0.8, z: originZ - 3, label: 'RIP Не доказано' });
    objects.push({ type: 'tombstone', x: originX + 3, y: 0.8, z: originZ + 4, label: 'RIP Perpetuum Mobile' });
  } else if (zone.type === 'observatory') {
    objects.push({ type: 'telescope', x: originX, y: 1.5, z: originZ - 4 });
  } else if (zone.type === 'crypt') {
    objects.push({ type: 'obelisk', x: originX - 3, y: 2, z: originZ, label: 'Скрижали Истории' });
  } else if (zone.type === 'library') {
    objects.push({ type: 'bookshelf', x: originX - 6, y: 2.5, z: originZ });
    objects.push({ type: 'bookshelf', x: originX + 6, y: 2.5, z: originZ });
  }

  // Halloween pumpkins & torches
  if (seed > 0.3) {
    objects.push({
      type: 'pumpkin',
      x: originX + (seed * 8 - 4),
      y: 0.4,
      z: originZ + ((seed * 11) % 8 - 4),
      glowing: true
    });
  }
  if (seed > 0.6) {
    objects.push({
      type: 'torch',
      x: originX + ((seed * 13) % 8 - 4),
      y: 2,
      z: originZ + ((seed * 7) % 8 - 4)
    });
  }

  // Check if any NPC is in this chunk
  const npcsInChunk = NPCS.filter(npc => npc.chunkX === cx && npc.chunkZ === cz);

  return {
    id: chunkId,
    cx,
    cz,
    worldX: originX,
    worldZ: originZ,
    zoneName: zone.name,
    zoneType: zone.type,
    objects,
    npcs: npcsInChunk
  };
}

// In-memory lookup map of all 100 chunks for high-speed serving
const allChunksMap = new Map();
for (let cx = -5; cx <= 4; cx++) {
  for (let cz = -5; cz <= 4; cz++) {
    const chunk = generateChunk(cx, cz);
    allChunksMap.set(`${cx},${cz}`, chunk);
  }
}

export function getChunk(cx, cz) {
  return allChunksMap.get(`${cx},${cz}`) || null;
}

// Helper: Convert player (x, z) to chunk coordinate
export function worldToChunkCoord(x, z) {
  return {
    cx: Math.round(x / CHUNK_SIZE),
    cz: Math.round(z / CHUNK_SIZE)
  };
}
