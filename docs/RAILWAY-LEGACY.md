# Railway = legacy (not TimelyInvoices 2.0)

**Production host = Netlify (`apps/web`).** Railway is **non-ship** for 2.0.

## Railway config

There is **no** root `railway.json` (the old file only built the frozen Express stack via `npm run build:server` / `npm start`).

TimelyInvoices 2.0 Railway services should use **Root Directory** `/apps/web` and config-as-code path **`/apps/web/railway.json`** (`npm run build` / `npm run start` — Next.js, not Express).

## Why “Deployed” on Railway is misleading

If GitHub is still connected to Railway projects (**timelyinvoices**, **trustworthy-optimism**), every push may rebuild/redeploy that Express app. A green **Deployed** status does **not** mean TimelyInvoices 2.0 shipped.

Ship surface: **Netlify** → `apps/web` (see [`docs/DEPLOY.md`](./DEPLOY.md)).

## How to disconnect (silence legacy deploys)

Pick one:

1. **Per Railway project:** open the project dashboard → disconnect / unlink the GitHub repo (disable auto-deploy) for **timelyinvoices** and **trustworthy-optimism**.
2. **Repo-wide:** GitHub → Settings → Integrations / Installed GitHub Apps → remove or revoke the **Railway** GitHub App for this repository.

Do not treat Railway as production. Do not point `timelyinvoices.app` DNS at Railway.

## Related

- Deploy checklist: [`docs/DEPLOY.md`](./DEPLOY.md)
- Product guide: [`docs/TIMELYINVOICES-2.0.md`](./TIMELYINVOICES-2.0.md)
