import crypto from 'node:crypto';
import { db } from './db.js';

// In-memory active session tokens: token -> username
const sessions = new Map();

export class AuthManager {
  static login(username, color = '#ff79c6') {
    const cleanName = (username || '').trim().slice(0, 20) || `Ghost_${Math.floor(Math.random() * 900 + 100)}`;
    const token = crypto.randomBytes(16).toString('hex');
    
    // Check if user exists in DB
    let user = db.getUser(cleanName);
    if (!user) {
      user = {
        username: cleanName,
        color,
        x: (Math.random() - 0.5) * 1.6,
        y: 1.6,
        z: 10.5, // Authentic South entrance of GUK (Главный вход с улицы)
        rotY: 0,
        score: 0,
        inventory: []
      };
      db.saveUser(user);
    } else {
      user.color = color || user.color;
      // Fresh login always starts at Main Entrance doors of GUK!
      user.x = (Math.random() - 0.5) * 1.6;
      user.y = 1.6;
      user.z = 10.5;
      user.rotY = 0;
      db.saveUser(user);
    }

    sessions.set(token, cleanName);
    return { token, user };
  }

  static verifyToken(token) {
    if (!token) return null;
    return sessions.get(token) || null;
  }

  static logout(token) {
    sessions.delete(token);
  }
}
