import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }
  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }
  setItem(key, value) {
    this.values.set(key, String(value));
  }
  removeItem(key) {
    this.values.delete(key);
  }
  clear() {
    this.values.clear();
  }
}

test('local auth verifies hashes, session scope, signup, and password reset', async () => {
  globalThis.localStorage = new MemoryStorage();
  globalThis.sessionStorage = new MemoryStorage();
  const auth = await import(`../src/services/localAuth.js?test=${Date.now()}`);

  await auth.initializeLocalAuth();
  await assert.rejects(
    auth.signIn({ identifier: auth.DEMO_CREDENTIALS.identifier, password: 'wrong password' }),
    (error) => error.code === 'INVALID_CREDENTIALS'
  );

  const demo = await auth.signIn({
    identifier: auth.DEMO_CREDENTIALS.identifier,
    password: auth.DEMO_CREDENTIALS.password,
    remember: false,
  });
  assert.equal(demo.storeName, 'Sok Laundry');
  assert.equal(auth.getCurrentUser()?.accountId, demo.accountId);
  assert.equal(globalThis.localStorage.getItem('kitluy.partner.local-auth.session.v1'), null);
  assert.ok(globalThis.sessionStorage.getItem('kitluy.partner.local-auth.session.v1'));
  assert.doesNotMatch(
    globalThis.localStorage.getItem('kitluy.partner.local-auth.accounts.v1'),
    /KitLuy123!/
  );

  await auth.signOut();
  assert.equal(auth.getCurrentUser(), null);
  const account = await auth.signUp({
    storeName: 'Test Laundry',
    businessType: 'Laundry & wash-fold',
    province: 'Phnom Penh',
    ownerName: 'Test Owner',
    phone: '012345678',
    email: 'owner@example.test',
    password: 'TestPass123!',
    remember: true,
  });
  assert.equal(account.storeName, 'Test Laundry');
  assert.notEqual(account.accountId, demo.accountId);
  assert.equal(auth.getCurrentUser()?.accountId, account.accountId);
  assert.ok(globalThis.localStorage.getItem('kitluy.partner.local-auth.session.v1'));
  const restoredAuth = await import(`../src/services/localAuth.js?restore=${Date.now()}`);
  assert.equal(restoredAuth.getCurrentUser()?.accountId, account.accountId);

  const request = await auth.requestPasswordReset('owner@example.test');
  assert.match(request.code, /^\d{6}$/);
  const verified = await auth.verifyPasswordReset({
    identifier: 'owner@example.test',
    code: request.code,
  });
  await auth.resetPassword({ resetToken: verified.resetToken, newPassword: 'NewPass123!' });
  await assert.rejects(
    auth.signIn({ identifier: 'owner@example.test', password: 'TestPass123!' }),
    (error) => error.code === 'INVALID_CREDENTIALS'
  );
  const signedIn = await auth.signIn({
    identifier: 'owner@example.test',
    password: 'NewPass123!',
  });
  assert.equal(signedIn.name, 'Test Owner');
  assert.equal(signedIn.accountId, account.accountId);
  assert.equal(auth.getCurrentUser()?.accountId, account.accountId);

  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
});
