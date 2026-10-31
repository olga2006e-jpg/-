// Setting: BMSTU Main Academic Building (ГУК МГТУ им. Н.Э. Баумана) on Halloween night!
// Based on the authentic campus floorplan (https://map.mf.bmstu.ru/)
// Total world chunks: 100 (10x10 grid from cx: -5 to +4, cz: -5 to +4).
// Rule: Client caches at most 10 chunks (<= 10% of total world).

export const TOTAL_CHUNKS_X = 10;
export const TOTAL_CHUNKS_Z = 10;
export const TOTAL_WORLD_CHUNKS = TOTAL_CHUNKS_X * TOTAL_CHUNKS_Z; // 100
export const CHUNK_SIZE = 24; // 24 units wide (meters)

// Exact building wings and auditoriums from BMSTU map:
// cx: -2, cz: 0  -> Кафедра К5 (ИУ5), Ауд. 227 (Преподавательская А.И. Канева)
// cx:  0, cz: -2 -> Северное крыло, Ауд. 404 (Поточная лекционная Высшей Математики ФН, Ф.Х. Ахметова)
// cx:  2, cz: 0  -> Восточное крыло, Ауд. 279 (Лаборатория Фотоники и Лазеров, В.М. Коршунов)
// cx:  0, cz: 0  -> ГУК: Центральный Вестибюль 1-го этажа, турникеты и парадная лестница (Альберт Эйнштейн)
// cx: -2, cz: 2  -> Музей Истории Инженерии МГТУ (Геродот Галикарнасский)
// cx:  0, cz: 2  -> Ауд. 223: Зал заседаний Учёного совета МГТУ им. Баумана
export const NPCS = [
  {
    id: 'einstein',
    name: 'Альберт Эйнштейн (Почётный Гость)',
    role: 'Центральный Вестибюль ГУК',
    chunkX: 0,
    chunkZ: 0,
    x: 0,
    y: 0.8,
    z: -3,
    color: '#f1fa8c',
    dialogueTopic: 'relativity',
    greeting: 'Приветствую в Главном Учебном Корпусе Бауманки! В этих коридорах время перед зачётом течет совсем по релятивистским законам. Спрашивай о времени, гравитации или свете!'
  },
  {
    id: 'kanev',
    name: 'Антон Игоревич Канев',
    role: 'Кафедра К5 (ИУ5) • Ауд. 227',
    chunkX: -2,
    chunkZ: 0,
    x: -48,
    y: 0.8,
    z: 0,
    color: '#8be9fd',
    dialogueTopic: 'software_engineering',
    greeting: 'Здравствуйте! Рад видеть вас на кафедре К5 (ИУ-5). Ночь на 31 октября — самое время защитить лабораторную по РИП и Сетям. Какой вопрос по архитектуре или протоколам хотите разобрать?'
  },
  {
    id: 'akhmetova',
    name: 'Фания Харисовна Ахметова',
    role: 'Кафедра Высшей Математики ФН • Ауд. 404',
    chunkX: 0,
    chunkZ: -2,
    x: 0,
    y: 0.8,
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
    chunkZ: 0,
    x: 48,
    y: 0.8,
    z: 0,
    color: '#50fa7b',
    dialogueTopic: 'photonics',
    greeting: 'Приветствую в оптической лаборатории аудитории 279! Видите, как светятся эти тыквы и спектральные лампы? Это закон Стокса и антенный эффект люминофоров. Готовы к вопросам по фотонике?'
  },
  {
    id: 'herodotus',
    name: 'Геродот Галикарнасский',
    role: 'Музей Истории Инженерии МГТУ',
    chunkX: -2,
    chunkZ: 2,
    x: -48,
    y: 0.8,
    z: 48,
    color: '#bd93f9',
    dialogueTopic: 'egypt',
    greeting: 'Приветствую вас, юные зодчие! В архивах МГТУ хранятся чертежи, достойные строителей пирамид Гизы. О каких тайнах древней механики вам рассказать?'
  }
];

// Architectural Building Classification for all 100 chunks
export function getZoneMeta(cx, cz) {
  // Center: Entrance Foyer & Stairs
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

  // West Wing: Department K5 (IU5) Computer Systems, Web & Networks
  if (cx === -2 && cz === 0) {
    return {
      name: 'Кафедра К5: Ауд. 227 — Преподавательская (А.И. Канев)',
      type: 'k5_office',
      roomCode: 'Ауд. 227',
      floor: 2,
      wing: 'Западное крыло (К5 / ИУ5)',
      color: '#005a7a'
    };
  }
  if (cx === -2 && cz === -1) {
    return {
      name: 'Кафедра К5: Ауд. 224 — Методический кабинет и Сетевая лаборатория',
      type: 'k5_lab',
      roomCode: 'Ауд. 224',
      floor: 2,
      wing: 'Западное крыло (К5)',
      color: '#005a7a'
    };
  }
  if (cx === -3 && cz === 0) {
    return {
      name: 'Ауд. 225: Компьютерный класс веб-разработки (РИП)',
      type: 'computer_class',
      roomCode: 'Ауд. 225',
      floor: 2,
      wing: 'Западное крыло (К5)',
      color: '#005a7a'
    };
  }
  if (cx === -3 && cz === -1) {
    return {
      name: 'Ауд. 226: Серверная и Канцелярия К5',
      type: 'server_room',
      roomCode: 'Ауд. 226',
      floor: 2,
      wing: 'Западное крыло (К5)',
      color: '#005a7a'
    };
  }

  // North Wing: Fundamental Sciences (FN) & Mathematics
  if (cx === 0 && cz === -2) {
    return {
      name: 'Кафедра ФН: Ауд. 404 — Поточная аудитория Матанализа (Ф.Х. Ахметова)',
      type: 'math_lecture',
      roomCode: 'Ауд. 404',
      floor: 4,
      wing: 'Северное крыло (ФН)',
      color: '#bd93f9'
    };
  }
  if (cx === -1 && cz === -2) {
    return {
      name: 'Ауд. 419: Поточная лекционная аудитория (Высшая математика)',
      type: 'lecture_hall',
      roomCode: 'Ауд. 419',
      floor: 4,
      wing: 'Северное крыло (ФН)',
      color: '#bd93f9'
    };
  }
  if (cx === 1 && cz === -2) {
    return {
      name: 'Университетская Научная Библиотека & Читальный Зал',
      type: 'library',
      roomCode: 'Библиотека',
      floor: 2,
      wing: 'Северное крыло',
      color: '#ffb86c'
    };
  }
  if (cx === 0 && cz === -3) {
    return {
      name: 'Ауд. 421: Кафедральный семинар теории функций',
      type: 'seminar_room',
      roomCode: 'Ауд. 421',
      floor: 4,
      wing: 'Северное крыло (ФН)',
      color: '#bd93f9'
    };
  }

  // East Wing: Photonics, Laser Physics & Departments K1, K2
  if (cx === 2 && cz === 0) {
    return {
      name: 'Ауд. 279: Лаборатория Фотоники и Лазеров (В.М. Коршунов)',
      type: 'photonics_lab',
      roomCode: 'Ауд. 279',
      floor: 2,
      wing: 'Восточное крыло (Фотоника)',
      color: '#50fa7b'
    };
  }
  if (cx === 2 && cz === -1) {
    return {
      name: 'Ауд. 275: Лаборатория люминесценции и спектроскопии лантаноидов',
      type: 'laser_lab',
      roomCode: 'Ауд. 275',
      floor: 2,
      wing: 'Восточное крыло',
      color: '#50fa7b'
    };
  }
  if (cx === 3 && cz === 0) {
    return {
      name: 'Кафедра К1: Системы автоматического управления',
      type: 'dep_k1',
      roomCode: 'Кафедра К1',
      floor: 2,
      wing: 'Восточное крыло (К1)',
      color: '#50fa7b'
    };
  }
  if (cx === 3 && cz === -1) {
    return {
      name: 'Кафедра К2: Информационно-измерительные системы',
      type: 'dep_k2',
      roomCode: 'Кафедра К2',
      floor: 2,
      wing: 'Восточное крыло (К2)',
      color: '#50fa7b'
    };
  }

  // South Wing: Administration & Scientific Council Hall (Учёный совет)
  if (cx === 0 && cz === 2) {
    return {
      name: 'Ауд. 223: Зал заседаний Учёного совета МГТУ им. Н.Э. Баумана',
      type: 'council_hall',
      roomCode: 'Ауд. 223',
      floor: 2,
      wing: 'Южное крыло (Администрация)',
      color: '#ff5555'
    };
  }
  if (cx === -1 && cz === 2) {
    return {
      name: 'Ауд. 205: Кабинет Директора МФ МГТУ им. Баумана',
      type: 'director_office',
      roomCode: 'Ауд. 205',
      floor: 2,
      wing: 'Южное крыло (Директорат)',
      color: '#ed9337'
    };
  }
  if (cx === 1 && cz === 2) {
    return {
      name: 'Ауд. 208/213: Приёмная и кабинет советника ректора МГТУ',
      type: 'rector_office',
      roomCode: 'Ауд. 208',
      floor: 2,
      wing: 'Южное крыло (Ректорат)',
      color: '#ed9337'
    };
  }
  if (cx === 0 && cz === 3) {
    return {
      name: 'Актовый Конференц-Зал МГТУ им. Баумана',
      type: 'conference_hall',
      roomCode: 'Актовый зал',
      floor: 2,
      wing: 'Южное крыло',
      color: '#ff79c6'
    };
  }

  // History Museum & Tower
  if (cx === -2 && cz === 2) {
    return {
      name: 'Музей Истории Инженерии МГТУ (Геродот Галикарнасский)',
      type: 'history_museum',
      roomCode: 'Музей МГТУ',
      floor: 1,
      wing: 'Юго-западный флигель',
      color: '#f1fa8c'
    };
  }
  if (cx === 2 && cz === 2) {
    return {
      name: 'Высотная Астрономическая Обсерватория МГТУ',
      type: 'observatory',
      roomCode: 'Обсерватория',
      floor: 5,
      wing: 'Юго-восточная башня',
      color: '#8be9fd'
    };
  }

  // Main Corridors & Galleries connecting all wings
  if (cz === 0 && Math.abs(cx) <= 4) {
    return {
      name: 'Главная Поперечная Галерея ГУК (Коридор 2-го этажа)',
      type: 'corridor_h',
      roomCode: 'Галерея-X',
      floor: 2,
      wing: 'Центральный переход',
      color: '#6272a4'
    };
  }
  if (cx === 0 && Math.abs(cz) <= 4) {
    return {
      name: 'Центральная Продольная Галерея ГУК (Парадный переход)',
      type: 'corridor_v',
      roomCode: 'Галерея-Z',
      floor: 2,
      wing: 'Центральный переход',
      color: '#6272a4'
    };
  }
  if (cz === -2 && Math.abs(cx) <= 3) {
    return {
      name: 'Северный Коридор кафедр фундаментальных наук (ФН)',
      type: 'corridor_h',
      roomCode: 'Коридор-ФН',
      floor: 4,
      wing: 'Северное крыло',
      color: '#6272a4'
    };
  }
  if (cz === 2 && Math.abs(cx) <= 3) {
    return {
      name: 'Южный Коридор Директората и Учёного Совета',
      type: 'corridor_h',
      roomCode: 'Коридор-Юг',
      floor: 2,
      wing: 'Южное крыло',
      color: '#6272a4'
    };
  }

  // Courtyards between wings
  if ((cx === -1 || cx === 1) && (cz === -1 || cz === 1)) {
    return {
      name: 'Внутренний Дворик Кампуса (Сад МГТУ им. Баумана)',
      type: 'courtyard',
      roomCode: 'Дворик',
      floor: 1,
      wing: 'Внутренний двор',
      color: '#50fa7b'
    };
  }

  // Campus Grounds & Academic Parks
  return {
    name: 'Кампус МГТУ им. Н.Э. Баумана (Парк & Аллеи инженеров)',
    type: 'campus_grounds',
    roomCode: 'Кампус',
    floor: 1,
    wing: 'Территория',
    color: '#44475a'
  };
}

// Pseudo-random hash for deterministic decoration
function hash2(x, z) {
  let h = (x * 374761393 + z * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// Generate static chunk payload representing real collegiate architecture
export function generateChunk(cx, cz) {
  const zone = getZoneMeta(cx, cz);
  const chunkId = `chunk_${cx}_${cz}`;
  const originX = cx * CHUNK_SIZE;
  const originZ = cz * CHUNK_SIZE;

  const objects = [];

  // 1. Floor
  objects.push({
    type: 'floor',
    x: originX,
    y: 0,
    z: originZ,
    width: CHUNK_SIZE,
    depth: CHUNK_SIZE,
    zoneType: zone.type
  });

  // 2. Ceilings and Corridor Lamps
  if (zone.type !== 'courtyard' && zone.type !== 'campus_grounds') {
    objects.push({
      type: 'ceiling_lamp',
      x: originX,
      y: 5.2,
      z: originZ
    });
  }

  // 3. Walls & Architectural Structure according to Room / Corridor Type
  const half = CHUNK_SIZE / 2; // 12m
  const seed = hash2(cx, cz);

  if (zone.type === 'foyer') {
    // Central Foyer: turnstiles, monumental columns, staircase, information stand
    objects.push({ type: 'turnstile', x: originX - 4, y: 0, z: originZ + 5, rotY: 0 });
    objects.push({ type: 'turnstile', x: originX,     y: 0, z: originZ + 5, rotY: 0 });
    objects.push({ type: 'turnstile', x: originX + 4, y: 0, z: originZ + 5, rotY: 0 });

    objects.push({ type: 'pillar', x: originX - 6, y: 3, z: originZ - 4, height: 6 });
    objects.push({ type: 'pillar', x: originX + 6, y: 3, z: originZ - 4, height: 6 });
    objects.push({ type: 'pillar', x: originX - 6, y: 3, z: originZ + 4, height: 6 });
    objects.push({ type: 'pillar', x: originX + 6, y: 3, z: originZ + 4, height: 6 });

    objects.push({
      type: 'signpost',
      x: originX,
      y: 2.8,
      z: originZ - 10,
      rotY: 0,
      text: '← Кафедра К5 (ИУ5) • Ауд. 227  |  Учёный Совет • Ауд. 223 →'
    });
  } else if (zone.type === 'corridor_h') {
    // Horizontal Corridor (East-West): north and south walls with doorways
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ - 5, width: CHUNK_SIZE, height: 5, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ + 5, width: CHUNK_SIZE, height: 5, depth: 0.4, rotY: 0 });
    // Doorway cutouts with plaques

    objects.push({ type: 'door', x: originX - 5, y: 1.3, z: originZ - 4.8, rotY: 0, roomNumber: '224', label: 'Кафедра К5' });
    objects.push({ type: 'door', x: originX + 5, y: 1.3, z: originZ + 4.8, rotY: Math.PI, roomNumber: '225', label: 'Учебная' });
    objects.push({ type: 'torch', x: originX, y: 2.2, z: originZ - 4.7 });
  } else if (zone.type === 'corridor_v') {
    // Vertical Gallery (North-South): west and east walls
    objects.push({ type: 'wall', x: originX - 5, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'wall', x: originX + 5, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'arch', x: originX, y: 2.8, z: originZ, rotY: 0 });
    objects.push({ type: 'torch', x: originX - 4.7, y: 2.2, z: originZ });
  } else if (zone.type === 'k5_office' || zone.type === 'k5_lab') {
    // Department K5: Server racks, desks, network switches, blackboard
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ - half + 0.2, width: CHUNK_SIZE, height: 5, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    // Doorway into corridor
    objects.push({ type: 'door', x: originX, y: 1.3, z: originZ + half - 0.2, rotY: 0, roomNumber: zone.roomCode, label: zone.name });

    objects.push({ type: 'server_rack', x: originX - 6, y: 0, z: originZ - 4, rotY: 0 });
    objects.push({ type: 'server_rack', x: originX - 4, y: 0, z: originZ - 4, rotY: 0 });
    objects.push({ type: 'desk_row', x: originX + 3, y: 0, z: originZ - 2, rotY: 0 });
    objects.push({ type: 'blackboard', x: originX, y: 2.0, z: originZ - half + 0.5, rotY: 0, formulaType: 'rip_network' });
  } else if (zone.type === 'math_lecture' || zone.type === 'lecture_hall') {
    // Mathematics Lecture Hall: rows of student desks, large blackboard
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ - half + 0.2, width: CHUNK_SIZE, height: 5, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: 1.3, z: originZ + half - 0.2, rotY: 0, roomNumber: zone.roomCode, label: 'Высшая Математика ФН' });

    objects.push({ type: 'blackboard', x: originX, y: 2.2, z: originZ - half + 0.5, rotY: 0, formulaType: 'math_analysis' });
    objects.push({ type: 'desk_row', x: originX, y: 0, z: originZ - 2, rotY: 0 });
    objects.push({ type: 'desk_row', x: originX, y: 0, z: originZ + 2, rotY: 0 });
    objects.push({ type: 'desk_row', x: originX, y: 0, z: originZ + 6, rotY: 0 });
  } else if (zone.type === 'photonics_lab' || zone.type === 'laser_lab') {
    // Photonics / Physics Lab: Laser benches, optics tables, glowing phosphor flasks
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ - half + 0.2, width: CHUNK_SIZE, height: 5, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: 1.3, z: originZ + half - 0.2, rotY: 0, roomNumber: zone.roomCode, label: 'Фотоника ФН' });

    objects.push({ type: 'laser_bench', x: originX - 4, y: 0, z: originZ, rotY: 0 });
    objects.push({ type: 'laser_bench', x: originX + 4, y: 0, z: originZ, rotY: 0 });
    objects.push({ type: 'blackboard', x: originX, y: 2.0, z: originZ - half + 0.5, rotY: 0, formulaType: 'photonics_stokes' });
  } else if (zone.type === 'council_hall' || zone.type === 'director_office') {
    // Council Hall: Oval table, oak armchairs, Bauman emblem
    objects.push({ type: 'wall', x: originX, y: 2.5, z: originZ - half + 0.2, width: CHUNK_SIZE, height: 5, depth: 0.4, rotY: 0 });
    objects.push({ type: 'wall', x: originX - half + 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'wall', x: originX + half - 0.2, y: 2.5, z: originZ, width: 0.4, height: 5, depth: CHUNK_SIZE, rotY: 0 });
    objects.push({ type: 'door', x: originX, y: 1.3, z: originZ + half - 0.2, rotY: 0, roomNumber: '223', label: 'Учёный Совет' });

    objects.push({ type: 'council_table', x: originX, y: 0, z: originZ });
    objects.push({ type: 'pillar', x: originX - 6, y: 3, z: originZ - 6, height: 6 });
    objects.push({ type: 'pillar', x: originX + 6, y: 3, z: originZ - 6, height: 6 });
  } else if (zone.type === 'library') {
    // Scientific Library: Tall bookshelves
    objects.push({ type: 'bookshelf', x: originX - 6, y: 2.5, z: originZ - 4 });
    objects.push({ type: 'bookshelf', x: originX - 6, y: 2.5, z: originZ + 4 });
    objects.push({ type: 'bookshelf', x: originX + 6, y: 2.5, z: originZ - 4 });
    objects.push({ type: 'bookshelf', x: originX + 6, y: 2.5, z: originZ + 4 });
    objects.push({ type: 'desk_row', x: originX, y: 0, z: originZ, rotY: 0 });
  } else if (zone.type === 'history_museum') {
    // History Museum: Ancient obelisks, manuscripts
    objects.push({ type: 'obelisk', x: originX - 3, y: 2, z: originZ, label: 'Летописи Бауманки' });
    objects.push({ type: 'obelisk', x: originX + 3, y: 2, z: originZ, label: 'Механика Античности' });
    objects.push({ type: 'bookshelf', x: originX, y: 2.5, z: originZ - 6 });
  } else if (zone.type === 'observatory') {
    // Astronomical Observatory
    objects.push({ type: 'telescope', x: originX, y: 1.5, z: originZ });
    objects.push({ type: 'pillar', x: originX - 5, y: 3, z: originZ - 5, height: 6 });
    objects.push({ type: 'pillar', x: originX + 5, y: 3, z: originZ + 5, height: 6 });
  } else if (zone.type === 'courtyard') {
    // Courtyard: Park benches, trees/pillars, paving stones
    objects.push({ type: 'pillar', x: originX - 5, y: 3, z: originZ - 5, height: 6 });
    objects.push({ type: 'pillar', x: originX + 5, y: 3, z: originZ + 5, height: 6 });
  }

  // 4. Halloween Pumpkins & Warm Lanterns throughout the building
  if (seed > 0.25) {
    objects.push({
      type: 'pumpkin',
      x: originX + (seed * 10 - 5),
      y: 0.35,
      z: originZ + (((seed * 17) % 10) - 5),
      glowing: true
    });
  }
  if (seed > 0.55 && zone.type !== 'courtyard' && zone.type !== 'campus_grounds') {
    objects.push({
      type: 'torch',
      x: originX + (((seed * 13) % 8) - 4),
      y: 2.2,
      z: originZ + (((seed * 19) % 8) - 4)
    });
  }

  // NPCs in this chunk
  const npcsInChunk = NPCS.filter(npc => npc.chunkX === cx && npc.chunkZ === cz);

  return {
    id: chunkId,
    cx,
    cz,
    zoneName: zone.name,
    roomCode: zone.roomCode,
    floor: zone.floor,
    wing: zone.wing,
    color: zone.color,
    objects,
    npcs: npcsInChunk
  };
}

// Convert world coordinates to chunk coordinates
export function worldToChunkCoord(x, z) {
  return {
    cx: Math.round(x / CHUNK_SIZE),
    cz: Math.round(z / CHUNK_SIZE)
  };
}

// Helper: Get real-time building location name for any (x, z)
export function getBuildingLocation(x, z) {
  const { cx, cz } = worldToChunkCoord(x, z);
  return getZoneMeta(cx, cz);
}

// Pre-generate all 100 chunks of the building for fast LAN streaming
export const allChunksMap = new Map();
for (let cx = -5; cx < 5; cx++) {
  for (let cz = -5; cz < 5; cz++) {
    const chunk = generateChunk(cx, cz);
    allChunksMap.set(`${cx},${cz}`, chunk);
  }
}

export function getChunk(cx, cz) {
  return allChunksMap.get(`${cx},${cz}`) || null;
}
