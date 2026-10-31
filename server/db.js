import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'gameState.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Directory may already exist or be managed externally
}

class Storage {
  constructor() {
    this.data = {
      users: {},         // { [username]: { id, username, color, x, y, z, rotY, inventory: [], discoveredSecrets: [] } }
      agentMemory: {},   // { [`${username}:${agentId}`]: { factsKnown: [], turnsCount: 0, tone: 'curious', history: [] } }
      chatLog: []        // [ { time, sender, text } ]
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[DB] Loaded state from', DB_FILE);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('[DB] Error loading DB file, initializing fresh:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save DB file:', err.message);
    }
  }

  // User methods
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
    if (!Array.isArray(user.inventory)) {
      user.inventory = [];
    }
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

  // Agent memory methods
  getAgentMemory(username, agentId) {
    const key = `${username}:${agentId}`;
    if (!this.data.agentMemory[key]) {
      this.data.agentMemory[key] = {
        username,
        agentId,
        factsKnown: [],
        turnsCount: 0,
        affinity: 1, // 1 to 5
        lastTopic: null,
        history: [] // recent dialog turns: [{ role: 'user'|'agent', content }]
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

  // Chat log
  addChatMessage(sender, text) {
    const entry = { time: Date.now(), sender, text };
    this.data.chatLog.push(entry);
    if (this.data.chatLog.length > 200) {
      this.data.chatLog.shift();
    }
    this.save();
    return entry;
  }
}

export const db = new Storage();
