import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthManager } from '../server/auth.js';
import { db } from '../server/db.js';

test('Registration and password authentication flow', () => {
  const testUser = `Hunt_${Math.floor(Math.random() * 89999 + 10000)}`;
  const testPass = 'GothicSecret123';

  // 1. Register new user
  const regRes = AuthManager.register(testUser, testPass, '#ffb86c');
  assert.equal(regRes.success, true, 'Registration must succeed');
  assert.ok(regRes.token, 'Token must be issued');
  assert.equal(regRes.authType, 'registered');
  assert.equal(regRes.isGuest, false);

  // 2. Reject duplicate registration
  const dupRes = AuthManager.register(testUser, 'AnotherPass', '#ff79c6');
  assert.ok(dupRes.error, 'Duplicate registration must be rejected');

  // 3. Login without password on password-protected user
  const noPassRes = AuthManager.login(testUser, '#ffb86c', null);
  assert.ok(noPassRes.error, 'Login without password on protected user must be rejected');

  // 4. Login with wrong password
  const wrongPassRes = AuthManager.login(testUser, '#ffb86c', 'WrongPassword');
  assert.ok(wrongPassRes.error, 'Login with wrong password must be rejected');

  // 5. Login with correct password
  const goodLoginRes = AuthManager.login(testUser, '#ffb86c', testPass);
  assert.equal(goodLoginRes.success, true, 'Login with correct password must succeed');
  assert.ok(goodLoginRes.token);
  assert.equal(goodLoginRes.isGuest, false);
  assert.equal(AuthManager.verifyToken(goodLoginRes.token), testUser);

  // 6. Guest login with unregistered name
  const guestName = `Gst_${Math.floor(Math.random() * 89999 + 10000)}`;
  const guestRes = AuthManager.login(guestName, '#50fa7b');
  assert.equal(guestRes.success, true);
  assert.equal(guestRes.isGuest, true);
  assert.equal(AuthManager.verifyToken(guestRes.token), guestName);
});
