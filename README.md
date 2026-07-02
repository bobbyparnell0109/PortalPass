# PortalPass

A next-generation school management platform — the vibrant, fast, personal
replacement for grey utilities like StudentApp and Bromcom.

**🌐 Live app: https://bobbyparnell0109.github.io/PortalPass/**

Every push to `main` or the development branch redeploys automatically via
GitHub Actions (`.github/workflows/deploy.yml` → `gh-pages` branch).

Three experiences, one codebase:

| Portal | Route | Who | Highlights |
| --- | --- | --- | --- |
| **Student App** | `/login` → `/app` | Students (11–18) | PIN + biometric login, home dashboard with next-lesson countdown, colour-coded timetable, homework with completion celebrations, grades with trend charts, attendance calendar, lunch balance, messages, achievements, full personalization suite |
| **Parent Portal** | `/parent/login` → `/parent` | Parents | Child overview, grades & attendance monitoring, lunch account top-ups (Stripe-ready) with auto top-up |
| **Admin System** | `/admin/login` → `/admin` | School staff | Dark-sidebar dashboard, student directory with search/filter, bulk attendance marking, announcement publishing, timetable grid with clash detection |

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and pick a portal:

- **Student**: PIN `12345` (or tap the fingerprint for the biometric demo)
- **Parent**: `parent@portalpass.demo` · `PortalPass-Demo-2026`
- **Admin**: `admin@springwood.sch.uk` · `PortalPass-Demo-2026`

## Tech stack

- **React 18 + TypeScript + Vite** — fast dev loop, code-split routes
- **Tailwind CSS** with a shadcn-style component kit (`src/components/ui.tsx`)
- **Recharts** for grade trend visualisations
- **Supabase** (PostgreSQL + Auth + RLS) — full schema in
  `supabase/migrations/0001_initial_schema.sql`
- **react-router-dom** with role-guarded route trees

## Live backend

The app ships wired to a live Supabase project (`PortalPass`, eu-west-2)
seeded with Springwood High School demo data. PIN verification runs through
the `verify_pin` RPC against a bcrypt hash; parent/admin logins are real
Supabase Auth sessions; dashboards, homework (including completion
persistence), grades, timetable, attendance, announcements and the admin
directory all read/write the live database under row-level security. Every
fetcher in `src/lib/api.ts` degrades to the bundled demo dataset if the
backend is unreachable, so the app still works fully offline.

All three migrations are applied to the hosted demo project — messaging,
parent grade access and top-up persistence run fully live.

To point the app at your own project instead:

1. Create a Supabase project and run the migrations in `supabase/migrations/`
   (in order) plus `supabase/seed.sql`.
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.

The schema ships with:

- Multi-tenant design (everything scoped by `school_id`)
- Row-level security: students see only their data, parents only their
  linked children (with per-relationship permission toggles), staff/admin
  scoped to their school
- bcrypt-hashed PINs via `crypt()` with `verify_pin` / `set_pin` RPCs —
  plaintext PINs never touch the database
- Safeguarding-compliant messaging (auditable, never hard-deleted)
- Lunch accounts with Stripe payment-intent tracking and auto top-up schedules
- Soft deletes (`is_deleted`) and full audit log

## Personalization (the anti-StudentApp)

Students make the app theirs from **Me → My Account**:

- Light / dark / auto theme
- Six accent colour palettes applied app-wide via CSS variables
- Font size (S/M/L/XL) for accessibility
- Emoji avatar picker
- Achievements and streaks for engagement

## Project layout

```
src/
  components/ui.tsx     shadcn-style primitives (Button, Card, Badge, …)
  lib/                  types, mock data, store (auth/theme), supabase client
  pages/Landing.tsx     portal chooser
  student/              PIN login + 10 student screens
  parent/               login, dashboard, Stripe-ready top-up flow
  admin/                login, dark-sidebar layout + 5 admin screens
supabase/migrations/    full PostgreSQL schema with RLS
```

## Roadmap

- **Phase 2**: drag-and-drop timetable builder, grade entry forms, real-time
  announcements via Supabase channels
- **Phase 3**: Stripe Checkout edge function for live top-ups, homework file
  attachments, avatar builder
- **Phase 4**: widget dashboard arrangement, notification preferences &
  quiet hours, parent weekly digests, PWA wrapper for app stores
