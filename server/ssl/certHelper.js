// server/ssl/certHelper.js — Генерация и получение SSL сертификатов для HTTPS
import fs from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import selfsigned from 'selfsigned';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CERT_DIR = __dirname;
const KEY_PATH = path.join(CERT_DIR, 'server.key');
const CERT_PATH = path.join(CERT_DIR, 'server.crt');

export async function getOrCreateSSLCert() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    try {
      const key = fs.readFileSync(KEY_PATH, 'utf8');
      const cert = fs.readFileSync(CERT_PATH, 'utf8');
      return { key, cert };
    } catch (e) {
      console.warn('[SSL] Ошибка чтения существующих сертификатов, пересоздаём...', e.message);
    }
  }

  console.log('[SSL] Генерация валидного сертификата для HTTPS/WSS...');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' }
  ];

  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4') {
        altNames.push({ type: 7, ip: iface.address });
      }
    }
  }

  const pems = await selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    extensions: [{ name: 'subjectAltName', altNames }]
  });

  try {
    fs.writeFileSync(KEY_PATH, pems.private, 'utf8');
    fs.writeFileSync(CERT_PATH, pems.cert, 'utf8');
    console.log('[SSL] Сертификат успешно сохранен в server/ssl/ (server.key, server.crt)');
  } catch (err) {
    console.warn('[SSL] Не удалось сохранить файл сертификата на диск:', err.message);
  }

  return { key: pems.private, cert: pems.cert };
}
