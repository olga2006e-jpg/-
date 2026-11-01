// server/mobs.js
// Reactive Ambient NPCs (Non-agent reactive mobs: bats, spectral cats, shadow students)
// These entities react to user presence, running, conversations, and light.

export const MOB_TYPES = {
  BAT: 'BAT',
  CAT: 'CAT',
  SHADOW_STUDENT: 'SHADOW_STUDENT'
};

export const REACTIVE_MOBS = [
  // --- 15 Летучих мышей (Bats) под сводами потолка ---
  { id: 'bat_01', type: MOB_TYPES.BAT, name: 'Призрачный нетопырь', chunkX: 0, chunkZ: 0, x: 2, y: 4.2, z: 5, radius: 4.5, speed: 2.2, state: 'CIRCLE' },
  { id: 'bat_02', type: MOB_TYPES.BAT, name: 'Призрачный нетопырь', chunkX: 0, chunkZ: 0, x: -3, y: 4.5, z: 8, radius: 3.8, speed: 2.0, state: 'CIRCLE' },
  { id: 'bat_03', type: MOB_TYPES.BAT, name: 'Призрачный нетопырь', chunkX: 0, chunkZ: -1, x: 0, y: 4.4, z: -15, radius: 5.0, speed: 2.5, state: 'CIRCLE' },
  { id: 'bat_04', type: MOB_TYPES.BAT, name: 'Призрачный нетопырь', chunkX: 0, chunkZ: -1, x: 6, y: 4.6, z: -20, radius: 4.0, speed: 2.1, state: 'CIRCLE' },
  { id: 'bat_05', type: MOB_TYPES.BAT, name: 'Пещерный нетопырь', chunkX: -1, chunkZ: 0, x: -18, y: 4.3, z: 4, radius: 3.5, speed: 1.9, state: 'CIRCLE' },
  { id: 'bat_06', type: MOB_TYPES.BAT, name: 'Пещерный нетопырь', chunkX: 1, chunkZ: 0, x: 16, y: 4.5, z: -2, radius: 4.2, speed: 2.3, state: 'CIRCLE' },
  { id: 'bat_07', type: MOB_TYPES.BAT, name: 'Архивный нетопырь', chunkX: -2, chunkZ: 0, x: -44, y: 4.6, z: 3, radius: 3.0, speed: 2.4, state: 'CIRCLE' },
  { id: 'bat_08', type: MOB_TYPES.BAT, name: 'Архивный нетопырь', chunkX: -2, chunkZ: -1, x: -50, y: 4.4, z: -20, radius: 4.8, speed: 2.0, state: 'CIRCLE' },
  { id: 'bat_09', type: MOB_TYPES.BAT, name: 'Спектральный нетопырь', chunkX: 2, chunkZ: -1, x: 45, y: 4.5, z: -22, radius: 4.0, speed: 2.5, state: 'CIRCLE' },
  { id: 'bat_10', type: MOB_TYPES.BAT, name: 'Спектральный нетопырь', chunkX: 3, chunkZ: -1, x: 70, y: 4.7, z: -25, radius: 3.6, speed: 2.2, state: 'CIRCLE' },
  { id: 'bat_11', type: MOB_TYPES.BAT, name: 'Высотный нетопырь', chunkX: 1, chunkZ: -2, x: 22, y: 4.8, z: -46, radius: 5.2, speed: 2.6, state: 'CIRCLE' },
  { id: 'bat_12', type: MOB_TYPES.BAT, name: 'Высотный нетопырь', chunkX: -1, chunkZ: -2, x: -26, y: 4.5, z: -50, radius: 4.4, speed: 2.1, state: 'CIRCLE' },
  { id: 'bat_13', type: MOB_TYPES.BAT, name: 'Хэллоуинский нетопырь', chunkX: 0, chunkZ: 1, x: 4, y: 4.3, z: 20, radius: 3.9, speed: 2.3, state: 'CIRCLE' },
  { id: 'bat_14', type: MOB_TYPES.BAT, name: 'Хэллоуинский нетопырь', chunkX: -1, chunkZ: 1, x: -20, y: 4.6, z: 22, radius: 4.1, speed: 1.8, state: 'CIRCLE' },
  { id: 'bat_15', type: MOB_TYPES.BAT, name: 'Хэллоуинский нетопырь', chunkX: 1, chunkZ: 1, x: 18, y: 4.4, z: 18, radius: 4.5, speed: 2.2, state: 'CIRCLE' },

  // --- 15 Призрачных котов (Spectral Cats) ---
  { id: 'cat_01', type: MOB_TYPES.CAT, name: 'Кот Учёный', chunkX: 0, chunkZ: 0, x: 4.5, y: 0.15, z: 6.2, rotY: 0.5, state: 'SIT', furColor: '#1a1829', eyeColor: '#50fa7b' },
  { id: 'cat_02', type: MOB_TYPES.CAT, name: 'Тайный кот', chunkX: 0, chunkZ: 0, x: -5.0, y: 0.15, z: 4.0, rotY: 1.2, state: 'SIT', furColor: '#2b213a', eyeColor: '#ffb86c' },
  { id: 'cat_03', type: MOB_TYPES.CAT, name: 'Кот кафедры ИУ-5', chunkX: 0, chunkZ: -1, x: 2.5, y: 0.15, z: -18.0, rotY: 3.14, state: 'SIT', furColor: '#161324', eyeColor: '#8be9fd' },
  { id: 'cat_04', type: MOB_TYPES.CAT, name: 'Кот кафедры ИУ-5', chunkX: -2, chunkZ: -1, x: -46.0, y: 0.15, z: -26.0, rotY: 0.8, state: 'SIT', furColor: '#211c33', eyeColor: '#50fa7b' },
  { id: 'cat_05', type: MOB_TYPES.CAT, name: 'Буфетный кот', chunkX: 1, chunkZ: 0, x: 21.0, y: 0.15, z: -3.5, rotY: 2.1, state: 'SIT', furColor: '#ffb86c', eyeColor: '#50fa7b' },
  { id: 'cat_06', type: MOB_TYPES.CAT, name: 'Буфетный кот', chunkX: 1, chunkZ: 0, x: 26.5, y: 0.15, z: 2.0, rotY: -0.4, state: 'SIT', furColor: '#2d2440', eyeColor: '#ff79c6' },
  { id: 'cat_07', type: MOB_TYPES.CAT, name: 'Музейный кот', chunkX: -2, chunkZ: 0, x: -51.0, y: 0.15, z: -2.0, rotY: 1.5, state: 'SIT', furColor: '#181528', eyeColor: '#f1fa8c' },
  { id: 'cat_08', type: MOB_TYPES.CAT, name: 'Лабораторный кот', chunkX: 2, chunkZ: -1, x: 50.5, y: 0.15, z: -21.0, rotY: -1.2, state: 'SIT', furColor: '#1f1a30', eyeColor: '#50fa7b' },
  { id: 'cat_09', type: MOB_TYPES.CAT, name: 'Радиевый кот', chunkX: 3, chunkZ: -1, x: 74.0, y: 0.15, z: -22.5, rotY: 0.2, state: 'SIT', furColor: '#1b2a26', eyeColor: '#50fa7b' },
  { id: 'cat_10', type: MOB_TYPES.CAT, name: 'Обсерваторный кот', chunkX: 1, chunkZ: -2, x: 26.0, y: 0.15, z: -45.0, rotY: 2.7, state: 'SIT', furColor: '#171426', eyeColor: '#8be9fd' },
  { id: 'cat_11', type: MOB_TYPES.CAT, name: 'Математический кот', chunkX: -1, chunkZ: -2, x: -22.0, y: 0.15, z: -46.5, rotY: -2.2, state: 'SIT', furColor: '#281c38', eyeColor: '#ff79c6' },
  { id: 'cat_12', type: MOB_TYPES.CAT, name: 'Коридорный кот', chunkX: -1, chunkZ: 0, x: -20.5, y: 0.15, z: 2.5, rotY: 0.0, state: 'SIT', furColor: '#1e1b2e', eyeColor: '#ffb86c' },
  { id: 'cat_13', type: MOB_TYPES.CAT, name: 'Коридорный кот', chunkX: 0, chunkZ: 1, x: -2.0, y: 0.15, z: 22.0, rotY: -1.0, state: 'SIT', furColor: '#191629', eyeColor: '#50fa7b' },
  { id: 'cat_14', type: MOB_TYPES.CAT, name: 'Привратный кот', chunkX: 1, chunkZ: 1, x: 20.0, y: 0.15, z: 16.0, rotY: 1.8, state: 'SIT', furColor: '#26203a', eyeColor: '#8be9fd' },
  { id: 'cat_15', type: MOB_TYPES.CAT, name: 'Привратный кот', chunkX: -1, chunkZ: 1, x: -18.0, y: 0.15, z: 20.0, rotY: -0.6, state: 'SIT', furColor: '#181525', eyeColor: '#50fa7b' },

  // --- 10 Бродячих теней студентов (Shadow Students) ---
  { id: 'shadow_01', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень первокурсника', chunkX: 0, chunkZ: 0, x: 1.0, y: 0.0, z: 12.0, pathRadius: 6.0, rotY: 0, state: 'WANDER' },
  { id: 'shadow_02', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень дипломника', chunkX: 0, chunkZ: -1, x: -4.0, y: 0.0, z: -14.0, pathRadius: 8.0, rotY: 1.5, state: 'WANDER' },
  { id: 'shadow_03', type: MOB_TYPES.SHADOW_STUDENT, name: 'Призрак лаборанта', chunkX: -1, chunkZ: 0, x: -16.0, y: 0.0, z: -2.0, pathRadius: 5.0, rotY: 0.5, state: 'WANDER' },
  { id: 'shadow_04', type: MOB_TYPES.SHADOW_STUDENT, name: 'Призрак старосты', chunkX: 1, chunkZ: 0, x: 18.0, y: 0.0, z: 6.0, pathRadius: 7.0, rotY: -1.0, state: 'WANDER' },
  { id: 'shadow_05', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень отличника', chunkX: -2, chunkZ: -1, x: -42.0, y: 0.0, z: -22.0, pathRadius: 6.5, rotY: 2.0, state: 'WANDER' },
  { id: 'shadow_06', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень физика', chunkX: 2, chunkZ: -1, x: 44.0, y: 0.0, z: -25.0, pathRadius: 7.5, rotY: -0.8, state: 'WANDER' },
  { id: 'shadow_07', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень химика', chunkX: 3, chunkZ: -1, x: 68.0, y: 0.0, z: -21.0, pathRadius: 5.5, rotY: 1.2, state: 'WANDER' },
  { id: 'shadow_08', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень астронома', chunkX: 1, chunkZ: -2, x: 20.0, y: 0.0, z: -44.0, pathRadius: 6.0, rotY: 0.0, state: 'WANDER' },
  { id: 'shadow_09', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень математика', chunkX: -1, chunkZ: -2, x: -20.0, y: 0.0, z: -47.0, pathRadius: 6.5, rotY: -2.0, state: 'WANDER' },
  { id: 'shadow_10', type: MOB_TYPES.SHADOW_STUDENT, name: 'Тень библиотекаря', chunkX: -2, chunkZ: 0, x: -46.0, y: 0.0, z: -4.0, pathRadius: 5.0, rotY: 3.14, state: 'WANDER' }
];

export function getMobsInChunk(cx, cz) {
  return REACTIVE_MOBS.filter(m => m.chunkX === cx && m.chunkZ === cz);
}
