import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLocalGateway,
  createSupabaseGateway,
  DomainConflictError,
} from '../src/store/domainGateway.js';

/* ── a stand-in for the device-local repository ───────────────────────── */

function fakeRepository(seed) {
  let stored = seed;
  return {
    load: () => stored,
    save: (data) => {
      stored = data;
      return data;
    },
    replaceData: (data) => {
      stored = data;
      return data;
    },
    reset: () => stored,
  };
}

const snapshot = (updatedAt, extra = {}) => ({
  meta: { schemaVersion: 1, updatedAt },
  orders: [],
  ...extra,
});

/* ── a stand-in for @supabase/supabase-js ─────────────────────────────── */

/**
 * Mimics the exact call chains the gateway uses. This is what verifies the query
 * shapes without a live database — the part of this code most likely to be wrong.
 */
function fakeSupabase({ row = null, failUpdate = false } = {}) {
  const state = { row, calls: [] };

  const from = () => {
    const filters = {};
    let pending = null;

    const api = {
      select() {
        return api;
      },
      eq(column, value) {
        filters[column] = value;
        return api;
      },
      insert(values) {
        pending = { op: 'insert', values };
        return api;
      },
      update(values) {
        pending = { op: 'update', values };
        return api;
      },
      upsert(values) {
        pending = { op: 'upsert', values };
        return api;
      },
      async maybeSingle() {
        state.calls.push({ op: 'select', filters });
        return { data: state.row, error: null };
      },
      async single() {
        return runWrite(true);
      },
      // An update() without .single() resolves as an array of the rows it touched.
      then(resolve, reject) {
        return runWrite(false).then(resolve, reject);
      },
    };

    async function runWrite(single) {
      state.calls.push({ ...pending, filters });

      if (pending.op === 'insert') {
        state.row = { data: pending.values.data, version: pending.values.version };
        return { data: state.row, error: null };
      }

      if (pending.op === 'upsert') {
        state.row = { data: pending.values.data, version: pending.values.version };
        return { data: state.row, error: null };
      }

      // update: only lands when the version filter still matches the stored row.
      if (failUpdate || !state.row || state.row.version !== filters.version) {
        return { data: [], error: null };
      }
      state.row = { data: pending.values.data, version: pending.values.version };
      return single ? { data: state.row, error: null } : { data: [state.row], error: null };
    }

    return api;
  };

  return {
    state,
    from,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
  };
}

/* ── local gateway ────────────────────────────────────────────────────── */

test('the local gateway answers synchronously, so the first render has data', () => {
  const gateway = createLocalGateway({ repository: fakeRepository(snapshot('2026-07-14T10:00:00Z')) });

  const loaded = gateway.loadSync();
  assert.equal(loaded.data.meta.schemaVersion, 1);
  assert.ok(loaded.version > 0, 'the version is derived from the snapshot clock');
  assert.equal(gateway.kind, 'local');
});

test('a local store has no channel — there are no other devices to hear from', () => {
  const gateway = createLocalGateway({ repository: fakeRepository(snapshot('2026-07-14T10:00:00Z')) });
  assert.equal(gateway.subscribe, null, 'callers must treat subscribe as optional');
});

test('the local version moves forward as the snapshot changes', async () => {
  const gateway = createLocalGateway({ repository: fakeRepository(snapshot('2026-07-14T10:00:00Z')) });
  const first = await gateway.load();
  const second = await gateway.save(snapshot('2026-07-14T10:05:00Z'));
  assert.ok(second.version > first.version);
});

/* ── supabase gateway ─────────────────────────────────────────────────── */

test('a fresh account seeds its row instead of showing an empty store', async () => {
  const client = fakeSupabase({ row: null });
  const gateway = createSupabaseGateway({
    client,
    accountId: 'acct_1',
    seedFactory: () => snapshot('2026-07-14T10:00:00Z', { orders: [{ id: 1 }] }),
  });

  const loaded = await gateway.load();
  assert.equal(loaded.version, 1);
  assert.equal(loaded.data.orders.length, 1);
  assert.ok(
    client.state.calls.some((call) => call.op === 'insert'),
    'insert, not upsert: two devices racing to create the row must not both win'
  );
});

test('an existing account loads its row and does not re-seed over it', async () => {
  const client = fakeSupabase({ row: { data: snapshot('x', { orders: [{ id: 9 }] }), version: 4 } });
  const gateway = createSupabaseGateway({
    client,
    accountId: 'acct_1',
    seedFactory: () => {
      throw new Error('the seed must never run for an account that already has data');
    },
  });

  const loaded = await gateway.load();
  assert.equal(loaded.version, 4);
  assert.equal(loaded.data.orders[0].id, 9);
});

test('a save carries the version it was based on and bumps it', async () => {
  const client = fakeSupabase({ row: { data: snapshot('a'), version: 4 } });
  const gateway = createSupabaseGateway({ client, accountId: 'acct_1', seedFactory: () => snapshot('s') });

  const saved = await gateway.save(snapshot('b'), { expectedVersion: 4 });
  assert.equal(saved.version, 5);

  const update = client.state.calls.find((call) => call.op === 'update');
  assert.equal(update.filters.version, 4, 'the update is guarded by the expected version');
  assert.equal(update.filters.account_id, 'acct_1', 'and scoped to this account');
});

test('a stale save is refused, not silently written over the other device', async () => {
  // The row has moved to version 7 while this client still believes it is on 4.
  const client = fakeSupabase({ row: { data: snapshot('theirs', { orders: [{ id: 7 }] }), version: 7 } });
  const gateway = createSupabaseGateway({ client, accountId: 'acct_1', seedFactory: () => snapshot('s') });

  await assert.rejects(
    () => gateway.save(snapshot('mine'), { expectedVersion: 4 }),
    (error) => {
      assert.ok(error instanceof DomainConflictError);
      assert.equal(error.code, 'DOMAIN_CONFLICT');
      // The winner comes back with the error so the caller can replay onto it.
      assert.equal(error.latest.version, 7);
      assert.equal(error.latest.data.orders[0].id, 7);
      return true;
    }
  );

  assert.equal(client.state.row.version, 7, 'the other device’s write survived');
});

test('reset and import overwrite whatever is there — that is the point of a restore', async () => {
  const client = fakeSupabase({ row: { data: snapshot('theirs'), version: 9 } });
  const gateway = createSupabaseGateway({ client, accountId: 'acct_1', seedFactory: () => snapshot('s') });

  const replaced = await gateway.replace(snapshot('restored', { orders: [{ id: 1 }] }));
  assert.equal(replaced.version, 10, 'the version still moves, so other devices are told');
  assert.equal(client.state.row.data.orders[0].id, 1);
});

test('the gateway refuses to be built without the things that scope it', () => {
  assert.throws(() => createSupabaseGateway({ accountId: 'a' }), /client is required/);
  assert.throws(() => createSupabaseGateway({ client: fakeSupabase() }), /account id is required/);
});
