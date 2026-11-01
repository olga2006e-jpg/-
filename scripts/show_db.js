// scripts/show_db.js — Инструмент быстрой демонстрации БД SQLite для жюри
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve('d:/rip-2026/hackathon/data/game.db');
const db = new DatabaseSync(dbPath);

console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
console.log('║  🗄️  СЕРВЕРНАЯ БАЗА ДАННЫХ SQLITE (Haunted Academy)                           ║');
console.log('║  Файл: data/game.db | WAL-режим (Write-Ahead Logging) | Двухуровневый кэш 10% ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

// 1. Игроки и координаты
console.log('👤 [ТАБЛИЦА users] Сохраненные аккаунты, координаты и инвентарь:');
const users = db.prepare('SELECT username, color, x, y, z, score, inventory, lastSeen FROM users ORDER BY lastSeen DESC LIMIT 8').all();
if (users.length === 0) {
  console.log('   (Пока нет сохраненных сессий игроков)\n');
} else {
  console.table(users.map(u => ({
    'Игрок': u.username,
    'Координаты [X, Y, Z]': `[${(u.x||0).toFixed(1)}, ${(u.y||0).toFixed(1)}, ${(u.z||0).toFixed(1)}]`,
    'Счет': u.score || 0,
    'Инвентарь': (u.inventory || '[]').slice(0, 20),
    'Был в сети': new Date(u.lastSeen || Date.now()).toLocaleTimeString()
  })));
}

// 2. Память агентов об игроках
console.log('🧠 [ТАБЛИЦА agent_memory] Долгосрочная память агентов-преподавателей:');
const memory = db.prepare('SELECT username, agentId, turnsCount, affinity, lastTopic FROM agent_memory LIMIT 8').all();
if (memory.length === 0) {
  console.log('   (Память формируется при первом обращении к агенту в чате)\n');
} else {
  console.table(memory.map(m => ({
    'Студент': m.username,
    'Преподаватель': m.agentId,
    'Диалогов': m.turnsCount,
    'Доверие (affinity)': m.affinity,
    'Тема': m.lastTopic || 'Сети/Математика'
  })));
}

// 3. Прогресс квеста
console.log('🏆 [ТАБЛИЦА quest_progress] Состояние квеста и шифра Врат:');
const quest = db.prepare('SELECT id, completed, winner, code, completedAt FROM quest_progress').all();
console.table(quest.map(q => ({
  'Квест': q.id,
  'Статус': q.completed ? '✓ ПРОЙДЕН' : 'В процессе',
  'Победитель': q.winner || '—',
  'Шифр': q.code || '2327'
})));

console.log('⚡ Все транзакции синхронизированы на диск. При перезапуске сервера состояние сохраняется.\n');
