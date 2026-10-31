// Setting: BMSTU Main Building (ГЗ МГТУ им. Н.Э. Баумана) on Halloween night!
// Total world chunks: 100 (10x10 grid from -5 to +4).
// Rule: Client caches at most 10 chunks (<= 10%).

export const TOTAL_CHUNKS_X = 10;
export const TOTAL_CHUNKS_Z = 10;
export const TOTAL_WORLD_CHUNKS = TOTAL_CHUNKS_X * TOTAL_CHUNKS_Z; // 100
export const CHUNK_SIZE = 24; // 24 units wide

// BMSTU Professors & Historic Scholars
export const NPCS = [
  {
    id: 'akhmetova',
    name: 'Фания Харисовна Ахметова (Призрак)',
    role: 'Кафедра Высшей Математики ФН',
    chunkX: 0,
    chunkZ: 2,
    x: 0,
    y: 0.8,
    z: 48,
    color: '#ff79c6',
    dialogueTopic: 'math_analysis',
    greeting: 'Здравствуйте, студенты! Ночь на дворе, а у вас пределы не посчитаны и интегралы не взяты! Готовы доказать теорему, чтобы получить допуск к зачёту?'
  },
  {
    id: 'kanev',
    name: 'Антон Игоревич Канев (Призрак)',
    role: 'Кафедра ИУ5 / Системный Архитектор',
    chunkX: 2,
    chunkZ: 0,
    x: 48,
    y: 0.8,
    z: 0,
    color: '#8be9fd',
    dialogueTopic: 'software_engineering',
    greeting: 'Так-так... Опять дописываем лабу в полночь? Надеюсь, архитектура чистая, базы данных нормализованы, а кэш не течет? Слушаю ваш вопрос по коду.'
  },
  {
    id: 'korshunov',
    name: 'Владислав Михайлович Коршунов (Призрак)',
    role: 'Кафедра ИУ / Мастер Алгоритмов',
    chunkX: -2,
    chunkZ: 0,
    x: -48,
    y: 0.8,
    z: 0,
    color: '#50fa7b',
    dialogueTopic: 'algorithms',
    greeting: 'Приветствую, коллеги-инженеры! В этой бауманской ночи выживает только тот, у кого сложность алгоритма не хуже O(N log N). Что хотите оптимизировать?'
  },
  {
    id: 'einstein',
    name: 'Альберт Эйнштейн (Почетный Гость)',
    role: 'Призрак Обсерватории на Ноге',
    chunkX: 0,
    chunkZ: 0,
    x: 0,
    y: 0.8,
    z: 2,
    color: '#f1fa8c',
    dialogueTopic: 'relativity',
    greeting: 'Приветствую бауманцев! Знаете ли вы, что в ваших коридорах ГЗ время течет совсем иначе перед сдачей сессии? Спрашивайте про относительность и скорость света!'
  },
  {
    id: 'herodotus',
    name: 'Геродот Галикарнасский (Странник)',
    role: 'Музей Редких Рукописей МГТУ',
    chunkX: -2,
    chunkZ: 2,
    x: -48,
    y: 0.8,
    z: 48,
    color: '#bd93f9',
    dialogueTopic: 'egypt',
    greeting: 'Приветствую вас, юные зодчие! Я исследовал пирамиды Гизы и Вавилон, но ваши бауманские чертежи поражают даже древних греков. О чем из истории вам поведать?'
  }
];

// Zone types based on chunk coordinates in BMSTU GZ
function getZoneType(cx, cz) {
  if (cx === 0 && cz === 0) return { name: 'Циркуль ГЗ — Центральный Холл', type: 'circus' };
  if (cx === 0 && cz === 2) return { name: 'Аудитория Высшей Математики ФН (Фания Харисовна)', type: 'math_hall' };
  if (cx === 2 && cz === 0) return { name: 'Лаборатория Программной Инженерии (А.И. Канев)', type: 'dev_lab' };
  if (cx === -2 && cz === 0) return { name: 'Класс Алгоритмов и Структур Данных (В.М. Коршунов)', type: 'algo_class' };
  if (cx === -2 && cz === 2) return { name: 'Музей Инженерных Древностей (Геродот)', type: 'crypt' };
  if (cx > 0 && cz > 0) return { name: 'Северное Крыло ГЗ — Читальный Зал', type: 'library' };
  if (cx < 0 && cz < 0) return { name: 'Южное Крыло — Лабиринт Кафедр', type: 'labyrinth' };
  if (cx > 0 && cz < 0) return { name: 'Высотная Часть «Нога» — Лестничные Пролеты', type: 'tower' };
  return { name: 'Коридоры Главного Здания МГТУ', type: 'hallway' };
}

function hash2(x, z) {
  let h = (x * 374761393 + z * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export function generateChunk(cx, cz) {
  const zone = getZoneType(cx, cz);
  const chunkId = `chunk_${cx}_${cz}`;
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;

  const objects = [];

  // Marble/Granite Floor
  objects.push({
    type: 'floor',
    x: originX,
    y: 0,
    z: originZ,
    width: CHUNK_SIZE,
    depth: CHUNK_SIZE,
    zoneType: zone.type
  });

  // Monumental Columns
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

  // Zone specific props
  const seed = hash2(cx, cz);
  if (zone.type === 'circus') {
    objects.push({ type: 'telescope', x: originX, y: 1.5, z: originZ - 4 });
  } else if (zone.type === 'math_hall') {
    objects.push({ type: 'bookshelf', x: originX - 5, y: 2.5, z: originZ });
    objects.push({ type: 'tombstone', x: originX + 4, y: 0.8, z: originZ + 3, label: 'lim(x→∞) = Зачёт' });
  } else if (zone.type === 'dev_lab') {
    objects.push({ type: 'cauldron', x: originX, y: 0, z: originZ - 2 });
    objects.push({ type: 'tombstone', x: originX + 5, y: 0.8, z: originZ + 3, label: 'git push --force в дедлайн' });
  } else if (zone.type === 'algo_class') {
    objects.push({ type: 'bookshelf', x: originX + 6, y: 2.5, z: originZ });
    objects.push({ type: 'tombstone', x: originX - 4, y: 0.8, z: originZ - 3, label: 'O(1) Зачётка' });
  } else if (zone.type === 'crypt') {
    objects.push({ type: 'obelisk', x: originX - 3, y: 2, z: originZ, label: 'Летописи Бауманки' });
  } else if (zone.type === 'library') {
    objects.push({ type: 'bookshelf', x: originX - 6, y: 2.5, z: originZ });
    objects.push({ type: 'bookshelf', x: originX + 6, y: 2.5, z: originZ });
  } else {
    if (seed > 0.4) {
      objects.push({ type: 'tombstone', x: originX + 3, y: 0.8, z: originZ - 3, label: 'Здесь был тубус' });
    }
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

export function worldToChunkCoord(x, z) {
  return {
    cx: Math.round(x / CHUNK_SIZE),
    cz: Math.round(z / CHUNK_SIZE)
  };
}
