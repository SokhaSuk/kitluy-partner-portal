import {
  createDomainSeed,
  DOMAIN_COLLECTION_KEYS,
  DOMAIN_SCHEMA_VERSION,
} from '../data/domainSeed.js';

export const DOMAIN_STORAGE_KEY = 'kitluy.partner.domain';
export const DOMAIN_GUEST_SCOPE = 'guest';
export const DOMAIN_SCOPE_PREFIX = `${DOMAIN_STORAGE_KEY}.scope`;
export const DOMAIN_LEGACY_OWNER_KEY = `${DOMAIN_STORAGE_KEY}.legacy-owner.v1`;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function normalizeDomainScope(scope) {
  const value = String(scope || '').trim();
  return value || DOMAIN_GUEST_SCOPE;
}

export function domainStorageKeyForScope(scope) {
  return `${DOMAIN_SCOPE_PREFIX}.${encodeURIComponent(normalizeDomainScope(scope))}`;
}

const ARRAY_COLLECTIONS = new Set([
  'orders', 'customers', 'threads', 'services', 'addons', 'priceHistory',
  'promotions', 'marketingFlows', 'offers', 'adCampaigns', 'inventoryItems',
  'purchaseOrders', 'suppliers', 'adjustments', 'counts', 'stockMoves',
  'stations', 'workOrders', 'productionExceptions', 'members', 'shifts',
  'attendance', 'permissions', 'notifications', 'paymentOptions', 'auditEvents',
  'integrations', 'apiKeys', 'webhooks',
]);

const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const ORDER_STATUSES = new Set(['created', 'paid', 'processing', 'ready', 'collected', 'completed', 'cancelled']);

const RECORD_RULES = {
  orders: { code: 'string', customer: 'string', service: 'string', status: 'string', total: 'number' },
  customers: { name: 'string', phone: 'string', type: 'string' },
  threads: { who: 'string', messages: 'array' },
  services: { name: 'string', price: 'number' },
  addons: { name: 'string', on: 'boolean' },
  promotions: { code: 'string', status: 'string' },
  marketingFlows: { type: 'string', on: 'boolean' },
  offers: { type: 'string', on: 'boolean' },
  adCampaigns: { name: 'string', status: 'string' },
  inventoryItems: { name: 'string', quantity: 'number', unit: 'string' },
  purchaseOrders: { code: 'string', supplier: 'string', lines: 'array' },
  suppliers: { name: 'string' },
  stations: { name: 'string', load: 'number', cap: 'number' },
  workOrders: { code: 'string', status: 'string' },
  productionExceptions: { code: 'string', status: 'string' },
  members: { name: 'string', role: 'string' },
  notifications: { label: 'string', on: 'boolean' },
  paymentOptions: { label: 'string', on: 'boolean' },
  auditEvents: { type: 'string', at: 'string' },
  integrations: { name: 'string', status: 'string' },
  apiKeys: { label: 'string', key: 'string' },
  webhooks: { url: 'string', status: 'string' },
};

export function cloneDomain(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertSafeTree(value, depth = 0) {
  if (depth > 40) throw new Error('Domain import is nested too deeply');
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(key)) throw new Error(`Domain import contains unsafe key: ${key}`);
    assertSafeTree(child, depth + 1);
  }
}

export function validateDomainData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Domain data must be an object');
  }

  assertSafeTree(value);
  for (const key of DOMAIN_COLLECTION_KEYS) {
    if (!(key in value)) throw new Error(`Domain data is missing collection: ${key}`);
    if (ARRAY_COLLECTIONS.has(key) && !Array.isArray(value[key])) {
      throw new TypeError(`Domain collection ${key} must be an array`);
    }
    if (!ARRAY_COLLECTIONS.has(key) && (!value[key] || typeof value[key] !== 'object' || Array.isArray(value[key]))) {
      throw new TypeError(`Domain collection ${key} must be an object`);
    }
  }

  for (const [collection, rules] of Object.entries(RECORD_RULES)) {
    value[collection].forEach((record, index) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new TypeError(`Domain collection ${collection}[${index}] must be an object`);
      }
      for (const [field, expected] of Object.entries(rules)) {
        const actual = Array.isArray(record[field]) ? 'array' : typeof record[field];
        if (actual !== expected) {
          throw new TypeError(`Domain field ${collection}[${index}].${field} must be ${expected}`);
        }
      }
    });
  }

  for (const key of ['customerNotes', 'customerPreferences']) {
    for (const [customer, rows] of Object.entries(value[key])) {
      if (!Array.isArray(rows)) throw new TypeError(`Domain field ${key}.${customer} must be an array`);
    }
  }
  value.orders.forEach((order, index) => {
    if (!ORDER_STATUSES.has(order.status)) throw new TypeError(`Unsupported order status at orders[${index}]: ${order.status}`);
  });
  if (typeof value.storeSettings.name !== 'string') throw new TypeError('Domain field storeSettings.name must be string');
  if (typeof value.loyaltyMode.id !== 'string') throw new TypeError('Domain field loyaltyMode.id must be string');
  if (!value.genericState.toggles || typeof value.genericState.toggles !== 'object' || Array.isArray(value.genericState.toggles)) {
    throw new TypeError('Domain field genericState.toggles must be an object');
  }
  if (!Array.isArray(value.genericState.actions)) throw new TypeError('Domain field genericState.actions must be an array');

  const dataVersion = value.meta?.schemaVersion;
  if (dataVersion !== undefined && dataVersion !== DOMAIN_SCHEMA_VERSION) {
    throw new Error(`Unsupported domain schema version: ${dataVersion}`);
  }
  return value;
}

function parseJsonInput(input) {
  let json;
  if (typeof input === 'string') json = input;
  else {
    try {
      json = JSON.stringify(input);
    } catch {
      throw new TypeError('Domain import must be JSON-serializable');
    }
  }
  if (!json) throw new TypeError('Domain import is empty');
  if (json.length > MAX_IMPORT_BYTES) throw new Error('Domain import exceeds the 5 MB safety limit');
  try {
    return JSON.parse(json);
  } catch {
    throw new SyntaxError('Domain import is not valid JSON');
  }
}

/** Parses either an exported envelope or a bare domain snapshot, without writing it. */
export function parseDomainImport(input) {
  const parsed = parseJsonInput(input);
  assertSafeTree(parsed);

  const isEnvelope = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'data' in parsed;
  if (isEnvelope && parsed.schemaVersion !== DOMAIN_SCHEMA_VERSION) {
    throw new Error(`Unsupported domain export version: ${parsed.schemaVersion}`);
  }
  const data = isEnvelope ? parsed.data : parsed;
  validateDomainData(data);
  return cloneDomain(data);
}

function createEnvelope(data, savedAt) {
  return {
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    savedAt,
    data,
  };
}

function storageLike(storage) {
  return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
}

function defaultStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

/**
 * Claims the pre-scope legacy snapshot for the first authenticated account.
 * The legacy value is copied, never removed, and a durable owner marker stops
 * later accounts from adopting it.
 */
export function adoptLegacyDomainSnapshot({
  storage = defaultStorage(),
  scope,
  now = () => new Date().toISOString(),
  onError = () => {},
} = {}) {
  const normalizedScope = normalizeDomainScope(scope);
  const scopedKey = domainStorageKeyForScope(normalizedScope);
  if (normalizedScope === DOMAIN_GUEST_SCOPE || !storageLike(storage)) {
    return { adopted: false, key: scopedKey, scope: normalizedScope };
  }

  try {
    const scopedRaw = storage.getItem(scopedKey);
    const legacyRaw = storage.getItem(DOMAIN_STORAGE_KEY);
    if (legacyRaw == null) return { adopted: false, key: scopedKey, scope: normalizedScope };

    const markerRaw = storage.getItem(DOMAIN_LEGACY_OWNER_KEY);
    let marker = null;
    if (markerRaw) {
      try {
        marker = JSON.parse(markerRaw);
      } catch {
        onError(new Error('Legacy domain owner marker is invalid; the legacy snapshot was left untouched'));
        return { adopted: false, key: scopedKey, scope: normalizedScope };
      }
      if (marker?.version !== 1 || typeof marker.scope !== 'string' || !marker.scope.trim()) {
        onError(new Error('Legacy domain owner marker is invalid; the legacy snapshot was left untouched'));
        return { adopted: false, key: scopedKey, scope: normalizedScope };
      }
    }
    if (!marker) {
      marker = { version: 1, scope: normalizedScope, claimedAt: now() };
      storage.setItem(DOMAIN_LEGACY_OWNER_KEY, JSON.stringify(marker));
      marker = JSON.parse(storage.getItem(DOMAIN_LEGACY_OWNER_KEY) || 'null');
    }
    if (marker?.scope !== normalizedScope) {
      return { adopted: false, key: scopedKey, scope: normalizedScope };
    }

    // A scoped snapshot is authoritative, but claiming the legacy marker here
    // prevents an unrelated account from inheriting old pre-scope data later.
    if (scopedRaw != null) {
      return { adopted: false, key: scopedKey, scope: normalizedScope };
    }

    storage.setItem(scopedKey, legacyRaw);
    return { adopted: true, key: scopedKey, scope: normalizedScope };
  } catch (error) {
    onError(error);
    return { adopted: false, key: scopedKey, scope: normalizedScope };
  }
}

export function createScopedDomainRepository(options = {}) {
  const scope = normalizeDomainScope(options.scope);
  const adoption = adoptLegacyDomainSnapshot({ ...options, scope });
  const repository = createDomainRepository({
    ...options,
    key: adoption.key,
  });
  return { ...repository, scope, legacyAdopted: adoption.adopted };
}

/**
 * Versioned localStorage repository. The first load writes one seed snapshot;
 * later loads always use the stored snapshot until reset/replace is explicit.
 */
export function createDomainRepository({
  storage = defaultStorage(),
  key = DOMAIN_STORAGE_KEY,
  now = () => new Date().toISOString(),
  seedFactory = createDomainSeed,
  onError = () => {},
} = {}) {
  let memory = null;
  let recovery = null;

  const write = (data, { replaceRecovery = false } = {}) => {
    const savedAt = now();
    const next = cloneDomain(data);
    const activeRecovery = recovery;
    const recoveryBlocked = Boolean(activeRecovery && !replaceRecovery);
    next.meta = {
      ...(next.meta || {}),
      schemaVersion: DOMAIN_SCHEMA_VERSION,
      createdAt: next.meta?.createdAt || savedAt,
      updatedAt: savedAt,
      persistence: recoveryBlocked || !storageLike(storage) ? 'memory' : 'localStorage',
    };
    if (recoveryBlocked) {
      next.meta.persistenceError = recovery.message;
      next.meta.recoveryRequired = true;
      next.meta.preservedStorageKey = key;
    } else {
      delete next.meta.persistenceError;
      delete next.meta.recoveryRequired;
      delete next.meta.preservedStorageKey;
    }
    validateDomainData(next);
    let envelope = createEnvelope(next, savedAt);
    memory = envelope;
    if (storageLike(storage) && !recoveryBlocked) {
      try {
        storage.setItem(key, JSON.stringify(envelope));
        if (replaceRecovery) recovery = null;
      } catch (error) {
        onError(error);
        next.meta.persistence = 'memory';
        next.meta.persistenceError = error?.message || 'Browser storage write failed';
        if (activeRecovery) {
          recovery = {
            message: `${activeRecovery.message} Explicit replacement could not be saved: ${error?.message || 'Browser storage write failed'}`,
          };
          next.meta.persistenceError = recovery.message;
          next.meta.recoveryRequired = true;
          next.meta.preservedStorageKey = key;
        }
        envelope = createEnvelope(next, savedAt);
        memory = envelope;
      }
    } else if (activeRecovery && replaceRecovery) {
      recovery = activeRecovery;
      next.meta.persistence = 'memory';
      next.meta.persistenceError = `${activeRecovery.message} Explicit replacement could not be saved because browser storage is unavailable.`;
      next.meta.recoveryRequired = true;
      next.meta.preservedStorageKey = key;
      envelope = createEnvelope(next, savedAt);
      memory = envelope;
    }
    return cloneDomain(next);
  };

  const freshSeed = () => seedFactory({ now });

  const load = () => {
    if (recovery && memory) return cloneDomain(memory.data);
    let raw = null;
    let readError = null;
    if (storageLike(storage)) {
      try {
        raw = storage.getItem(key);
      } catch (error) {
        onError(error);
        readError = error;
      }
    }

    if (readError) {
      recovery = {
        message: `Stored domain data could not be read and remains untouched. Use Reset data or Import data to replace it. ${readError?.message || ''}`.trim(),
      };
      return write(freshSeed());
    }

    if (raw == null && memory) return cloneDomain(memory.data);
    if (raw == null) return write(freshSeed());

    try {
      const data = parseDomainImport(raw);
      memory = createEnvelope(data, data.meta?.updatedAt || now());
      return data;
    } catch (error) {
      onError(error);
      recovery = {
        message: `Stored domain data could not be loaded and remains untouched. Use Reset data or Import data to replace it. ${error?.message || ''}`.trim(),
      };
      return write(freshSeed());
    }
  };

  const save = (data) => write(parseDomainImport(data));
  const reset = () => write(freshSeed(), { replaceRecovery: true });
  const replaceData = (input) => {
    const parsed = parseDomainImport(input);
    return write(parsed, { replaceRecovery: true });
  };
  const exportData = ({ pretty = true } = {}) => {
    const data = load();
    const envelope = createEnvelope(data, data.meta?.updatedAt || now());
    return JSON.stringify(envelope, null, pretty ? 2 : 0);
  };

  return {
    key,
    schemaVersion: DOMAIN_SCHEMA_VERSION,
    load,
    save,
    reset,
    replaceData,
    parseImport: parseDomainImport,
    exportData,
    hasRecovery: () => Boolean(recovery),
  };
}
