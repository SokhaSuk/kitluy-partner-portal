/**
 * Browser-local authentication for the development portal.
 *
 * This is deliberately not a production identity system. Accounts are scoped to
 * this browser profile, password hashes live in localStorage, and reset codes are
 * displayed by the UI because no email/SMS provider exists. The persisted shapes
 * are versioned so a future migration can be explicit instead of silently losing
 * local accounts.
 */

const STORE_VERSION = 1;
const SESSION_VERSION = 1;
const RESET_VERSION = 1;

const ACCOUNT_STORE_KEY = 'kitluy.partner.local-auth.accounts.v1';
const SESSION_KEY = 'kitluy.partner.local-auth.session.v1';
const RESET_KEY = 'kitluy.partner.local-auth.reset.v1';
const LEGACY_SESSION_KEY = 'kitluy.partner.session';

const RESET_TTL_MS = 10 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

/** Credentials intentionally documented for this local-development build. */
export const DEMO_CREDENTIALS = Object.freeze({
  identifier: 'demo@kitluy.local',
  password: 'KitLuy123!',
  storeName: 'Sok Laundry',
});

export class LocalAuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LocalAuthError';
    this.code = code;
  }
}

const emptyStore = () => ({ version: STORE_VERSION, accounts: [] });

function storage(name) {
  try {
    return globalThis[name] || null;
  } catch {
    return null;
  }
}

function readJson(target, key) {
  if (!target) return null;
  try {
    const raw = target.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    throw new LocalAuthError(
      'STORAGE_READ_FAILED',
      `Local account data could not be read in this browser. ${error?.message || ''}`.trim()
    );
  }
}

function writeJson(target, key, value) {
  if (!target) {
    throw new LocalAuthError(
      'STORAGE_UNAVAILABLE',
      'Browser storage is unavailable, so this local-development account cannot be saved.'
    );
  }
  try {
    target.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new LocalAuthError(
      'STORAGE_WRITE_FAILED',
      `Local account data could not be saved in this browser. ${error?.message || ''}`.trim()
    );
  }
}

function remove(target, key) {
  try {
    target?.removeItem(key);
  } catch {
    // Clearing a best-effort local session must never trap the user in the portal.
  }
}

function readAccountStore() {
  const value = readJson(storage('localStorage'), ACCOUNT_STORE_KEY);
  if (!value) return emptyStore();
  if (value.version !== STORE_VERSION || !Array.isArray(value.accounts)) {
    throw new LocalAuthError(
      'STORE_VERSION_UNSUPPORTED',
      'This browser contains an unsupported local account-store version. Clear the site data to restart the development account store.'
    );
  }
  return value;
}

function writeAccountStore(value) {
  writeJson(storage('localStorage'), ACCOUNT_STORE_KEY, value);
}

function utf8Bytes(value) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
  const bytes = [];
  for (const char of value) {
    const point = char.codePointAt(0);
    if (point <= 0x7f) bytes.push(point);
    else if (point <= 0x7ff) {
      bytes.push(0xc0 | (point >>> 6), 0x80 | (point & 0x3f));
    } else if (point <= 0xffff) {
      bytes.push(0xe0 | (point >>> 12), 0x80 | ((point >>> 6) & 0x3f), 0x80 | (point & 0x3f));
    } else {
      bytes.push(
        0xf0 | (point >>> 18),
        0x80 | ((point >>> 12) & 0x3f),
        0x80 | ((point >>> 6) & 0x3f),
        0x80 | (point & 0x3f)
      );
    }
  }
  return Uint8Array.from(bytes);
}

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotateRight = (value, bits) => (value >>> bits) | (value << (32 - bits));

/** Deterministic SHA-256 fallback used only when Web Crypto is unavailable. */
function fallbackSha256(bytes) {
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i += 1) {
      const x = words[i - 15];
      const y = words[i - 2];
      const s0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3);
      const s1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ (y >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choose + SHA256_K[i] + words[i]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

async function sha256(value) {
  const bytes = utf8Bytes(value);
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Some non-secure development origins expose crypto without usable subtle.
  }
  return fallbackSha256(bytes);
}

let fallbackNonce = 0;

function randomHex(byteLength = 16) {
  const bytes = new Uint8Array(byteLength);
  try {
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fall through to a development-only nonce below.
  }
  fallbackNonce += 1;
  const seed = `${Date.now()}:${fallbackNonce}:${Math.random()}`;
  return fallbackSha256(utf8Bytes(seed)).slice(0, byteLength * 2);
}

function randomId(prefix) {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  } catch {
    // Use the local fallback below.
  }
  return `${prefix}_${randomHex(16)}`;
}

function randomResetCode() {
  const number = Number.parseInt(randomHex(4), 16) % 1000000;
  return String(number).padStart(6, '0');
}

async function passwordRecord(password, salt = randomHex(16)) {
  return {
    algorithm: 'sha256-v1',
    salt,
    hash: await sha256(`kitluy-local-auth:${salt}:${password}`),
  };
}

async function verifyPassword(password, record) {
  if (!record || record.algorithm !== 'sha256-v1' || !record.salt || !record.hash) return false;
  const candidate = await sha256(`kitluy-local-auth:${record.salt}:${password}`);
  if (candidate.length !== record.hash.length) return false;
  let difference = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    difference |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i);
  }
  return difference === 0;
}

function normalizeIdentifier(value) {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return `email:${raw.toLowerCase()}`;
  const phone = raw.replace(/\D/g, '');
  return phone ? `phone:${phone}` : '';
}

function identifiersFor({ phone, email }) {
  return [normalizeIdentifier(phone), normalizeIdentifier(email)].filter(Boolean);
}

function findAccount(storeValue, identifier) {
  const normalized = normalizeIdentifier(identifier);
  return normalized
    ? storeValue.accounts.find((account) => account.identifiers.includes(normalized)) || null
    : null;
}

function publicUser(account) {
  if (!account) return null;
  return {
    accountId: account.id,
    name: account.profile.name,
    role: account.role,
    contact: account.profile.phone || account.profile.email,
    phone: account.profile.phone,
    email: account.profile.email,
    storeName: account.store.name,
    store: { ...account.store },
  };
}

function clearSessions() {
  remove(storage('localStorage'), SESSION_KEY);
  remove(storage('sessionStorage'), SESSION_KEY);
  remove(storage('localStorage'), LEGACY_SESSION_KEY);
}

function persistSession(accountId, remember) {
  clearSessions();
  const value = {
    version: SESSION_VERSION,
    accountId,
    createdAt: new Date().toISOString(),
  };
  writeJson(storage(remember ? 'localStorage' : 'sessionStorage'), SESSION_KEY, value);
}

function readSession() {
  const value =
    readJson(storage('sessionStorage'), SESSION_KEY) ||
    readJson(storage('localStorage'), SESSION_KEY);
  return value?.version === SESSION_VERSION && value.accountId ? value : null;
}

function readReset() {
  const value = readJson(storage('sessionStorage'), RESET_KEY);
  return value?.version === RESET_VERSION ? value : null;
}

function writeReset(value) {
  writeJson(storage('sessionStorage'), RESET_KEY, value);
}

function clearReset() {
  remove(storage('sessionStorage'), RESET_KEY);
}

let initialization;

export function initializeLocalAuth() {
  if (!initialization) {
    initialization = (async () => {
      const storeValue = readAccountStore();
      if (!storeValue.accounts.some((account) => account.seed === 'demo-v1')) {
        const now = new Date().toISOString();
        storeValue.accounts.push({
          id: 'acct_demo_v1',
          seed: 'demo-v1',
          role: 'Owner',
          identifiers: identifiersFor({
            phone: '+855 12 345 678',
            email: DEMO_CREDENTIALS.identifier,
          }),
          store: {
            name: DEMO_CREDENTIALS.storeName,
            businessType: 'Laundry & wash-fold',
            province: 'Phnom Penh',
          },
          profile: {
            name: 'Het Sovannara',
            phone: '+855 12 345 678',
            email: DEMO_CREDENTIALS.identifier,
          },
          password: await passwordRecord(DEMO_CREDENTIALS.password),
          createdAt: now,
          updatedAt: now,
        });
        writeAccountStore(storeValue);
      }
      remove(storage('localStorage'), LEGACY_SESSION_KEY);
      return true;
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

/** Synchronous restore used during the first React render to avoid auth flicker. */
export function getCurrentUser() {
  try {
    const current = readSession();
    if (!current) return null;
    const account = readAccountStore().accounts.find((item) => item.id === current.accountId);
    if (!account) {
      clearSessions();
      return null;
    }
    return publicUser(account);
  } catch {
    return null;
  }
}

export async function signIn({ identifier, password, remember = true }) {
  await initializeLocalAuth();
  const storeValue = readAccountStore();
  const account = findAccount(storeValue, identifier);
  const valid = account ? await verifyPassword(password, account.password) : false;
  if (!valid) {
    throw new LocalAuthError(
      'INVALID_CREDENTIALS',
      'The phone number/email or password is incorrect for this browser-local account.'
    );
  }
  persistSession(account.id, remember);
  return publicUser(account);
}

export async function signUp({
  storeName,
  businessType,
  province,
  ownerName,
  phone,
  email,
  password,
  remember = true,
}) {
  await initializeLocalAuth();
  const storeValue = readAccountStore();
  const identifiers = identifiersFor({ phone, email });
  if (identifiers.some((identifier) => storeValue.accounts.some((a) => a.identifiers.includes(identifier)))) {
    throw new LocalAuthError(
      'ACCOUNT_EXISTS',
      'A browser-local account already uses that phone number or email. Sign in or reset its password.'
    );
  }

  const now = new Date().toISOString();
  const account = {
    id: randomId('acct'),
    role: 'Owner',
    identifiers,
    store: {
      name: storeName.trim(),
      businessType,
      province,
    },
    profile: {
      name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
    },
    password: await passwordRecord(password),
    createdAt: now,
    updatedAt: now,
  };
  storeValue.accounts.push(account);
  writeAccountStore(storeValue);
  persistSession(account.id, remember);
  return publicUser(account);
}

export async function requestPasswordReset(identifier) {
  await initializeLocalAuth();
  const storeValue = readAccountStore();
  const account = findAccount(storeValue, identifier);
  if (!account) {
    throw new LocalAuthError(
      'ACCOUNT_NOT_FOUND',
      'No browser-local account matches that phone number or email.'
    );
  }

  const code = randomResetCode();
  const salt = randomHex(12);
  const createdAt = Date.now();
  writeReset({
    version: RESET_VERSION,
    accountId: account.id,
    identifier: normalizeIdentifier(identifier),
    codeSalt: salt,
    codeHash: await sha256(`kitluy-local-reset:${salt}:${code}`),
    attempts: 0,
    createdAt,
    expiresAt: createdAt + RESET_TTL_MS,
    resetToken: null,
  });
  return { code, expiresAt: createdAt + RESET_TTL_MS };
}

export async function verifyPasswordReset({ identifier, code }) {
  await initializeLocalAuth();
  const reset = readReset();
  if (!reset || reset.identifier !== normalizeIdentifier(identifier)) {
    throw new LocalAuthError('RESET_NOT_FOUND', 'Generate a new development reset code first.');
  }
  if (Date.now() > reset.expiresAt) {
    clearReset();
    throw new LocalAuthError('RESET_EXPIRED', 'That development reset code expired. Generate a new one.');
  }
  if (reset.attempts >= MAX_RESET_ATTEMPTS) {
    clearReset();
    throw new LocalAuthError('RESET_LOCKED', 'Too many incorrect attempts. Generate a new code.');
  }

  const candidate = await sha256(`kitluy-local-reset:${reset.codeSalt}:${code}`);
  if (candidate !== reset.codeHash) {
    const attempts = reset.attempts + 1;
    writeReset({ ...reset, attempts });
    throw new LocalAuthError(
      'INVALID_RESET_CODE',
      attempts >= MAX_RESET_ATTEMPTS
        ? 'Too many incorrect attempts. Generate a new code.'
        : 'That development reset code is not correct.'
    );
  }

  const resetToken = randomHex(24);
  writeReset({ ...reset, resetToken, verifiedAt: Date.now() });
  return { resetToken };
}

export async function resetPassword({ resetToken, newPassword }) {
  await initializeLocalAuth();
  const reset = readReset();
  if (!reset || !reset.resetToken || reset.resetToken !== resetToken) {
    throw new LocalAuthError('RESET_NOT_VERIFIED', 'Verify a fresh development reset code first.');
  }
  if (Date.now() > reset.expiresAt) {
    clearReset();
    throw new LocalAuthError('RESET_EXPIRED', 'That reset request expired. Start again.');
  }

  const storeValue = readAccountStore();
  const index = storeValue.accounts.findIndex((account) => account.id === reset.accountId);
  if (index < 0) {
    clearReset();
    throw new LocalAuthError('ACCOUNT_NOT_FOUND', 'The browser-local account no longer exists.');
  }
  const account = storeValue.accounts[index];
  storeValue.accounts[index] = {
    ...account,
    password: await passwordRecord(newPassword),
    updatedAt: new Date().toISOString(),
  };
  writeAccountStore(storeValue);
  clearReset();
  clearSessions();
  return publicUser(storeValue.accounts[index]);
}

export async function signOut() {
  clearSessions();
  clearReset();
}
