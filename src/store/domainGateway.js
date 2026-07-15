/**
 * The boundary between the domain and wherever it is stored.
 *
 * Everything above this line (DomainProvider, the mutations, every screen) is the
 * same whether the store lives in this browser or in Postgres. Everything below it
 * is swappable. Adding a backend means passing a different gateway — not touching a
 * single screen.
 *
 * A gateway is:
 *
 *   load()                          -> Promise<{ data, version }>
 *   save(data, { expectedVersion }) -> Promise<{ data, version }>
 *   subscribe(onRemote)             -> () => void        (optional; local has none)
 *   close()                         -> void
 *
 * `version` is what makes concurrent devices safe. A save carries the version it was
 * based on; if the row has moved on since, the gateway throws DomainConflictError
 * instead of overwriting. The provider then replays its mutation onto the fresh
 * snapshot and retries — which works because a domain mutation is a pure function of
 * the snapshot, not a diff.
 */

export class DomainConflictError extends Error {
  /** @param {{data: object, version: number}} latest the snapshot that won the race */
  constructor(latest) {
    super('The store changed on another device while this change was being saved.');
    this.name = 'DomainConflictError';
    this.code = 'DOMAIN_CONFLICT';
    this.latest = latest;
  }
}

/**
 * The gateway used today: the existing device-local repository, given an async face.
 *
 * There is no `subscribe` — a local store has no other devices to hear from. Callers
 * must treat subscribe as optional rather than assume a live channel exists.
 */
export function createLocalGateway({ repository }) {
  // localStorage has no row version, so derive one from the snapshot's own clock.
  // It only has to increase when the data changes, which meta.updatedAt already does.
  const versionOf = (data) => Date.parse(data?.meta?.updatedAt || 0) || 0;

  return {
    kind: 'local',

    /**
     * A device-local store can answer immediately, and the provider uses that to seed
     * its first render with no loading state. A network gateway has no such method,
     * which is exactly why the provider must also handle the async path.
     */
    loadSync() {
      const data = repository.load();
      return { data, version: versionOf(data) };
    },

    async load() {
      const data = repository.load();
      return { data, version: versionOf(data) };
    },

    async save(data) {
      // A single device cannot race itself, so expectedVersion is ignored here.
      const saved = repository.save(data);
      return { data: saved, version: versionOf(saved) };
    },

    async reset() {
      const data = repository.reset();
      return { data, version: versionOf(data) };
    },

    async replace(input) {
      const data = repository.replaceData(input);
      return { data, version: versionOf(data) };
    },

    exportData: (options) => repository.exportData(options),
    parseImport: (input) => repository.parseImport(input),
    subscribe: null,
    close() {},
  };
}

/** The table the Supabase gateway reads and writes. See CONTRACT.md. */
export const DOMAIN_TABLE = 'partner_domains';

/**
 * The gateway for a real backend: one row per account, holding the store's snapshot.
 *
 * `client` is a @supabase/supabase-js client, created by each app (the two platforms
 * configure auth storage differently, so the client is injected rather than built here).
 *
 * Why one JSONB row and not a table per collection: the domain is already a single
 * atomic snapshot with replayable mutations, and every screen reads it that way. This
 * gives real multi-device sync without rewriting 35 mutations into SQL. When the
 * backend is ready to own business rules, collections can be split out behind this
 * same interface and nothing above it changes.
 */
export function createSupabaseGateway({
  client,
  accountId,
  table = DOMAIN_TABLE,
  seedFactory,
  onError = () => {},
}) {
  if (!client) throw new TypeError('A Supabase client is required');
  if (!accountId) throw new TypeError('An account id is required to scope the store');

  let channel = null;

  const read = async () => {
    const { data, error } = await client
      .from(table)
      .select('data, version')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) throw error;
    return data ? { data: data.data, version: Number(data.version) } : null;
  };

  return {
    kind: 'supabase',

    async load() {
      const existing = await read();
      if (existing) return existing;

      // First sign-in on a fresh account: seed the row rather than leaving the app
      // staring at an empty store. `insert` (not upsert) so two devices racing to
      // create it cannot both win — the loser reads the winner's row.
      const seeded = seedFactory();
      const { data, error } = await client
        .from(table)
        .insert({ account_id: accountId, data: seeded, version: 1 })
        .select('data, version')
        .single();

      if (error) {
        const raced = await read();
        if (raced) return raced;
        throw error;
      }
      return { data: data.data, version: Number(data.version) };
    },

    /**
     * Optimistic concurrency: the update only lands if the row is still at the
     * version this change was based on. If another device got there first, no rows
     * match and we raise a conflict carrying the winning snapshot, so the caller can
     * replay onto it.
     */
    async save(data, { expectedVersion } = {}) {
      const next = Number(expectedVersion || 0) + 1;

      const { data: rows, error } = await client
        .from(table)
        .update({ data, version: next, updated_at: new Date().toISOString() })
        .eq('account_id', accountId)
        .eq('version', expectedVersion)
        .select('data, version');

      if (error) throw error;

      if (!rows?.length) {
        const latest = await read();
        throw new DomainConflictError(latest);
      }

      return { data: rows[0].data, version: Number(rows[0].version) };
    },

    /**
     * Reset and Import: this snapshot wins, whatever the row currently holds.
     * No version check — the whole point of a restore is to overwrite.
     */
    async replace(data) {
      const current = await read();
      const next = Number(current?.version || 0) + 1;

      const { data: rows, error } = await client
        .from(table)
        .upsert(
          { account_id: accountId, data, version: next, updated_at: new Date().toISOString() },
          { onConflict: 'account_id' }
        )
        .select('data, version')
        .single();

      if (error) throw error;
      return { data: rows.data, version: Number(rows.version) };
    },

    /**
     * Live updates from other devices. Realtime delivers the new row, so a change on
     * the phone reaches the laptop without a refetch.
     */
    subscribe(onRemote) {
      channel = client
        .channel(`domain:${accountId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            filter: `account_id=eq.${accountId}`,
          },
          (payload) => {
            const row = payload.new;
            if (!row?.data) return;
            onRemote({ data: row.data, version: Number(row.version) });
          }
        )
        .subscribe((status, error) => {
          if (error) onError(error);
        });

      return () => {
        if (channel) client.removeChannel(channel);
        channel = null;
      };
    },

    close() {
      if (channel) client.removeChannel(channel);
      channel = null;
    },
  };
}
