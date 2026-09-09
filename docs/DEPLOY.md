# TimelyInvoices 2.0 — Deploy checklist

Ship surface: **`apps/web` only** (Next.js on Netlify). Legacy root `src/` + `client/` and `railway.json` are frozen — do not use for 2.0.

Canonical product docs: [`docs/TIMELYINVOICES-2.0.md`](./TIMELYINVOICES-2.0.md). Env names: [`apps/web/.env.example`](../apps/web/.env.example).

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

**Optional**

- `GROQ_API_KEY` / `ANTHROPIC_API_KEY`
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`

Also add the site URL to Supabase → Authentication → URL Configuration → Redirect URLs.

---

## Supabase migrations (RLS path)

Migrations live under `apps/web/supabase/migrations/` (apply in order):

1. `20260412120000_add_client_company_fields.sql`
2. `20260812130000_rls_and_v2_foundations.sql` — RLS + v2 foundations
3. `20260812140000_hardening_collections_billing_ratelimit.sql` — collections/billing/rate limit
4. `20260909120000_invoice_number_unique_per_owner.sql` — `UNIQUE(owner_id, invoice_number)` partial index

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

Auth (code accepts either; prefer Bearer):

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_SITE/api/cron/recurring"

curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  "https://YOUR_SITE/api/cron/collections"
```

Suggested cadence: daily (or every few hours) for both. Without `CRON_SECRET`, routes return **503**. Wrong secret → **401**.

Vercel cron header (`x-vercel-cron`) is also accepted when `VERCEL` is set; Netlify deploys should use Bearer + external scheduler (cron-job.org, GitHub Actions, etc.).

---

## Staging → production sequence

1. Deploy Netlify **branch/preview** or staging site with staging Supabase project.
2. Apply migrations on staging; set env names above; disable demo login.
3. Run Vitest + manual smoke (auth, invoice, share, pay session fail-closed without secrets).
4. Point production Netlify env + production Supabase; apply migrations; set `NEXT_PUBLIC_APP_URL` to prod HTTPS.
5. Wire external cron to production URLs.
6. Only then switch DNS / announce go-live.

---

## Legacy (do not use for 2.0)

- Root `README.md` / `SETUP.md` / `PROJECT_SUMMARY.md` — Express/Railway era; banners point here.
- `railway.json` — legacy Express deploy; not TimelyInvoices 2.0.
