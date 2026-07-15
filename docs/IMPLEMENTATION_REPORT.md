# Implementation report

Report date: 2026-07-13  
Scope: final local-first implementation, dynamic-function audit, verification, and future-agent handoff.

## Executive result

The static-preview conversion is complete at the local code/unit/build boundary. The portal now has a
schema-versioned `DomainProvider` and repository, audited immutable actions, hashed local-development
authentication, hash deep links/history, domain-driven business screens, recovery/backup paths, real
local files/print, a local message outbox, local integration records, deterministic local AI, and an
application error boundary.

Persistence is isolated by immutable local-auth `accountId` plus a guest scope. Session restoration,
sign-in, registration, and sign-out switch repositories. A pre-scope legacy snapshot is preserved and
adoptable by at most one authenticated account. Corrupt/future snapshots remain byte-for-byte in
storage during protected memory recovery; only explicit valid import/reset may replace them.

The local implementation is not a production backend. Supabase/remote data, production identity,
SMS/Telegram/email delivery, payments/KHQR, POS publication, printer/device service, OAuth, real API
keys, webhook delivery, accounting/logistics delivery, and hosted AI remain `BLOCKED_EXTERNAL`.

Automated checks pass. Browser automation and final live-server launch were unavailable, so the
browser/reload/manual matrix is explicitly `NOT RUN`.

## Delivered implementation

| Area | Result | Current boundary |
|---|---:|---|
| Schema-v1 seed/repository/provider | `COMPLETE` | Local persistence plus validated JSON backup |
| Account/guest scoping and legacy adoption | `COMPLETE` | Immutable account scopes; one-owner copied legacy adoption; original bytes preserved |
| Protected corrupt/future recovery | `COMPLETE` | Stored bytes preserved; memory-only commits until explicit valid import/reset |
| Immutable domain actions/local audit | `COMPLETE` | Browser-local audit, not tamper-resistant compliance evidence |
| Hashed login/register/reset/session | `LOCAL_ONLY` | Development identity, not production authorization |
| Hash routing/deep links/history | `COMPLETE` | Runtime back/forward/deep-link smoke `NOT RUN` |
| Dashboard/orders/customers/operations | `LOCAL_ONLY` | Canonical browser domain |
| Catalog/marketing/inventory/team/settings | `LOCAL_ONLY` | Canonical browser domain |
| Messages/complaints | `LOCAL_ONLY` | Persistent local outbox/audit; no provider delivery |
| Integrations/API keys/webhooks | `LOCAL_ONLY` | Development records/placeholders; no OAuth/key service/delivery worker |
| Finance/reports/files/printing | `LOCAL_ONLY` | Derived local data, CSV/JSON, browser print |
| AI insights/query | `LOCAL_ONLY` | Deterministic local rules; no hosted model |
| Typed route reuse | `COMPLETE` | B2B/Store/Inventory/Team/Finance/Audit map to canonical live pages where defined |
| Remaining generic sub-pages/actions | `LOCAL_ONLY` | Conspicuous seed/reference boundary; live CSV mappings where relevant; persistent local intent |
| Error boundary/recovery guidance | `COMPLETE` | Browser runtime failure injection `NOT RUN` |
| Production/provider integrations | `BLOCKED_EXTERNAL` | Contracts, backend, credentials, policy, and sandbox required |

## Source reconciliation

The final source inspection found:

- `DomainProvider` wrapped by `ErrorBoundary` and paired with `PortalProvider`;
- 28 page/component files importing `useDomain`;
- named actions for orders, customers, notes, services, add-ons, promotions, campaigns, marketing,
  purchase orders, inventory settings, adjustments, count start/completion, members, store settings,
  notifications, loyalty, payments, production exceptions, threads/messages, integrations, API key
  placeholders, webhook records, generic actions, reset/import/export;
- no mutable business-record imports from legacy fixture modules in pages/components; remaining
  message/marketplace imports are reference constants;
- zero `p.say`, `p.noop`, `demo action`, or `full build` handlers;
- custom hash routes for pages and order/customer detail views;
- scoped repositories keyed by guest/immutable `accountId`, lifecycle scope switching, protected
  recovery, one-owner legacy adoption, and identity-preserving business reset;
- canonical B2B Customers, typed Store routes, mapped live Inventory/Team/Finance tabs, real Settings
  Audit, and visibly bounded remaining generic modules with relevant live CSV mapping;
- backup import/export/reset controls, CSV helpers, browser print paths, local AI query, and
  `ErrorBoundary`.

## Automated verification evidence

Primary command:

```powershell
npm.cmd run check
```

Observed result on 2026-07-13:

| Check | Result | Evidence |
|---|---:|---|
| Domain mutation tests | `PASS` | Quantity/Unicode-minus parsing, partial PO remaining receipt, immutable mutation/audit |
| Repository tests | `PASS` | Seed/load, export/replace, unsafe rejection, protected corrupt/future recovery, failed replacement protection, blocked storage, account/guest isolation, one-owner legacy adoption, authoritative scope |
| Export tests | `PASS` | CSV escaping and stable BOM/CRLF output |
| Local auth test | `PASS` | Hash verification, session scope, signup, reset |
| Full Node suite | `PASS` | 17/17 passed; 0 failed/skipped/todo; approximately 334 ms |
| Production build | `PASS WITH WARNING` | Vite 6.4.3; 708 modules; 4.98s |
| Bundle warning | `OPEN` | One minified JS chunk is 512.32 kB (146.88 kB gzip), above Vite's 500 kB warning threshold |
| Stale-handler scan | `PASS` | Zero fake/demo/no-op handler signals in `src` |
| Domain-consumer scan | `PASS` | 28 UI files use `useDomain` |

This current 17-test run supersedes the earlier 9- and 12-test snapshots.

## Verification not performed

| Check | Result | Reason / next action |
|---|---:|---|
| Automated browser test | `NOT RUN` | Browser automation was unavailable |
| Final live-server smoke | `NOT RUN` | Launch approval was not granted |
| Clean-profile login/navigation | `NOT RUN` | Run `docs/TESTING.md` when a browser is available |
| Hash deep-link/back/forward/refresh | `NOT RUN` | Requires live browser |
| Cross-screen mutation/reload persistence | `NOT RUN` | Repository is unit-tested; rendered journey still requires browser observation |
| Account/guest scope switching and legacy adoption | `NOT RUN` | Repository/lifecycle source is tested; rendered multi-account journey requires browser observation |
| Mobile/responsive/theme/accessibility | `NOT RUN` | Requires browser/viewports/assistive checks |
| Download/print dialogs and output | `NOT RUN` | Helpers/build pass; browser artifacts were not inspected |
| External providers | `NOT RUN / BLOCKED_EXTERNAL` | No approved contracts, sandboxes, backend, or credentials |

No statement in this report should be read as an observed browser result where the table says
`NOT RUN`.

## Documentation reconciled

- `README.md` - current local-first scope, commands, evidence, and external boundary.
- `AGENTS.md` - future-agent operating contract.
- `AI_HANDBOOK.md` - architecture and continuation map.
- `TASKS.md` - completed local scope, open runtime gate, performance warning, external backlog.
- `docs/FUNCTION_AUDIT.md` - final feature/control matrix.
- `docs/ARCHITECTURE.md` - actual providers, hash routing, state, persistence, and adapters.
- `docs/DATA_MODEL.md` - schema-v1 collections/auth stores/invariants.
- `docs/TESTING.md` - `check` gate, 12-test evidence, and unrun browser matrix.
- `docs/EXTERNAL_INTEGRATIONS.md` - contracts and secrets still required.

## Next actions

1. Run the complete browser matrix and record observed results without changing `NOT RUN` prematurely.
2. Investigate intentional code splitting for the 512.32 kB chunk warning.
3. Add component/end-to-end coverage for the highest-risk mutation/reload paths.
4. Obtain explicit contracts/sandboxes before implementing any external adapter.
5. Keep browser-local success distinct from provider confirmation in code, tests, and copy.
