# Testing and verification

## Primary command

From `kitluy-partner-portal` on Windows PowerShell:

```powershell
npm.cmd run check
```

`check` runs the full Node test suite and then the production Vite build. Use it before and after a
meaningful change. Supporting commands:

```powershell
npm.cmd test
npm.cmd run test:domain
npm.cmd run build
npm.cmd run dev
npm.cmd run preview
```

## Last verified automated result

Run date: 2026-07-13

`npm.cmd run check` passed:

- 17 tests, 17 passed, 0 failed/skipped/todo;
- test duration approximately 334 ms;
- Vite 6.4.3 transformed 708 modules;
- build completed in 4.98s;
- generated JavaScript included a 512.32 kB minified chunk (146.88 kB gzip), producing Vite's
  over-500-kB warning.

Earlier 9- and 12-test snapshots are superseded by this current 17-test run.

## Current automated coverage

| File | Covered behavior |
|---|---|
| `test/domainMutations.test.js` | Quantity parsing, Unicode minus handling, partial PO receipt quantity, immutable mutation, local audit append |
| `test/domainRepository.test.js` | Seed/load, export/replace, unsafe import rejection, explicit reset, protected corrupt/future recovery, failed replacement protection, blocked storage, account/guest isolation, one-owner legacy adoption, authoritative scoped snapshot |
| `test/export.test.js` | CSV comma/quote/line-break escaping, selected labels, BOM, stable CRLF output |
| `test/localAuth.test.js` | Hashed credential verification, session scope, signup, reset challenge, and password reset |

The production build additionally proves that the complete React module graph parses/transforms and
bundles. Static reconciliation also found:

- 28 UI files importing `useDomain`;
- no mutable business-record imports from the legacy seed modules in pages/components;
- zero `p.say`, `p.noop`, `demo action`, or `full build` handlers.

These checks do not render or click the application.

## Browser status: NOT RUN

Browser automation was unavailable during the final run. A final live-server launch could not be
approved, so no manual browser/reload result is recorded. Do not infer runtime success from the build.

When access is available, start the app:

```powershell
npm.cmd run dev
```

Confirm the actual listener/URL printed by Vite, then execute the matrix below from both a clean
browser profile and an existing-data profile.

## Required browser journeys

1. **Authentication and routing**
   - local login, wrong password, remember on/off, sign-out;
   - registration and local reset code expiry/wrong-code/attempt handling;
   - direct `#/dashboard`, order detail, and customer detail hashes;
   - back/forward and refresh on page/detail routes.
   - create/sign into two accounts plus guest; verify immutable-account scope isolation through
     restored session, sign-in, registration, sign-out, and reload.
2. **Shell and accessibility**
   - desktop collapse, mobile drawer/overlay, group/child nav, navigation search, theme;
   - live order/message counts and local `updatedAt` label;
   - skip link, visible focus, keyboard-only operation, drawer/dialog Escape and focus behavior.
3. **Orders and dependent views**
   - search/filter/reset, open detail, perform each supported status transition;
   - confirm dashboard, production, fulfillment, customer history, finance/reports, timeline, and
     badges update; reload and repeat invalid/stale transitions.
4. **Customers and communications**
   - add customer, search/open, add note, download history;
   - read a message and verify unread counts; save local outbox reply and reload;
   - create/open zero-thread state; verify no UI claims SMS/Telegram delivery;
   - save complaint response note and verify local audit/reload.
5. **Catalog, marketing, loyalty, subscriptions**
   - add service/add-on/promotion/campaign, toggle flows/offers/add-ons;
   - change loyalty mode and record subscription review;
   - verify persistence and that POS/billing/ad delivery remains labelled unconnected.
6. **Inventory**
   - create PO; partially receive; receive remaining quantity; attempt duplicate/excess receipt;
   - verify item on-hand, PO status, movement/history, dashboard warning, and audit;
   - add/remove adjustment with valid/invalid/zero/Unicode-minus quantities;
   - start count, enter variances, complete once, and verify movements/reload;
   - change inventory settings and exercise printable/download paths.
7. **Team, settings, and generic screens**
   - add/open member; change store profile, notification, payment, and generic toggles/actions;
   - cancel/dirty/save behavior; navigate every listed sub-page and unknown hash;
   - verify B2B routes to Customers; mapped Store/Inventory/Team/Finance destinations use live pages;
     Audit uses Settings Audit; remaining generic modules show the seed/reference boundary;
   - verify relevant generic CSV exports use live mapped rows and unmapped exports say seed/reference;
   - verify local-only identity/PIN/payroll/support/security copy.
8. **Finance, reports, exports, and print**
   - compare derived totals after order changes; exercise tabs/date/empty states;
   - download CSV and inspect encoding/columns/values;
   - open each browser print path and inspect pagination/content without claiming hardware acceptance.
9. **Integrations and local AI**
   - filter integration catalog; toggle local connection; add key placeholder and valid/invalid webhook;
   - verify clear non-secret/no-delivery labels and reload;
   - run local AI queries with normal, empty, and no-result input; verify no hosted-model claim.
10. **Backup, recovery, and reload**
    - export domain JSON; change state; import backup; confirm replacement and audit;
    - reject malformed/incomplete/future/unsafe/oversized input without replacement;
    - reset with cancel/confirm and verify active account store identity is retained;
    - place corrupt/future bytes in a scoped key; verify they remain byte-for-byte, normal commits stay
      in protected memory, and only successful explicit valid import/reset replaces them;
    - make explicit replacement persistence fail and verify recovery stays protected;
    - verify a legacy global snapshot remains untouched and is copied to at most one authenticated
      account; verify an existing scoped snapshot remains authoritative;
    - simulate blocked/quota storage;
    - force a render failure to inspect `ErrorBoundary` and recovery instructions.

## Responsive and visual matrix

- Narrow phone, tablet, normal desktop, and wide desktop.
- Light and dark theme.
- Long store/customer/service names, empty collections, large counts, and validation errors.
- No hidden primary action, trapped scroll, clipped drawer, or unreadable print output.
- Semantic danger/warning/success contrast and reduced-motion behavior.

## Evidence format

For each manual journey, record:

- date, browser/version, viewport, and clean/existing profile state;
- route and exact steps;
- expected and observed cross-screen/persistence result;
- screenshot or concise evidence reference when useful;
- negative/error path;
- anything not exercised.

Update `IMPLEMENTATION_REPORT.md` and the corresponding `FUNCTION_AUDIT.md` row. If a step cannot run,
record `NOT RUN` and the exact blocker.

## External integration verification

Do not test against production. Each provider needs a sandbox/test tenant, approved credentials,
contract tests, callback signature/replay tests, timeout/retry/rate-limit cases, scrubbed logs, and
explicit queued/succeeded/failed/unknown states. Until those exist, the capability remains
`BLOCKED_EXTERNAL` regardless of local UI behavior.

## Completion rule

- `npm.cmd run check` must pass.
- A required browser path is not verified until it is observed.
- Browser print is not printer-service acceptance.
- Local outbox is not message delivery.
- Local integration/key/webhook state is not provider connectivity.
- Local AI is not hosted-model output.
- External work stays blocked until its contract and sandbox verification exist.
