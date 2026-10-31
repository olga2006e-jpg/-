// Single-level educational pavilion. The server retains a 10×10 sector world.
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
// Four clues, all reachable on the single exhibition floor.
export const COLLECTIBLE_ITEMS = [
    { id: 'hourglass_relativity', name: 'Формула времени', type: 'artifact', subType: 'hourglass', chunkX: 0, chunkZ: 0, x: 5, y: 0.8, z: -5, clue: 'Первая цифра: 2 — степень в E=mc².', icon: '⏳' },
    { id: 'papyrus_egypt', name: 'Архив инженеров', type: 'artifact', subType: 'scroll', chunkX: -1, chunkZ: 0, x: -20, y: 0.8, z: 5, clue: 'Вторая цифра: 3 — три великие пирамиды Гизы.', icon: '📜' },
    { id: 'radium_flask', name: 'Свет лаборатории', type: 'artifact', subType: 'flask', chunkX: 1, chunkZ: 0, x: 20, y: 0.8, z: 5, clue: 'Третья цифра: 2 — группа радия.', icon: '🧪' },
    { id: 'crypt_scroll', name: 'Последняя теорема', type: 'artifact', subType: 'scroll', chunkX: 0, chunkZ: -1, x: 5, y: 0.8, z: -20, clue: 'Четвёртая цифра: 7. Соберите код и откройте сейф в холле.', icon: '📜' }
];
const places = { einstein: [0, 0, 0, -5], herodotus: [0, 0, -6, 4], kanev: [-1, 0, -25, -4], korshunov: [1, 0, 25, -4], akhmetova: [0, -1, 0, -27] };
for (let i = NPCS.length - 1; i >= 0; i--)
    if (!places[NPCS[i].id])
        NPCS.splice(i, 1);
for (const npc of NPCS) {
    const [cx, cz, x, z] = places[npc.id];
    Object.assign(npc, { chunkX: cx, chunkZ: cz, x, z, y: 0.8 });
    npc.role = npc.id === 'kanev' ? '01 / Цифровая лаборатория' : npc.id === 'korshunov' ? '03 / Лаборатория света' : npc.id === 'akhmetova' ? '02 / Математическая гостиная' : '00 / Центральный холл';
}
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
    }
    else if (doorSide === 'south') {
        const wallZ = originZ + half - 0.2;
        objects.push({ type: 'wall', x: originX - 6.55, y: baseY + 2.5, z: wallZ, width: segW, height: wallH, depth: wallD, rotY: 0 });
        objects.push({ type: 'wall', x: originX + 6.55, y: baseY + 2.5, z: wallZ, width: segW, height: wallH, depth: wallD, rotY: 0 });
        objects.push({ type: 'wall', x: originX, y: baseY + 3.85, z: wallZ, width: 2.2, height: 2.3, depth: wallD, rotY: 0 });
        objects.push({ type: 'door', x: originX, y: baseY + 1.35, z: wallZ, rotY: 0, roomNumber: doorNumber, label: doorLabel });
    }
    else if (doorSide === 'east') {
        const wallX = originX + half - 0.2;
        objects.push({ type: 'wall', x: wallX, y: baseY + 2.5, z: originZ - 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
        objects.push({ type: 'wall', x: wallX, y: baseY + 2.5, z: originZ + 6.55, width: wallD, height: wallH, depth: segW, rotY: 0 });
        objects.push({ type: 'wall', x: wallX, y: baseY + 3.85, z: originZ, width: wallD, height: 2.3, depth: 2.2, rotY: 0 });
        objects.push({ type: 'door', x: wallX, y: baseY + 1.35, z: originZ, rotY: -Math.PI / 2, roomNumber: doorNumber, label: doorLabel });
    }
    else if (doorSide === 'west') {
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
const ROOMS = {
    '0,0': { name: 'Центральный холл', type: 'foyer', code: '00' },
    '-1,0': { name: 'Цифровая лаборатория', type: 'k5_lab', code: '01', side: 'east' },
    '0,-1': { name: 'Математическая гостиная', type: 'math_lecture', code: '02', side: 'south' },
    '1,0': { name: 'Лаборатория света', type: 'photonics_lab', code: '03', side: 'west' }
};
export function getZoneMeta(cx, cz) {
    const r = ROOMS[`${cx},${cz}`];
    return { name: r?.name || 'Внешний двор', type: r?.type || 'courtyard', roomCode: r?.code || 'Двор', floor: 1, wing: 'Учебный павильон', color: '#d9b978' };
}

// Global synchronized state for movable/relocated props
export const movedProps = new Map(); // propId -> { x, y, z, rotY, isHeld, heldBy }

export function pickupProp(propId, heldBy) {
    const existing = movedProps.get(propId) || {};
    movedProps.set(propId, { ...existing, isHeld: true, heldBy });
    return true;
}

export function placeProp(propId, x, y, z, rotY = 0, heldBy = null) {
    movedProps.set(propId, { x, y, z, rotY, isHeld: false, heldBy: null });
    return true;
}

export function getMovedProps() {
    return Array.from(movedProps.entries()).map(([id, data]) => ({ id, ...data }));
}
export function generateChunk(cx, cz) {
    if (!Number.isInteger(cx) || !Number.isInteger(cz) || cx < -5 || cx > 4 || cz < -5 || cz > 4)
        return null;
    const x = cx * 24, z = cz * 24, zone = getZoneMeta(cx, cz), room = ROOMS[`${cx},${cz}`];
    const objects = [{ type: 'floor', x, y: 0, z, width: 24, depth: 24, zoneType: zone.type }];
    if (room) {
        objects.push({ type: 'ceiling', x, y: 5, z, width: 24, depth: 24 }, { type: 'ceiling_lamp', x, y: 4.85, z });
        if (room.side)
            buildRoom(objects, x, z, 12, room.side, room.code, room.name, [], 0);
        else {
            // Three wide portals connect the hub to the classrooms without stairs.
            for (const side of ['north', 'west', 'east']) {
                const vertical = side !== 'north', edge = side === 'west' ? -11.8 : 11.8;
                for (const offset of [-7.5, 7.5])
                    objects.push({ type: 'wall', x: vertical ? edge : offset, y: 2.5, z: vertical ? offset : -11.8, width: vertical ? 0.4 : 9, height: 5, depth: vertical ? 9 : 0.4 });
            }
            objects.push({ type: 'wall', x: 0, y: 2.5, z: 11.8, width: 24, height: 5, depth: 0.4 });
            objects.push({ type: 'founders_safe', x: 7, y: 0, z: 7, rotY: Math.PI });
            for (const px of [-8, 8])
                objects.push({ type: 'pillar', x: px, y: 2.5, z: 8, height: 5 });
            objects.push({ type: 'signpost', x: 0, y: 3.5, z: -11.5, rotY: 0, text: '02  /  МАТЕМАТИКА' });
            objects.push({ type: 'signpost', x: -11.5, y: 3.5, z: 0, rotY: Math.PI / 2, text: '01  /  ТЕХНОЛОГИИ' });
            objects.push({ type: 'signpost', x: 11.5, y: 3.5, z: 0, rotY: -Math.PI / 2, text: '03  /  СВЕТ' });
            for (const px of [-7])
                objects.push({ type: 'bench', x: px, y: 0, z: 9.5, rotY: 0 });
            objects.push(
                { id: 'pumpkin_hub_1', type: 'pumpkin', x: 5.8, y: 0.35, z: 8.4, glowing: true, isMovable: true, label: 'Тыква-фонарь' },
                { id: 'pumpkin_hub_2', type: 'pumpkin', x: -6.5, y: 0.35, z: 6.8, glowing: true, isMovable: true, label: 'Тыква-фонарь' },
                { id: 'pumpkin_hub_3', type: 'pumpkin', x: 0, y: 0.35, z: 9.8, glowing: true, isMovable: true, label: 'Большая Тыква' },
                { id: 'pumpkin_hub_4', type: 'pumpkin', x: -3.5, y: 0.35, z: 2.5, glowing: true, isMovable: true, label: 'Тыква-фонарь' },
                { id: 'pumpkin_hub_5', type: 'pumpkin', x: 3.5, y: 0.35, z: 2.5, glowing: true, isMovable: true, label: 'Тыква-фонарь' },
                { id: 'tome_hub_bench', type: 'tome', x: -7, y: 0.5, z: 9.5, isMovable: true, label: 'Гримуар Основателей' },
                { id: 'tome_hub_safe', type: 'tome', x: 7, y: 1.4, z: 7, isMovable: true, label: 'Летопись 1830 года' },
                { id: 'flask_hub_1', type: 'flask', x: -2, y: 0.3, z: 7, isMovable: true, label: 'Эликсир Мудрости', color: 0x50fa7b },
                { id: 'flask_hub_2', type: 'flask', x: 2, y: 0.3, z: 7, isMovable: true, label: 'Зелье Призрачного Огня', color: 0xff79c6 },
                { id: 'skull_hub_1', type: 'skull', x: -5, y: 0.3, z: 4, isMovable: true, label: 'Хрустальный Череп' },
                { id: 'skull_hub_2', type: 'skull', x: 5, y: 0.3, z: 4, isMovable: true, label: 'Аметистовый Череп' },
                { id: 'candelabra_hub_1', type: 'candelabra', x: -4, y: 0, z: -1, isMovable: true, label: 'Бронзовый Канделябр' },
                { id: 'candelabra_hub_2', type: 'candelabra', x: 4, y: 0, z: -1, isMovable: true, label: 'Золотой Канделябр' },
                { id: 'crystal_hub_1', type: 'crystal', x: 0, y: 0.3, z: 3, isMovable: true, label: 'Магический Кристалл', color: 0x8be9fd },
                { type: 'torch', x: -4, y: 2.4, z: 11.2 },
                { type: 'torch', x: 4, y: 2.4, z: 11.2 },
                { type: 'lantern', x: -2.5, y: 0, z: 10.2 },
                { type: 'lantern', x: 2.5, y: 0, z: 10.2 },
                { type: 'lantern', x: -7.5, y: 0, z: -2.5 },
                { type: 'lantern', x: 7.5, y: 0, z: -2.5 },
                { type: 'lantern', x: -3.5, y: 0, z: -8.5 },
                { type: 'lantern', x: 3.5, y: 0, z: -8.5 },
                { type: 'lantern', x: 7, y: 0, z: 4.5 },
                { type: 'floating_candle', x: 0, y: 2.8, z: 0 },
                { type: 'floating_candle', x: -3.5, y: 2.6, z: -3.5 },
                { type: 'floating_candle', x: 3.5, y: 2.9, z: -3.5 },
                { type: 'cobweb', x: -11.2, y: 4.4, z: 11.2, rotY: 0 },
                { type: 'cobweb', x: 11.2, y: 4.4, z: 11.2, rotY: Math.PI / 2 }
            );
        }
        const positions = [[-8, -8], [8, -8], [8, 8], [-8, 8]];
        for (let i = 0; i < positions.length; i++) {
            const [dx, dz] = positions[i];
            objects.push({ id: `pumpkin_corner_${cx}_${cz}_${i}`, type: 'pumpkin', x: x + dx, y: 0.35, z: z + dz, glowing: true, isMovable: true, label: 'Угловая Тыква' });
        }
        if (cx === -1) {
            objects.push({ type: 'blackboard', x: x - 10, y: 2.3, z, rotY: Math.PI / 2, formulaType: 'software_engineering' });
            for (const dz of [-7, 7])
                objects.push({ type: 'server_rack', x: x - 8, y: 0, z: z + dz, rotY: Math.PI / 2 });
            objects.push({ type: 'teacher_desk', x: x - 5, y: 0, z: z - 7, rotY: 0 });
            objects.push(
                { id: 'pumpkin_tech_1', type: 'pumpkin', x: x - 4.2, y: 1.0, z: z - 7, glowing: true, isMovable: true, label: 'Тыква на кафедре' },
                { id: 'pumpkin_tech_2', type: 'pumpkin', x: x - 8, y: 0.35, z: z - 2, glowing: true, isMovable: true, label: 'Тыква-фонарь' },
                { id: 'tome_tech_1', type: 'tome', x: x - 5, y: 0.8, z: z - 7, isMovable: true, label: 'Фолиант Архитектуры ЭВМ' },
                { id: 'tome_tech_2', type: 'tome', x: x - 3, y: 0.8, z: z - 7, isMovable: true, label: 'Манускрипт Алгоритмов' },
                { id: 'flask_tech_1', type: 'flask', x: x - 7, y: 0.3, z: z + 2, isMovable: true, label: 'Квантовая Плазма', color: 0x8be9fd },
                { id: 'skull_tech_1', type: 'skull', x: x - 6, y: 0.3, z: z - 4, isMovable: true, label: 'Кибер-Череп' },
                { id: 'crystal_tech_1', type: 'crystal', x: x - 2, y: 0.3, z: z + 5, isMovable: true, label: 'Кристалл Данных', color: 0x50fa7b },
                { id: 'candelabra_tech_1', type: 'candelabra', x: x - 5, y: 0.8, z: z - 6, isMovable: true, label: 'Канделябр Серверной' },
                { type: 'torch', x: x - 11.4, y: 2.4, z },
                { type: 'lantern', x: x - 4, y: 0, z },
                { type: 'floating_candle', x: x - 2, y: 2.8, z },
                { type: 'cobweb', x: x - 11.2, y: 4.4, z: z - 11.2, rotY: 0 },
                { type: 'cobweb', x: x - 11.2, y: 4.4, z: z + 11.2, rotY: Math.PI / 2 }
            );
        }
        else if (cx === 1) {
            objects.push({ type: 'laser_bench', x: x + 6, y: 0, z: z + 5, rotY: 0 }, { type: 'telescope', x: x + 7, y: 0, z: z - 7 });
            objects.push(
                { id: 'pumpkin_light_1', type: 'pumpkin', x: x + 5.5, y: 1.1, z: z + 5, glowing: true, isMovable: true, label: 'Тыква на оптическом столе' },
                { id: 'pumpkin_light_2', type: 'pumpkin', x: x + 8.2, y: 0.35, z: z - 5.5, glowing: true, isMovable: true, label: 'Тыква у телескопа' },
                { id: 'tome_light_1', type: 'tome', x: x + 6, y: 0.9, z: z + 5, isMovable: true, label: 'Трактат об Оптике' },
                { id: 'tome_light_2', type: 'tome', x: x + 4, y: 0.9, z: z + 5, isMovable: true, label: 'Теория Относительности' },
                { id: 'flask_light_1', type: 'flask', x: x + 7, y: 0.9, z: z + 4, isMovable: true, label: 'Люминесцентный Раствор', color: 0xffb86c },
                { id: 'skull_light_1', type: 'skull', x: x + 3, y: 0.3, z: z - 2, isMovable: true, label: 'Оптический Череп' },
                { id: 'crystal_light_1', type: 'crystal', x: x + 5, y: 0.3, z: z - 4, isMovable: true, label: 'Призма Преломления', color: 0xff79c6 },
                { id: 'candelabra_light_1', type: 'candelabra', x: x + 8, y: 0.3, z: z + 2, isMovable: true, label: 'Канделябр Фотоники' },
                { type: 'torch', x: x + 11.4, y: 2.4, z },
                { type: 'lantern', x: x + 4, y: 0, z },
                { type: 'floating_candle', x: x + 3.5, y: 2.8, z },
                { type: 'cobweb', x: x + 11.2, y: 4.4, z: z - 11.2, rotY: 0 },
                { type: 'cobweb', x: x + 11.2, y: 4.4, z: z + 11.2, rotY: Math.PI / 2 }
            );
        }
        else if (cz === -1) {
            objects.push({ type: 'blackboard', x, y: 2.3, z: z - 10, rotY: 0, formulaType: 'math_analysis' });
            for (const dx of [-8, 8])
                objects.push({ type: 'bookshelf', x: x + dx, y: 0, z: z - 7 });
            objects.push({ type: 'desk_row', x: x - 6, y: 0, z: z + 6, rotY: 0 });
            objects.push(
                { id: 'pumpkin_math_1', type: 'pumpkin', x: x - 5.5, y: 1.0, z: z + 6, glowing: true, isMovable: true, label: 'Тыква на парте' },
                { id: 'pumpkin_math_2', type: 'pumpkin', x: x + 7.5, y: 0.35, z: z - 5, glowing: true, isMovable: true, label: 'Тыква у шкафа' },
                { id: 'tome_math_1', type: 'tome', x: x - 6, y: 0.8, z: z + 6, isMovable: true, label: 'Математический Гримуар' },
                { id: 'tome_math_2', type: 'tome', x: x - 4, y: 0.8, z: z + 6, isMovable: true, label: 'Скрижали Дифференциалов' },
                { id: 'tome_math_3', type: 'tome', x: x + 8, y: 1.1, z: z - 7, isMovable: true, label: 'Неевклидова Геометрия' },
                { id: 'skull_math_1', type: 'skull', x: x - 2, y: 0.3, z: z + 4, isMovable: true, label: 'Череп Архимеда' },
                { id: 'flask_math_1', type: 'flask', x: x + 6, y: 0.3, z: z + 2, isMovable: true, label: 'Экстракт Бесконечности', color: 0xbd93f9 },
                { id: 'crystal_math_1', type: 'crystal', x: x + 2, y: 0.3, z: z - 3, isMovable: true, label: 'Кристалл Топологии', color: 0x50fa7b },
                { id: 'candelabra_math_1', type: 'candelabra', x: x - 6, y: 0.8, z: z + 5, isMovable: true, label: 'Канделябр Архива' },
                { type: 'torch', x, y: 2.4, z: z - 11.4 },
                { type: 'lantern', x, y: 0, z: z - 4 },
                { type: 'floating_candle', x, y: 3.0, z: z - 2 },
                { type: 'cobweb', x: x - 11.2, y: 4.4, z: z - 11.2, rotY: 0 },
                { type: 'cobweb', x: x + 11.2, y: 4.4, z: z - 11.2, rotY: Math.PI / 2 }
            );
        }
    }
    else {
        // Server world still has 100 genuine sectors; the focused interior uses four.
        objects.push(
            { type: 'pillar', x: x - 8, y: 2.5, z: z - 8, height: 5 },
            { type: 'bench', x: x + 5, y: 0, z: z + 5, rotY: 0 },
            { type: 'pumpkin', x: x + 3, y: 0.35, z: z - 3, glowing: true },
            { type: 'lantern', x: x, y: 0, z: z }
        );
    }
    for (const item of COLLECTIBLE_ITEMS)
        if (item.chunkX === cx && item.chunkZ === cz)
            objects.push({ ...item });

    // Override object coordinates if moved/relocated by player
    for (const obj of objects) {
        if (obj.id && movedProps.has(obj.id)) {
            const m = movedProps.get(obj.id);
            obj.x = m.x;
            obj.y = m.y;
            obj.z = m.z;
            if (m.rotY !== undefined) obj.rotY = m.rotY;
            if (m.isHeld) obj.isHeld = true;
        }
    }
    return { id: `chunk_${cx}_${cz}`, cx, cz, zoneName: zone.name, zoneType: zone.type, floor: 1, wing: zone.wing, color: zone.color, objects, npcs: NPCS.filter(n => n.chunkX === cx && n.chunkZ === cz) };
}
export function worldToChunkCoord(x, z) {
    return { cx: Math.round(x / 24), cz: Math.round(z / 24) };
}

// Canonical deterministic JSON serializer for byte-accurate chunk sizing
export function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

// Precompute canonical chunk byte sizes for all 100 chunks without runtime world dumps
const chunkByteSizeMap = new Map();
let totalCanonicalBytes = 0;

for (let cx = -5; cx <= 4; cx++) {
  for (let cz = -5; cz <= 4; cz++) {
    const rawChunk = generateChunk(cx, cz);
    const serialized = canonicalStringify(rawChunk);
    const size = Buffer.byteLength(serialized, 'utf-8');
    chunkByteSizeMap.set(`${cx},${cz}`, size);
    totalCanonicalBytes += size;
  }
}

export const TOTAL_WORLD_CANONICAL_BYTES = totalCanonicalBytes;

export function getChunkByteSize(cx, cz) {
  const key = `${cx},${cz}`;
  if (chunkByteSizeMap.has(key)) {
    return chunkByteSizeMap.get(key);
  }
  // Fallback for any dynamic coordinate
  const c = generateChunk(cx, cz);
  return Buffer.byteLength(canonicalStringify(c), 'utf-8');
}

// Alias for backwards compatibility with multiplayer.js
export function getChunk(cx, cz) {
  const chunk = generateChunk(cx, cz);
  if (!chunk) return null;
  const byteSize = getChunkByteSize(cx, cz);
  return {
    ...chunk,
    byteSize
  };
}
