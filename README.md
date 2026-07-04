# PortalPass

A modern school management platform — the vibrant, fast, personal
replacement for grey utilities like StudentApp and Bromcom. One codebase,
four portals, one multi-tenant Postgres backend with row-level security.

**🌐 Live app: https://bobbyparnell0109.github.io/PortalPass/**

> Continuing development with Claude Code? **Read `CLAUDE.md`** — it holds
> the full session handbook: infrastructure, credentials, workflows, and
> operational gotchas.

## The four portals

| Portal | Route | Login |
| --- | --- | --- |
| 🎒 **Student app** | `/login` | Pair device with school email once, then 5-digit PIN (demo: `bobby.parnell@springwood.sch.uk`, PIN `12345`) |
| 👪 **Parent portal** | `/parent/login` | `parent@portalpass.demo` / `PortalPass-Demo-2026` |
| 🧑‍🏫 **Teacher portal** | `/staff/login` | `okafor@springwood.sch.uk` / `PortalPass-Demo-2026` |
| 🗂️ **School admin** | `/admin/login` | `admin@springwood.sch.uk` / `PortalPass-Demo-2026` |

## What works today (all live against Supabase)

**Students** — personalised dashboard (next lesson countdown, streaks, live
lunch balance), class-scoped timetable, homework with completion that
persists, grades with teacher feedback and trend chart, attendance calendar,
messaging with teachers (safeguarding-auditable), announcements, lunch
transaction history, full personalisation (dark mode, accent colours, text
size) with the school's brand colour as the default theme.

**Teachers** — their own day's lessons, one-tap class registers, homework
setting that lands in students' apps instantly, whole-class grade entry
grid with per-student feedback.

**Parents** — child dashboard (attendance, grades, homework sorted by
urgency, lunch activity), lunch top-ups that update the child's balance via
a database trigger.

**Admins** — school branding (name + colour rethemes every app), student
enrolment with auto-generated bcrypt PINs, **bulk CSV import** with
validated preview, teacher accounts with issued passwords, PIN resets,
archive/restore, tap-to-schedule timetable builder with school-wide clash
detection, **TimeTabler-style timetable CSV import** (auto-creates unknown
subjects and rooms), subjects & rooms management, registers, announcements.

## Stack

- React 18 + TypeScript (strict) + Vite, Tailwind with a hand-rolled
  shadcn-style kit, recharts, route-level code splitting
- Supabase: Postgres + Auth + RLS. Migrations in `supabase/migrations/`
  (0001–0006, all applied to the live project), demo seed in
  `supabase/seed.sql`
- Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push
- Offline-resilient: every read falls back to the bundled demo dataset if
  the backend is unreachable; admin/teacher writes surface their errors
  instead

## Local development

```bash
npm install
npm run dev        # http://localhost:5173 against the live demo backend
npm run build      # type-check + production build
```

To point at your own Supabase project: copy `.env.example` → `.env`, set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, run the migrations in
order plus `seed.sql`, and disable "Confirm email" under Authentication
(account creation is done by school admins, not self-signup).

## Roadmap to a paying pilot

1. Server-side bulk import (edge function, thousands of students in seconds)
2. School-branded invite/welcome emails (custom SMTP)
3. Self-serve "create your school" tenant onboarding
4. Ops: custom domain, paid Supabase tier (free tier auto-pauses), GDPR &
   safeguarding review — required before real child data enters the system
5. Product: Stripe Checkout top-ups, Supabase Realtime feeds, widget
   dashboard, notification preferences, avatar builder, exam timetables,
   per-lesson attendance, PWA install
