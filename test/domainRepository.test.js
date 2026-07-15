import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDomainRepository,
  createScopedDomainRepository,
  domainStorageKeyForScope,
  DOMAIN_LEGACY_OWNER_KEY,
  DOMAIN_STORAGE_KEY,
} from '../src/store/domainRepository.js';

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.writes = 0;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.writes += 1;
    this.values.set(key, String(value));
  }
}

const fixedNow = () => '2026-07-13T12:00:00.000Z';

test('seeds only once and loads the persisted snapshot on later starts', () => {
  const storage = new MemoryStorage();
  const repository = createDomainRepository({ storage, now: fixedNow });

  const seeded = repository.load();
  assert.equal(storage.writes, 1);
  assert.ok(seeded.orders.length > 0);

  seeded.storeSettings.name = 'Persisted Laundry';
  repository.save(seeded);
  const restarted = createDomainRepository({ storage, now: fixedNow }).load();

  assert.equal(storage.writes, 2);
  assert.equal(restarted.storeSettings.name, 'Persisted Laundry');
});

test('exports a versioned envelope and safely replaces from it', () => {
  const storage = new MemoryStorage();
  const repository = createDomainRepository({ storage, now: fixedNow });
  repository.load();

  const exported = JSON.parse(repository.exportData({ pretty: false }));
  assert.equal(exported.schemaVersion, 1);
  exported.data.storeSettings.name = 'Imported Laundry';

  const imported = repository.replaceData(JSON.stringify(exported));
  assert.equal(imported.storeSettings.name, 'Imported Laundry');
  assert.equal(repository.load().storeSettings.name, 'Imported Laundry');
});

test('rejects malformed, incomplete, future, and unsafe imports without replacing storage', () => {
  const storage = new MemoryStorage();
  const repository = createDomainRepository({ storage, now: fixedNow });
  repository.load();
  const before = storage.getItem(DOMAIN_STORAGE_KEY);

  assert.throws(() => repository.replaceData('{bad json'), /valid JSON/);
  assert.throws(() => repository.replaceData({ orders: [] }), /missing collection/);
  assert.throws(
    () => repository.replaceData({ schemaVersion: 999, data: JSON.parse(before).data }),
    /Unsupported domain export version/
  );
  assert.throws(
    () => repository.replaceData(`{"schemaVersion":1,"data":{"__proto__":{},"orders":[]}}`),
    /unsafe key/
  );
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), before);
});

test('reset restores canonical seed data and persists it', () => {
  const storage = new MemoryStorage();
  const repository = createDomainRepository({ storage, now: fixedNow });
  const changed = repository.load();
  changed.orders = [];
  repository.save(changed);

  const reset = repository.reset();
  assert.ok(reset.orders.length > 0);
  assert.ok(repository.load().orders.length > 0);
});

test('keeps corrupt persisted JSON untouched and runs in memory until explicit reset', () => {
  const storage = new MemoryStorage();
  const corrupt = 'not-json';
  storage.setItem(DOMAIN_STORAGE_KEY, corrupt);
  const errors = [];
  const repository = createDomainRepository({ storage, now: fixedNow, onError: (error) => errors.push(error) });

  const recovered = repository.load();
  assert.ok(recovered.customers.length > 0);
  assert.equal(recovered.meta.persistence, 'memory');
  assert.equal(recovered.meta.recoveryRequired, true);
  assert.match(recovered.meta.persistenceError, /remains untouched/);
  assert.equal(errors.length, 1);
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), corrupt);

  recovered.storeSettings.name = 'Memory Recovery';
  repository.save(recovered);
  assert.equal(repository.load().storeSettings.name, 'Memory Recovery');
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), corrupt);
  assert.equal(repository.hasRecovery(), true);

  repository.reset();
  assert.doesNotThrow(() => JSON.parse(storage.getItem(DOMAIN_STORAGE_KEY)));
  assert.equal(repository.hasRecovery(), false);
});

test('keeps recovery protected when an explicit replacement cannot be persisted', () => {
  const storage = new MemoryStorage();
  const corrupt = '{still-broken';
  storage.setItem(DOMAIN_STORAGE_KEY, corrupt);
  const originalSetItem = storage.setItem.bind(storage);
  let writesBlocked = true;
  storage.setItem = (key, value) => {
    if (writesBlocked) throw new Error('quota blocked');
    originalSetItem(key, value);
  };
  const repository = createDomainRepository({ storage, now: fixedNow });

  repository.load();
  const failedReset = repository.reset();
  assert.equal(failedReset.meta.persistence, 'memory');
  assert.equal(failedReset.meta.recoveryRequired, true);
  assert.match(failedReset.meta.persistenceError, /quota blocked/);
  assert.equal(repository.hasRecovery(), true);
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), corrupt);

  writesBlocked = false;
  repository.reset();
  assert.equal(repository.hasRecovery(), false);
  assert.doesNotThrow(() => JSON.parse(storage.getItem(DOMAIN_STORAGE_KEY)));
});

test('continues in memory when browser storage is blocked', () => {
  const errors = [];
  const storage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  const repository = createDomainRepository({ storage, now: fixedNow, onError: (error) => errors.push(error) });

  const seeded = repository.load();
  seeded.storeSettings.name = 'Memory Only';
  repository.save(seeded);

  assert.equal(repository.load().storeSettings.name, 'Memory Only');
  assert.ok(errors.length >= 1);
});

test('keeps version-mismatched data untouched until an explicit valid import', () => {
  const storage = new MemoryStorage();
  const source = createDomainRepository({ storage: new MemoryStorage(), now: fixedNow });
  const future = JSON.parse(source.exportData({ pretty: false }));
  future.schemaVersion = 999;
  const raw = JSON.stringify(future);
  storage.setItem(DOMAIN_STORAGE_KEY, raw);
  const repository = createDomainRepository({ storage, now: fixedNow });

  const recovered = repository.load();
  assert.equal(recovered.meta.recoveryRequired, true);
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), raw);

  const replacement = source.load();
  replacement.storeSettings.name = 'Explicit Import';
  repository.replaceData(replacement);
  assert.equal(repository.load().storeSettings.name, 'Explicit Import');
  assert.notEqual(storage.getItem(DOMAIN_STORAGE_KEY), raw);
});

test('scopes domain data independently for guest and local auth accounts', () => {
  const storage = new MemoryStorage();
  const accountA = createScopedDomainRepository({ storage, scope: 'acct_a', now: fixedNow });
  const dataA = accountA.load();
  dataA.storeSettings.name = 'Account A Laundry';
  accountA.save(dataA);

  const accountB = createScopedDomainRepository({ storage, scope: 'acct_b', now: fixedNow });
  const guest = createScopedDomainRepository({ storage, scope: null, now: fixedNow });
  assert.equal(accountB.load().storeSettings.name, 'Sok Laundry');
  const guestData = guest.load();
  assert.equal(guestData.storeSettings.name, 'Sok Laundry');
  guestData.storeSettings.name = 'Guest Laundry';
  guest.save(guestData);
  assert.equal(createScopedDomainRepository({ storage, scope: 'acct_a', now: fixedNow }).load().storeSettings.name, 'Account A Laundry');
  assert.equal(createScopedDomainRepository({ storage, scope: null, now: fixedNow }).load().storeSettings.name, 'Guest Laundry');
  assert.notEqual(domainStorageKeyForScope('acct_a'), domainStorageKeyForScope('acct_b'));
  assert.notEqual(domainStorageKeyForScope('acct_a'), domainStorageKeyForScope(null));
});

test('adopts the legacy snapshot for at most one authenticated account', () => {
  const storage = new MemoryStorage();
  const legacy = createDomainRepository({ storage, now: fixedNow });
  const legacyData = legacy.load();
  legacyData.storeSettings.name = 'Legacy Laundry';
  legacy.save(legacyData);
  const legacyRaw = storage.getItem(DOMAIN_STORAGE_KEY);

  const first = createScopedDomainRepository({ storage, scope: 'acct_first', now: fixedNow });
  assert.equal(first.legacyAdopted, true);
  assert.equal(first.load().storeSettings.name, 'Legacy Laundry');
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), legacyRaw);

  const second = createScopedDomainRepository({ storage, scope: 'acct_second', now: fixedNow });
  assert.equal(second.legacyAdopted, false);
  assert.equal(second.load().storeSettings.name, 'Sok Laundry');
  assert.equal(JSON.parse(storage.getItem(DOMAIN_LEGACY_OWNER_KEY)).scope, 'acct_first');
});

test('keeps an existing scoped snapshot authoritative while consuming the legacy claim', () => {
  const storage = new MemoryStorage();
  const legacySource = createDomainRepository({ storage: new MemoryStorage(), now: fixedNow });
  const legacyData = legacySource.load();
  legacyData.storeSettings.name = 'Legacy Laundry';
  const legacyRaw = JSON.stringify({
    schemaVersion: 1,
    savedAt: fixedNow(),
    data: legacyData,
  });
  storage.setItem(DOMAIN_STORAGE_KEY, legacyRaw);

  const scopedData = legacySource.load();
  scopedData.storeSettings.name = 'Existing Account Laundry';
  storage.setItem(domainStorageKeyForScope('acct_existing'), JSON.stringify({
    schemaVersion: 1,
    savedAt: fixedNow(),
    data: scopedData,
  }));

  const existing = createScopedDomainRepository({ storage, scope: 'acct_existing', now: fixedNow });
  assert.equal(existing.legacyAdopted, false);
  assert.equal(existing.load().storeSettings.name, 'Existing Account Laundry');
  assert.equal(JSON.parse(storage.getItem(DOMAIN_LEGACY_OWNER_KEY)).scope, 'acct_existing');

  const other = createScopedDomainRepository({ storage, scope: 'acct_other', now: fixedNow });
  assert.equal(other.load().storeSettings.name, 'Sok Laundry');
  assert.equal(storage.getItem(DOMAIN_STORAGE_KEY), legacyRaw);
});
