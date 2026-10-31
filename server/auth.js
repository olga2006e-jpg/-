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
      // Preserve existing saved coordinates if present; fallback to South entrance if unset
      if (user.x === undefined || user.x === null || !Number.isFinite(user.x)) {
        user.x = (Math.random() - 0.5) * 1.6;
        user.y = 1.6;
        user.z = 10.5;
        user.rotY = 0;
      }
      db.saveUser(user);
    }

    sessions.set(token, {
      username: cleanName,
      createdAt: Date.now(),
      isGuest: true
    });
    return {
      token,
      user,
      authType: 'guest_session',
      isGuest: true,
      disclaimer: 'Гостевой вход без пароля: сохранение привязано к никнейму на локальном сервере'
    };
  }

  static verifyToken(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    return typeof session === 'string' ? session : session.username;
  }

  static getSession(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    return typeof session === 'string' ? { username: session, isGuest: true } : session;
  }
  static logout(token) {
    sessions.delete(token);
  }
}
