# ⚡ ТЗ для Девушки 2: Chunk Streaming & UI/HUD Lead

> **Твоя миссия:** Закрыть ключевое формальное требование регламента хакатона — **кэширование не более 10% данных мира на клиенте** — и сделать интерфейс понятным, красивым и удобным для игроков и судей.

---

## 📁 Твои рабочие файлы:
* `client/src/chunkManager.js` — LRU-кэш и стриминг секторов (выгрузка далеких чанков)
* `client/src/ui.js` — логика интерфейса (чат, диалоги, монитор кэша, инвентарь)
* `client/index.html` и `client/style.css` — разметка и стилизация

---

## 🎯 Чек-лист задач:

### 1. Железное соблюдение правила «Кэш $\le 10\%$» (Критично для судей!)
- [ ] Проверить работу функции `enforceCacheLimit(centerCx, centerCz)` в `chunkManager.js`.
- [ ] Убедиться, что при выгрузке чанка вызывается:
  ```javascript
  group.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
  scene.remove(group);
  ```
- [ ] Проверить индикатор кэша в углу:
  * `Всего чанков мира: 100`
  * `Загружено в память: 7 / 10`
  * `Использовано: 7.0%`
  * `ЛИМИТ: ≤ 10% [СОБЛЮДЕНО ✅]`

---

### 2. Круглая миникарта / Радар (Minimap)
- [ ] Добавить в левый верхний угол HTML-элемент `<canvas id="radar" width="120" height="120"></canvas>`.
- [ ] В `ui.js` написать функцию отрисовки радара:
  * Центр — игрок (белая стрелочка с направлением взгляда).
  * Другие игроки — цветные точки.
  * Призраки (Эйнштейн, Геродот, Кюри) — светящиеся фиолетовые и желтые иконки `👻`.

```javascript
// Пример отрисовки радара:
export function drawRadar(ctx, playerPos, remotePlayers, npcs) {
  ctx.clearRect(0, 0, 120, 120);
  ctx.fillStyle = 'rgba(11, 9, 20, 0.85)';
  ctx.beginPath();
  ctx.arc(60, 60, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#bd93f9';
  ctx.stroke();

  // Игрок в центре
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(58, 58, 4, 4);

  // Отрисовка других игроков относительно центра
  for (const p of remotePlayers) {
    const rx = 60 + (p.targetX - playerPos.x) * 2;
    const rz = 60 + (p.targetZ - playerPos.z) * 2;
    if (Math.hypot(rx - 60, rz - 60) < 55) {
      ctx.fillStyle = p.color || '#ff79c6';
      ctx.beginPath();
      ctx.arc(rx, rz, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

---

### 3. Эффект печатной машинки в диалогах (Typewriter effect)
- [ ] Реплика призрака не должна падать мгновенной простыней текста. Сделай плавное побуквенное появление текста за 1-2 секунды.
```javascript
function typeWriter(element, text, speed = 25) {
  element.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(timer);
    }
  }, speed);
}
```

---

### 4. Панель квеста и инвентаря внизу экрана
- [ ] Добавить в `index.html` панель «Код от Главных Врат: [ _ ] [ _ ] [ _ ] [ _ ]».
- [ ] Когда игрок узнает правильный ответ у призрака — соответствующая цифра загорается зеленым цветом.

---

## 🔍 Критерии приёмки:
1. Виджет кэша всегда показывает `≤ 10% [СОБЛЮДЕНО ✅]`.
2. Диалоговое окно красиво открывается по `E` и закрывается по `Esc`.
3. Чат легко открывается по `Enter`.
