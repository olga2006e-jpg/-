import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('d:/rip-2026/hackathon/data/game.db');
const tables = db.prepare("SELECT sql FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));
