# Function audit

Reconciled: 2026-07-13  
Scope: visible routes, controls, forms, drawers, downloads, printing, local persistence, and advertised
integrations in `kitluy-partner-portal`.

## Status and evidence

- `COMPLETE` - implemented and supported by the stated automated/source evidence.
- `LOCAL_ONLY` - implemented and persistent where applicable, but intentionally limited to this
  browser/profile.
- `BLOCKED_EXTERNAL` - production behavior requires a backend, provider, credentials, policy, or
  contract not present here.
- `NOT RUN` - no runtime result exists.

Automated evidence: `npm.cmd run check` passed on 2026-07-13 with 17/17 tests and a Vite build of 708
modules in 4.98s. Static reconciliation found 28 UI files using `useDomain`, no mutable business-record
imports from legacy fixture modules, and zero `p.say`, `p.noop`, `demo action`, or `full build`
handlers. `data/messages.js` and `data/marketplace.js` remain UI reference constants only.

Runtime boundary: browser automation was unavailable and final live-server launch approval was not
granted. Every rendered-UI/reload row below therefore carries an implicit **browser matrix: NOT RUN**.
Automated evidence supports the implementation status; it does not claim the click path was observed.

## Foundation and shell

| Surface / control | Status | Implemented behavior | Evidence / remaining boundary |
|---|---:|---|---|
| Domain seed/repository/provider | `COMPLETE` | Schema-v1 scoped seed/load/save, validation, identity-preserving reset, backup import/export, protected corrupt/future recovery, storage fallback, metadata, and canonical provider | Repository tests pass; browser reload matrix `NOT RUN` |
| Account/guest data isolation | `COMPLETE` | Immutable `accountId` and guest use distinct scoped keys; restored session/sign-in/register/sign-out switch scope | Scope-isolation tests pass; rendered account switching `NOT RUN` |
| Legacy pre-scope adoption | `COMPLETE` | Original global bytes remain untouched; at most one authenticated account receives a copy; durable owner marker prevents cross-account adoption | Legacy adoption/authoritative-scope tests pass |
| Protected recovery | `COMPLETE` | Corrupt/future raw bytes remain byte-for-byte in storage while a fresh snapshot runs in protected memory; normal commits cannot overwrite; only explicit valid import/reset may replace | Recovery/future/replacement-failure tests pass; Settings flow `NOT RUN` |
| Immutable actions and audit | `COMPLETE` | Named domain actions clone state, validate business input, mutate canonical records, append local audit events, and persist | Mutation/repository tests pass |
| UI/domain separation | `COMPLETE` | `PortalContext` owns routing/transient UI; `DomainContext` owns business state; pages/components no longer mutate seed arrays | Source scan + build pass |
| Hash deep links/history | `COMPLETE` | Page hashes and order/customer detail hashes; pop/hash listeners; route restoration | Source/build verified; browser back/forward/deep-link matrix `NOT RUN` |
| Sidebar navigation/search | `LOCAL_ONLY` | Parent/child navigation, mobile close, group state, working search, dynamic store name, live order/message counts | Domain wiring/build pass; responsive/keyboard clicks `NOT RUN` |
| Topbar | `LOCAL_ONLY` | Theme/collapse/mobile controls, dynamic unread count, browser-local `meta.updatedAt`, promo navigation | Domain wiring/build pass; runtime `NOT RUN` |
| UI preferences | `LOCAL_ONLY` | Versioned theme/collapse preferences stored separately from domain data | Source/build pass; reload `NOT RUN` |
| Error boundary | `COMPLETE` | Last-resort render fallback with reload and data recovery guidance | Source/build pass; forced runtime failure `NOT RUN` |
| Success/error copy | `COMPLETE` | Fake success handlers removed; controls either commit locally or state their external requirement | Zero stale-handler scan + build pass |
| CSV encoding/download helper | `COMPLETE` | RFC-4180-style escaping, BOM/CRLF CSV, text/JSON browser downloads | CSV tests pass; actual browser download `NOT RUN` |
| Backup import/export/reset | `LOCAL_ONLY` | Settings exports scoped versioned JSON, validates/replaces imports, confirms reset, and preserves active account store identity on reset | Repository tests pass; file picker/download/reload `NOT RUN` |
| Browser printing | `LOCAL_ONLY` | Report/receipt/label paths use browser print/printable output without claiming device acceptance | Build/source pass; print dialog/output `NOT RUN` |

## Authentication and access

| Surface / control | Status | Implemented behavior | Evidence / remaining boundary |
|---|---:|---|---|
| Local login and remember-me | `LOCAL_ONLY` | Salted SHA-256 verification, constant-time comparison, local/session storage selection, protected shell, sign-out | Local-auth test passes; rendered flow `NOT RUN` |
| Local registration | `LOCAL_ONLY` | Validated account/store creation and local session | Local-auth test passes; no remote identity/store provisioning |
| Local forgot/reset flow | `LOCAL_ONLY` | Hashed reset code, session-scoped challenge, expiry, attempt limit, resend/reset | Local-auth test passes; code is shown locally because no delivery provider exists |
| Production identity/authorization | `BLOCKED_EXTERNAL` | Not implemented | Needs identity provider, tenant membership, server enforcement, invitations, MFA/session/PIN policy, and security review |
| Roles/POS PIN/access views | `LOCAL_ONLY` | Persistent local records/actions and truthful external boundary | Backend-enforced roles, PIN provisioning, revocation, and trusted audit remain blocked |

## Home, orders, and operations

| Surface / control | Status | Implemented behavior | Evidence / remaining boundary |
|---|---:|---|---|
| Dashboard KPIs/charts/recent orders | `LOCAL_ONLY` | Derived from canonical orders, inventory, customers, production, and finance data; quick links route to live views | Domain wiring/build pass; rendered reconciliation `NOT RUN` |
| Local AI insights/query | `LOCAL_ONLY` | Deterministic query/insight behavior over local domain data; dismiss/restore/actions persist | No hosted model or external analysis; browser matrix `NOT RUN` |
| Hosted/generative AI | `BLOCKED_EXTERNAL` | Not connected | Needs approved model, trusted endpoint, privacy/evaluation policy, rate/cost controls, and secrets |
| Messages list/filter/read/unread | `LOCAL_ONLY` | Canonical persistent threads, zero-thread state, read action, dynamic sidebar/topbar counts | Domain wiring/build pass; browser/reload `NOT RUN` |
| Message composer/quick replies | `LOCAL_ONLY` | Replies persist to a clearly labelled local outbox; customer-profile navigation is real | SMS/Telegram/email delivery is not connected |
| Order Center search/status/filter/reset | `LOCAL_ONLY` | Canonical order filters and detail routing | Domain wiring/build pass; browser matrix `NOT RUN` |
| Order status/detail/timeline | `LOCAL_ONLY` | Validated status changes append timeline/audit and update dependent dashboard/production/fulfillment/customer/report views | Domain wiring/build pass; cross-screen/reload matrix `NOT RUN` |
| Order/customer/report CSV | `LOCAL_ONLY` | Real browser CSV generation rather than queued-message simulation | CSV utility tested; download content in browser `NOT RUN` |
| Receipt/report/label print | `LOCAL_ONLY` | Browser print path only | Named printer/device acceptance is not claimed; output `NOT RUN` |
| Production board/exceptions | `LOCAL_ONLY` | Work queues derive from orders; production exception resolution persists | Domain wiring/build pass; rendered transition matrix `NOT RUN` |
| Fulfillment | `LOCAL_ONLY` | Ready/pickup/delivery views derive from canonical orders and supported actions persist | Domain wiring/build pass; browser matrix `NOT RUN` |
| Capacity | `LOCAL_ONLY` | Station/order workload is domain-driven | Domain wiring/build pass; business calibration/runtime `NOT RUN` |
| Driver/carrier dispatch | `BLOCKED_EXTERNAL` | Not connected | Needs provider API, tracking callbacks, consent/address policy, and sandbox |

## Customers and growth

| Surface / control | Status | Implemented behavior | Evidence / remaining boundary |
|---|---:|---|---|
| Customer list/search/tier/detail/history | `LOCAL_ONLY` | Canonical customers and related orders drive list/detail/history | Domain wiring/build pass; browser matrix `NOT RUN` |
| Add customer and notes | `LOCAL_ONLY` | Validated customer/note actions persist stable records and local audit | Domain wiring/build pass; form/reload `NOT RUN` |
| Customer export | `LOCAL_ONLY` | Real local CSV/download path | Browser download `NOT RUN` |
| B2B Accounts | `LOCAL_ONLY` | Routes to canonical Customers with the live B2B filter/heading rather than a generic preview | Domain/source/build pass; statements/credit enforcement need backend |
| Marketing flows/offers | `LOCAL_ONLY` | Canonical flow/offer toggles persist | No customer-provider delivery is implied |
| Promotions | `LOCAL_ONLY` | Validated promotions persist and update local marketing views | POS publication is separate and blocked |
| Advertising campaigns | `LOCAL_ONLY` | Local campaign records/actions persist | Real ad placement/spend/provider delivery is blocked |
| Loyalty mode | `LOCAL_ONLY` | Canonical local contribution mode persists; seed analytics are labelled | Cross-device balances/billing provider not connected |
| Subscriptions | `LOCAL_ONLY` | Seed analytics are labelled; review actions persist locally | Enrollment and recurring billing are blocked |
| Complaints/reviews | `LOCAL_ONLY` | Accessible composer stores response notes in local audit history | Telegram/provider reply delivery is not connected |
| POS publication | `BLOCKED_EXTERNAL` | Not connected | Needs POS schema/API, idempotency, conflict handling, acknowledgment, and sandbox |
| Subscription billing / ad delivery | `BLOCKED_EXTERNAL` | Not connected | Needs provider contracts, trusted backend, callbacks, compliance, and sandbox |

## Store, inventory, and team

| Surface / control | Status | Implemented behavior | Evidence / remaining boundary |
|---|---:|---|---|
| Services/pricing | `LOCAL_ONLY` | Canonical service creation and price/catalog rendering | Domain wiring/build pass; browser form `NOT RUN`; POS sync blocked |
| Add-ons | `LOCAL_ONLY` | Add and toggle actions persist | Domain wiring/build pass; runtime `NOT RUN` |
| Store profile/settings/hours/notifications/payment options/loyalty | `LOCAL_ONLY` | Forms hydrate from canonical state, save domain patches/toggles, and support backup/reset | Domain wiring/build pass; dirty/cancel/reload matrix `NOT RUN` |
| Store typed route reuse | `LOCAL_ONLY` | Add-ons -> Catalog; Profile/Hours/Notifications/Data -> typed Settings; Payment Methods -> typed Finance settings | Source/build pass; browser routing matrix `NOT RUN` |
| Remaining store reference modules | `LOCAL_ONLY` | Generic rules/templates/devices/language screens show a conspicuous seed/reference boundary and persist local intent | Provider/device consequences remain blocked |
| Inventory overview/items/history/waste/valuation | `LOCAL_ONLY` | Views derive from canonical items, stock moves, settings, adjustments, and counts | Domain wiring/build pass; rendered reconciliation `NOT RUN` |
| Purchase-order creation | `LOCAL_ONLY` | Validated PO records/lines/supplier/totals persist | Domain wiring/build pass; browser/reload `NOT RUN` |
| Purchase-order receipt | `LOCAL_ONLY` | Partial/remaining receipt quantities create stock movements and update PO state | Partial-receipt unit test passes; cross-screen/browser `NOT RUN` |
| Stock adjustment | `LOCAL_ONLY` | Quantity parsing/validation and append-only stock/audit changes persist | Quantity/mutation tests pass; browser form `NOT RUN` |
| Inventory count start/completion | `LOCAL_ONLY` | Count lifecycle persists and completion posts variance movements | Domain wiring/build pass; browser/reload `NOT RUN` |
| Suppliers | `LOCAL_ONLY` | Canonical supplier/PO relationships feed views and drawers | Build/source pass; rendered CRUD depth `NOT RUN` |
| Inventory mapped live tabs | `LOCAL_ONLY` | Stock Receipts routes to live History; AI Reorder routes to live Overview; core inventory tabs use `Supplies` | Source/build pass; browser routing `NOT RUN` |
| Remaining inventory reference tabs | `LOCAL_ONLY` | Transfer, mixing, labels, import, approval and other unmapped modules show the seed/reference boundary and persist local intent; relevant exports use live mapped rows | No external print/AI/approval service is implied |
| Team member add/list/detail | `LOCAL_ONLY` | Canonical member action and views persist | Domain wiring/build pass; invite delivery not connected |
| Team mapped live tabs | `LOCAL_ONLY` | Overview/Employees/POS PIN -> Members; Roles & Access -> Permissions; Time Clock/Cards/Attendance -> Attendance; Shifts/Scheduling -> Shifts | Source/build pass; browser routing `NOT RUN` |
| Remaining team reference tabs | `LOCAL_ONLY` | Unmapped payroll/labor/training modules show seed/reference boundary and persist local intent | Production payroll authority requires backend/approved export contract |
| Printer/device/POS PIN services | `BLOCKED_EXTERNAL` | Not connected | Browser print and local records exist; pairing, device auth, PIN provisioning, and hardware acceptance require external services |

## Finance, reports, and system

| Surface / control | Status | Implemented behavior | Evidence / remaining boundary |
|---|---:|---|---|
| Finance overview/ledgers/reconciliation/shift/settings | `LOCAL_ONLY` | Values derive from canonical data; Sales/Deposits/Customer Tabs map to live Overview, Payment Ledger to Reconciliation, Cash Drawer to Shift Finance, AI assistant to local AI | Domain wiring/build pass; business/runtime reconciliation `NOT RUN` |
| Reports tabs/KPIs/filters | `LOCAL_ONLY` | Domain-driven sales, services, payments, staff, issues, and generic report views | Domain wiring/build pass; browser matrix `NOT RUN` |
| Report export/print | `LOCAL_ONLY` | Real CSV and browser print paths | CSV tested; browser download/print `NOT RUN` |
| Payment/KHQR/card/refund/settlement truth | `BLOCKED_EXTERNAL` | Not connected | Needs gateway sandbox, backend verification, callbacks, idempotency, reconciliation, and compliance |
| Accounting/ERP/payroll delivery | `BLOCKED_EXTERNAL` | Not connected | Local files/actions do not equal destination acceptance; needs approved schema/provider |
| Knowledge Base | `COMPLETE` | Article cards open accessible inline details and include local-policy caveats | Source/build pass; keyboard/screen-reader runtime `NOT RUN` |
| Integration catalog/filter/status | `LOCAL_ONLY` | Canonical local connection markers, filters, counts, and request audit actions | OAuth/provider health is not connected |
| Local API key placeholders | `LOCAL_ONLY` | Controlled form stores clearly labelled development placeholders | They are not credentials; real issuance/rotation is blocked |
| Local webhook records | `LOCAL_ONLY` | Controlled HTTPS/event form persists endpoint records | No signing or delivery worker exists |
| Audit Log | `LOCAL_ONLY` | Routes to the real Settings Audit tab with canonical local audit events and CSV export | Source/build pass; browser/export `NOT RUN`; local audit is not tamper-resistant |
| Security/Support reference screens | `LOCAL_ONLY` | Generic screens retain conspicuous seed/reference boundary and persistent local intent | Trusted security/support operations need backend/provider ownership |
| OAuth, API key service, webhook delivery | `BLOCKED_EXTERNAL` | Not connected | Needs server token/key storage, signing, retries, revocation, delivery logs, and sandbox |

## Navigation sub-page coverage

All configured destinations resolve to a canonical typed page when mapped, otherwise a visibly
labelled seed/reference module; unknown hashes render a page-not-found state. Generic controls persist
through `genericState`, but this is local intent, not proof of a remote workflow. Relevant generic CSV
exports map to live domain rows where an explicit mapping exists.

- **Store Management (`LOCAL_ONLY`):** Services & Pricing; Add-ons & Special Handling; Order Rules &
  Workflow; Store Profile; Business Hours; Receipt Templates; Laundry Tag Templates; Payment Methods;
  POS Devices & Registers; Notifications; Language & Currency; Data Import / Export.
- **Inventory Management (`LOCAL_ONLY`):** Overview; Stock Items; Purchase Orders; Stock Receipts;
  Transfer Orders; Stock Adjustments; Inventory Counts; Production / Mixing / Bundles; Inventory
  History; Inventory Valuation; Label Printing; Waste / Loss; Suppliers; Import / Export; AI Reorder
  Suggestions; Approval Workflow; Settings.
- **Employee Management (`LOCAL_ONLY`):** Overview; Employees; Roles & Access; POS PIN Access; Time
  Clock; Time Cards; Shifts; Sales by Employee; Workload by Hour; Attendance; Approvals; Activity Log;
  Scheduling; Payroll Export; Labor Cost; Overtime Rules; Incentives; Training Checklist; AI Staffing
  Recommendation.
- **Finance (`LOCAL_ONLY`):** Overview; Sales Ledger; Payment Ledger; Cash Drawer; Shift Finance;
  Reconciliation; Refunds & Voids; Deposits & Balances; Customer Tabs; B2B Statements; Payouts;
  Documents; Taxes & Fees; Expenses; Profitability; Export Center; Finance Alerts; AI Finance
  Assistant; ERP Export Prep; Settings.
- **Reports (`LOCAL_ONLY`):** Overview; Sales; Orders; Due & Overdue; Payments; Shifts; Staff;
  Services; Customers; Issues & Rewash; Consumables; Inventory; Employee; Finance; Exports; Presets;
  AI Summary.
- **Canonical mapped destinations (`LOCAL_ONLY`):** B2B Accounts -> Customers; Audit Log -> Settings
  Audit; mapped Store/Inventory/Team/Finance routes listed above.
- **System reference modules (`LOCAL_ONLY`):** Security and Support retain the seed/reference boundary.
  Their trusted external consequences remain `BLOCKED_EXTERNAL` as listed above.

## Required next audit

Run the browser matrix in `TESTING.md`. Update a row only with observed evidence; if the live server or
browser remains unavailable, retain `NOT RUN`. External rows stay blocked until their contracts,
sandboxes, credentials, and verification exist.
