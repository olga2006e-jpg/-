import crypto from 'node:crypto';
import { db } from './db.js';

// Helper functions for password hashing with salt (PBKDF2 SHA-512)
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (_) {
    return false;
  }
}

// In-memory active session tokens: token -> { username, createdAt, isGuest }
const sessions = new Map();

export class AuthManager {
  // Registration: creates new user with password or upgrades guest account
  static register(username, password, color = '#ff79c6') {
    const cleanName = (username || '').trim().slice(0, 20);
    if (!cleanName || cleanName.length < 2) {
      return { error: 'Имя исследователя должно содержать от 2 до 20 символов' };
    }
    if (!password || typeof password !== 'string' || password.length < 3) {
      return { error: 'Пароль должен содержать не менее 3 символов' };
    }

    const existing = db.getUser(cleanName);
    if (existing && existing.passwordHash) {
      return { error: 'Исследователь с таким именем уже зарегистрирован. Пожалуйста, выполните вход.' };
    }

    const { hash, salt } = hashPassword(password);
    const user = {
      ...(existing || {}),
      username: cleanName,
      color: color || existing?.color || '#ff79c6',
      x: (existing && Number.isFinite(existing.x)) ? existing.x : (Math.random() - 0.5) * 1.6,
      y: 1.6,
      z: (existing && Number.isFinite(existing.z)) ? existing.z : 10.5,
      rotY: existing?.rotY ?? 0,
      score: existing?.score ?? 0,
      inventory: existing?.inventory || [],
      passwordHash: hash,
      salt
    };
    db.saveUser(user);

    const token = crypto.randomBytes(16).toString('hex');
    sessions.set(token, {
      username: cleanName,
      createdAt: Date.now(),
      isGuest: false
    });

    return {
      success: true,
      token,
      user,
      authType: 'registered',
      isGuest: false,
      message: 'Успешная регистрация'
    };
  }

  // Login: verifies password if account is password-protected, or allows guest login
  static login(username, color = '#ff79c6', password = null) {
    const cleanName = (username || '').trim().slice(0, 20) || `Ghost_${Math.floor(Math.random() * 900 + 100)}`;
    const existing = db.getUser(cleanName);

    // If account has password set:
    if (existing && existing.passwordHash) {
      if (!password) {
        return { error: 'Этот аккаунт защищен паролем. Пожалуйста, введите пароль.' };
      }
      if (!verifyPassword(password, existing.passwordHash, existing.salt)) {
        return { error: 'Неверный пароль' };
      }
      existing.color = color || existing.color;
      db.saveUser(existing);

      const token = crypto.randomBytes(16).toString('hex');
      sessions.set(token, {
        username: cleanName,
        createdAt: Date.now(),
        isGuest: false
      });
      return {
        success: true,
        token,
        user: existing,
        authType: 'registered',
        isGuest: false,
        message: 'Успешный вход по паролю'
      };
    }

    // If password was provided for unregistered name, auto-register!
    if (password && typeof password === 'string' && password.length >= 3 && !existing) {
      return this.register(cleanName, password, color);
    }

    // Guest login (no password protection on account)
    const token = crypto.randomBytes(16).toString('hex');
    let user = existing;
    if (!user) {
      user = {
        username: cleanName,
        color,
        x: (Math.random() - 0.5) * 1.6,
        y: 1.6,
        z: 10.5,
        rotY: 0,
        score: 0,
        inventory: []
      };
      db.saveUser(user);
    } else {
      user.color = color || user.color;
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
      success: true,
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
