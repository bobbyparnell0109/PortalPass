-- PortalPass initial schema
-- Multi-tenant school management platform: one row in `schools` per school,
-- everything else scoped by school_id with row-level security.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto; -- for PIN hashing via crypt()

-- ---------------------------------------------------------------------------
-- Core tenants and people
-- ---------------------------------------------------------------------------

create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  primary_color text default '#7c3aed',
  school_hours jsonb default '{"start": "08:50", "end": "15:15"}',
  year_start date,
  year_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- One profile per auth.users row; role drives RBAC in RLS policies.
create type user_role as enum ('student', 'parent', 'staff', 'admin');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid not null references schools (id),
  role user_role not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  avatar_emoji text default '🙂',
  avatar_url text,
  -- Student PIN, hashed with bcrypt via crypt(); never store plaintext.
  pin_hash text,
  preferences jsonb not null default '{}', -- theme, accent, font size, widgets
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table students (
  id uuid primary key references profiles (id) on delete cascade,
  school_id uuid not null references schools (id),
  year_group int not null,
  form text not null,
  house text,
  status text not null default 'active' check (status in ('active', 'left', 'moved')),
  lunch_balance_pence int not null default 0,
  streak_days int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table staff (
  id uuid primary key references profiles (id) on delete cascade,
  school_id uuid not null references schools (id),
  title text, -- e.g. "Head of Maths"
  subjects text[] not null default '{}',
  on_site boolean not null default true,
  permissions jsonb not null default '{}', -- granular RBAC flags
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

-- Many-to-many: a parent can have several children, a child several parents.
create table parent_students (
  parent_id uuid not null references profiles (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  -- What this parent may see; admins toggle per relationship.
  can_view_grades boolean not null default true,
  can_view_attendance boolean not null default true,
  can_manage_lunch boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Timetable
-- ---------------------------------------------------------------------------

create table subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table rooms (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  name text not null,
  building text,
  capacity int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  subject_id uuid not null references subjects (id),
  teacher_id uuid not null references staff (id),
  room_id uuid references rooms (id),
  class_group text not null, -- e.g. "10RW" or an option group
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index lessons_school_day_idx on lessons (school_id, day_of_week);

create table lesson_enrolments (
  lesson_id uuid not null references lessons (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  primary key (lesson_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------

create type attendance_status as enum ('present', 'absent', 'late');

create table attendance_records (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  student_id uuid not null references students (id),
  lesson_id uuid references lessons (id), -- null = AM/PM registration
  date date not null,
  status attendance_status not null,
  minutes_late int,
  reason_code text, -- sick / approved / excluded / unauthorised …
  reason text,
  marked_by uuid references staff (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  unique (student_id, date, lesson_id)
);

create index attendance_student_date_idx on attendance_records (student_id, date desc);

-- ---------------------------------------------------------------------------
-- Grades and homework
-- ---------------------------------------------------------------------------

create table assessments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  subject_id uuid not null references subjects (id),
  name text not null,
  term text not null,
  grade_scale text not null default '9-1', -- or A-E, percentage…
  weighting numeric default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table grades (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  assessment_id uuid not null references assessments (id),
  student_id uuid not null references students (id),
  grade text not null,
  score numeric, -- normalised 0-100 for charts
  predicted_grade text,
  feedback text,
  entered_by uuid references staff (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  unique (assessment_id, student_id)
);

create table homework (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  subject_id uuid not null references subjects (id),
  teacher_id uuid not null references staff (id),
  class_group text not null,
  title text not null,
  description text,
  set_date date not null default current_date,
  due_date date not null,
  estimated_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table homework_submissions (
  homework_id uuid not null references homework (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'submitted', 'late', 'missing')),
  completed_at timestamptz,
  attachment_url text,
  teacher_feedback text,
  updated_at timestamptz not null default now(),
  primary key (homework_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Announcements, events, messaging
-- ---------------------------------------------------------------------------

create table announcements (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  title text not null,
  body text not null,
  category text not null check (category in ('academic', 'events', 'important', 'social')),
  audience text not null default 'whole_school', -- or "year:10", "form:10RW"
  pinned boolean not null default false,
  publish_at timestamptz not null default now(),
  created_by uuid references staff (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table calendar_events (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  title text not null,
  description text,
  category text not null check (category in ('exam', 'holiday', 'assembly', 'trip', 'club')),
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table message_threads (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  subject_line text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create table thread_participants (
  thread_id uuid not null references message_threads (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  primary key (thread_id, profile_id)
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references message_threads (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  body text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  -- Safeguarding: messages are never hard-deleted and stay auditable.
  flagged boolean not null default false,
  is_deleted boolean not null default false
);

create index messages_thread_idx on messages (thread_id, sent_at);

-- ---------------------------------------------------------------------------
-- Lunch accounts
-- ---------------------------------------------------------------------------

create table lunch_transactions (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid not null references schools (id),
  student_id uuid not null references students (id),
  amount_pence int not null, -- negative = purchase, positive = top-up/refund
  type text not null check (type in ('purchase', 'topup', 'refund')),
  description text,
  stripe_payment_intent text, -- set on Stripe-backed top-ups
  initiated_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index lunch_tx_student_idx on lunch_transactions (student_id, created_at desc);

create table auto_topups (
  id uuid primary key default uuid_generate_v4(),
  parent_id uuid not null references profiles (id),
  student_id uuid not null references students (id),
  amount_pence int not null,
  schedule text not null default 'weekly_monday_08',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table activity_log (
  id bigint generated always as identity primary key,
  school_id uuid references schools (id),
  actor_id uuid references profiles (id),
  action text not null,
  entity text,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table schools enable row level security;
alter table profiles enable row level security;
alter table students enable row level security;
alter table staff enable row level security;
alter table parent_students enable row level security;
alter table subjects enable row level security;
alter table rooms enable row level security;
alter table lessons enable row level security;
alter table lesson_enrolments enable row level security;
alter table attendance_records enable row level security;
alter table assessments enable row level security;
alter table grades enable row level security;
alter table homework enable row level security;
alter table homework_submissions enable row level security;
alter table announcements enable row level security;
alter table calendar_events enable row level security;
alter table message_threads enable row level security;
alter table thread_participants enable row level security;
alter table messages enable row level security;
alter table lunch_transactions enable row level security;
alter table auto_topups enable row level security;
alter table activity_log enable row level security;

-- Helpers
create or replace function current_school_id() returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from profiles where id = auth.uid()
$$;

create or replace function current_role_is(r user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = r)
$$;

create or replace function is_parent_of(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from parent_students
    where parent_id = auth.uid() and student_id = sid
  )
$$;

-- Everyone can read their own school row
create policy school_read on schools for select
  using (id = current_school_id());

-- Profiles: read own; staff/admin can read all in their school
create policy profile_own on profiles for select
  using (id = auth.uid());
create policy profile_staff_read on profiles for select
  using (
    school_id = current_school_id()
    and (current_role_is('staff') or current_role_is('admin'))
  );
create policy profile_own_update on profiles for update
  using (id = auth.uid());

-- Students: self, their parents, and school staff/admin
create policy student_read on students for select
  using (
    id = auth.uid()
    or is_parent_of(id)
    or (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  );
create policy student_admin_write on students for all
  using (school_id = current_school_id() and current_role_is('admin'));

-- Grades: student sees own, parents see children's (if allowed), staff see school
create policy grades_read on grades for select
  using (
    student_id = auth.uid()
    or (is_parent_of(student_id) and exists (
      select 1 from parent_students
      where parent_id = auth.uid() and student_id = grades.student_id and can_view_grades
    ))
    or (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  );
create policy grades_staff_write on grades for all
  using (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')));

-- Attendance: same shape as grades
create policy attendance_read on attendance_records for select
  using (
    student_id = auth.uid()
    or is_parent_of(student_id)
    or (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  );
create policy attendance_staff_write on attendance_records for all
  using (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')));

-- Announcements: everyone in the school reads published ones; staff manage
create policy announcements_read on announcements for select
  using (school_id = current_school_id() and publish_at <= now() and not is_deleted);
create policy announcements_staff_write on announcements for all
  using (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')));

-- Messages: participants only; admins can audit (safeguarding)
create policy threads_participant_read on message_threads for select
  using (
    exists (select 1 from thread_participants tp where tp.thread_id = id and tp.profile_id = auth.uid())
    or (school_id = current_school_id() and current_role_is('admin'))
  );
create policy messages_participant_read on messages for select
  using (
    exists (select 1 from thread_participants tp where tp.thread_id = messages.thread_id and tp.profile_id = auth.uid())
    or current_role_is('admin')
  );
create policy messages_participant_send on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from thread_participants tp where tp.thread_id = messages.thread_id and tp.profile_id = auth.uid())
  );

-- Lunch: student sees own, managing parents and staff see too; only the
-- backend (service role, via Stripe webhook) inserts top-ups.
create policy lunch_read on lunch_transactions for select
  using (
    student_id = auth.uid()
    or (is_parent_of(student_id) and exists (
      select 1 from parent_students
      where parent_id = auth.uid() and student_id = lunch_transactions.student_id and can_manage_lunch
    ))
    or (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  );

-- Timetable data is school-visible
create policy subjects_read on subjects for select using (school_id = current_school_id());
create policy rooms_read on rooms for select using (school_id = current_school_id());
create policy lessons_read on lessons for select using (school_id = current_school_id());
create policy events_read on calendar_events for select using (school_id = current_school_id());
create policy homework_read on homework for select using (school_id = current_school_id());
create policy hw_sub_read on homework_submissions for select
  using (
    student_id = auth.uid()
    or is_parent_of(student_id)
    or current_role_is('staff') or current_role_is('admin')
  );
create policy hw_sub_student_write on homework_submissions for update
  using (student_id = auth.uid());

-- Admin-only tables
create policy audit_admin_read on activity_log for select
  using (school_id = current_school_id() and current_role_is('admin'));

-- ---------------------------------------------------------------------------
-- PIN verification (called via RPC; never expose pin_hash to clients)
-- ---------------------------------------------------------------------------

create or replace function verify_pin(user_email text, pin text) returns boolean
language plpgsql security definer set search_path = public as $$
declare h text;
begin
  select pin_hash into h from profiles where email = user_email and role = 'student';
  if h is null then return false; end if;
  return h = crypt(pin, h);
end;
$$;

create or replace function set_pin(pin text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(pin) < 4 or length(pin) > 6 or pin !~ '^[0-9]+$' then
    raise exception 'PIN must be 4-6 digits';
  end if;
  update profiles set pin_hash = crypt(pin, gen_salt('bf')), updated_at = now()
  where id = auth.uid();
end;
$$;
