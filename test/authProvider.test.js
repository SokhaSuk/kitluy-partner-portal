import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAuthProvider,
  createSupabaseAuthProvider,
  supabaseUserToAccount,
} from '../src/services/authProvider.js';

/**
 * A stand-in for supabase.auth. Records the calls the provider makes, so the query
 * shapes are verified without a live backend — the part most likely to be wrong.
 */
function fakeSupabase({ session = null } = {}) {
  const calls = [];
  const listeners = [];

  const auth = {
    calls,
    emit(event, nextSession) {
      listeners.forEach((cb) => cb(event, nextSession));
    },
    async getSession() {
      return { data: { session }, error: null };
    },
    onAuthStateChange(cb) {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithPassword(credentials) {
      calls.push({ op: 'signInWithPassword', credentials });
      return { data: { user: { id: 'uid_1', email: credentials.email, user_metadata: {} } }, error: null };
    },
    async signUp(payload) {
      calls.push({ op: 'signUp', payload });
      return {
        data: { user: { id: 'uid_new', email: payload.email, user_metadata: payload.options.data } },
        error: null,
      };
    },
    async resetPasswordForEmail(email) {
      calls.push({ op: 'resetPasswordForEmail', email });
      return { error: null };
    },
    async verifyOtp(payload) {
      calls.push({ op: 'verifyOtp', payload });
      return { data: { session: { access_token: 'tok_123' } }, error: null };
    },
    async updateUser(payload) {
      calls.push({ op: 'updateUser', payload });
      return { data: { user: { id: 'uid_1', email: 'a@b.com', user_metadata: {} } }, error: null };
    },
    async signOut() {
      calls.push({ op: 'signOut' });
      return { error: null };
    },
  };

  return { auth };
}

test('with no client, the provider is the device-local one', () => {
  const provider = createAuthProvider({ client: null });
  assert.equal(provider.kind, 'local');
  assert.equal(provider.subscribe, null, 'a local account has no cross-device channel');
});

test('with a client, the provider is the Supabase one', () => {
  const provider = createAuthProvider({ client: fakeSupabase() });
  assert.equal(provider.kind, 'supabase');
  assert.equal(typeof provider.subscribe, 'function');
});

test('a Supabase auth user maps onto the shape the app already speaks', () => {
  const account = supabaseUserToAccount({
    id: 'uid_9',
    email: 'sok@store.com',
    user_metadata: { name: 'Sok', store_name: 'Sok Laundry', province: 'Kampot', business_type: 'Laundry' },
  });

  assert.equal(account.accountId, 'uid_9', 'accountId is the auth uid — what scopes the store');
  assert.equal(account.name, 'Sok');
  assert.equal(account.storeName, 'Sok Laundry');
  assert.equal(account.store.province, 'Kampot');
  assert.equal(supabaseUserToAccount(null), null);
});

test('an email identifier signs in by email, a phone one by phone', async () => {
  const client = fakeSupabase();
  const provider = createSupabaseAuthProvider({ client });

  await provider.signIn({ identifier: 'sok@store.com', password: 'x' });
  await provider.signIn({ identifier: '012 345 678', password: 'x' });

  const [byEmail, byPhone] = client.auth.calls;
  assert.deepEqual(Object.keys(byEmail.credentials).sort(), ['email', 'password']);
  assert.equal(byPhone.credentials.phone, '012345678', 'phone is normalized, spaces stripped');
});

test('sign-up carries the store profile into user_metadata', async () => {
  const client = fakeSupabase();
  const provider = createSupabaseAuthProvider({ client });

  const account = await provider.signUp({
    email: 'new@store.com',
    password: 'KitLuy123!',
    ownerName: 'Rithy',
    storeName: 'Rithy Wash',
    businessType: 'Laundry & wash-fold',
    province: 'Kampot',
  });

  assert.equal(account.accountId, 'uid_new');
  assert.equal(account.storeName, 'Rithy Wash');

  const call = client.auth.calls.find((c) => c.op === 'signUp');
  assert.equal(call.payload.options.data.store_name, 'Rithy Wash', 'the store name is persisted');
  assert.equal(call.payload.options.data.role, 'Owner');
});

test('getSession returns the restored user, or null when signed out', async () => {
  const signedIn = createSupabaseAuthProvider({
    client: fakeSupabase({ session: { user: { id: 'uid_1', email: 'a@b.com', user_metadata: {} } } }),
  });
  assert.equal((await signedIn.getSession()).accountId, 'uid_1');

  const signedOut = createSupabaseAuthProvider({ client: fakeSupabase({ session: null }) });
  assert.equal(await signedOut.getSession(), null);
});

test('subscribe delivers the account on an auth state change', async () => {
  const client = fakeSupabase();
  const provider = createSupabaseAuthProvider({ client });

  const seen = [];
  const unsubscribe = provider.subscribe((account) => seen.push(account));

  client.auth.emit('SIGNED_IN', { user: { id: 'uid_1', email: 'a@b.com', user_metadata: {} } });
  client.auth.emit('SIGNED_OUT', null);

  assert.equal(seen[0].accountId, 'uid_1');
  assert.equal(seen[1], null, 'a sign-out on another device arrives as null');
  assert.equal(typeof unsubscribe, 'function');
});

test('a password reset verifies the OTP then updates, and does not stay signed in', async () => {
  const client = fakeSupabase();
  const provider = createSupabaseAuthProvider({ client });

  const { resetToken } = await provider.verifyPasswordReset({ identifier: 'a@b.com', code: '123456' });
  assert.equal(resetToken, 'tok_123');

  await provider.resetPassword({ resetToken, newPassword: 'NewPass123!' });

  const ops = client.auth.calls.map((c) => c.op);
  assert.ok(ops.includes('updateUser'), 'the password is actually changed');
  assert.ok(ops.includes('signOut'), 'and the session is cleared, matching local behaviour');
});

test('phone reset is refused with a clear message, since it needs SMS config', async () => {
  const provider = createSupabaseAuthProvider({ client: fakeSupabase() });
  await assert.rejects(() => provider.requestPasswordReset('012345678'), /email on the account/);
});
