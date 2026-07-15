# Agent guide

Operating contract for AI/code agents working in `kitluy-partner-portal`.

## Required reading

1. `README.md` - delivered scope, commands, and boundary.
2. `TASKS.md` - completed local baseline and remaining work.
3. `docs/FUNCTION_AUDIT.md` - control/status truth table.
4. `docs/ARCHITECTURE.md` and `docs/DATA_MODEL.md` - providers, persistence, and invariants.
5. `docs/TESTING.md` - automated evidence and the unrun browser matrix.
6. `docs/EXTERNAL_INTEGRATIONS.md` - provider work that is still blocked.
7. `docs/IMPLEMENTATION_REPORT.md` - final implementation evidence and validation boundary.

Run this first after inspecting the worktree:

```powershell
npm.cmd run check
```

## Current product boundary

The dynamic local-first baseline is implemented. `DomainProvider` is the canonical business source,
the schema-v1 repository persists it in the browser, and 28 UI files use `useDomain`. Mutable
business data must not be reintroduced as page/component fixture imports. Seed modules under
`src/data` may provide deterministic initial data and immutable UI reference constants only.

Local-development authentication stores salted SHA-256 hashes and versioned sessions. It is useful
for this browser build but is not production identity or authorization. Browser storage is editable
by the browser user and provides no cross-device sync, tenant enforcement, backup service, or
tamper-resistant audit.

Business persistence is scoped by immutable local-auth `accountId`, with a separate guest scope.
Restored sessions, sign-in, registration, and sign-out switch the active domain repository. Never
read/write a global snapshot as the active store. The pre-scope legacy snapshot is preserved, copied
to at most one authenticated account, and guarded by a durable owner marker.

External services remain unconnected. Never describe a local outbox record, local integration flag,
key placeholder, webhook record, browser print call, or deterministic local AI result as provider
confirmation.

## Source map

- `src/main.jsx` - `ErrorBoundary` -> `DomainProvider` -> `PortalProvider`.
- `src/store/DomainContext.jsx` - canonical fields and named actions exposed by `useDomain`.
- `src/store/domainRepository.js` - account/guest-scoped storage, legacy adoption, protected recovery,
  seed/load/save/reset/import/export.
- `src/store/domainMutations.js` - immutable mutation/audit helpers.
- `src/store/PortalContext.jsx` - transient UI state, hash/history routing, local-auth facade.
- `src/services/localAuth.js` - hashed browser-local accounts/session/reset.
- `src/data/domainSeed.js` - complete schema-v1 seed.
- `src/data/*.js` - seed/reference constants; not runtime business databases.
- `src/pages/` and `src/components/` - domain consumers and UI composition.
- `src/lib/export.js` - local CSV/JSON/browser downloads.
- `test/` - domain mutation/repository, export, and local-auth tests.

## State and routing rules

- Put business entities/events in `DomainContext`; keep page/tab/filter/drawer/toast state in
  `PortalContext` or local component state when it is genuinely transient.
- Dispatch named domain actions. Do not mutate arrays/objects in pages.
- Derive dashboard counts, badges, stock, finance, customer history, production, fulfillment, and
  reports from canonical domain records.
- Use stable IDs for relationships. Display names/codes are alternate labels, not authorization keys.
- Store KHR as integer riel and quantities as numbers plus units.
- Use ISO-8601 timestamps; make display timezone assumptions explicit.
- Treat stock movements, finance corrections, timelines, and audit events as append-only.
- Preserve PO receipt/count completion idempotency and validation.
- Breaking persisted changes require a new schema version and compatibility tests.
- Use the existing hash route helpers for page/order/customer navigation; do not create a second
  routing source of truth.
- Keep domain scope tied to immutable `accountId`; display email/phone/store name must never select a
  storage scope.
- Corrupt/future raw snapshots are protected evidence. Normal commits must remain in memory and must
  not overwrite those bytes; only explicit valid import/reset may replace them.
- Reset may replace business records but must preserve the active account's store identity fields.
- Prefer the existing typed route reuse (B2B -> Customers; store/settings/inventory/team/finance/audit
  mappings) before adding a generic page.
- Generic pages must retain their visible seed/reference boundary; map exports to live domain rows
  only when a relevant canonical collection exists.

## Control implementation rule

A local business control is complete only when it:

1. validates input and exposes errors;
2. dispatches a domain/generic action rather than a fake toast;
3. updates all dependent views from the same canonical state;
4. persists through the repository;
5. uses truthful `LOCAL_ONLY` copy where an external consequence is absent;
6. has automated evidence and, when possible, an observed browser path.

The final source scan has zero `p.say`, `p.noop`, `demo action`, and `full build` handlers. Keep it
that way.

## Local versus external

Safe local implementations include domain CRUD/actions, local audit/outbox, deterministic AI,
development integration records, JSON/CSV downloads, and browser print.

`BLOCKED_EXTERNAL` work includes Supabase/remote sync, production identity, SMS/Telegram/email,
payments/KHQR, POS publication, printer/device service, OAuth, real API keys, webhook delivery,
accounting/logistics delivery, and hosted AI. Read `docs/EXTERNAL_INTEGRATIONS.md` before touching any
of these. Do not invent contracts or response shapes.

All `VITE_*` settings are public bundle configuration. Never place service-role keys, OAuth/provider
secrets, private payment/messaging credentials, or hosted-AI secrets in frontend environment files.

## Verification rules

The last `npm.cmd run check` passed 17/17 tests and built 708 modules. It also reported a 512.32 kB
minified chunk warning.

Browser automation and final live-server launch were unavailable, so the manual/reload matrix is
`NOT RUN`. Do not silently promote that to pass. When browser access exists, execute
`docs/TESTING.md` and record browser/version, profile state, route, steps, cross-screen effect,
reload result, negative case, and evidence.

Before claiming a change complete:

1. run `npm.cmd run check`;
2. run the relevant browser journey if available;
3. state any `NOT RUN` boundary;
4. update the audit, tasks, and implementation report;
5. keep provider work blocked until contract/sandbox verification exists.

## Safety and handoff

- Preserve unrelated user changes in a dirty worktree.
- Prefer focused patches and existing tokens/components/actions.
- Never test against production providers or send/charge/publish real data without explicit scope.
- Do not expose passwords, reset codes, tokens, payment payloads, or unnecessary personal data in
  logs/audit details.
- For each handoff, list files changed, user-visible behavior, domain entities/actions affected,
  migration impact, exact commands/results, browser paths observed or `NOT RUN`, and external blockers.
