# PortalPass — Claude session handbook

Read this first. It contains everything needed to continue the project:
current state, infrastructure, credentials, workflows, and hard-won
operational knowledge from previous sessions.

## What this project is

PortalPass is a school management platform (MIS) built to replace
Bromcom/StudentApp — the owner intends to **sell it to schools**. Four
portals in one React SPA against one Supabase backend:

| Portal | Route | Users | Login |
| --- | --- | --- | --- |
| Student app (mobile-first) | `/login` → `/app` | Students | Device pairing (school email once) + 5-digit PIN |
| Parent portal | `/parent/login` → `/parent` | Parents | Email + password |
| Teacher portal | `/staff/login` → `/staff` | Teachers | Email + password |
| Admin system | `/admin/login` → `/admin` | Office staff | Email + password |

**Everything below is LIVE and verified working end-to-end**, not scaffolding:
branding (school name + colour rethemes all apps), student enrolment with
bcrypt PINs, bulk CSV student import, teacher accounts with issued
passwords, timetable builder + TimeTabler-style CSV import (auto-creates
subjects/rooms), subjects & rooms management, per-class registers, homework
setting, whole-class grade entry, messaging, announcements, lunch accounts
with balance trigger, PIN resets, archive/restore.

## Live infrastructure

- **Deployed app**: https://bobbyparnell0109.github.io/PortalPass/
- **Repo**: `bobbyparnell0109/PortalPass`, development branch
  `claude/claude-md-continuation-rw20vo` (continues from
  `claude/portalpass-platform-ftxeog`; default branch `main` is stale —
  everything is on the claude branches; no PR has been opened)
- **Deployment**: push to the claude branch → `.github/workflows/deploy.yml`
  builds with `PORTALPASS_BASE=/PortalPass/` and pushes `dist/` to the
  `gh-pages` branch via peaceiris/actions-gh-pages → GitHub Pages serves it.
  SPA deep links work via `404.html` copy. See "Deployment gotchas" below.
- **Backend**: Supabase project **PortalPass**, ref `ghpifoswlustuhgszxmk`,
  region eu-west-2, free tier, on the owner's account
  (org `jtpyetagcegzacbepnyr`).
  - URL: `https://ghpifoswlustuhgszxmk.supabase.co`
  - Publishable key (safe to commit, already hardcoded as default in
    `src/lib/supabase.ts`): `sb_publishable_XrPvmad_eU7CK942_ac_SA__gxLHJJ0`
  - Auth: email confirmations are **disabled** (required for client-side
    account creation to work without email rate limits)
  - **Free-tier warning**: the project auto-pauses after ~1 week of
    inactivity. The app then falls back to demo data. Restore from the
    Supabase dashboard. A paying pilot needs the paid tier.

## Demo credentials (seeded data: "Springwood High School")

- Student: pair device with `bobby.parnell@springwood.sch.uk`, PIN `12345`
- Parent: `parent@portalpass.demo` / `PortalPass-Demo-2026`
- Teacher: `okafor@springwood.sch.uk` / `PortalPass-Demo-2026` (all 10 seeded
  teachers share this password)
- Admin: `admin@springwood.sch.uk` / `PortalPass-Demo-2026`

## Critical workflow: database migrations

`supabase/migrations/0001`–`0006` are ALL APPLIED to the live project.
`0007_bulk_import.sql` is committed but NOT YET APPLIED (waiting on the
owner; needed by the bulk-import edge function). `supabase/seed.sql` was
applied once (demo school).

**The Supabase MCP server's write tools (`apply_migration`, `execute_sql`)
usually fail with "requires approval" in remote sessions.** It worked early
in the first session and never again. The established workflow:

1. Write the migration into `supabase/migrations/NNNN_name.sql` and commit it.
2. Ask the owner to paste it into the Supabase SQL editor (dashboard →
   PortalPass → SQL Editor → Run). They've done this several times and are
   comfortable with it — give them the GitHub file link.
3. Verify the migration landed via the REST API with curl (sign in as a
   demo user against `/auth/v1/token?grant_type=password`, then hit
   `/rest/v1/...` — see "Verification" below). Read-only REST verification
   always works; use it liberally.

RLS lessons learned (don't re-learn these the hard way):

- A table with RLS enabled but **no SELECT policy silently empties any
  policy subquery that references it** (bit us twice: `thread_participants`,
  `parent_students`). Every table referenced inside another table's policy
  needs its own read policy or a `security definer` helper function.
- Self-referencing policies recurse — use `security definer` helpers
  (`is_thread_participant`, `current_role_is`, `current_school_id`,
  `is_parent_of`).
- Supabase pins `search_path`; functions using `crypt`/`gen_salt` need
  `set search_path = public, extensions`.
- Postgres treats NULLs as distinct in unique constraints:
  `unique (student_id, date, lesson_id)` doesn't dedupe AM registrations
  (lesson_id null) — `markAttendance` in api.ts deletes-then-inserts.

## Auth model (unconventional, understand before touching)

- All accounts are Supabase Auth users; `profiles.role` drives RBAC via RLS.
- **Student PIN login**: `admin_set_pin(target, pin)` (security definer)
  stores a bcrypt hash in `profiles.pin_hash` AND sets the auth password to
  the derived secret `pp-pin:<pin>:<lowercased email>`. The client signs in
  with that derived password (`src/lib/api.ts` → `studentPinLogin`).
  Device pairing = the login page stores the student's email in
  localStorage (`pp-paired`) so subsequent visits are PIN-only.
- **Teacher passwords**: `admin_set_staff_password(target, pwd)` writes
  `auth.users.encrypted_password` directly. Admin UI generates memorable
  passwords (`maple-otter-4821`) shown once.
- **Account creation is client-side**: a secondary Supabase client
  (`signUpClient` in api.ts, no session persistence) calls `signUp` with a
  throwaway password so the admin's own session is untouched; then profile +
  role rows are inserted under admin RLS policies. Sign-ups are IP
  rate-limited (~100-150/min sustained) — bulk import runs sequentially with
  350ms gaps. The production-scale path (not yet built) is an edge function
  using the service role.
- GoTrue rejects emails on reserved TLDs (`.demo`, `.test`) at signUp with
  `email_address_invalid`; seeded rows bypass this (inserted via SQL).

## Frontend architecture

- Vite + React 18 + TS strict + Tailwind (dark mode via `class`), hand-rolled
  shadcn-style kit in `src/components/ui.tsx`. Route-level code splitting
  (recharts is isolated in the Grades chunk).
- `src/lib/api.ts` is the single data layer: every read wraps
  `withFallback()` → falls back to `src/lib/mockData.ts` when the backend is
  unreachable, so the app always renders. **Admin/teacher writes do NOT
  fall back silently** — they return `WriteResult {ok, error}` and screens
  surface errors; keep that contract.
- `src/lib/store.tsx`: session (localStorage `pp-session`), theme prefs
  (`pp-prefs`), school branding (school's `primary_color` hex → HSL CSS vars
  as the default accent until a student customises;
  `prefs.accentCustomized` flag). School record cached in `pp-school` for
  pre-auth screens.
- Students see only lessons where `class_group == their form` plus explicit
  `lesson_enrolments` (`fetchMyLessons`); teachers see lessons where
  `teacher_id = uid` (`fetchMyTeachingLessons`); admin sees all.
- CSV parsing: `src/lib/csv.ts` (no deps). Student import template and
  TimeTabler-style timetable import template are embedded in
  `src/admin/Students.tsx` / `src/admin/TimetableBuilder.tsx`.

## Build, test, deploy

- `npm run build` = tsc + vite; must stay clean (strict + noUnusedLocals).
- **Verification methodology** (do this — it caught real bugs every round):
  drive the DEPLOYED site (or local `npm run preview` on :4173) with
  playwright-core (`npm i --no-save playwright-core`, executablePath
  `/opt/pw-browsers/chromium`). In the remote sandbox, Chromium's proxy
  tunnel to external HTTPS is broken — route through Playwright's Node-side
  fetch:
  ```js
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
    proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } })
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true })
  await ctx.route('**://{*.supabase.co,*.github.io}/**', async (route) => {
    for (let a = 0; a < 3; a++) {
      try { return route.fulfill({ response: await ctx.request.fetch(route.request(), { maxRedirects: 0, timeout: 30000 }) }) }
      catch { /* retry */ }
    }
    return route.abort()
  })
  ```
  This relay is sandbox-only; real browsers talk to Supabase directly.
  Clean up any test data you create (archive test students; the roster is
  demo data the owner shows people).
- **Deployment gotchas**: the `pages build and deployment` run fails
  transiently with "Deployment failed, try again later" fairly often.
  Fix: re-run it via the GitHub MCP (`actions_run_trigger`/
  `rerun_workflow_run`), or push an empty commit to `gh-pages` to mint a
  fresh deployment. Confirm by polling the served bundle hash:
  `curl -s https://bobbyparnell0109.github.io/PortalPass/ | grep -o 'index-[A-Za-z0-9_-]*\.js'`
  and compare with `git show origin/gh-pages:index.html`.
- Test emails for fake accounts: use `something.<timestamp>@springwoodhigh.uk`
  (real-format TLD, harmless bounce), never `.demo`/`.test`.

## Working with the owner

Non-technical; away from keyboard between messages. Proven patterns:
- They happily paste SQL migrations into the Supabase SQL editor and flip
  dashboard toggles when given exact click-paths and a GitHub link to the
  file. Make any required action obvious and singular.
- Verify everything yourself in the browser before reporting; report
  outcomes with screenshots (SendUserFile), lead with what works, be honest
  about what doesn't.
- Keep the demo data presentable — it's their sales demo.

## Roadmap (agreed priorities, not yet built)

1. **Server-side bulk import** — BUILT, pending owner deploy. The
   `bulk-import` edge function (`supabase/functions/bulk-import/index.ts`)
   creates accounts with the service role; the client
   (`importStudents` in api.ts) prefers it in 40-row chunks and falls back
   to the client-side sequential path when it isn't deployed (fallback
   verified live 2026-07-04). To go live the owner must (a) paste
   migration 0007 into the SQL editor and (b) paste-deploy the function
   via dashboard (Edge Functions → Deploy new function → name it exactly
   `bulk-import`, keep JWT verification on). MCP deploy is approval-gated.
2. **School-branded invite/welcome emails** (needs custom SMTP — free
   built-in mailer is ~2 emails/hour).
3. **Self-serve school signup** — "create your school" tenant onboarding so
   the owner doesn't hand-provision customers. Schema is already
   multi-tenant (everything scoped by `school_id` + RLS).
4. **Commercial ops for a real pilot**: custom domain, paid Supabase tier
   (no auto-pause), GDPR/safeguarding review (non-optional for UK schools —
   raise it whenever a pilot is discussed).
5. Product backlog from the original spec, still open: Stripe Checkout for
   real lunch top-ups (demo top-up writes the ledger directly under a
   parent RLS policy), Supabase Realtime for announcements/messages,
   drag-and-drop dashboard widgets, notification preferences/quiet hours,
   avatar builder, exam timetables, parent weekly digest, per-lesson
   attendance (currently AM registration), historical grade terms to make
   the progress chart live (it's still static mock data), PWA manifest for
   add-to-home-screen.

## Session history (condensed)

Built in one long session series: scaffold → live Supabase wiring (schema,
seed, RLS) → GitHub Pages deployment + CI → mobile admin drawer → school
operations (branding/roster/timetable) → bulk import + per-student PIN +
subjects/rooms + timetable CSV import → teacher portal (registers, homework,
grades) + staff passwords + PIN reset. Migrations 0001–0006 applied; full
teacher→student→parent loop verified live on 2026-07-04.
