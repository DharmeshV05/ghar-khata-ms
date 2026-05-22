# GharKhata

Modern household expense, monthly bill book, and credit ledger — built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Supabase** (PostgreSQL + Auth + RLS).

## Features

- Authentication (signup/login) with Supabase Auth
- Multi-user **households** with roles: owner, admin, member, viewer
- Dashboard KPIs, charts (Recharts), due-payment reminders
- Purchases CRUD with units, GST, archive, search, duplicate
- Integrated **calculator** modal (Ctrl+K) with safe math parsing
- Vendors with pending balance rollup
- Partial **payments** and payment history (DB triggers)
- Reports: PDF, Excel, printable statements
- Monthly summary cron (Vercel)
- PWA manifest + basic service worker
- JSON backup export / partial import
- In-memory rate limits on export/cron/backup routes

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL editor.
3. Enable Email auth; add your site URL under Authentication → URL configuration.

### 2. Environment

Copy [`.env.local.example`](.env.local.example) to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy (Vercel)

- Set the same env vars in the Vercel project.
- `vercel.json` schedules monthly summary upserts (`/api/cron/monthly-summaries`) — call with header `Authorization: Bearer <CRON_SECRET>`.

## Scripts

| Command        | Description        |
|----------------|--------------------|
| `npm run dev`  | Development server |
| `npm run build`| Production build   |
| `npm run lint` | ESLint             |
| `npm test`     | Vitest (calculator)|

## Project structure

- `app/(marketing)` — landing
- `app/(auth)` — login, signup
- `app/(dashboard)` — dashboard, purchases, vendors, reports, settings
- `app/onboarding` — create household
- `lib/actions` — Server Actions (CRUD)
- `lib/supabase` — SSR/browser/service clients
- `supabase/migrations` — database schema + RLS

## PWA icons

Add `public/icon-192.png` and `public/icon-512.png` for install prompts (referenced in `manifest.json`).

## License

Private / your household use. Extend toward SaaS as needed.
