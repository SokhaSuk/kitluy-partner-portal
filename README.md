# KitLuy Partner Portal

Local-first React/Vite partner portal for a laundry business: orders, customers, production,
fulfillment, inventory, team, finance, reports, catalog, marketing, settings, communications, and
integration configuration. The interface is Khmer-market oriented and stores KHR as integer riel.

## Current status

The dynamic local-first baseline is implemented. Business records flow through `DomainProvider`, a
schema-versioned repository, immutable audited mutations, and browser persistence. Twenty-eight UI
files consume `useDomain`; mutable business records are no longer imported from fixture modules by
pages/components. Legacy data modules remain seed/reference sources only.

Implemented local capabilities include:

- schema-v1 account/guest-scoped seed/load/save, validated backup import/export, reset, protected
  corrupt/future-data recovery, and blocked-storage memory fallback;
- salted SHA-256 local-development authentication, remembered/tab sessions, registration, and local
  password-reset flow;
- hash deep links and browser history for pages, orders, and customers;
- automatic domain-scope switching on restored session, sign-in, registration, and sign-out; each
  immutable local `accountId` and the guest scope have isolated business data;
- dynamic dashboard, orders, customers, catalog, marketing, production, fulfillment, capacity,
  inventory, purchase-order receipt, adjustment, count start/completion, team, settings, messages,
  integrations, finance, and reports;
- canonical route reuse for B2B Customers, typed store Add-ons/Profile/Hours/Notifications/Data/
  Payment pages, live inventory/team/finance mappings, and the real local Audit view in Settings;
- local CSV/JSON downloads, browser print paths, local message outbox, local rule-based AI query, and
  an application error boundary;
- persisted actions for every visible business control. The final source scan found no `p.say`,
  `p.noop`, `demo action`, or `full build` handlers.
- conspicuously labelled seed/reference generic modules, with live-domain CSV mapping where a generic
  export has a relevant canonical collection.

This is not a production multi-user backend. Browser-local records do not provide cross-device sync,
backup service, tenant enforcement, or tamper-resistant audit. Provider-dependent work remains
`BLOCKED_EXTERNAL`; see [External integrations](docs/EXTERNAL_INTEGRATIONS.md).

## Verification snapshot

On 2026-07-13, `npm.cmd run check` passed:

- 17/17 Node tests passed;
- Vite built 708 modules in 4.98s;
- the build emitted one warning for a 512.32 kB minified chunk (146.88 kB gzip).

Browser automation was unavailable, and launching a final live server could not be approved. The
manual browser, responsive, navigation-history, and reload-persistence matrix is therefore `NOT RUN`.
Build/unit success is strong code evidence, but it is not a substitute for that runtime gate.

## Stack

| Area | Technology |
|---|---|
| Build | Vite 6 |
| UI | React 18 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| Charts | Recharts |
| Fonts | Self-hosted DM Sans |
| Routing | Custom hash/history routing in `PortalContext` |
| Domain | `DomainProvider` + schema-v1 local repository |
| Authentication | Hashed browser-local development accounts |

## Run and verify

Use a current Node LTS release. From `kitluy-partner-portal`:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

`npm.cmd run check` is the primary gate; it runs tests and then the production build. Other scripts:

```powershell
npm.cmd test
npm.cmd run test:domain
npm.cmd run build
npm.cmd run preview
```

Vite normally serves development at `http://localhost:5173`. A future agent should run the manual
matrix in [Testing](docs/TESTING.md) once a browser/live-server session is available.

## Local versus external behavior

| Capability | Current boundary |
|---|---|
| Domain records, settings, audit actions, backups | Browser-local and persistent |
| Login/register/reset | Hashed local-development identity only |
| Messages and complaint replies | Local outbox/audit only; not delivered |
| AI insights/query | Deterministic local analysis only |
| Integration connections, API keys, webhooks | Local development records/placeholders only |
| Receipt/report/label printing | Browser print/download only |
| Supabase, production auth, SMS/Telegram, payments, POS publication, printer service, OAuth, webhook delivery, hosted AI | `BLOCKED_EXTERNAL` |

The UI labels these boundaries. Never reinterpret a local record as provider confirmation.

## Architecture

```text
ErrorBoundary
  DomainProvider
    PortalProvider
      pages/components
          |                 |
          | useDomain       | transient UI/auth/routing state
          v                 v
    account/guest domain PortalContext + localAuth
          |
          v
    versioned repository
          |
          v
    browser localStorage / validated JSON backup
```

Key locations:

```text
src/
  App.jsx                         shell and page resolution
  main.jsx                        ErrorBoundary + providers
  pages/                          domain-driven screens
  components/                     shell, drawers, controls, error boundary
  store/
    DomainContext.jsx             canonical fields and named actions
    domainRepository.js           scoped seed/load/save/recovery/import/export
    domainMutations.js            immutable mutation/audit helpers
    PortalContext.jsx             hash routing and transient UI state
  services/localAuth.js           hashed local-development authentication
  data/domainSeed.js              schema-v1 deterministic seed
  data/*.js                       seed/reference constants only
  lib/export.js                   CSV/JSON/browser download helpers
test/                              repository, mutation, export, and auth tests
```

## Configuration and secrets

Local mode needs no credentials. `.env.example` contains reserved public settings for a future
adapter. If needed:

```powershell
Copy-Item .env.example .env.local
```

Every `VITE_*` value is bundled into browser code. Never put service-role keys, OAuth secrets,
private messaging/payment credentials, printer secrets, or hosted-AI keys there.

## Data invariants

- KHR money is integer riel; formatting belongs at the view boundary.
- Quantities are numeric with explicit units.
- Mutable records have stable IDs; display names are not authorization boundaries.
- Domain writes append local audit events and update metadata.
- PO receipt and count completion are modeled as validated stock movements.
- Business state and transient UI state have separate persistence lifecycles.
- Guest data and each immutable local account ID use distinct scoped storage keys.
- A legacy pre-scope snapshot is preserved and can be adopted by at most one authenticated account.
- Corrupt/future scoped bytes remain untouched during protected in-memory recovery; only explicit
  valid import or reset may replace them.
- Reset restores business seed data while preserving the current account's store identity fields.
- Breaking persisted shapes require a schema-version change and tested compatibility handling.

## Documentation

| Document | Purpose |
|---|---|
| [AGENTS.md](AGENTS.md) | Required operating rules for future agents |
| [AI_HANDBOOK.md](AI_HANDBOOK.md) | Fast project orientation and continuation guidance |
| [TASKS.md](TASKS.md) | Completed local scope, remaining runtime gate, and external backlog |
| [Function audit](docs/FUNCTION_AUDIT.md) | Feature/control status matrix |
| [Architecture](docs/ARCHITECTURE.md) | Provider, state, routing, and adapter boundaries |
| [Data model](docs/DATA_MODEL.md) | Schema-v1 collections and invariants |
| [Testing](docs/TESTING.md) | Automated evidence and unrun browser matrix |
| [External integrations](docs/EXTERNAL_INTEGRATIONS.md) | Contracts and credentials still required |
| [Implementation report](docs/IMPLEMENTATION_REPORT.md) | Final implementation and validation record |

Status vocabulary:

- `COMPLETE` - implemented and supported by the stated automated/source evidence.
- `LOCAL_ONLY` - implemented, but intentionally limited to this browser/profile.
- `BLOCKED_EXTERNAL` - needs a backend, provider, credentials, policy, or contract.
- `NOT RUN` - no runtime result exists; do not infer one from a build.
