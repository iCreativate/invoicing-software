# TimelyInvoices (Flutter)

Cross-platform mobile client for **TimelyInvoices**. It uses **Supabase Auth** (same project as the web app) and calls your deployed **Next.js `/api/*` routes** with `Authorization: Bearer <access_token>`.

## Prerequisites

- Flutter SDK (stable)
- Running or deployed `apps/web` (Next.js) — the app talks to `API_BASE_URL`
- Supabase URL + anon key (same as web `.env.local`)

## Configure

Pass build-time defines (replace with your values):

```bash
cd apps/mobile/timely_invoices

flutter run \
  --dart-define=API_BASE_URL=https://your-host.example \
  --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

- **Android emulator**: use `http://10.0.2.2:3000` if Next runs on the host at port 3000.
- **iOS simulator**: use `http://127.0.0.1:3000`.
- **Physical device**: use your machine LAN IP or a public HTTPS URL.

## Features (overview)

| Area | Notes |
|------|--------|
| **Dashboard** | Revenue, outstanding, overdue, quick actions |
| **Invoices** | List, create draft, detail, send email/WhatsApp, PDF preview |
| **Clients** | Supabase `clients` table (list + add) |
| **Payments** | `/api/payments` list + analytics |
| **Alerts** | Activity feed + test **local** notifications |
| **Offline** | Hive cache for dashboard + lists when the network fails |
| **Biometric lock** | Optional Face ID / fingerprint after backgrounding (Profile) |
| **Ask Timely** | Floating assistant: live data intents + `/api/ai/chat` stream |

## Push notifications (remote)

Local notifications are wired for demos. For **FCM/APNs**, add `firebase_core` + `firebase_messaging`, place `google-services.json` (Android) and enable push capability (iOS), then register the device token with your backend.

## Backend note

API routes accept **cookie sessions (web)** or **`Authorization: Bearer`** (mobile) via `createSupabaseServerClient(request)` in `apps/web`.
