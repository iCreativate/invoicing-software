# Railway = legacy (not TimelyInvoices 2.0)

**Production host = Netlify (`apps/web`).** Railway is **non-ship** for 2.0.

## What `railway.json` does

Root `railway.json` cannot carry comments (JSON). It configures a **frozen Express** stack:

- `buildCommand`: `npm run build:server`
- `startCommand`: `npm start`

That is the old root `src/` API — **not** the Next.js app in `apps/web`.

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
