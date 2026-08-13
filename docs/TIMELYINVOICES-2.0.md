# TimelyInvoices 2.0 — Architecture, Product & Engineering Guide

> Living document. Do not mark work complete unless it is implemented and verified.
> Last updated: 2026-08-12

---

## 1. Product vision

TimelyInvoices is a **premium financial command centre** for South African SMEs:

> Invoice → Collect → Understand → Act

North-star: when a business owner opens the app, they immediately understand what is happening with their money and what to do next.

**Not** a full ERP/accounting suite. Remain simpler than Xero/QuickBooks while being intelligent around invoicing, payments, collections, clients, cashflow, and insights.

---

## 2. Source of truth

| Path | Role |
|------|------|
| `apps/web` | **Primary product** — Next.js 16 + Supabase |
| `apps/web/supabase` | Canonical Postgres schema + migrations |
| `src/` + `client/` | **Frozen legacy** — Express/TypeORM + old Next client. Reference only. |
| `apps/mobile/timely_invoices` | Flutter mobile (secondary) |

**Stack decision:** Keep Next.js + Supabase. No framework rewrite.

---

## 3. Current architecture

```
Browser → middleware (Supabase session)
       → App Router pages / Route Handlers (/api/*)
       → Feature modules + lib/*
       → Supabase Auth / Postgres / Storage
       → Resend (email) / Twilio WhatsApp / PayFast / SnapScan
```

| Layer | Technology |
|-------|------------|
| Frontend | Next 16, React 19, Tailwind 4, Radix/CVA, cmdk, Recharts, Serwist |
| Backend | Next Route Handlers + Supabase client queries |
| Auth | Supabase Auth (SSR cookies) |
| Tenancy | `owner_id` workspace owner + `employees` for team |
| Permissions | `owner \| admin \| billing \| member \| viewer` |
| Money storage | Postgres `numeric` |
| Jobs | Vercel cron `/api/cron/recurring` |
| Deploy | Netlify (`apps/web`); Vercel cron optional |
| Tests | Vitest harness (domain money + security helpers) |

### Multi-tenancy

- Solo user: `workspaceOwnerId = auth.uid()`
- Team member: resolved via `employees` (`owner_id` + email, unique per workspace)
- **RLS:** enabled via migration `20260812130000_rls_and_v2_foundations.sql` — production requirement

---

## 4. Target architecture

```
Presentation (apps/web UI)
  → Application services (route handlers, feature api)
  → Domain (lib/domain, lib/money, entitlements)
  → Data access (Supabase, scoped by workspace)
  → Infrastructure (email, WhatsApp, payments, storage, cron)
```

Principles:

1. Data integrity  
2. Security  
3. Reliability  
4. UX  
5. Performance  
6. Scalability  
7. Visual polish  

---

## 5. Feature matrix

| Area | Status | Notes |
|------|--------|-------|
| Invoices + composer + preview | Mature | Reuse; polish UX |
| Public invoice + portal | Mature | Reuse; visual upgrade |
| Partial payments | Mature | Extend statuses/events |
| PayFast / SnapScan | Partial | Service-role webhooks + events |
| Quotes + convert | Partial | Public accept pending |
| Clients | Partial | Payment score added |
| Expenses | Mature CRUD | Keep lightweight |
| Recurring | Partial | Harden idempotency |
| Collections / reminders | Partial | Hub wired to real data |
| Notifications | Partial | API + table; replace mocks |
| Billing / entitlements | Partial | Plan registry; no client spoof |
| Cashflow / reports / insights | Partial | Data-driven only |
| Team / RBAC | Partial | Backend enforced |
| Payment plans | Schema ready | UI phased |
| Audit log | Schema + helper | Wire critical actions |
| Onboarding | Thin | Wizard phased |
| Landing | Needs rebuild | Truthful product demo |
| Payroll / time-tracking | Secondary | Demoted in nav |

### Do not rewrite

- Invoice composer + `InvoicePreview`
- Public share invoice + client portal
- Messaging module (extend channels)
- Workspace/permission helpers (harden)
- Core Supabase tables (migrate forward)
- Command palette shell
- Expenses CRUD

---

## 6. Design system

### Direction

Premium, calm, editorial, financial — quality bar of Linear/Stripe/Mercury **as craft**, not copies.

**Avoid:** glassmorphism defaults, cyan glow, purple SaaS gradients, card hell, pill badge spam, AI stickers.

### Tokens

Defined in `apps/web/src/app/globals.css` (`--ti-*`) and `apps/web/src/theme/tokens.ts`.

- Surfaces: background, surface, elevated
- Text: primary, secondary, muted
- Brand: restrained accent
- Semantic: success, warning, danger, info
- Spacing scale, restrained radius, subtle shadows
- Typography roles: display, heading, body, caption, label, **numeric**

### Navigation IA

- **Overview**
- **Money:** Invoices, Quotes, Payments, Expenses
- **People:** Clients
- **Insights:** Cashflow, Reports, Timely Insights
- **Collections**
- **Workspace:** Team, Settings, Billing
- **More:** Recurring, Catalog, Payroll, Time tracking (demoted)

---

## 7. Pricing & entitlements

Published marketing prices (do not change without product decision):

| Plan | Price |
|------|-------|
| Starter (free) | R 0 |
| Pro | R 299 / mo |
| Business | R 799 / mo |

Entitlements live in `apps/web/src/lib/billing/entitlements.ts`. Backend is authoritative. Clients cannot PATCH `subscription_plan`.

---

## 8. Security plan

| Item | Status |
|------|--------|
| RLS on tenant tables | Migration + policies |
| Receipt signed URLs require auth + ownership | Fixed |
| Payment session create asserts workspace | Fixed |
| Settings cannot spoof subscription plan | Fixed |
| PayFast webhook uses service role + payment_events | Fixed |
| Employees unique `(owner_id, email)` | Migration |
| Money helpers in cents | `lib/money` + tests |
| Rate limiting | Outstanding (Phase 14) |
| Optional 2FA | Outstanding |

---

## 9. Database changes (additive)

Migration: `apps/web/supabase/migrations/20260812130000_rls_and_v2_foundations.sql`

- RLS policies
- `invoices.viewed_at`, `delivered_at`
- `payment_events` (webhook idempotency)
- `payment_schedules` / `payment_schedule_items`
- `notifications`, `audit_logs`
- `collection_sequences` / steps
- Employee uniqueness
- Amount check constraints where safe

---

## 10. Implementation phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | This document | Done |
| 0.5 | Security + money foundations | Done |
| 1 | Design system + shell | Done |
| 2 | Dashboard 2.0 | Done |
| 3 | Invoices 2.0 foundations | Done (composer reused; templates/lifecycle added) |
| 4 | Quotes | Done (public accept/decline) |
| 5 | Clients + Timely Payment Score | Done |
| 6 | Payments domain | Partial (events + plans schema; UI phased) |
| 7 | Collections engine | Done (cron automation + hub) |
| 8 | Expenses + profitability | Done (estimate helper) |
| 9–11 | Cashflow, reports, insights | Partial (pages live; deepen reports) |
| 12 | Onboarding | Done (wizard page) |
| 13 | Marketing | Done (landing + pricing) |
| 14–15 | Hardening + production readiness | Done (rate limit, Sentry, Playwright smoke) |

### After each phase

1. Typecheck  
2. Lint  
3. Tests  
4. Build  
5. Regression / responsive / a11y spot-check  
6. Migration validation  

---

## 11. Testing strategy

- **Unit:** money (VAT, discounts, balances), permissions, status transitions  
- **Integration:** invoice send, payments, webhooks, recurring  
- **Security:** tenant isolation, unauthorized access  
- **E2E:** signup → invoice → pay; quote → convert; overdue → reminder  

Harness: Vitest under `apps/web` (`npm run test`).

---

## 12. Migration rules

1. Inspect existing data  
2. Additive migration  
3. Backfill  
4. Validate  
5. Only then deprecate  

Never casually delete financial history.

---

## 13. Completed work

- [x] Repository audit
- [x] This document created
- [x] Legacy stack frozen as non-source-of-truth
- [x] RLS + v2 foundations migration (`20260812130000_rls_and_v2_foundations.sql`)
- [x] Service-role admin client; PayFast/SnapScan webhooks hardened + `payment_events`
- [x] Receipt signed URLs require auth + path ownership
- [x] Payment session create asserts workspace ownership
- [x] Settings API ignores client `subscriptionPlan` spoofing
- [x] Money helpers (cents) + Vitest harness
- [x] Entitlements registry (R0 / R299 / R799)
- [x] Design tokens + light financial AppShell + grouped nav IA
- [x] Dashboard 2.0 (metric hierarchy, action centre, business pulse, cashflow ranges)
- [x] Cashflow / Insights / Integrations / Onboarding pages
- [x] Collections hub (replaces mock reminders)
- [x] Notifications API + page
- [x] Billing page aligned to entitlements
- [x] Timely Payment Score™ on client profiles
- [x] Invoice templates module + lifecycle helpers
- [x] Profitability estimate helper (clearly labelled)
- [x] Feature flag stub
- [x] Command palette + routes + middleware updated

## 14. Outstanding work

- Apply Supabase migrations in production (RLS + hardening) and validate
- SMS channel provider
- Saved workspace invoice templates table + UI
- Full E2E against staging with seeded fixtures in CI
- Optional 2FA

## 13b. Hardening slice completed (2026-08-12)

- [x] Collections automation cron (`/api/cron/collections`) + default sequence seed
- [x] Public quote accept/decline (`/quote/[shareId]` + APIs)
- [x] PayFast SaaS checkout / webhook / cancel + billing UI upgrades
- [x] Entitlement enforcement on payment links + collections automation
- [x] Landing rebuild (light financial, Geist)
- [x] Playwright smoke suite (`npm run test:e2e`)
- [x] Postgres rate limiting helper on send/checkout/webhooks
- [x] Sentry instrumentation + structured logger + audit wiring
- [x] Migration `20260812140000_hardening_collections_billing_ratelimit.sql`
---

## 15. Environment variables (names only)

See `apps/web/.env.example`. Critical: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_*`, `TWILIO_*`, `PAYFAST_*`, `SNAPSCAN_*`, `CRON_SECRET`.
