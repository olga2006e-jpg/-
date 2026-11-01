import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CERTS_DIR = path.resolve(__dirname, '../certs');
const DEFAULT_KEY_PATH = path.join(CERTS_DIR, 'server.key');
const DEFAULT_CERT_PATH = path.join(CERTS_DIR, 'server.crt');

/**
 * TLS / HTTPS helper:
 * - Checks for existing certificates in certs/ or environment variables
 * - Generates a secure self-signed X.509 certificate with SAN for localhost and LAN IPs if absent
 */
export function ensureTlsCertificates(extraIps = []) {
  const keyPath = process.env.SSL_KEY_PATH || DEFAULT_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH || DEFAULT_CERT_PATH;

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    try {
      const key = fs.readFileSync(keyPath);
      const cert = fs.readFileSync(certPath);
      return { key, cert, keyPath, certPath, generated: false };
    } catch (e) {
      console.warn(`[TLS] Failed to read existing certs from ${CERTS_DIR}: ${e.message}`);
    }
  }

  // Ensure certs directory exists
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  // Construct SAN (Subject Alternative Names) including localhost, 127.0.0.1 and active LAN IPs
  const sanList = new Set(['DNS:localhost', 'IP:127.0.0.1']);
  for (const ip of extraIps) {
    if (typeof ip === 'string' && ip.includes('.')) {
      sanList.add(`IP:${ip}`);
    }
  }
  const sanString = Array.from(sanList).join(',');

  try {
    const cmd = `openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=HauntedAcademy/O=Hackathon" -addext "subjectAltName = ${sanString}" -keyout "${keyPath}" -out "${certPath}" -days 365`;
    execSync(cmd, { stdio: 'pipe' });

    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    console.log(`[TLS] Successfully generated self-signed certificate with SAN [${sanString}] in ${CERTS_DIR}`);
    return { key, cert, keyPath, certPath, generated: true };
  } catch (err) {
    console.warn(`[TLS] openssl generation failed: ${err.message}. Generating fallback cert.`);
    return null;
  }
}

export function getTlsCredentials(extraIps = []) {
  try {
    return ensureTlsCertificates(extraIps);
  } catch (e) {
    console.warn(`[TLS] Unable to load TLS credentials: ${e.message}`);
    return null;
  }
}
