# 🚀 РУКОВОДСТВО ПО ИНТЕГРАЦИИ ФРОНТЕНДА (ЗАДАНИЯ НА ВОСКРЕСЕНЬЕ)
> **Для разработчика / нейросети, обновляющей интерфейс (`client/`)**  
> Все бэкенд-сервисы, физический движок, процедурные анимированные 3D-модели, реактивные мобы и панель администратора **полностью реализованы, протестированы (10/10 тестов пройдено) и готовы к подключению**.

---

## 📌 Оглавление
1. [Панель администратора и отправка телеметрии (FPS + Ping)](#1-панель-администратора-и-телеметрия)
2. [Составные анимированные 3D-объекты (`animatedProps.js`)](#2-составные-анимированные-3d-объекты)
3. [Интерактивные объекты и физика бросков (`physics.js`)](#3-интерактивные-объекты-и-физика)
4. [Новый класс реактивных мобов — 40+ NPC (`reactiveMobs.js`)](#4-реактивные-мобы-40-npc)
5. [Изменение мира агентами (`WORLD_MUTATION`)](#5-изменение-мира-агентами-world_mutation)
6. [Готовый сниппет подключения в игровой цикл (3 минуты)](#6-готовый-сниппет-подключения)

---

## 1. Панель администратора и телеметрия

### 🌐 Доступ к панели
- **URL панели:** `http://localhost:3001/admin`
- Открывается в любом браузере. Выполнена в киберпанк/дарк-стиле.
- Позволяет в реальном времени:
  - Видеть сводную таблицу всех подключенных игроков с их **FPS, Ping, числом загруженных чанков, памятью и IP**.
  - Менять плотность тумана (`fogDensity`), освещение (`lightIntensity`), цвет фонового света (`ambientColor`), гравитацию (`gravity`) и погоду (`weather`).
  - Редактировать промпты, поведение и настроение агентов (`normal`, `helpful`, `strict`).
  - Вызывать динамические мутации мира (`SPAWN_LIGHT_BEAM`, `SPAWN_SERVER_RACK`, `SPAWN_PORTAL`).
  - Отправлять глобальные анонсы всем игрокам.

### 📡 Отправка телеметрии из клиента в WebSocket
Чтобы панель отображала реальные FPS и Ping каждого клиента, клиент отправляет раз в 1–2 секунды сообщение:

```javascript
// 1. Измерение Ping через PING-PONG
function measurePing(ws) {
  const pingStart = performance.now();
  
  const onPong = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'PONG') {
      const pingMs = Math.round(performance.now() - pingStart);
      ws.removeEventListener('message', onPong);
      
      // Отправляем телеметрию на сервер
      ws.send(JSON.stringify({
        type: 'CLIENT_TELEMETRY',
        fps: Math.round(currentFps),            // Число кадров/сек
        ping: pingMs,                           // Пинг в мс
        loadedChunks: chunkManager.loadedCount, // Кол-во активных чанков
        memoryMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 64
      }));
    }
  };

  ws.addEventListener('message', onPong);
  ws.send(JSON.stringify({ type: 'PING', time: pingStart }));
}

// Запускаем опрос каждые 2 секунды:
setInterval(() => measurePing(socket), 2000);
```

---

## 2. Составные анимированные 3D-объекты
**Файл модуля:** `client/src/animatedProps.js`

Все объекты собраны из иерархических сеток Three.js и **не требуют загрузки внешних тяжелых файлов**:

1. **`GrandfatherClock` (Старинные напольные часы):**
   - Корпус из темного ореха с резным карнизом и стеклянным смотровым окном.
   - **Маятник:** качается по гармоническому закону $\theta(t) = \theta_0 \sin(\omega t)$.
   - **Две шестерни за стеклом:** зацеплены и непрерывно вращаются в противоположные стороны согласно передаточному отношению.
   - **Стрелки циферблата:** часовая и минутная стрелки вращаются плавно.
2. **`ObservatoryTelescope` (Астрономический телескоп):**
   - Тяжелый латунный треножный штатив.
   - **Поворотная турель (азимут):** плавно сканирует сектор ночного неба.
   - **Труба оптическая (высота):** поднимается и опускается с отслеживанием созвездий.
   - **Маховик фокусировки:** вращается с боковой стороны.
   - **Линза:** мягко пульсирует сине-голубым свечением.
3. **`ArcaneGyroscope` (Арканный гироскоп / Оррери):**
   - Три концентрических латунных кольца (карданный подвес), вращающихся независимо вокруг трех взаимно перпендикулярных осей (X, Y, Z).
   - В центре парит левитирующий октаэдрический кристалл, меняющий масштаб и пульсирующий энергией.
4. **`AnimatedServerRack` (Серверная стойка лаборатории ИИ):**
   - 24 разноцветных светодиода активности, мерцающих с разной частотой.
   - 2 скоростных вытяжных вентилятора охлаждения сзади.

### 💻 Пример использования:
```javascript
import { AnimatedPropsManager } from './animatedProps.js';

// При инициализации сцены:
const animatedProps = new AnimatedPropsManager(scene);

// Автоматически расставляет все 4 составных объекта на территории кампуса:
animatedProps.spawnDefaultCampusProps();

// Внутри requestAnimationFrame(animate):
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  
  animatedProps.update(delta); // Анимирует все маятники, шестерни, гироскопы и диоды
  renderer.render(scene, camera);
}
```

---

## 3. Интерактивные объекты и физика
**Файл модуля:** `client/src/physics.js`

### 🎮 Возможности:
- **Баллистическая траектория броска** с гравитацией ($g = 9.8$) и сопротивлением воздуха.
- **Передача инерции движения игрока:** если игрок бежит вперед при броске, предмет летит быстрее и дальше!
- **Упругие отскоки от пола:** коэффициент упругости $e \approx 0.55$, боковое трение скольжения, реалистичное кувыркание (вращение по 3 осям).
- **Интерактивные двери:** плавное открытие/закрытие на дверных петлях при взаимодействии.
- **Взять / Положить / Бросить:**
  - `E` — взять предмет в руку или открыть/закрыть дверь перед собой.
  - `F` или клик — бросить удерживаемый предмет вперед с передачей инерции.

### 💻 Пример использования:
```javascript
import { PhysicsWorld } from './physics.js';

const physics = new PhysicsWorld(scene);
physics.setNetwork(networkClient); // Для передачи бросков по мультиплееру

// Спавн интерактивных предметов:
physics.createInteractiveProp('flask_1', 'flask', new THREE.Vector3(2, 0.2, 5));
physics.createInteractiveProp('orb_1', 'crystal_orb', new THREE.Vector3(7, 0.2, 7));
physics.createInteractiveProp('book_1', 'book', new THREE.Vector3(-3, 0.2, 8));

// Спавн интерактивной распашной двери:
physics.createInteractiveDoor('door_iu5', new THREE.Vector3(0, 0, -10), 0);

// Обработка клавиш:
window.addEventListener('keydown', (e) => {
  // Клавиша E: Подобрать предмет или открыть дверь
  if (e.code === 'KeyE') {
    const result = physics.interact(camera, myUsername);
    if (result) console.log('Взаимодействие:', result.action);
  }

  // Клавиша F: Бросить удерживаемый предмет вперед с силой и инерцией
  if (e.code === 'KeyF') {
    const playerVelocity = controls.getVelocity(); // Vector3 скорости ходьбы
    physics.throwHeldObject(camera, playerVelocity, 14.0);
  }
});

// В цикле animate():
physics.update(delta, camera);
```

---

## 4. Реактивные мобы (40+ NPC)
**Файл модуля:** `client/src/reactiveMobs.js`  
**Файл данных:** `server/mobs.js`

В отличие от разговорных AI-агентов, эти мобы реагируют на поведение игрока:
1. **15 Летучих мышей (`ReactiveBat`):**
   - Кружат под высокими сводами потолка, плавно взмахивая крыльями (12 Гц).
   - Если игрок приближается ближе 4 метров или включает фонарь (`lanternOn`), они пугаются (`state = 'FLEE'`), ускоряют взмахи до 24 Гц и взмывают вверх к потолку.
2. **15 Призрачных кошек (`ReactiveSpectralCat`):**
   - Сидят на скамейках и у подоконников, лениво помахивая хвостом.
   - **Динамический трекинг головы:** когда игрок проходит рядом, кошка плавно поворачивает голову и следит за ним глазами (`lookAt(player)`).
   - Если игрок бежит на спринте (`Shift`) или кидает рядом предмет, кошка испуганно прижимается и ощетинивается.
3. **10 Бродячих теней студентов (`ReactiveShadowStudent`):**
   - Силуэты в капюшонах, парящие вдоль книжных полок с левитирующим гримуаром.
   - **Реакция на разговор:** когда игрок пишет в чат или говорит с профессором, тень останавливается, поворачивается лицом к разговору (`state = 'LISTENING'`) и внимательно слушает.

### 💻 Пример использования:
```javascript
import { ReactiveMobsManager } from './reactiveMobs.js';
import { REACTIVE_MOBS } from '../../server/mobs.js'; // Список 40 мобов

const mobs = new ReactiveMobsManager(scene);
mobs.loadMobs(REACTIVE_MOBS);

// В цикле animate():
mobs.update(delta, camera.position, {
  isSprinting: keys.shiftDown,      // Бежит ли игрок
  lanternOn: isLanternActive,        // Включен ли фонарь
  isChatting: isChatInputFocused     // Говорит ли игрок в чате
});
```

---

## 5. Изменение мира агентами (`WORLD_MUTATION`)

Агенты Бауманки (Канев, Ахметова, Коршунов, Эйнштейн, Кюри) и Администратор умеют модифицировать 3D-пространство в ответ на диалоги пользователей!

### Примеры триггеров:
- Пользователь просит Канева осветить путь или решить задачу -> Канев призывает **Световой Маяк** к Сейфу Основателей.
- Администратор из панели нажимает «Призвать Серверную Стойку» или «Создать Портал».

### Сетевое событие:
Сервер отправляет по WebSocket:
```json
{
  "type": "WORLD_MUTATION",
  "mutationType": "SPAWN_LIGHT_BEAM",
  "x": 7,
  "y": 0,
  "z": 7,
  "author": "Канев Сергей Владимирович",
  "message": "✨ Канев призвал световой маяк к Сейфу Основателей!"
}
```

### Обработка на клиенте:
```javascript
// В обработчике ws.onmessage:
if (msg.type === 'WORLD_MUTATION') {
  // Спавнит 45-метровый небесный столб света с рунами или портал:
  animatedProps.mutationHandler.handleMutation(msg);
  
  // Показываем плашку в UI
  ui.showNotification(msg.message);
}
```

---

## 6. Готовый сниппет подключения

Если вы обновляете `main.js`, вот как всё подключается буквально в **несколько строк**:

```javascript
import { PhysicsWorld } from './physics.js';
import { AnimatedPropsManager } from './animatedProps.js';
import { ReactiveMobsManager } from './reactiveMobs.js';
import { REACTIVE_MOBS } from '../../server/mobs.js';

// 1. Инициализация в конструкторе
const physics = new PhysicsWorld(scene);
const animatedProps = new AnimatedPropsManager(scene);
animatedProps.spawnDefaultCampusProps();

const mobs = new ReactiveMobsManager(scene);
mobs.loadMobs(REACTIVE_MOBS);

// 2. Обработка входящих сообщений сети в network.js
network.onMessage = (msg) => {
  if (msg.type === 'WORLD_MUTATION') {
    animatedProps.mutationHandler.handleMutation(msg);
  }
  if (msg.type === 'PROP_THROWN') {
    physics.handleRemoteThrow(msg.propId, msg.startPos, msg.velocity);
  }
};

// 3. Кадр анимации (внутри animate())
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  // Обновление всех трех систем
  physics.update(delta, camera);
  animatedProps.update(delta);
  mobs.update(delta, camera.position, {
    isSprinting: controls.isSprinting,
    lanternOn: controls.lanternActive,
    isChatting: ui.isChatOpen
  });

  renderer.render(scene, camera);
}
```

---
*Документ составлен для интеграции на хакатоне. Все модули совместимы с Vite, Three.js и WebSocket сервером.*

