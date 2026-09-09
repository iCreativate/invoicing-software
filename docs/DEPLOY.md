# TimelyInvoices 2.0 — Deploy checklist

**Production host = Netlify (`apps/web`).** That is the only ship surface for TimelyInvoices 2.0.

Ship surface: **`apps/web` only** (Next.js on Netlify). Legacy root `src/` + `client/` and `railway.json` are frozen — do not use for 2.0.

Canonical product docs: [`docs/TIMELYINVOICES-2.0.md`](./TIMELYINVOICES-2.0.md). Env names: [`apps/web/.env.example`](../apps/web/.env.example). Railway context: [`docs/RAILWAY-LEGACY.md`](./RAILWAY-LEGACY.md).

**Do not put secret values in this file.** Names only.

---

## Go / no-go

| Gate | Staging | Production |
|------|---------|------------|
| `apps/web` builds (`npm run build`) | Required | Required |
| Vitest green (`npm run test`) | Required | Required |
| Supabase migrations applied (see below) | Required | Required |
| RLS validated (anon cannot read other tenants) | Required | Required |
| `NEXT_PUBLIC_APP_URL` = real HTTPS origin (no localhost) | Required | Required |
| `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=0` (or unset) | Required | Required |
| `CRON_SECRET` set + external scheduler hitting cron routes | Recommended | Required for recurring/collections |
| PayFast / SnapScan secrets | Optional (routes fail closed) | Required only if accepting live payments |
| Custom DNS / HTTPS | Optional | Required for brand domain |
| Force-push / rewrite history | Never | Never |

**Current expectation:** closer to **staging-GO** after this finalize pass; **NO-GO for production** until John sets secrets, applies RLS/migrations on the remote Supabase project, and confirms DNS.

---

## Netlify

- Root `netlify.toml`: `base = "apps/web"`, `command = npm run build`, plugin `@netlify/plugin-nextjs`.
- **Do not** add Netlify Scheduled Functions that conflict with the Next plugin unless verified against current `@netlify/plugin-nextjs` docs. Prefer an **external cron** (below).

### Environment variables (names only)

**Required**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (HTTPS site URL, no trailing slash)
- `CRON_SECRET` (if using cron routes)

**Strongly recommended**

- `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=0`
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM`

**Payments (fail closed if missing)**

- `PAYFAST_MERCHANT_ID` / `PAYFAST_MERCHANT_KEY` / `PAYFAST_PASSPHRASE` / `PAYFAST_SANDBOX`
- `SNAPSCAN_SNAPCODE` / `SNAPSCAN_WEBHOOK_AUTH_KEY`

**Platform EFT + crew (names only; set values in Netlify)**

- `TIMELY_CREW_EMAILS`
- `TIMELY_EFT_BANK_NAME` / `TIMELY_EFT_ACCOUNT_NAME` / `TIMELY_EFT_ACCOUNT_NUMBER` / `TIMELY_EFT_BRANCH_CODE` / `TIMELY_EFT_ACCOUNT_TYPE`

**Optional**

- `GROQ_API_KEY` / `ANTHROPIC_API_KEY`
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`

Also add the site URL to Supabase → Authentication → URL Configuration → Redirect URLs.

---

## Railway GitHub deploy statuses are misleading / legacy

Railway project dashboards (e.g. **timelyinvoices**, **trustworthy-optimism**) may show **“Deployed”** after GitHub pushes. **That status is not TimelyInvoices 2.0.**

- Root `railway.json` builds/starts the **frozen Express** app (`npm run build:server` / `npm start`), not `apps/web`.
- Do **not** treat a Railway “Deployed” badge as evidence that 2.0 shipped.
- See [`docs/RAILWAY-LEGACY.md`](./RAILWAY-LEGACY.md).

**To silence misleading deploys:**

1. In each Railway project dashboard (**timelyinvoices** and **trustworthy-optimism**): disconnect GitHub deploy (unlink the repo / disable auto-deploy), **or**
2. Remove the Railway GitHub App from this repository’s GitHub settings (Integrations / Installed GitHub Apps).

Either stops Railway from rebuilding the legacy Express stack on every push.

---

## DNS for `timelyinvoices.app` (currently NXDOMAIN)

Exact clicks for John:

1. **Confirm the domain is registered** at the registrar (ownership / renewal OK).
2. **Netlify → Domain management → Add domain** `timelyinvoices.app` (and `www.timelyinvoices.app` if desired).
3. **Copy Netlify’s DNS instructions** for the domain (usually an apex A/ALIAS to Netlify’s load-balancer IP, and/or a `www` CNAME to `*.netlify.app`).
4. **At the registrar (or Netlify DNS if you delegated nameservers):** create exactly the records Netlify shows.
5. **Wait** until Netlify shows HTTPS provisioned / certificate active.
6. **Set env + Auth:**
   - Netlify: `NEXT_PUBLIC_APP_URL=https://timelyinvoices.app` (no trailing slash)
   - Supabase → Authentication → URL Configuration → Redirect URLs: add `https://timelyinvoices.app/**` (and www if used)

Until DNS resolves, use the Netlify site URL (`*.netlify.app`) for `NEXT_PUBLIC_APP_URL`, Supabase redirects, and cron targets.

---

## Supabase migrations (RLS path)

Migrations live under `apps/web/supabase/migrations/` (apply in order):

1. `20260412120000_add_client_company_fields.sql`
2. `20260812130000_rls_and_v2_foundations.sql` — RLS + v2 foundations
3. `20260812140000_hardening_collections_billing_ratelimit.sql` — collections/billing/rate limit
4. `20260909120000_invoice_number_unique_per_owner.sql` — `UNIQUE(owner_id, invoice_number)` partial index
5. `20260909160000_eft_claims_and_crew_admin.sql` — EFT claims, crew audit log, account suspend/terminate flags

**Do not** run `apps/web/supabase/fix-rls-inserts.sql` against any remote DB from automation.

### Apply commands (John / operator)

Via Supabase SQL editor (paste each file in order), or CLI if linked:

```bash
cd "apps/web"
# If using Supabase CLI linked to the project:
npx supabase db push
# Or apply a single file in the dashboard SQL editor from:
#   supabase/migrations/<timestamp>_*.sql
```

After apply: smoke-test login, create invoice, public share link, and confirm RLS (second user cannot see first user’s clients/invoices).

If `invoices_owner_invoice_number_uidx` fails, resolve duplicate `(owner_id, invoice_number)` rows, then re-apply that migration.

---

## Cron (external scheduler)

Routes (both require `CRON_SECRET`):

- `GET /api/cron/recurring`
- `GET /api/cron/collections`

**Site URL:** use the **Netlify site URL** (`https://YOUR_SITE.netlify.app`) until `timelyinvoices.app` DNS + HTTPS work; then switch to `https://timelyinvoices.app`.

Auth (code accepts either; prefer Bearer):

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_NETLIFY_OR_CUSTOM_ORIGIN/api/cron/recurring"

curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_NETLIFY_OR_CUSTOM_ORIGIN/api/cron/collections"
```

Suggested cadence: daily (or every few hours) for both. Without `CRON_SECRET`, routes return **503**. Wrong secret → **401**.

Vercel cron header (`x-vercel-cron`) is also accepted when `VERCEL` is set; Netlify deploys should use Bearer + external scheduler (cron-job.org, GitHub Actions, etc.).

---

## Staging → production sequence

1. Deploy Netlify **branch/preview** or staging site with staging Supabase project.
2. Apply migrations on staging; set env names above; disable demo login.
3. Run Vitest + manual smoke (auth, invoice, share, pay session fail-closed without secrets).
4. Point production Netlify env + production Supabase; apply migrations; set `NEXT_PUBLIC_APP_URL` to prod HTTPS (Netlify URL until custom domain works).
5. Wire external cron to those production URLs (Bearer + `CRON_SECRET`).
6. Only then switch DNS / announce go-live.

---



## Pay by EFT + Timely crew admin

**Do not put bank account numbers or secrets in git.** Configure on Netlify (and local `.env.local`) only.

| Env | Purpose |
|-----|---------|
| `TIMELY_CREW_EMAILS` | Comma-separated crew emails allowed to open `/crew` (case-insensitive). Example: `john@icreativate.co.za` |
| `TIMELY_EFT_BANK_NAME` | Bank name shown on Settings → Billing |
| `TIMELY_EFT_ACCOUNT_NAME` | Account name on the bank account. Example: `Timely Invoices`. If this equals Timely Invoices, Billing shows that name only (no “Trading as” split); otherwise UI appends “· Trading as Timely Invoices”. |
| `TIMELY_EFT_ACCOUNT_NUMBER` | Account number |
| `TIMELY_EFT_BRANCH_CODE` | Branch code |
| `TIMELY_EFT_ACCOUNT_TYPE` | e.g. Savings / Cheque |

Customer flow: Settings → Billing → Pay by EFT → transfer with reference `TI-{shortId}` → “I’ve paid” creates a pending `eft_payment_claims` row. Crew approves/rejects in `/crew`.

Soft account actions (suspend / reinstate / terminate) set `company_profiles.account_status` (+ timestamps). Middleware redirects suspended/terminated owners away from app routes to `/settings/billing` (billing + `/crew` remain reachable).

Apply migration `20260909160000_eft_claims_and_crew_admin.sql` before enabling these features in production.

## Legacy (do not use for 2.0)

- Root `README.md` / `SETUP.md` / `PROJECT_SUMMARY.md` — Express/Railway era; banners point here.
- `railway.json` — legacy Express deploy; not TimelyInvoices 2.0. Details: [`docs/RAILWAY-LEGACY.md`](./RAILWAY-LEGACY.md).
