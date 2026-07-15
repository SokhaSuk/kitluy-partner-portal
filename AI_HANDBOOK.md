# AI handbook

Fast orientation for a future AI continuing KitLuy Partner Portal.

## Snapshot

As of 2026-07-13, the former static preview has a complete local-first implementation at the
code/unit/build boundary:

- schema-v1 `DomainProvider` and immutable-account/guest-scoped local repository;
- audited immutable actions covering the visible business controls;
- salted-hash local auth and versioned session/reset stores;
- hash routes/history for pages and order/customer details;
- 28 UI files consuming `useDomain`;
- no mutable UI business-fixture imports and no fake/demo/no-op handlers;
- JSON backup/import/reset, CSV downloads, browser print, local outbox, local integrations, local AI,
  and `ErrorBoundary`;
- `npm.cmd run check` passes 17/17 tests and builds 708 modules.

One runtime caveat is important: browser automation was unavailable and final live-server launch was
not approved. The browser/reload/accessibility matrix is `NOT RUN`. There is also a 512.32 kB
minified-chunk warning.

## Mental model

```text
ErrorBoundary
  DomainProvider                 PortalProvider
      |                               |
      | canonical entities/actions    | hash route + transient UI + auth facade
      v                               v
  account/guest repository       pages/components
      |
      v
  browser localStorage
```

`src/store/DomainContext.jsx` exposes both the snapshot collections and named actions through
`useDomain()`. `src/store/PortalContext.jsx` owns page/tab/filter/drawer/toast/theme state, hash/history
routing, and the local-auth facade. Do not merge these lifecycles.

`src/data/domainSeed.js` builds the initial canonical snapshot. Other `src/data/*.js` files remain
seed/reference inputs. UI may import immutable reference maps such as message channel tones or
marketplace categories, but must not treat fixture arrays as mutable live business data.

The domain repository scope is `guest` or the immutable local-auth `accountId`. Session restoration,
sign-in, registration, and sign-out switch scope; email, phone, and store name never identify storage.
The first eligible authenticated account can adopt a copied pre-scope legacy snapshot, but the legacy
bytes remain in place and a durable owner marker prevents another account from inheriting them.

## Current domain action surface

The provider owns actions for:

- order status/timeline;
- customer creation and notes;
- services, add-ons, promotions, campaigns, flows, and offers;
- PO creation/receipt, inventory settings, adjustments, count start/completion;
- members, store settings, notifications, loyalty mode, payment options;
- production exception resolution;
- thread creation/read/local message send;
- local integration flags, development key placeholders, webhook records;
- persistent generic toggles/actions;
- reset, backup import replacement, and export.

Use a typed action whenever an operation has a real invariant. `genericState`, `setGenericToggle`, and
`recordGenericAction` are appropriate for persistent local behavior on data-driven screens, not as an
unstructured substitute for orders, stock, money, credentials, or provider status.

## Source-of-truth test

For a business control, answer:

1. Which stable entity/event changes?
2. Which named action validates and commits it?
3. Which other views derive from that same state?
4. What survives a reload or backup round trip?
5. Which guest/account scope owns the record?
6. What is browser-local versus provider-confirmed?
7. Which test and browser journey prove it?

Example: PO receipt must update the PO, post stock movements, update on-hand/history, append audit,
respect remaining quantity, reject duplicate/excess behavior, and persist. The partial-receipt unit
test covers the mutation rule; the rendered cross-screen/reload journey is still `NOT RUN`.

## High-risk consistency paths

- **Orders:** status/timeline must agree across detail, dashboard, production, fulfillment, customer
  history, finance, and reports.
- **Inventory:** PO receipts, adjustments, counts, waste, history, valuation, and low-stock views must
  reconcile; quantities/units and idempotency matter.
- **Customers/messages:** customer/note/thread IDs, unread counts, local outbox, and navigation must
  remain consistent; local save is never provider delivery.
- **Catalog/marketing:** prices use integer KHR; local activation does not publish to POS or ad
  networks.
- **Team/access:** local member/permission records do not enforce production identity, PINs, or roles.
- **Finance:** local ledgers/reports are derived from local records; gateway settlement/refunds remain
  external truth.
- **Integrations:** local connected flags, key placeholders, and webhook endpoints are development
  records, not OAuth, credentials, or deliveries.
- **Scope/backup/reset:** each guest/account scope is isolated; import validates before replacement;
  reset preserves the active account's store identity; auth stores are excluded from business backup.
- **Protected recovery:** corrupt/future raw bytes stay untouched while the app runs a fresh snapshot
  in memory; ordinary commits cannot overwrite recovery evidence. Only explicit valid import/reset can
  replace it, and failed explicit persistence keeps recovery protected.

## Authentication boundary

`src/services/localAuth.js` salts and hashes passwords with SHA-256 (Web Crypto when available, a
deterministic fallback otherwise), compares hashes without early exit, versions stores, scopes
remembered/tab sessions, and hashes reset codes with expiry/attempt limits. Tests verify the local
flow.

It remains development identity because all account material and enforcement live in the browser.
Never call it secure production auth, tenant authorization, or tamper-resistant access control.

## Routing

The app uses custom hash routing, not React Router. `PortalContext` parses hashes, generates page/detail
hashes, listens for pop/hash changes, and pushes history. Reuse those helpers and state fields. Direct
hash/back/forward/refresh behavior needs the pending browser matrix before it is described as observed.

`App.jsx` intentionally maps B2B to canonical Customers, core store tabs to Catalog/Settings/Finance,
selected inventory/team/finance tabs to their live domain pages, AI report/finance tabs to local AI,
and Audit to the real Settings audit view. Remaining generic modules display a prominent seed/reference
boundary and use live-domain CSV rows where a relevant mapping exists.

## Local feature boundaries

- **Messages/complaints:** persisted local outbox/audit only.
- **AI:** deterministic local query/insights only.
- **Integrations:** persistent development configuration only.
- **Keys:** visible local placeholders, not secrets or credentials.
- **Webhooks:** endpoint records, no signing/delivery worker.
- **Print:** browser print output, no named-printer acceptance.
- **Exports:** real browser file generation; destination-provider delivery is separate.

Production Supabase/auth/providers/payments/POS/printers/OAuth/webhooks/hosted AI remain
`BLOCKED_EXTERNAL`. See `docs/EXTERNAL_INTEGRATIONS.md`.

## Verification workflow

Primary gate:

```powershell
npm.cmd run check
```

Useful audits:

```powershell
rg -l "useDomain" src/pages src/components
rg -n "p\.say|p\.noop|demo action|full build" src
rg -n "from .*data/(orders|customers|inventory|suppliers|reports|team)" src/pages src/components
rg -n "hashchange|location\.hash|history" src/store/PortalContext.jsx
```

The last combined check passed 17 tests and built 708 modules in 4.98s, with a 512.32 kB chunk
warning. Run it again after changes; never copy old evidence as a new result.

Then run the relevant browser journey in `docs/TESTING.md`. If the browser/server is unavailable,
record `NOT RUN` with the exact blocker.

## Best next work

1. Execute and record the full browser/reload/responsive/accessibility matrix.
2. Add component/end-to-end tests for the highest-risk cross-screen paths.
3. Investigate intentional lazy loading/code splitting for the chunk warning.
4. Implement external adapters only after contracts, sandbox credentials, tenant/security policy, and
   ownership are supplied.

## Documentation maintenance

- Update `FUNCTION_AUDIT.md`, `TASKS.md`, and `IMPLEMENTATION_REPORT.md` with exact evidence.
- Keep `COMPLETE`, `LOCAL_ONLY`, `BLOCKED_EXTERNAL`, and `NOT RUN` distinct.
- If source and docs differ, inspect current source/tests, correct the docs, and record the drift.
- Never convert a provider blocker into a local simulation merely to make a control respond.
