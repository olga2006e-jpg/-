// Setting: BMSTU Main Building (ГУК МГТУ им. Н.Э. Баумана) on Halloween night!
// Authentic 2-Floor Campus Architecture:
// Floor 1 (y = 0.0m, eye height 1.6m):
//   - (0, 0): ГУК: Центральный Вестибюль (Турникеты, Парадный вход, Парадная лестница)
//   - (1, 0): «Кафедра Питания» (Студенческая столовая ГУК №1, Тётя Клава)
//   - (-1, 0): Большой Студенческий Гардероб ГУК №1 (Сектор А)
//   - (-2, 0): Музей Истории Инженерии МГТУ (Геродот Галикарнасский)
// Floor 2 (y = 4.0m, eye height 5.6m, reached via Grand Stairs):
//   - (0, -1): Бельэтаж & Парадная Галерея ГУК
//   - (0, -2): Зал Учёного Совета МГТУ (Ауд. 223 • Сейф Основателей 1830)
//   - (-1, -1): Кафедра К5: Ауд. 224 — Сетевая лаборатория
//   - (-2, -1): Кафедра К5: Ауд. 227 — Преподавательская (А.И. Канев)
//   - (-3, -1): Кафедра К5: Ауд. 225 — Компьютерный класс веб-разработки (РИП)
//   - (-1, -2): Кафедра ФН: Ауд. 404 — Поточная аудитория Матанализа (Ф.Х. Ахметова)
//   - (1, -1): Университетская Научная Библиотека & Читальный Зал
//   - (2, -1): Ауд. 279: Лаборатория Фотоники и Лазеров (В.М. Коршунов)
//   - (3, -1): Ауд. 275: Лаборатория Радиохимии & Люминесценции (Мария Кюри)
//   - (1, -2): Высотная Астрономическая Обсерватория МГТУ (Альберт Эйнштейн)

export const TOTAL_CHUNKS_X = 10;
export const TOTAL_CHUNKS_Z = 10;
export const TOTAL_WORLD_CHUNKS = TOTAL_CHUNKS_X * TOTAL_CHUNKS_Z; // 100
export const CHUNK_SIZE = 24; // 24m per chunk

// NPCs exactly placed in their authentic auditoriums:
export const NPCS = [
  {
    id: 'bufetchitsa',
    name: 'Клавдия Петровна (Тётя Клава)',
    role: 'Кафедра Питания ГУК • Шеф-повар столовой',
    chunkX: 1,
    chunkZ: 0,
    x: 24,
    y: 0.8,
    z: -1.5,
    color: '#ffb86c',
    dialogueTopic: 'cafeteria',
    greeting: 'Здравствуйте, соколики! Заходите на Кафедру Питания! Берите горячие сосиски в тесте и чай с лимоном, а для смелых — наваристый ведьминский борщ!'
  },
  {
    id: 'herodotus',
    name: 'Геродот Галикарнасский',
    role: 'Музей Истории Инженерии МГТУ',
    chunkX: -2,
    chunkZ: 0,
    x: -48,
    y: 0.8,
    z: 0,
    color: '#bd93f9',
    dialogueTopic: 'egypt',
    greeting: 'Приветствую вас, юные зодчие! В архивах МГТУ хранятся чертежи, достойные строителей пирамид Гизы. О каких тайнах древней механики вам рассказать?'
  },
  {
    id: 'kanev',
    name: 'Антон Игоревич Канев',
    role: 'Кафедра К5 (ИУ5) • Ауд. 227',
    chunkX: -2,
    chunkZ: -1,
    x: -48,
    y: 4.8,
    z: -24.5,
    color: '#8be9fd',
    dialogueTopic: 'software_engineering',
    greeting: 'Здравствуйте! Рад видеть вас на кафедре К5 (ИУ-5). Ночь на 31 октября — самое время защитить лабораторную по РИП и Сетям. Какой вопрос по архитектуре или протоколам хотите разобрать?'
  },
  {
    id: 'akhmetova',
    name: 'Фания Харисовна Ахметова',
    role: 'Кафедра Высшей Математики ФН • Ауд. 404',
    chunkX: -1,
    chunkZ: -2,
    x: -24,
    y: 4.8,
    z: -48,
    color: '#ff79c6',
    dialogueTopic: 'math_analysis',
    greeting: 'Здравствуйте, студенты! В аудитории 404 матанализ не спит даже на Хэллоуин. Напомните мне строгое определение предела по Коши через эпсилон и дельта для допуска к зачёту!'
  },
  {
    id: 'korshunov',
    name: 'Владислав Михайлович Коршунов',
    role: 'Лаборатория Фотоники • Ауд. 279',
    chunkX: 2,
    chunkZ: -1,
    x: 48,
    y: 4.8,
    z: -24,
    color: '#50fa7b',
    dialogueTopic: 'photonics',
    greeting: 'Приветствую в оптической лаборатории аудитории 279! Видите, как светятся эти тыквы и спектральные лампы? Это закон Стокса и антенный эффект люминофоров. Готовы к вопросам по фотонике?'
  },
  {
    id: 'curie',
    name: 'Мария Склодовская-Кюри',
    role: 'Лаборатория Радиохимии • Ауд. 275',
    chunkX: 3,
    chunkZ: -1,
    x: 72,
    y: 4.8,
    z: -24,
    color: '#50fa7b',
    dialogueTopic: 'radiation',
    greeting: 'Здравствуйте! Рада видеть вас в лаборатории радиохимии. Радий и полоний научили нас, что атом полон колоссальной энергии. Какой вопрос о радиоактивности или люминесценции вас интересует?'
  },
  {
    id: 'einstein',
    name: 'Альберт Эйнштейн',
    role: 'Высотная Астрономическая Обсерватория',
    chunkX: 1,
    chunkZ: -2,
    x: 24,
    y: 4.8,
    z: -48,
    color: '#f1fa8c',
    dialogueTopic: 'relativity',
    greeting: 'Приветствую в Высотной Обсерватории Бауманки! В этих коридорах время перед зачётом течет совсем по релятивистским законам. Спрашивай о времени, гравитации или свете!'
  }
];

// Collectible items / artifacts distributed across chunks for the quest
export const COLLECTIBLE_ITEMS = [
  {
    id: 'scroll_pyramid',
    name: 'Папирус Геродота',
    type: 'artifact',
    subType: 'scroll',
    chunkX: -2,
    chunkZ: 0,
    x: -45,
    y: 0.8,
    z: 2,
    clue: 'Три великие пирамиды хранят тайны фараонов. Вторая цифра кода: 3',
    icon: '📜'
  },
  {
    id: 'key_crypt',
    name: 'Зашифрованная USB-флешка К5',
    type: 'artifact',
    subType: 'key',
    chunkX: -2,
    chunkZ: -1,
    x: -45,
    y: 4.8,
    z: -22,
    clue: 'Защищённый ключ маршрутизации. Четвертая цифра кода: 7',
    icon: '🗝️'
  },
  {
    id: 'flask_radium',
    name: 'Колба со светящимся радием',
    type: 'artifact',
    subType: 'flask',
    chunkX: 3,
    chunkZ: -1,
    x: 75,
    y: 4.8,
    z: -22,
    clue: 'Радий принадлежит ко 2-й группе элементов таблицы Менделеева. Третья цифра кода: 2',
    icon: '🧪'
  },
  {
    id: 'hourglass_relativity',
    name: 'Песочные Часы Относительности',
    type: 'artifact',
    subType: 'hourglass',
    chunkX: 1,
    chunkZ: -2,
    x: 27,
    y: 4.8,
    z: -46,
    clue: 'Время замедляется в движении. Первая цифра кода: 2 (степень скорости света в E=mc²)',
    icon: '⏳'
  }
];

// Architectural Building Classification for all 100 chunks
export function getZoneMeta(cx, cz) {
  // ================= 1st FLOOR (y = 0.0m) =================
  if (cx === 0 && cz === 0) {
    return {
      name: 'ГУК: Центральный Вестибюль (Турникеты & Парадная лестница)',
      type: 'foyer',
      roomCode: 'ГУК-1',
      floor: 1,
      wing: 'Центральный вестибюль',
      color: '#ed9337'
    };
  }
  if (cx === 1 && cz === 0) {
    return {
      name: '«Кафедра Питания» МГТУ им. Н.Э. Баумана (Студенческая столовая ГУК №1)',
      type: 'cafeteria',
      roomCode: 'Столовая-ГУК',
      floor: 1,
      wing: 'Восточное крыло (1-й этаж)',
      color: '#ffb86c'
    };
  }
  if (cx === -1 && cz === 0) {
    return {
      name: 'Большой Студенческий Гардероб ГУК №1 (Сектор А)',
      type: 'wardrobe_hall',
      roomCode: 'Гардероб-А',
      floor: 1,
      wing: 'Западное крыло (1-й этаж)',
      color: '#a08060'
    };
  }
  if (cx === -2 && cz === 0) {
    return {
      name: 'Музей Истории Инженерии МГТУ (Геродот Галикарнасский)',
      type: 'history_museum',
      roomCode: 'Музей МГТУ',
      floor: 1,
      wing: 'Западное крыло (1-й этаж)',
      color: '#bd93f9'
    };
  }
  if (cx === 0 && cz === 1) {
    return {
      name: 'Парадный Вход ГУК (2-я Бауманская ул., Памятник Н.Э. Бауману)',
      type: 'campus_grounds',
      roomCode: 'Парадный Вход',
      floor: 1,
      wing: 'Улица',
      color: '#44475a'
    };
  }

  // ================= 2nd FLOOR (y = 4.0m) =================
  if (cx === 0 && cz === -1) {
    return {
      name: '2-й ЭТАЖ: Бельэтаж & Парадная Галерея ГУК',
      type: 'foyer_floor2',
      roomCode: 'Бельэтаж',
      floor: 2,
      wing: 'Центральный переход 2-го этажа',
      color: '#6272a4'
    };
  }
  if (cx === 0 && cz === -2) {
    return {
      name: 'Зал Учёного Совета МГТУ им. Н.Э. Баумана (Ауд. 223 • Сейф Основателей)',
      type: 'council_hall',
      roomCode: 'Ауд. 223',
      floor: 2,
      wing: 'Центральная парадная часть',
      color: '#ffd700'
    };
  }

  // --- WEST WING: Department K5 (IU5) ---
  if (cx === -1 && cz === -1) {
    return {
      name: 'Кафедра К5: Ауд. 224 — Сетевая лаборатория',
      type: 'k5_lab',
      roomCode: 'Ауд. 224',
      floor: 2,
      wing: 'Западное крыло (К5)',
      color: '#005a7a'
    };
  }
  if (cx === -2 && cz === -1) {
    return {
      name: 'Кафедра К5: Ауд. 227 — Преподавательская (А.И. Канев)',
      type: 'k5_office',
      roomCode: 'Ауд. 227',
      floor: 2,
      wing: 'Западное крыло (К5 / ИУ5)',
      color: '#005a7a'
    };
  }
  if (cx === -3 && cz === -1) {
    return {
      name: 'Ауд. 225: Компьютерный класс веб-разработки (РИП)',
      type: 'computer_class',
      roomCode: 'Ауд. 225',
      floor: 2,
      wing: 'Западное крыло (К5)',
      color: '#005a7a'
    };
  }
  if (cx === -1 && cz === -2) {
    return {
      name: 'Кафедра ФН: Ауд. 404 — Поточная аудитория Матанализа (Ф.Х. Ахметова)',
      type: 'math_lecture',
      roomCode: 'Ауд. 404',
      floor: 2,
      wing: 'Северное крыло (ФН)',
      color: '#bd93f9'
    };
  }

  // --- EAST WING: Library, Photonics & Observatory ---
  if (cx === 1 && cz === -1) {
    return {
      name: 'Университетская Научная Библиотека & Читальный Зал',
      type: 'library',
      roomCode: 'Библиотека',
      floor: 2,
      wing: 'Восточное крыло',
      color: '#ffb86c'
    };
  }
  if (cx === 2 && cz === -1) {
    return {
      name: 'Ауд. 279: Лаборатория Фотоники и Лазеров (В.М. Коршунов)',
      type: 'photonics_lab',
      roomCode: 'Ауд. 279',
      floor: 2,
      wing: 'Восточное крыло (Фотоника)',
      color: '#50fa7b'
    };
  }
  if (cx === 3 && cz === -1) {
    return {
      name: 'Ауд. 275: Лаборатория Радиохимии & Люминесценции (Мария Кюри)',
      type: 'laser_lab',
      roomCode: 'Ауд. 275',
      floor: 2,
      wing: 'Восточное крыло',
      color: '#50fa7b'
    };
  }
  if (cx === 1 && cz === -2) {
    return {
      name: 'Высотная Астрономическая Обсерватория МГТУ (Альберт Эйнштейн)',
      type: 'observatory',
      roomCode: 'Обсерватория',
      floor: 2,
      wing: 'Северная башня',
      color: '#8be9fd'
    };
  }

  // Courtyards
  if ((cx === -1 || cx === 1) && (cz === 1)) {
    return {
      name: 'Внутренний Дворик Кампуса (Сад МГТУ им. Баумана)',
      type: 'courtyard',
      roomCode: 'Дворик',
      floor: 1,
      wing: 'Внутренний двор',
      color: '#50fa7b'
    };
  }

  // Outer Grounds
  return {
    name: 'Кампус МГТУ им. Н.Э. Баумана (Парк & Аллеи инженеров)',
    type: 'campus_grounds',
    roomCode: 'Кампус',
    floor: 1,
    wing: 'Территория',
    color: '#44475a'
  };
}

function hash2(x, z) {
  let h = (x * 374761393 + z * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// Helper to construct fully enclosed architectural room with 4 solid walls and a swinging collegiate doorway
function buildRoom(objects, originX, originZ, half, doorSide, doorNumber, doorLabel, interiorProps = [], baseY = 0) {
  const wallH = 5.0;
  const wallD = 0.4;
  const segW = 10.9; // (24 - 2.2) / 2 = 10.9m

  // 1. Solid perimeter walls on sides WITHOUT the doorway
  if (doorSide !== 'north') {
    objects.push({ type: 'wall', x: originX, y: baseY + 2.5, z: originZ - half + 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });
  }
  if (doorSide !== 'south') {
    objects.push({ type: 'wall', x: originX, y: baseY + 2.5, z: originZ + half - 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });
  }
  if (doorSide !== 'west') {
    objects.push({ type: 'wall', x: originX - half + 0.2, y: baseY + 2.5, z: originZ, width: wallD, height: wallH, depth: CHUNK_SIZE, rotY: 0 });
  }
  if (doorSide !== 'east') {
    objects.push({ type: 'wall', x: originX + half - 0.2, y: baseY + 2.5, z: originZ, width: wallD, height: wallH, depth: CHUNK_SIZE, rotY: 0 });
  }

  // 2. Doorway wall on doorSide (left wall + right wall + top transom above door + swinging door)
  if (doorSide === 'north') {
    const wallZ = originZ - half + 0.2;
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: wallZ, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: wallZ, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: wallZ, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: wallZ, rotY: Math.PI, roomNumber: doorNumber, label: doorLabel });
  } else if (doorSide === 'south') {
    const wallZ = originZ + half - 0.2;
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: wallZ, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: wallZ, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: wallZ, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: wallZ, rotY: 0, roomNumber: doorNumber, label: doorLabel });
  } else if (doorSide === 'east') {
    const wallX = originX + half - 0.2;
    objects.push({ type: 'wall', x: wallX, y: baseY + 2.5, z: originZ - 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: wallX, y: baseY + 2.5, z: originZ + 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: wallX, y: baseY + 3.85, z: originZ, width: wallD, height: 2.3, depth: 2.2, rotY: 0 });
    objects.push({ type: 'door', x: wallX, y: baseY + 1.35, z: originZ, rotY: -Math.PI / 2, roomNumber: doorNumber, label: doorLabel });
  } else if (doorSide === 'west') {
    const wallX = originX - half + 0.2;
    objects.push({ type: 'wall', x: wallX, y: baseY + 2.5, z: originZ - 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: wallX, y: baseY + 2.5, z: originZ + 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: wallX, y: baseY + 3.85, z: originZ, width: wallD, height: 2.3, depth: 2.2, rotY: 0 });
    objects.push({ type: 'door', x: wallX, y: baseY + 1.35, z: originZ, rotY: Math.PI / 2, roomNumber: doorNumber, label: doorLabel });
  }

  // 3. Add interior props offset by floor height
  for (const p of interiorProps) {
    objects.push({ ...p, y: (p.y || 0) + baseY });
  }
}

// Generate static chunk payload representing real collegiate architecture
export function generateChunk(cx, cz) {
  const zone = getZoneMeta(cx, cz);
  const chunkId = `chunk_${cx}_${cz}`;
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;
  const half = CHUNK_SIZE / 2; // 12m
  const seed = hash2(cx, cz);

  const objects = [];

  // 1. Floor at proper collegiate level (Floor 2 is at y = 4.0m, Floor 1 is at y = 0.0m)
  const baseY = zone.floor === 2 ? 4.0 : 0.0;
  objects.push({
    type: 'floor',
    x: originX,
    y: baseY,
    z: originZ,
    width: CHUNK_SIZE,
    depth: CHUNK_SIZE,
    zoneType: zone.type
  });

  // 2. Ceiling & Chandelier Lamps for all indoor chunks
  if (zone.type !== 'courtyard' && zone.type !== 'campus_grounds') {
    objects.push({
      type: 'ceiling',
      x: originX,
      y: baseY + 5.0,
      z: originZ,
      width: CHUNK_SIZE,
      depth: CHUNK_SIZE
    });
    objects.push({
      type: 'ceiling_lamp',
      x: originX,
      y: baseY + 4.85,
      z: originZ
    });
  }

  // ========================================================
  // 3. SPECIFIC ROOM & CORRIDOR INTERIOR GENERATORS
  // ========================================================

  if (zone.type === 'foyer') {
    // --- (0, 0): ГУК: Центральный Вестибюль ---
    // A. Grand Staircase in center leading up to 2nd Floor
    objects.push({ type: 'grand_stairs', x: originX, y: 0, z: originZ });

    // B. Collegiate Elevator on East wall
    objects.push({ type: 'elevator', x: originX + 8.5, y: 0, z: originZ + 3.5, rotY: -Math.PI / 2 });

    // C. South Entrance Wall (z = +11.8):
    // Left & Right solid walls + doorway in center with Main Entrance Doors!
    objects.push({ type: 'wall', x: originX - 6.55, y: 2.5, z: originZ + half - 0.2, width: 10.9, height: 5.0, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: 2.5, z: originZ + half - 0.2, width: 10.9, height: 5.0, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: 3.85, z: originZ + half - 0.2, width: 2.2, height: 2.3, depth: 0.4, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: 1.35, z: originZ + half - 0.2, rotY: 0, roomNumber: 'ВХОД', label: 'Главный вход ГУК' });

    // Monumental Coat of Arms of BMSTU over South Entrance
    objects.push({ type: 'bauman_crest', x: originX, y: 3.6, z: originZ + 11.2, rotY: Math.PI });

    // Turnstiles in front of the South Entrance
    objects.push({ type: 'turnstile', x: originX - 3.5, y: 0, z: originZ + 7.5, rotY: 0 });
    objects.push({ type: 'turnstile', x: originX,       y: 0, z: originZ + 7.5, rotY: 0 });
    objects.push({ type: 'turnstile', x: originX + 3.5, y: 0, z: originZ + 7.5, rotY: 0 });

    // Round Soviet Clock «Стрела» above the turnstiles
    objects.push({ type: 'clock', x: originX, y: 4.2, z: originZ + 7.8, rotY: 0 });

    // Classical Busts of BMSTU Titans
    objects.push({ type: 'bust', x: originX - 6.5, y: 0, z: originZ + 2.0, name: 'Н.Э. Бауман' });
    objects.push({ type: 'bust', x: originX + 6.5, y: 0, z: originZ + 2.0, name: 'С.П. Королёв' });

    // Oak benches & radiators
    objects.push({ type: 'bench', x: originX - 4.5, y: 0, z: originZ + 5.2, rotY: 0 });
    objects.push({ type: 'bench', x: originX + 4.5, y: 0, z: originZ + 5.2, rotY: 0 });
    objects.push({ type: 'radiator', x: originX - 11.2, y: 0, z: originZ + 6.0, rotY: Math.PI / 2 });
    objects.push({ type: 'radiator', x: originX + 11.2, y: 0, z: originZ + 6.0, rotY: -Math.PI / 2 });

    // Marble Columns
    objects.push({ type: 'pillar', x: originX - 7, y: 2.5, z: originZ - 7, height: 5 });
    objects.push({ type: 'pillar', x: originX + 7, y: 2.5, z: originZ - 7, height: 5 });

    // East Wall (x = +11.8): Doorway into Cafeteria «Кафедра Питания»
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ - 6.55, width: 0.4, height: 5.0, depth: 10.9, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ + 6.55, width: 0.4, height: 5.0, depth: 10.9, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 3.85, z: originZ, width: 0.4, height: 2.3, depth: 2.2, rotY: 0 });
    objects.push({ type: 'door', x: originX + half - 0.2, y: 1.35, z: originZ, rotY: -Math.PI / 2, roomNumber: 'Столовая', label: 'Кафедра Питания' });

    // West Wall (x = -11.8): Doorway into Wardrobe «Гардероб Сектор А»
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ - 6.55, width: 0.4, height: 5.0, depth: 10.9, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ + 6.55, width: 0.4, height: 5.0, depth: 10.9, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 3.85, z: originZ, width: 0.4, height: 2.3, depth: 2.2, rotY: 0 });
    objects.push({ type: 'door', x: originX - half + 0.2, y: 1.35, z: originZ, rotY: Math.PI / 2, roomNumber: 'Гардероб', label: 'Сектор А' });

    // Solid wall under stairs at North perimeter
    objects.push({ type: 'wall', x: originX, y: 2.0, z: originZ - half + 0.2, width: CHUNK_SIZE, height: 4.0, depth: 0.4, rotY: 0 });

    // Halloween pumpkins & floating candles
    objects.push({ type: 'pumpkin', x: originX - 2.8, y: 0, z: originZ + 2.4, glowing: true });
    objects.push({ type: 'pumpkin', x: originX + 2.8, y: 0, z: originZ + 2.4, glowing: true });
    objects.push({ type: 'floating_candle', x: originX - 4.0, y: 3.2, z: originZ });
    objects.push({ type: 'floating_candle', x: originX + 4.0, y: 3.2, z: originZ });
    // Grand Chandelier in Vestibule ceiling & torches by entrance
    objects.push({ type: 'ceiling_lamp', x: originX, y: 4.85, z: originZ + 3.0 });
    objects.push({ type: 'torch', x: originX - 6.8, y: 2.2, z: originZ + 7.5, rotY: 0 });
    objects.push({ type: 'torch', x: originX + 6.8, y: 2.2, z: originZ + 7.5, rotY: 0 });
  } else if (zone.type === 'cafeteria') {
    // --- (1, 0): «Кафедра Питания» (Студенческая столовая ГУК №1) ---
    buildRoom(objects, originX, originZ, half, 'west', 'Столовая ГУК', 'Кафедра Питания', [
      { type: 'food_counter', x: originX, y: 0, z: originZ - 4.5, rotY: 0 },
      { type: 'cafeteria_menu', x: originX, y: 0, z: originZ - half + 0.6, rotY: 0 },
      { type: 'witch_cauldron', x: originX + 7.5, y: 0, z: originZ - 4.5 },
      { type: 'dining_table', x: originX - 4.5, y: 0, z: originZ + 1.5 },
      { type: 'dining_table', x: originX + 4.5, y: 0, z: originZ + 1.5 },
      { type: 'dining_table', x: originX - 4.5, y: 0, z: originZ + 6.5 },
      { type: 'dining_table', x: originX + 4.5, y: 0, z: originZ + 6.5 },
      { type: 'bench', x: originX, y: 0, z: originZ + half - 1.2, rotY: 0 },
      { type: 'radiator', x: originX - 8.5, y: 0, z: originZ + half - 0.6, rotY: 0 },
      { type: 'radiator', x: originX + 8.5, y: 0, z: originZ + half - 0.6, rotY: 0 },
      { type: 'floating_candle', x: originX - 3.5, y: 2.8, z: originZ - 2.5 },
      { type: 'floating_candle', x: originX + 3.5, y: 2.8, z: originZ - 2.5 },
      { type: 'cobweb', x: originX - half + 1.2, y: 3.5, z: originZ - half + 1.2, rotY: 0 },
      { type: 'cobweb', x: originX + half - 1.2, y: 3.5, z: originZ - half + 1.2, rotY: Math.PI / 2 }
    ], baseY);

  } else if (zone.type === 'wardrobe_hall') {
    // --- (-1, 0): Большой студенческий Гардероб (Сектор А) ---
    // Doorway on East connects to Foyer, Doorway on West connects to Museum!
    const wallH = 5.0;
    const wallD = 0.4;
    const segW = 10.9;

    // Solid North & South walls
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ - half + 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ + half - 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });

    // East doorway into Foyer
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ - 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ + 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 3.85, z: originZ, width: wallD, height: 2.3, depth: 2.2, rotY: 0 });
    objects.push({ type: 'door', x: originX + half - 0.2, y: 1.35, z: originZ, rotY: -Math.PI / 2, roomNumber: 'Гардероб', label: 'Сектор А' });

    // West doorway into History Museum
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ - 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ + 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 3.85, z: originZ, width: wallD, height: 2.3, depth: 2.2, rotY: 0 });
    objects.push({ type: 'door', x: originX - half + 0.2, y: 1.35, z: originZ, rotY: Math.PI / 2, roomNumber: 'Музей', label: 'Музей Истории' });

    // Wardrobe racks, counter, benches
    objects.push({ type: 'wardrobe', x: originX, y: 0, z: originZ - 3.5, rotY: 0 });
    objects.push({ type: 'wardrobe', x: originX, y: 0, z: originZ + 3.5, rotY: 0 });
    objects.push({ type: 'bench', x: originX - 6.0, y: 0, z: originZ, rotY: Math.PI / 2 });
    objects.push({ type: 'bench', x: originX + 6.0, y: 0, z: originZ, rotY: -Math.PI / 2 });
    objects.push({ type: 'radiator', x: originX, y: 0, z: originZ + half - 0.6, rotY: 0 });
    objects.push({ type: 'pumpkin', x: originX - 4.0, y: 0, z: originZ - 2.0, glowing: true });

  } else if (zone.type === 'history_museum') {
    // --- (-2, 0): Музей Истории Инженерии МГТУ (Геродот Галикарнасский) ---
    buildRoom(objects, originX, originZ, half, 'east', 'Музей МГТУ', 'Музей Инженерии', [
      { type: 'obelisk', x: originX - 4, y: 2, z: originZ, label: 'Летописи Бауманки' },
      { type: 'obelisk', x: originX + 4, y: 2, z: originZ, label: 'Механика Античности' },
      { type: 'bust', x: originX, y: 0, z: originZ - 4.5, name: 'Античный Мыслитель' },
      { type: 'pumpkin', x: originX - 6, y: 0, z: originZ + 2, glowing: true },
      { type: 'pumpkin', x: originX + 6, y: 0, z: originZ + 2, glowing: true },
      { type: 'cobweb', x: originX - half + 1.2, y: 3.5, z: originZ - half + 1.2, rotY: 0 },
      { type: 'bookshelf', x: originX, y: 2.5, z: originZ - 7 }
    ], baseY);

  } else if (zone.type === 'foyer_floor2') {
    // --- (0, -1): Бельэтаж & Парадная Галерея 2-го этажа ---
    const wallH = 5.0;
    const wallD = 0.4;
    const segW = 10.9;

    // A. South side: Balustrade overlooking Grand Stairs
    // Player can walk onto the landing at z = -12 directly from the staircase!
    objects.push({ type: 'bench', x: originX - 6.0, y: baseY, z: originZ + half - 2.0, rotY: Math.PI });
    objects.push({ type: 'bench', x: originX + 6.0, y: baseY, z: originZ + half - 2.0, rotY: Math.PI });

    // B. North wall: Doorway into Council Hall (Ауд. 223)
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: originZ - half + 0.2, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: originZ - half + 0.2, rotY: Math.PI, roomNumber: 'Ауд. 223', label: 'Учёный Совет' });

    // C. West Arch into West Wing (Кафедра К5 / ИУ-5)
    objects.push({ type: 'arch', x: originX - half + 0.2, y: baseY + 2.5, z: originZ, rotY: Math.PI / 2 });

    // D. East Arch into East Wing (Библиотека & Фотоника)
    objects.push({ type: 'arch', x: originX + half - 0.2, y: baseY + 2.5, z: originZ, rotY: -Math.PI / 2 });

    // Marble Columns, Clocks, Notice boards
    objects.push({ type: 'pillar', x: originX - 5, y: baseY + 2.5, z: originZ - 5, height: 5 });
    objects.push({ type: 'pillar', x: originX + 5, y: baseY + 2.5, z: originZ - 5, height: 5 });
    objects.push({ type: 'clock', x: originX, y: baseY + 3.8, z: originZ, rotY: 0 });
    objects.push({ type: 'schedule_board', x: originX - 8.0, y: baseY, z: originZ, rotY: Math.PI / 2 });
    objects.push({ type: 'dean_notice_board', x: originX + 8.0, y: baseY, z: originZ, rotY: -Math.PI / 2 });
    objects.push({ type: 'pumpkin', x: originX - 3.5, y: baseY, z: originZ - 3.5, glowing: true });
    objects.push({ type: 'pumpkin', x: originX + 3.5, y: baseY, z: originZ - 3.5, glowing: true });
    objects.push({ type: 'floating_candle', x: originX, y: baseY + 2.8, z: originZ - 2.0 });
    objects.push({ type: 'ceiling_lamp', x: originX, y: baseY + 4.85, z: originZ });
  } else if (zone.type === 'council_hall') {
    // --- (0, -2): Зал Учёного Совета МГТУ им. Н.Э. Баумана (Ауд. 223) ---
    // Door on South wall connecting to Foyer Floor 2!
    buildRoom(objects, originX, originZ, half, 'south', 'Ауд. 223', 'Учёный Совет МГТУ', [
      { type: 'council_table', x: originX, y: 0, z: originZ },
      { type: 'bauman_crest', x: originX, y: 3.5, z: originZ - half + 0.5, rotY: 0 },
      { type: 'bust', x: originX - 6.5, y: 0, z: originZ - 4.5, name: 'В.Г. Шухов' },
      { type: 'podium', x: originX + 4.5, y: 0, z: originZ - 3.5, rotY: Math.PI / 4 },
      // Monumental Founders' Safe 1830 on North Wall!
      { type: 'founders_safe', x: originX, y: 0, z: originZ - half + 1.2, rotY: 0 },
      { type: 'pumpkin', x: originX - 3.5, y: 0, z: originZ + 4, glowing: true },
      { type: 'pumpkin', x: originX + 3.5, y: 0, z: originZ + 4, glowing: true },
      { type: 'pillar', x: originX - 7, y: 2.5, z: originZ - 7, height: 5 },
      { type: 'pillar', x: originX + 7, y: 2.5, z: originZ - 7, height: 5 }
    ], baseY);

  } else if (zone.type === 'k5_lab') {
    // --- (-1, -1): Кафедра К5: Ауд. 224 — Сетевая лаборатория ---
    // Hallway connects East into (0, -1) and West into (-2, -1). Door on North leads into Room 224!
    const wallH = 5.0;
    const wallD = 0.4;
    const segW = 10.9;

    // North wall with door into Room 224
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: originZ - half + 0.2, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: originZ - half + 0.2, rotY: Math.PI, roomNumber: 'Ауд. 224', label: 'Сетевая лаборатория' });

    // South wall: solid with windows/radiators
    objects.push({ type: 'wall', x: originX, y: baseY + 2.5, z: originZ + half - 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });

    // Open arches on East & West along corridor
    objects.push({ type: 'arch', x: originX + half - 0.2, y: baseY + 2.5, z: originZ, rotY: -Math.PI / 2 });
    objects.push({ type: 'arch', x: originX - half + 0.2, y: baseY + 2.5, z: originZ, rotY: Math.PI / 2 });

    // Interior props: server racks, desks, network board, benches
    objects.push({ type: 'server_rack', x: originX - 6, y: baseY, z: originZ - 5, rotY: 0 });
    objects.push({ type: 'server_rack', x: originX - 3.5, y: baseY, z: originZ - 5, rotY: 0 });
    objects.push({ type: 'desk_row', x: originX, y: baseY, z: originZ - 8, rotY: 0 });
    objects.push({ type: 'blackboard', x: originX, y: baseY + 2.0, z: originZ - half + 0.6, rotY: 0, formulaType: 'rip_network' });
    objects.push({ type: 'bench', x: originX, y: baseY, z: originZ + half - 1.2, rotY: 0 });
    objects.push({ type: 'radiator', x: originX - 6, y: baseY, z: originZ + half - 0.6, rotY: 0 });
    objects.push({ type: 'radiator', x: originX + 6, y: baseY, z: originZ + half - 0.6, rotY: 0 });
    objects.push({ type: 'pumpkin', x: originX - 4, y: baseY, z: originZ + 3, glowing: true });
    objects.push({ type: 'ceiling_lamp', x: originX, y: baseY + 4.85, z: originZ - 4.0 });
  } else if (zone.type === 'k5_office') {
    // --- (-2, -1): Кафедра К5: Ауд. 227 — Преподавательская А.И. Канева ---
    const wallH = 5.0;
    const wallD = 0.4;
    const segW = 10.9;

    // North wall with door into Room 227
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: originZ - half + 0.2, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: originZ - half + 0.2, rotY: Math.PI, roomNumber: 'Ауд. 227', label: 'Кафедра К5 (ИУ-5)' });

    // South wall
    objects.push({ type: 'wall', x: originX, y: baseY + 2.5, z: originZ + half - 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });

    // Open arches on East & West
    objects.push({ type: 'arch', x: originX + half - 0.2, y: baseY + 2.5, z: originZ, rotY: -Math.PI / 2 });
    objects.push({ type: 'arch', x: originX - half + 0.2, y: baseY + 2.5, z: originZ, rotY: Math.PI / 2 });

    // Inside Room 227: Teacher desk with green banker lamp, laptop, lab reports, rotary phone, tea podstakannik
    objects.push({ type: 'teacher_desk', x: originX, y: baseY, z: originZ - 6.5, rotY: 0 });
    objects.push({ type: 'podium', x: originX - 5.5, y: baseY, z: originZ - 6.5, rotY: Math.PI / 4 });
    objects.push({ type: 'server_rack', x: originX - 7.5, y: baseY, z: originZ - 9.5, rotY: 0 });
    objects.push({ type: 'bookshelf', x: originX + 7.5, y: baseY, z: originZ - 7.5, rotY: -Math.PI / 2 });
    objects.push({ type: 'blackboard', x: originX, y: baseY + 2.0, z: originZ - half + 0.6, rotY: 0, formulaType: 'rip_network' });
    objects.push({ type: 'bench', x: originX, y: baseY, z: originZ + half - 1.2, rotY: 0 });
    objects.push({ type: 'radiator', x: originX - 6, y: baseY, z: originZ + half - 0.6, rotY: 0 });
    objects.push({ type: 'pumpkin', x: originX + 5.0, y: baseY, z: originZ - 4.0, glowing: true });
    objects.push({ type: 'ceiling_lamp', x: originX, y: baseY + 4.85, z: originZ - 4.0 });
  } else if (zone.type === 'computer_class') {
    // --- (-3, -1): Ауд. 225: Компьютерный класс веб-разработки (РИП) ---
    buildRoom(objects, originX, originZ, half, 'east', 'Ауд. 225', 'Класс РИП (К5)', [
      { type: 'desk_row', x: originX - 2, y: 0, z: originZ - 5, rotY: 0 },
      { type: 'desk_row', x: originX - 2, y: 0, z: originZ, rotY: 0 },
      { type: 'desk_row', x: originX - 2, y: 0, z: originZ + 5, rotY: 0 },
      { type: 'server_rack', x: originX - 8, y: 0, z: originZ - 6, rotY: 0 },
      { type: 'bench', x: originX + 8.5, y: 0, z: originZ, rotY: -Math.PI / 2 },
      { type: 'blackboard', x: originX - 2, y: 2.0, z: originZ - half + 0.6, rotY: 0, formulaType: 'rip_network' },
      { type: 'pumpkin', x: originX + 4, y: 0, z: originZ - 4, glowing: true }
    ], baseY);

  } else if (zone.type === 'math_lecture') {
    // --- (-1, -2): Кафедра ФН: Ауд. 404 — Поточная аудитория Матанализа (Ф.Х. Ахметова) ---
    buildRoom(objects, originX, originZ, half, 'south', 'Ауд. 404', 'Высшая Математика ФН', [
      { type: 'blackboard', x: originX, y: 2.2, z: originZ - half + 0.6, rotY: 0, formulaType: 'math_analysis' },
      { type: 'desk_row', x: originX, y: 0, z: originZ - 4, rotY: 0 },
      { type: 'desk_row', x: originX, y: 0, z: originZ, rotY: 0 },
      { type: 'desk_row', x: originX, y: 0, z: originZ + 4, rotY: 0 },
      { type: 'floating_candle', x: originX - 4, y: 2.8, z: originZ },
      { type: 'floating_candle', x: originX + 4, y: 2.8, z: originZ },
      { type: 'pumpkin', x: originX - 6, y: 0, z: originZ - 6, glowing: true }
    ], baseY);

  } else if (zone.type === 'library') {
    // --- (1, -1): Университетская Научная Библиотека & Читальный Зал ---
    const wallH = 5.0;
    const wallD = 0.4;
    const segW = 10.9;

    // North wall with door into Library
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: originZ - half + 0.2, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: originZ - half + 0.2, rotY: Math.PI, roomNumber: 'Библиотека', label: 'Читальный Зал' });

    // South wall
    objects.push({ type: 'wall', x: originX, y: baseY + 2.5, z: originZ + half - 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });

    // Open arches on East & West along corridor
    objects.push({ type: 'arch', x: originX - half + 0.2, y: baseY + 2.5, z: originZ, rotY: Math.PI / 2 });
    objects.push({ type: 'arch', x: originX + half - 0.2, y: baseY + 2.5, z: originZ, rotY: -Math.PI / 2 });

    // Bookshelves, study desks, reading lamps
    objects.push({ type: 'bookshelf', x: originX - 7, y: baseY + 2.5, z: originZ - 6 });
    objects.push({ type: 'bookshelf', x: originX + 7, y: baseY + 2.5, z: originZ - 6 });
    objects.push({ type: 'desk_row', x: originX, y: baseY, z: originZ - 6, rotY: 0 });
    objects.push({ type: 'bench', x: originX, y: baseY, z: originZ + half - 1.2, rotY: 0 });
    objects.push({ type: 'floating_candle', x: originX, y: baseY + 2.8, z: originZ - 4 });
    objects.push({ type: 'pumpkin', x: originX + 4, y: baseY, z: originZ + 3, glowing: true });
    objects.push({ type: 'ceiling_lamp', x: originX, y: baseY + 4.85, z: originZ - 4.0 });
  } else if (zone.type === 'photonics_lab') {
    // --- (2, -1): Ауд. 279: Лаборатория Фотоники и Лазеров (В.М. Коршунов) ---
    const wallH = 5.0;
    const wallD = 0.4;
    const segW = 10.9;

    // North wall with door into Room 279
    objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: originZ - half + 0.2, width: segW, height: wallH, depth: wallD, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: originZ - half + 0.2, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: originZ - half + 0.2, rotY: Math.PI, roomNumber: 'Ауд. 279', label: 'Фотоника и Лазеры' });

    // South wall
    objects.push({ type: 'wall', x: originX, y: baseY + 2.5, z: originZ + half - 0.2, width: CHUNK_SIZE, height: wallH, depth: wallD, rotY: 0 });

    // Open arches on East & West
    objects.push({ type: 'arch', x: originX - half + 0.2, y: baseY + 2.5, z: originZ, rotY: Math.PI / 2 });
    objects.push({ type: 'arch', x: originX + half - 0.2, y: baseY + 2.5, z: originZ, rotY: -Math.PI / 2 });

    // Inside Room 279: optical benches, lasers, blackboard
    objects.push({ type: 'laser_bench', x: originX - 3.5, y: baseY, z: originZ - 6.5, rotY: 0 });
    objects.push({ type: 'laser_bench', x: originX + 3.5, y: baseY, z: originZ - 6.5, rotY: 0 });
    objects.push({ type: 'blackboard', x: originX, y: baseY + 2.0, z: originZ - half + 0.6, rotY: 0, formulaType: 'photonics_stokes' });
    objects.push({ type: 'bench', x: originX, y: baseY, z: originZ + half - 1.2, rotY: 0 });
    objects.push({ type: 'pumpkin', x: originX + 6, y: baseY, z: originZ - 4, glowing: true });
    objects.push({ type: 'ceiling_lamp', x: originX, y: baseY + 4.85, z: originZ - 4.0 });
  } else if (zone.type === 'laser_lab') {
    // --- (3, -1): Ауд. 275: Лаборатория Радиохимии & Люминесценции (Мария Кюри) ---
    buildRoom(objects, originX, originZ, half, 'west', 'Ауд. 275', 'Лаборатория Радиохимии', [
      { type: 'laser_bench', x: originX, y: 0, z: originZ - 3, rotY: 0 },
      { type: 'laser_bench', x: originX, y: 0, z: originZ + 3, rotY: 0 },
      { type: 'bookshelf', x: originX + 7, y: 2.5, z: originZ },
      { type: 'blackboard', x: originX, y: 2.0, z: originZ - half + 0.6, rotY: 0, formulaType: 'photonics_stokes' },
      { type: 'pumpkin', x: originX - 5, y: 0, z: originZ - 4, glowing: true }
    ], baseY);

  } else if (zone.type === 'observatory') {
    // --- (1, -2): Высотная Астрономическая Обсерватория МГТУ (Альберт Эйнштейн) ---
    buildRoom(objects, originX, originZ, half, 'south', 'Обсерватория', 'Астрономическая башня', [
      { type: 'telescope', x: originX, y: 1.5, z: originZ },
      { type: 'blackboard', x: originX - 5, y: 2.0, z: originZ - half + 0.6, rotY: 0, formulaType: 'math_analysis' },
      { type: 'pillar', x: originX - 6, y: 2.5, z: originZ - 6, height: 5 },
      { type: 'pillar', x: originX + 6, y: 2.5, z: originZ - 6, height: 5 },
      { type: 'floating_candle', x: originX - 3, y: 2.8, z: originZ + 3 },
      { type: 'floating_candle', x: originX + 3, y: 2.8, z: originZ + 3 },
      { type: 'pumpkin', x: originX + 5, y: 0, z: originZ - 4, glowing: true }
    ], baseY);

  } else if (zone.type === 'courtyard') {
    // Внутренний дворик кампуса
    objects.push({ type: 'pillar', x: originX - 6, y: 2.5, z: originZ - 6, height: 5 });
    objects.push({ type: 'pillar', x: originX + 6, y: 2.5, z: originZ - 6, height: 5 });
    objects.push({ type: 'pillar', x: originX - 6, y: 2.5, z: originZ + 6, height: 5 });
    objects.push({ type: 'pillar', x: originX + 6, y: 2.5, z: originZ + 6, height: 5 });
  }

  // 4. Halloween Jack-o-Lanterns throughout campus
  if (seed > 0.35) {
    objects.push({
      type: 'pumpkin',
      x: originX + (seed * 8 - 4),
      y: baseY + 0.35,
      z: originZ + (((seed * 17) % 8) - 4),
      glowing: true
    });
  }

  // 5. Collectible items / artifacts for the quest
  const itemsInChunk = COLLECTIBLE_ITEMS.filter(it => it.chunkX === cx && it.chunkZ === cz);
  for (const item of itemsInChunk) {
    objects.push({
      type: 'artifact',
      id: item.id,
      name: item.name,
      subType: item.subType,
      x: item.x,
      y: item.y,
      z: item.z,
      clue: item.clue,
      icon: item.icon
    });
  }

  return {
    id: chunkId,
    cx,
    cz,
    zoneName: zone.name,
    zoneType: zone.type,
    floor: zone.floor,
    wing: zone.wing,
    color: zone.color,
    objects,
    npcs: NPCS.filter(npc => npc.chunkX === cx && npc.chunkZ === cz)
  };
}

// Helper: Convert player (x, z) to chunk coordinate
export function worldToChunkCoord(x, z) {
  return {
    cx: Math.round(x / CHUNK_SIZE),
    cz: Math.round(z / CHUNK_SIZE)
  };
}
// Alias for backwards compatibility with multiplayer.js
export function getChunk(cx, cz) {
  return generateChunk(cx, cz);
}
