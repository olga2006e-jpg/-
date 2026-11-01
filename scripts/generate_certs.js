import { getOrCreateSSLCert } from '../server/ssl/certHelper.js';
const c = await getOrCreateSSLCert();
console.log('✅ SSL certificate generated & stored successfully! Cert length:', c.cert.length);
