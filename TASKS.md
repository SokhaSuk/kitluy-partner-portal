# Work tracker

Reconciled: 2026-07-13

The local-first implementation is complete at the code/unit/build boundary. This file keeps the
remaining browser-runtime gate and external production work visible.

## Completed local-first baseline

- [x] **COMPLETE - Versioned domain repository and provider.**
  - Schema-v1 deterministic seed, validated envelope, account/guest-scoped persistence, backup
    import/export, identity-preserving reset, protected corrupt/future recovery, blocked-storage
    fallback, named actions, and append-only local audit events.
  - Evidence: repository/mutation tests pass under `npm.cmd run check`.
- [x] **COMPLETE - Isolate account and guest business data.**
  - Restored session, sign-in, registration, and sign-out switch by immutable `accountId`; guest and
    accounts have independent keys. The pre-scope legacy snapshot is preserved and adoptable by at
    most one authenticated account via a durable owner marker.
- [x] **LOCAL_ONLY - Hashed development authentication.**
  - Salted SHA-256 password records, constant-time comparison, session/local remember behavior,
    registration, reset-code verification, expiry/attempt controls, password reset, and sign-out.
  - Evidence: local-auth test passes. This is not production identity or authorization.
- [x] **COMPLETE - Hash deep-link/history routing.**
  - Page hashes plus order/customer detail hashes are implemented; pop/hash listeners restore route
    state. Browser back/forward behavior still belongs to the unrun manual matrix below.
- [x] **COMPLETE - Prefer canonical typed routes over generic previews.**
  - B2B uses Customers; core store tabs use Catalog/Settings/Finance; mapped inventory/team/finance
    tabs use live pages; Audit uses the real Settings audit view. Remaining generic modules display a
    seed/reference boundary and export live mapped rows where applicable.
- [x] **LOCAL_ONLY - Dynamic business screens and controls.**
  - Dashboard, orders, customers, catalog, marketing, production, fulfillment, capacity, inventory,
    PO creation/receipt, adjustments, count start/completion, team, settings, messages, integrations,
    finance, reports, loyalty, subscriptions, complaints, advertising, and generic screens consume
    the canonical domain or persistent generic actions.
  - Twenty-eight page/component files use `useDomain`; mutable UI business-fixture imports are gone.
- [x] **COMPLETE - Remove false-success handlers.**
  - Final scan found zero `p.say`, `p.noop`, `demo action`, or `full build` handlers. Local and external
    boundaries are stated in the UI.
- [x] **LOCAL_ONLY - Local files, print, outbox, integrations, and AI.**
  - CSV/JSON download, backup, browser print, local message outbox, local integration/key/webhook
    records, and deterministic local AI query are implemented without claiming provider delivery.
- [x] **COMPLETE - Recovery UI and handoff documentation.**
  - Application `ErrorBoundary`, data recovery guidance, README, agent guide, handbook, audit,
    architecture, model, tests, integrations, and implementation report are present.

## Automated verification

- [x] **COMPLETE - Primary check.**
  - `npm.cmd run check` passed on 2026-07-13.
  - 17/17 Node tests passed: domain mutations, scoped repository safety/recovery/adoption, CSV, and
    local auth.
  - Vite built 708 modules in 4.98s.
- [ ] **TODO - Reduce or split the large production chunk.**
  - Current build warning: one minified JavaScript chunk is 512.32 kB (146.88 kB gzip).
  - Acceptance: choose an intentional lazy-loading/manual-chunk strategy and verify behavior/build
    metrics; do not trade correctness for an arbitrary number.

## Runtime verification still required

- [ ] **NOT RUN - Browser and reload matrix.**
  - Blocker for this run: browser automation was unavailable and final live-server launch approval
    was not granted.
  - Acceptance: run every journey in `docs/TESTING.md` from a clean profile and an existing profile;
    verify hash deep links, back/forward, mobile/desktop shell, form validation, cross-screen updates,
    account/guest switching, reload persistence, backup round trip, protected corrupt/future recovery,
    identity-preserving reset, print/download behavior,
    keyboard access, and local/external labels.
- [ ] **TODO - Automated component/end-to-end coverage.**
  - Current tests exercise domain/auth/export utilities, not rendered React journeys.
  - Acceptance: add reliable component and browser tests for the highest-risk mutation/reload paths and
    run them in CI.

## Production and provider backlog

- [ ] **BLOCKED_EXTERNAL - Supabase/remote multi-user adapter.**
  - Needs project/test environment, tenant/store schema, migrations, RLS, transactional boundaries,
    conflict/realtime policy, audit/retention, backups, and migration ownership.
- [ ] **BLOCKED_EXTERNAL - Production authentication and authorization.**
  - Needs identity provider, invitation/reset delivery, roles, PIN/device policy, session/MFA policy,
    server enforcement, rate limiting, and security review.
- [ ] **BLOCKED_EXTERNAL - SMS/Telegram/email/push delivery.**
  - Needs approved provider, consent/templates, backend sender, delivery callbacks, retry/rate limits,
    and sandbox credentials.
- [ ] **BLOCKED_EXTERNAL - Payments/KHQR/refunds/settlement.**
  - Needs merchant contract, sandbox, trusted backend, callback verification, idempotency,
    reconciliation, and compliance review.
- [ ] **BLOCKED_EXTERNAL - POS publication and device/printer service.**
  - Browser print is local-only. Production publishing/devices need APIs, pairing/authorization,
    acknowledgments, offline behavior, formats, and hardware tests.
- [ ] **BLOCKED_EXTERNAL - OAuth integrations, real API keys, webhook delivery.**
  - Current integration states, keys, and endpoints are development records only. Production needs
    server-side token/key storage, signing, delivery workers, retries, revocation, and audit.
- [ ] **BLOCKED_EXTERNAL - Hosted AI.**
  - Current AI is deterministic and local. Hosted AI needs an approved model/server endpoint, privacy
    policy, structured contract, evaluations, cost/rate controls, and secret management.
- [ ] **BLOCKED_EXTERNAL - Production operations.**
  - Needs hosting, environment ownership, monitoring, privacy/security review, support/runbook,
    backup/restore, data migration, and rollback exercise.

## Completion protocol

1. Run `npm.cmd run check` and record exact results.
2. Run the relevant browser journey; if it cannot run, keep it `NOT RUN`.
3. Update `docs/FUNCTION_AUDIT.md` and `docs/IMPLEMENTATION_REPORT.md` with evidence.
4. Keep local-only behavior distinct from provider-confirmed behavior.
5. Never mark an external item complete without its contract, sandbox, and verification.
