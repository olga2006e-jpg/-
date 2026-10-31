import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.GAME_DATA_DIR ? path.resolve(process.env.GAME_DATA_DIR) : path.resolve(__dirname, '../data');
const DEFAULT_SQLITE_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, 'game.db');
const LEGACY_JSON_PATH = process.env.JSON_PATH || path.join(DATA_DIR, 'gameState.json');
const DB_FILE = LEGACY_JSON_PATH;

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Directory may already exist
}

function safeParseJson(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * SQLite Storage Implementation using Node.js native node:sqlite
 */
class SQLiteStorage {
  constructor(dbPath = DEFAULT_SQLITE_PATH) {
    this.dbPath = dbPath;
    this.type = 'sqlite';
    this.initDatabase();
    this.migrateFromLegacyJsonIfEmpty();
  }

  initDatabase() {
    let DatabaseSync;
    try {
      const sqliteModule = require('node:sqlite');
      DatabaseSync = sqliteModule.DatabaseSync;
    } catch (e) {
      throw new Error(`node:sqlite not available in this Node runtime (${e.message})`);
    }
    if (!DatabaseSync) {
      throw new Error('DatabaseSync constructor not found in node:sqlite');
    }

    this.sqlite = new DatabaseSync(this.dbPath);

    // Pragmas for performance and data safety
    this.sqlite.exec('PRAGMA journal_mode = WAL;');
    this.sqlite.exec('PRAGMA synchronous = NORMAL;');

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        color TEXT,
        x REAL,
        y REAL,
        z REAL,
        rotY REAL,
        score INTEGER DEFAULT 0,
        inventory TEXT DEFAULT '[]',
        discoveredSecrets TEXT DEFAULT '[]',
        lastSeen INTEGER
      );

      CREATE TABLE IF NOT EXISTS agent_memory (
        username TEXT,
        agentId TEXT,
        factsKnown TEXT DEFAULT '[]',
        turnsCount INTEGER DEFAULT 0,
        affinity INTEGER DEFAULT 1,
        lastTopic TEXT,
        history TEXT DEFAULT '[]',
        PRIMARY KEY (username, agentId)
      );

      CREATE TABLE IF NOT EXISTS quest_progress (
        id TEXT PRIMARY KEY,
        completed INTEGER DEFAULT 0,
        winner TEXT,
        code TEXT,
        completedAt INTEGER,
        extra TEXT DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS chat_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time INTEGER,
        sender TEXT,
        text TEXT
      );
    `);

    // Prepare reusable statements
    this.stmtGetUser = this.sqlite.prepare('SELECT * FROM users WHERE username = ?');
    this.stmtSaveUser = this.sqlite.prepare(`
      INSERT INTO users (username, color, x, y, z, rotY, score, inventory, discoveredSecrets, lastSeen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        color = COALESCE(excluded.color, users.color),
        x = COALESCE(excluded.x, users.x),
        y = COALESCE(excluded.y, users.y),
        z = COALESCE(excluded.z, users.z),
        rotY = COALESCE(excluded.rotY, users.rotY),
        score = COALESCE(excluded.score, users.score),
        inventory = COALESCE(excluded.inventory, users.inventory),
        discoveredSecrets = COALESCE(excluded.discoveredSecrets, users.discoveredSecrets),
        lastSeen = excluded.lastSeen
    `);

    this.stmtGetMemory = this.sqlite.prepare('SELECT * FROM agent_memory WHERE username = ? AND agentId = ?');
    this.stmtSaveMemory = this.sqlite.prepare(`
      INSERT INTO agent_memory (username, agentId, factsKnown, turnsCount, affinity, lastTopic, history)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, agentId) DO UPDATE SET
        factsKnown = excluded.factsKnown,
        turnsCount = excluded.turnsCount,
        affinity = excluded.affinity,
        lastTopic = excluded.lastTopic,
        history = excluded.history
    `);

    this.stmtInsertChat = this.sqlite.prepare('INSERT INTO chat_log (time, sender, text) VALUES (?, ?, ?)');
    this.stmtGetChat = this.sqlite.prepare('SELECT time, sender, text FROM chat_log ORDER BY id DESC LIMIT ?');
    this.stmtPruneChat = this.sqlite.prepare(`
      DELETE FROM chat_log WHERE id NOT IN (
        SELECT id FROM chat_log ORDER BY id DESC LIMIT 200
      )
    `);

    this.stmtGetQuest = this.sqlite.prepare('SELECT * FROM quest_progress WHERE id = ?');
    this.stmtSaveQuest = this.sqlite.prepare(`
      INSERT INTO quest_progress (id, completed, winner, code, completedAt, extra)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        completed = excluded.completed,
        winner = excluded.winner,
        code = excluded.code,
        completedAt = excluded.completedAt,
        extra = excluded.extra
    `);
  }

  migrateFromLegacyJsonIfEmpty() {
    try {
      const countRow = this.sqlite.prepare('SELECT COUNT(*) as cnt FROM users').get();
      if (countRow && countRow.cnt > 0) {
        return; // Already has data
      }

      if (fs.existsSync(LEGACY_JSON_PATH)) {
        const raw = fs.readFileSync(LEGACY_JSON_PATH, 'utf-8');
        const legacy = JSON.parse(raw);
        console.log('[DB-Migration] Reading existing data/gameState.json for one-time SQLite migration...');

        // 1. Migrate Users
        if (legacy.users && typeof legacy.users === 'object') {
          for (const [uname, u] of Object.entries(legacy.users)) {
            const inventoryJson = JSON.stringify(Array.isArray(u.inventory) ? u.inventory : []);
            const secretsJson = JSON.stringify(Array.isArray(u.discoveredSecrets) ? u.discoveredSecrets : []);
            this.stmtSaveUser.run(
              uname,
              u.color || '#8be9fd',
              u.x ?? 0,
              u.y ?? 1.6,
              u.z ?? 10.5,
              u.rotY ?? 0,
              u.score ?? 0,
              inventoryJson,
              secretsJson,
              u.lastSeen || Date.now()
            );
          }
        }

        // 2. Migrate Agent Memory
        if (legacy.agentMemory && typeof legacy.agentMemory === 'object') {
          for (const [key, mem] of Object.entries(legacy.agentMemory)) {
            let uname = mem.username;
            let agentId = mem.agentId;
            if (!uname || !agentId) {
              const parts = key.split(':');
              uname = uname || parts[0];
              agentId = agentId || parts[1];
            }
            if (uname && agentId) {
              this.stmtSaveMemory.run(
                uname,
                agentId,
                JSON.stringify(Array.isArray(mem.factsKnown) ? mem.factsKnown : []),
                mem.turnsCount || 0,
                mem.affinity || 1,
                mem.lastTopic || null,
                JSON.stringify(Array.isArray(mem.history) ? mem.history : [])
              );
            }
          }
        }

        // 3. Migrate Chat Log
        if (Array.isArray(legacy.chatLog)) {
          for (const item of legacy.chatLog) {
            this.stmtInsertChat.run(item.time || Date.now(), item.sender || 'System', item.text || '');
          }
        }

        // 4. Create safe backup of gameState.json without deleting or altering original
        const backupPath = `${LEGACY_JSON_PATH}.backup`;
        if (!fs.existsSync(backupPath)) {
          fs.copyFileSync(LEGACY_JSON_PATH, backupPath);
        }
        console.log('[DB-Migration] One-time migration to SQLite finished successfully! Original gameState.json retained.');
      }
    } catch (err) {
      console.warn('[DB-Migration] Migration notice:', err.message);
    }
  }

  getUser(username) {
    if (!username) return null;
    const row = this.stmtGetUser.get(username);
    if (!row) return null;
    return {
      username: row.username,
      color: row.color,
      x: row.x,
      y: row.y,
      z: row.z,
      rotY: row.rotY,
      score: row.score,
      inventory: safeParseJson(row.inventory, []),
      discoveredSecrets: safeParseJson(row.discoveredSecrets, []),
      lastSeen: row.lastSeen
    };
  }

  saveUser(user) {
    if (!user || !user.username) return;
    const current = this.getUser(user.username);
    const merged = {
      ...current,
      ...user,
      lastSeen: Date.now()
    };
    this.stmtSaveUser.run(
      merged.username,
      merged.color || '#8be9fd',
      merged.x ?? 0,
      merged.y ?? 1.6,
      merged.z ?? 10.5,
      merged.rotY ?? 0,
      merged.score ?? 0,
      JSON.stringify(merged.inventory || []),
      JSON.stringify(merged.discoveredSecrets || []),
      merged.lastSeen
    );
  }

  addItemToInventory(username, item) {
    const user = this.getUser(username);
    if (!user) return false;
    user.inventory = Array.isArray(user.inventory) ? user.inventory : [];
    if (user.inventory.some(i => i.id === item.id)) {
      return false; // Already collected
    }
    user.inventory.push({
      id: item.id,
      name: item.name,
      subType: item.subType || 'artifact',
      clue: item.clue || '',
      icon: item.icon || '📜',
      collectedAt: Date.now()
    });
    this.saveUser(user);
    return true;
  }

  getInventory(username) {
    const user = this.getUser(username);
    return (user && Array.isArray(user.inventory)) ? user.inventory : [];
  }

  getAgentMemory(username, agentId) {
    const row = this.stmtGetMemory.get(username, agentId);
    if (!row) {
      return {
        username,
        agentId,
        factsKnown: [],
        turnsCount: 0,
        affinity: 1,
        lastTopic: null,
        history: []
      };
    }
    return {
      username: row.username,
      agentId: row.agentId,
      factsKnown: safeParseJson(row.factsKnown, []),
      turnsCount: row.turnsCount,
      affinity: row.affinity,
      lastTopic: row.lastTopic,
      history: safeParseJson(row.history, [])
    };
  }

  updateAgentMemory(username, agentId, updateFn) {
    const mem = this.getAgentMemory(username, agentId);
    updateFn(mem);
    this.stmtSaveMemory.run(
      username,
      agentId,
      JSON.stringify(mem.factsKnown || []),
      mem.turnsCount || 0,
      mem.affinity || 1,
      mem.lastTopic || null,
      JSON.stringify(mem.history || [])
    );
    return mem;
  }

  addChatMessage(sender, text) {
    const time = Date.now();
    this.stmtInsertChat.run(time, sender, text);
    this.stmtPruneChat.run();
    return { time, sender, text };
  }

  getChatHistory(limit = 50) {
    const rows = this.stmtGetChat.all(Math.min(limit, 200));
    return rows.reverse();
  }

  getQuestProgress(questId = 'founders_vault') {
    const row = this.stmtGetQuest.get(questId);
    if (!row) {
      return { completed: false, winner: null, code: null, completedAt: null };
    }
    return {
      completed: Boolean(row.completed),
      winner: row.winner,
      code: row.code,
      completedAt: row.completedAt,
      ...safeParseJson(row.extra, {})
    };
  }

  saveQuestProgress(data, questId = 'founders_vault') {
    this.stmtSaveQuest.run(
      questId,
      data.completed ? 1 : 0,
      data.winner || null,
      data.code || null,
      data.completedAt || Date.now(),
      JSON.stringify(data.extra || {})
    );
  }

  close() {
    try {
      if (this.sqlite && typeof this.sqlite.close === 'function') {
        this.sqlite.close();
      }
    } catch (e) {}
  }
}

/**
 * Robust JSON Storage Fallback with Atomic File Writes and Backup
 */
class JsonStorage {
  constructor(filePath = LEGACY_JSON_PATH) {
    this.filePath = filePath;
    this.type = 'json_fallback';
    this.data = {
      users: {},
      agentMemory: {},
      chatLog: [],
      questProgress: {}
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          agentMemory: parsed.agentMemory || {},
          chatLog: Array.isArray(parsed.chatLog) ? parsed.chatLog : [],
          questProgress: parsed.questProgress || {}
        };
        console.log('[DB] Loaded state from JSON fallback:', this.filePath);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('[DB] JSON load failed, attempting backup recovery:', err.message);
      const backupPath = `${this.filePath}.backup`;
      if (fs.existsSync(backupPath)) {
        try {
          const raw = fs.readFileSync(backupPath, 'utf-8');
          this.data = JSON.parse(raw);
          console.log('[DB] Recovered state from backup:', backupPath);
        } catch (e) {
          console.error('[DB] Backup recovery failed:', e.message);
        }
      }
    }
  }

  save() {
    try {
      const serialized = JSON.stringify(this.data, null, 2);
      const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, serialized, 'utf-8');
      fs.renameSync(tempPath, this.filePath);

      // Create backup on successful write (skip if in temporary test directory)
      if (!process.env.GAME_DATA_DIR) {
        const backupPath = `${this.filePath}.backup`;
        fs.copyFileSync(this.filePath, backupPath);
      }
    } catch (err) {
      console.error('[DB] Atomic save failed in JsonStorage:', err.message);
      throw err;
    }
  }

  getUser(username) {
    return this.data.users[username] || null;
  }

  saveUser(user) {
    this.data.users[user.username] = {
      ...this.data.users[user.username],
      ...user,
      lastSeen: Date.now()
    };
    this.save();
  }

  addItemToInventory(username, item) {
    const user = this.getUser(username);
    if (!user) return false;
    if (!Array.isArray(user.inventory)) user.inventory = [];
    if (user.inventory.some(i => i.id === item.id)) return false;
    user.inventory.push({
      id: item.id,
      name: item.name,
      subType: item.subType || 'artifact',
      clue: item.clue || '',
      icon: item.icon || '📜',
      collectedAt: Date.now()
    });
    this.saveUser(user);
    return true;
  }

  getInventory(username) {
    const user = this.getUser(username);
    return (user && Array.isArray(user.inventory)) ? user.inventory : [];
  }

  getAgentMemory(username, agentId) {
    const key = `${username}:${agentId}`;
    if (!this.data.agentMemory[key]) {
      this.data.agentMemory[key] = {
        username,
        agentId,
        factsKnown: [],
        turnsCount: 0,
        affinity: 1,
        lastTopic: null,
        history: []
      };
    }
    return this.data.agentMemory[key];
  }

  updateAgentMemory(username, agentId, updateFn) {
    const mem = this.getAgentMemory(username, agentId);
    updateFn(mem);
    this.data.agentMemory[`${username}:${agentId}`] = mem;
    this.save();
    return mem;
  }

  addChatMessage(sender, text) {
    const entry = { time: Date.now(), sender, text };
    this.data.chatLog.push(entry);
    if (this.data.chatLog.length > 200) {
      this.data.chatLog.shift();
    }
    this.save();
    return entry;
  }

  getChatHistory(limit = 50) {
    return this.data.chatLog.slice(-limit);
  }

  getQuestProgress(questId = 'founders_vault') {
    return this.data.questProgress[questId] || { completed: false, winner: null, code: null, completedAt: null };
  }

  saveQuestProgress(data, questId = 'founders_vault') {
    this.data.questProgress[questId] = {
      ...this.data.questProgress[questId],
      ...data,
      completedAt: data.completedAt || Date.now()
    };
    this.save();
  }

  close() {}
}

// Global factory
export function createStorage(preferredPath = process.env.DB_PATH) {
  if (process.env.GAME_DATA_DIR && !process.env.SQLITE_PATH) {
    const jsonPath = path.join(DATA_DIR, 'gameState.json');
    return new JsonStorage(jsonPath);
  }
  try {
    const sqlitePath = preferredPath || DEFAULT_SQLITE_PATH;
    const store = new SQLiteStorage(sqlitePath);
    console.log(`[Storage] Active database engine: SQLite (${sqlitePath})`);
    return store;
  } catch (err) {
    console.warn(`[Storage] SQLite unavailable (${err.message}). Falling back to Atomic JsonStorage.`);
    return new JsonStorage(preferredPath || LEGACY_JSON_PATH);
  }
}

export const db = createStorage();
