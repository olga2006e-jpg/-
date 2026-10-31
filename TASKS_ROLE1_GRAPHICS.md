# 🎃 ТЗ для Девушки 1: 3D Graphics & Atmosphere Lead

> **Твоя миссия:** Превратить базовый 3D-мир в кинематографичный замок с атмосферой Хэллоуина. Жюри должно сразу сказать: «Вау, как красиво и плавно!».

---

## 📁 Твои рабочие файлы:
* `client/src/scene.js` — Three.js сцена, камера, лунный свет, туман
* `client/src/environment.js` — 3D-модели окружения (тыквы, факелы, колонны, призраки)
* `client/src/controls.js` — физика управления, чувствительность мыши, шаги

---

## 🎯 Чек-лист задач:

### 1. Звуковая атмосфера Хэллоуина (Web Audio API)
- [ ] Добавить фоновый звук ветра/мистического замка (зацикленный `Audio` с низкой громкостью).
- [ ] Добавить звук шагов при движении на WASD (в `controls.js`).
- [ ] Добавить звук появления призрака при открытии диалога.

**Пример реализации простого синтезатора звука ветра / шагов без внешних файлов:**
```javascript
// Вставить в controls.js при ходьбе:
export function playStepSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}
```

---

### 2. Загрузка красивых low-poly моделей (.glb / .gltf)
- [ ] Скачать бесплатные ассеты на [Kenney.nl Haunted / Medieval kit](https://kenney.nl/assets) или [Sketchfab](https://sketchfab.com).
- [ ] Положить `.glb` файлы в папку `client/public/models/`.
- [ ] Подключить `GLTFLoader` из `three/addons/loaders/GLTFLoader.js` и заменять процедурные кубики на готовые модели сундуков, надгробий и замковых стен.

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
loader.load('/models/coffin.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

---

### 3. Эффекты освещения и частицы
- [ ] Усилить хэллоуинский эффект: сделать мерцание факелов более живым (в функции `animate` в `chunkManager.js`).
- [ ] Добавить плавающие частицы (светлячки/пылинки в воздухе):
```javascript
// Простая система частиц пыли/светлячков
const particleGeo = new THREE.BufferGeometry();
const count = 300;
const posArray = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 60;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMat = new THREE.PointsMaterial({
  size: 0.08,
  color: 0xbd93f9,
  transparent: true,
  opacity: 0.6
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);
```

---

## 🔍 Критерии приёмки:
1. Стабильные 60 FPS на средних ноутбуках.
2. Атмосферное освещение: темнота, подсвеченная факелами и тыквами.
3. Персонажи NPC и игроки четко различимы издалека.

## 🛠 Как тестировать:
```bash
npm run dev
# Открыть в браузере http://localhost:5173
```
