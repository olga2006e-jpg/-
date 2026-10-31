# 🦇 Haunted Academy — Backend Handoff (Role 3 / Sasha)

Этот документ содержит полную документацию по бэкенду, сетевому протоколу, персистентности, локальному ИИ и результатам проверок для команды.

---

## 1. Команды запуска и тестирования

### Запуск сервера
```bash
# Обычный запуск сервера (по умолчанию порт 3001)
npm start
# или
node server/index.js
```

### Запуск автоматических тестов
```bash
# Полный тестовый запуск из 10 проверок с изолированной базой данных
npm test
# или
node test/test_backend_complete.js
```

---

## 2. Переменные окружения

| Переменная | По умолчанию | Описание |
| :--- | :--- | :--- |
| `PORT` | `3001` | Порт HTTP и WebSocket сервера. |
| `SQLITE_PATH` | `./data/game.db` | Путь к файлу базы данных SQLite (`node:sqlite`). |
| `JSON_PATH` | `./data/gameState.json` | Путь к файлу резервного JSON-хранилища при отказе SQLite. |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Хост и порт локального сервиса Ollama. |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Имя локальной LLM модели (например, `qwen2.5:3b` или `llama3.2:3b`). |

---

## 3. Архитектура хранилища данных (SQLite + Резервный JSON)

1. **Основное хранилище:** Встроенный модуль `node:sqlite` (`DatabaseSync`). Создает таблицы:
   - `users`: координаты `(x, y, z, rotY)`, цвет, инвентарь (JSON), время `lastSeen`.
   - `agent_memory`: память диалогов `(username, agent_id)` — счетчик реплик, изученные факты, обсужденные темы, история последних реплик.
   - `quest_progress`: статус открытия Врат Вечности, имя победителя, код `2327`, время победы.
   - `chat_log`: последние 200 сообщений чата.
2. **Одноразовый импорт:** При первом запуске SQLite автоматически переносит данные из существующего `data/gameState.json`. Исходный файл `gameState.json` сохраняется и не удаляется.
3. **Резервный Fallback:** Если SQLite блокируется окружением, система переключается на `Atomic JsonStorage`:
   - Запись через временный файл `.tmp` и `fs.renameSync` (атомарная замена без повреждения файла при сбое).
   - Автоматическое создание бэкапа `.bak`.
4. **Периодическое сохранение:** Каждые 5 секунд сохраняются только изменившиеся игроки (`dirty: true`).
5. **Graceful Shutdown:** При получении `SIGINT` / `SIGTERM` сервер сохраняет координаты всех активных сессий и закрывает базу данных.

---

## 4. Сетевой протокол и изменения контрактов

### 4.1 REST API

#### `POST /api/login`
- **Запрос:** `{ "username": "Sasha", "color": "#ff79c6" }`
- **Ответ:**
```json
{
  "success": true,
  "token": "a1b2c3d4...",
  "user": {
    "username": "Sasha",
    "color": "#ff79c6",
    "x": 0.5,
    "y": 1.6,
    "z": 10.5,
    "rotY": 0,
    "inventory": []
  },
  "authType": "guest_session",
  "isGuest": true,
  "disclaimer": "Гостевой вход без пароля: сохранение привязано к никнейму на локальном сервере",
  "world": {
    "totalChunks": 100,
    "totalWorldBytes": 60461,
    "maxClientCachePercent": 10
  }
}
```

#### `GET /api/status`
- **Ответ:**
```json
{
  "status": "online",
  "timestamp": 1793455900000,
  "totalChunks": 100,
  "totalWorldBytes": 60461,
  "databaseEngine": "sqlite",
  "aiModel": "qwen2.5:3b",
  "ollama": {
    "host": "http://127.0.0.1:11434",
    "modelTarget": "qwen2.5:3b",
    "serviceAvailable": true,
    "modelPresent": true,
    "availableModels": ["qwen2.5:3b"],
    "error": null
  }
}
```

---

### 4.2 WebSocket Протокол

#### Авторизация и защита:
1. Любые действия (`MOVE`, `CHAT`, `AGENT_CHAT`, `SUBMIT_GATE_CODE`, `REQUEST_CHUNK`) до сообщения `AUTH` **отклоняются** с сообщением `{ "type": "ERROR", "message": "Not authenticated" }`.
2. Неверный или просроченный токен вызывает `{ "type": "AUTH_FAIL", "error": "Invalid or expired token" }` и закрытие сокета с кодом `4003`.
3. **Повторное подключение одного ника (Dual Connection):**
   - Если открывается новое соединение с тем же никнеймом, старое соединение закрывается с кодом `4001: 'Replaced by newer connection'`.
   - Активный игрок **НЕ удаляется** из памяти сервера и не рассылает ложный `PLAYER_LEFT`.

#### Стриминг чанков и метаданные размера:
- В сообщении `AUTH_SUCCESS` отправляются:
  - `totalWorldChunks: 100`
  - `totalWorldBytes: 60461` (канонический размер мира в байтах, предрассчитанный без передачи 100 чанков клиенту)
  - `maxClientCachePercent: 10`
  - `maxAllowedChunksOnClient: 10`
- Клиент запрашивает чанк: `{ "type": "REQUEST_CHUNK", "cx": 0, "cz": 0 }`
- Сервер отвечает `CHUNK_DATA`:
```json
{
  "type": "CHUNK_DATA",
  "chunk": {
    "id": "chunk_0_0",
    "cx": 0,
    "cz": 0,
    "objects": [...],
    "byteSize": 2994
  },
  "chunkBytes": 2994
}
```
*Клиент видит точный вес чанка в байтах сразу в сообщении (`chunkBytes`) и в объекте чанка (`chunk.byteSize`), не рассчитывая его самостоятельно.*

#### Чат и перемещение (с валидацией типов и границ):
- `MOVE`: координаты проверяются на `Number.isFinite`. При `NaN`, `Infinity` или выходе за пределы кампуса (`|x| > 150` или `|z| > 150`) возвращается `ERROR`.
- `CHAT`: длина сообщения до 300 символов, рассылка всем подключенным игрокам.
- Рассылка позиций 20 раз в секунду (`PLAYERS_SYNC`).

---

## 5. ИИ Агенты и Эвристический Движок

### 5.1 Проверка Ollama
- `AgentService.checkOllamaHealth()` раздельно проверяет:
  1. Доступность HTTP сервиса Ollama (`serviceAvailable`).
  2. Наличие запрошенной модели в списке тегов (`modelPresent`).

### 5.2 Поведение и Fallback (Heuristic Rule Engine)
- Если Ollama выключена или не отвечает в течение 10 секунд:
  - Сервер **не падает**, соединение WebSocket не рвется.
  - Активируется **Heuristic Rule Engine** (`usedLLM: false`, `provider: 'heuristic_rule_engine'`).
  - Ответ формируется на основе ключевых слов темы, каталога знаний персонажа и памяти игрока.
  - **Движок никогда не называет себя LLM или языковой моделью.**
- **Случайное открытие фактов полностью удалено:** темы и факты регистрируются строго тогда, когда игрок или агент упомянули их в реальном диалоге.
- В `AGENT_REPLY` отправляется:
```json
{
  "type": "AGENT_REPLY",
  "agentId": "curie",
  "agentName": "Мария Склодовская-Кюри",
  "reply": "...",
  "usedLLM": false,
  "provider": "heuristic_rule_engine",
  "knownFactsCount": 2,
  "discussedTopics": ["Открытие радия и полония"],
  "turnsCount": 3
}
```

---

## 6. Квест: Шифр Врат Вечности (`2327`)

Сюжет и подсказки гармонизированы между персонажами, артефактами и кодом:
1. **Первая цифра: `2`** — Альберт Эйнштейн / Песочные Часы Относительности: показатель степени скорости света в формуле $E = mc^{\mathbf{2}}$.
2. **Вторая цифра: `3`** — Геродот / Папирус: три великие пирамиды плато Гиза в долине Нила.
3. **Третья цифра: `2`** — Мария Кюри / Колба с радием: число Нобелевских премий (1903 и 1911) и 2-я группа щелочноземельных металлов таблицы Менделеева.
4. **Четвертая цифра: `7`** — Антон Игоревич Канев / USB-флешка: 7 уровней эталонной сетевой модели OSI.

- При отправке `{ "type": "SUBMIT_GATE_CODE", "code": "2327" }`:
  - Рассылается `VICTORY` всем игрокам в сети.
  - Победа и имя победителя сохраняются в таблице `quest_progress` в SQLite.
  - При неверном коде возвращается `CODE_INCORRECT`.

---

## 7. Результаты проверок и ограничений

Все проверки были физически запущены через тестовый набор `test/test_backend_complete.js` на изолированной базе `data/test_verification.db`:

```
====================================================
🦇 RUNNING EXHAUSTIVE BACKEND VERIFICATION SUITE 🦇
📁 Test Database: .../data/test_verification.db
====================================================
🧪 [Check 1] Rejection of gameplay actions before AUTH...
  ✅ Unauthenticated actions strictly rejected.
🧪 [Check 2] Auth failure on invalid token & guest session tagging...
  ✅ Invalid token rejected; guest session properly marked without password requirement.
🧪 [Check 3] Multi-player synchronization & chat...
  ✅ 2 players synchronized: joined broadcast, chat, and 20Hz tick working.
🧪 [Check 4] Reconnecting same nickname (duplicate connection handling)...
  ✅ Old connection closed cleanly with 4001; new connection retained without losing player.
🧪 [Check 5] AI fallback without Ollama (Heuristic Rule Engine)...
  ✅ AI Fallback answered intelligently, did not call itself LLM, tracked topic.
🧪 [Check 6] AI response tracking when model returns response...
  ✅ Ollama health check & model presence verification validated.
🧪 [Check 7] Quest submission (invalid code -> winning code 2327 -> victory)...
  ✅ Quest code 2327 verified, VICTORY broadcasted, and state persisted in DB.
🧪 [Check 8] Chunk streaming byte-size metadata...
  ✅ Chunk metadata delivered byteSize & chunkBytes without broadcasting full world.
🧪 [Check 9] Persistence across server restart in SQLite...
  ✅ User position, inventory, and agent memory perfectly restored across restart.
🧪 [Check 10] Input type and limits validation...
  ✅ Coordinates and input limits thoroughly validated.
====================================================
🎉 ALL 10/10 AUTOMATED VERIFICATION CHECKS PASSED! 🎉
====================================================
```

### Ограничения:
1. Гостевые аккаунты привязаны к никнейму на сервере без паролей; парольная авторизация не требуется по условиям регламента хакатона.
2. Размер мира зафиксирован на 100 чанках (сетка $10 \times 10$, координаты от $-5$ до $+4$). Запросы за пределами диапазона отклоняются.
3. Максимальный размер пакета чата ограничен 300 символами.
