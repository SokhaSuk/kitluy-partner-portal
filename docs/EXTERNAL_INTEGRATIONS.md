# External integrations

The repository currently has no approved production backend/provider environment. Local data can be
made dynamic without credentials; the integrations below cannot be truthfully completed from this
frontend alone.

## Supabase / remote data adapter

Status: `BLOCKED_EXTERNAL`

Required before implementation:

- project URL and public anon key for a non-production environment;
- owner-approved SQL schema and migration ownership;
- store/tenant identity model and user-to-store membership rules;
- authentication provider and role matrix;
- Row Level Security policies with positive and cross-tenant negative tests;
- transaction/RPC boundaries for order transitions, stock receipts/counts, and finance events;
- idempotency, conflict, offline/realtime, deletion, retention, and audit policies;
- seed/migration plan from browser-local data;
- backups, restore test, monitoring, and environment ownership.

Only the public anon key may reach browser code, and only with tested RLS. Never put a Supabase
service-role key in a `VITE_*` variable or commit it anywhere in this repository.

The local nested snapshot is not the final SQL model. Normalize ownership and relations, enforce
foreign keys/unique constraints server-side, and keep application pages behind the adapter/action
facade.

## Production authentication and authorization

Status: `BLOCKED_EXTERNAL`

`src/services/localAuth.js` is development-only browser authentication. Production needs identity
provider ownership, session/refresh/MFA policy, invitation and password-reset delivery, POS PIN rules,
role enforcement, user/store provisioning, revocation, rate limiting, and audit requirements.

Client route guards improve UX but do not enforce authorization. Authorization must be checked by the
backend and database policy for every tenant-scoped operation.

## Messaging: Telegram, SMS, email, push

Status: `BLOCKED_EXTERNAL`

Required: approved providers/bot ownership, sandbox credentials, recipient consent and opt-out rules,
template ownership/localization, backend send endpoint, delivery webhooks, retry/rate-limit policy,
message correlation IDs, and retention/privacy rules.

A local thread append is `local`; it is not `sent` or `delivered`. Model those states separately.

## Payments and KHQR

Status: `BLOCKED_EXTERNAL`

Required: gateway/acquirer contract, merchant/sandbox credentials, currency/amount rules, backend
create/verify/refund endpoints, signed callback verification, idempotency keys, timeout/recovery rules,
settlement/reconciliation source of truth, and security/compliance review.

Never mark a payment successful from a browser redirect or toast alone. Provider verification and
reconciliation own payment truth. Do not expose private merchant credentials in the browser.

## Printing and devices

Status: `BLOCKED_EXTERNAL`

Receipt, Z-report, laundry-tag, and inventory-label controls need an agreed output format, dimensions,
fonts/encoding, preview, device/browser/print-agent strategy, device registration, offline behavior,
and hardware tests. A call to `window.print()` may support a deliberate browser-print path, but it
must not claim a named receipt printer accepted the job.

## AI features

Status: `BLOCKED_EXTERNAL` for hosted AI; deterministic local rules may be `LOCAL_ONLY` when labelled.

Required: approved use cases and model/provider, trusted server endpoint, data minimization and PII
policy, prompt/version ownership, structured response schema, timeout/rate/cost limits, provenance and
confidence display, evaluation cases, human review rules, and safe fallback behavior.

Never embed a provider secret in Vite configuration. Static suggestions must not be presented as a
fresh model analysis.

## POS/catalog publication

Status: `BLOCKED_EXTERNAL`

Local services, prices, add-ons, rules, and promotions can persist in the portal. "Live at the POS"
requires POS ownership, record mapping, API or sync transport, idempotency, version/conflict rules,
partial-failure handling, acknowledgment status, and sandbox testing.

## Marketplace OAuth and connected apps

Status: `BLOCKED_EXTERNAL`

Integration cards are catalog/reference data until each provider has a contract. Connecting needs a
server-side OAuth flow with state/PKCE as appropriate, secure token storage/rotation/revocation,
scopes, tenant ownership, health checks, disconnect behavior, and provider-specific error handling.
Do not store access/refresh tokens in the domain snapshot.

## API keys and webhooks

Status: `BLOCKED_EXTERNAL`

API keys must be generated server-side, shown only once, stored hashed, scoped, expirable, revocable,
and audited. Seeded/display-only strings are not credentials.

Webhooks need server-side endpoint ownership, signing-secret rotation, signature/timestamp verification,
retry/backoff/dead-letter behavior, delivery logs, replay controls, and SSRF-safe endpoint validation.

## Accounting / ERP / payroll exports

Status: `BLOCKED_EXTERNAL` until the receiving schema is approved. A generic local CSV can be
`LOCAL_ONLY` only when its documented columns are genuinely useful and tested.

Required: destination owner, file/API schema, account/tax/employee mappings, date/rounding rules,
encoding, secure transfer, validation, acknowledgment/error handling, and correction/replay policy.

## Logistics / delivery

Status: `BLOCKED_EXTERNAL`

Required: carrier/driver ownership, address and contact consent, service zones/rates, dispatch and
tracking contract, webhook events, cancellation/failure rules, proof-of-delivery policy, and sandbox.

## Support and observability

Status: `BLOCKED_EXTERNAL`

Production requires a hosting target, error monitoring, structured logs/correlation IDs, alert owner,
support/ticket destination, status communication, privacy-safe diagnostics, backup/restore runbook,
and rollback exercise.

## Environment configuration

`.env.example` documents reserved public frontend settings. Copy it to `.env.local` only when a
specific adapter is implemented. Blank provider settings must keep the application in local mode and
render truthful unconnected states.

All `VITE_*` values are public at build time. Secrets belong in the trusted backend/Edge Function
environment, never this file or browser storage.

