# Architecture

## Delivered architecture

KitLuy Partner Portal is a client-rendered Vite/React application with a complete local-first domain
layer. It uses custom hash/history routing and browser persistence. The architecture is production-
buildable but deliberately not a production multi-user backend.

```text
main.jsx
  ErrorBoundary
    DomainProvider
      PortalProvider
        App / pages / components

UI event
  -> named useDomain action
  -> immutable validated mutation + local audit event
  -> schema-v1 repository save
  -> canonical snapshot update
  -> every dependent domain consumer rerenders
```

## Provider responsibilities

### ErrorBoundary

`src/components/ErrorBoundary.jsx` wraps both providers. A render failure shows reload/data-recovery
guidance instead of a blank portal and logs developer diagnostics. Runtime failure injection is part
of the browser matrix and was not run in the final automated-only validation.

### DomainProvider

`src/store/DomainContext.jsx` owns the canonical business snapshot and exposes collections plus named
actions through `useDomain()`.

Current actions cover orders, customers/notes, catalog, marketing, inventory/PO/counts, team,
settings, production exceptions, threads/messages, local integration records, generic data-driven
actions, reset/import/export, and related audit events. Twenty-eight UI files consume this provider.

Every domain commit:

1. clones the current snapshot;
2. validates the operation/input in the action/helper;
3. changes the affected records/events;
4. appends a browser-local audit event where applicable;
5. updates metadata;
6. persists through the repository;
7. publishes the committed snapshot.

Typed actions are used for workflows with business invariants. `genericState` provides durable local
toggles/action history for data-driven screens without pretending a provider workflow exists.

### PortalProvider

`src/store/PortalContext.jsx` owns transient/UI state:

- current page/tab, filters/searches, drawer/toast/banner state;
- theme/collapsed/mobile/group preferences;
- auth-screen selection and local-auth facade;
- custom hash/history routing.

It parses `window.location.hash`, generates page/order/customer detail hashes, listens to
`popstate`/`hashchange`, and pushes route changes. Theme/collapse preferences use a separate versioned
UI preference record. Business records never belong in this store.

### Local authentication service

`src/services/localAuth.js` implements development-only accounts, session scope, registration,
reset-code verification, and password reset. Passwords and reset codes are salted/hashed; accounts,
sessions, and reset challenges use separate versioned browser stores.

Each account exposes an immutable `accountId`. `PortalContext` switches `DomainProvider` to that scope
after session restoration, sign-in, and registration, and back to `guest` on sign-out. Email, phone,
and store display fields never choose a business-data scope.

This is not an authorization boundary because the browser user controls storage and code. Production
identity remains an external adapter concern.

## Persistence repository

`src/store/domainRepository.js` owns schema version 1 and scoped keys derived as
`kitluy.partner.domain.scope.<encoded accountId-or-guest>`. It supports:

- deterministic seed on first load;
- validated current-version load/save;
- JSON export envelope and bare/envelope import parsing;
- explicit reset/replacement;
- required-collection/type checks;
- unsafe-key and 5 MB import rejection;
- protected corrupt/future recovery: original raw bytes remain untouched while a complete seed runs
  in memory with recovery metadata;
- in-memory continuity when browser storage is blocked;
- post-write verification/error reporting;
- explicit valid import/reset as the only operations allowed to replace protected recovery bytes;
- preservation of recovery when an explicit replacement cannot be persisted;
- pre-scope legacy adoption: global `kitluy.partner.domain` bytes are copied, never removed, to at
  most one authenticated account using `kitluy.partner.domain.legacy-owner.v1`.

The stored envelope is:

```js
{
  schemaVersion: 1,
  savedAt: "ISO-8601 timestamp",
  data: {
    meta: { schemaVersion: 1, createdAt: "...", updatedAt: "..." },
    // domain collections
  }
}
```

Repository/mutation tests cover the critical safety paths. The rendered reload/import/reset journey
still needs the browser matrix.

`DomainContext.resetData()` restores business seed records through explicit replacement while
preserving the active account's store identity fields (`name`, `vertical`, `province`, and `phone`).

## Seed and reference data

`src/data/domainSeed.js` assembles the complete detached schema-v1 snapshot. Other `src/data/*.js`
files are canonical seed/reference inputs, not live business databases.

Pages/components no longer import mutable business fixture arrays. They may still import immutable UI
reference constants, such as channel tone/filter labels or marketplace categories/colors/developer
tool descriptions.

## Read model

Derived values are computed from canonical collections, including:

- dashboard KPIs, recent orders, and shell badges;
- customer history/totals and message unread counts;
- production/fulfillment/capacity queues;
- inventory on-hand/history/variance/low-stock state;
- finance/report totals and exports;
- current settings, catalog, campaigns, team, integrations, and audit actions.

Do not reintroduce shadow page arrays or persist formatted totals as competing truth.

## Routing and navigation

`App.jsx` resolves canonical typed routes first and then data-driven `GENERIC` specs. B2B routes to
live Customers; Add-ons/Profile/Hours/Notifications/Data/Payment use Catalog/Settings/Finance; mapped
inventory/team/finance tabs use their live domain pages; Audit uses the real Settings Audit view.
Security, Support, and other unmapped modules remain generic with a conspicuous seed/reference
boundary. Relevant generic exports map to live domain rows; other exports identify themselves as
seed/reference. Only an unknown route reaches page-not-found.

This is custom routing, not React Router. A future routing-library migration must preserve hashes or
provide an explicit compatibility redirect/migration.

## Local files, print, messages, integrations, and AI

- `src/lib/export.js` generates CSV/JSON/text browser downloads.
- Settings owns domain backup export/import/reset.
- report/receipt/label controls use browser print/printable paths.
- message sends append to a labelled local outbox; they do not contact SMS/Telegram/email.
- integration flags, API key placeholders, and webhook endpoints are local development records.
- AI insights/query are deterministic local analysis over the domain.

Each boundary is stated in UI copy. Provider delivery/acceptance is a different state and does not
exist in this frontend-only build.

## Remote adapter boundary

A future Supabase/API adapter must not be implemented with ad hoc page queries. It requires:

- store/tenant identity and server authorization;
- SQL/API schema, migrations, constraints, and RLS;
- server transactions for order/stock/payment invariants;
- idempotency and conflict/offline/realtime rules;
- audit/retention/deletion/backup/restore policy;
- migration from local snapshots;
- sandbox, monitoring, and operational ownership.

Production auth, messaging, payments, POS, printers/devices, OAuth, keys, webhook delivery, accounting,
logistics, and hosted AI similarly require trusted adapters. See `EXTERNAL_INTEGRATIONS.md`.

## Failure boundaries

- Validation errors remain local to the form/action and do not commit.
- Invalid imports do not replace the current snapshot.
- Corrupt/future stored bytes are reported and preserved byte-for-byte; a complete snapshot runs in
  protected memory until explicit valid import/reset successfully replaces storage.
- Blocked storage continues in memory but cannot promise reload durability.
- Render failures fall to `ErrorBoundary`.
- External timeouts/callbacks cannot be modeled as success until a provider adapter exists.

## Verification and performance boundary

`npm.cmd run check` passed 17/17 tests and a 708-module production build on 2026-07-13. The build
reported one 512.32 kB minified JavaScript chunk (146.88 kB gzip); code splitting remains an
optimization task.

Browser automation/live-server smoke was unavailable. Hash history, responsive behavior,
cross-screen rerender, reload persistence, browser downloads/print, and accessibility remain
`NOT RUN` as rendered journeys.
