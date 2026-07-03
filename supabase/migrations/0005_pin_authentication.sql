-- Per-student PIN authentication. A student's PIN now doubles as their app
-- credential: admin_set_pin stores the bcrypt PIN hash on the profile AND
-- sets the auth password to a PIN-derived secret, so any enrolled student
-- can sign in on their own device with just their email + PIN.
-- (Production hardening: swap for an edge function that mints sessions
-- after PIN verification, plus device binding. GoTrue rate-limits password
-- attempts, which covers brute force for a pilot.)

create or replace function admin_set_pin(target uuid, pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare target_email text;
begin
  if not current_role_is('admin') then
    raise exception 'admins only';
  end if;
  if length(pin) < 4 or length(pin) > 6 or pin !~ '^[0-9]+$' then
    raise exception 'PIN must be 4-6 digits';
  end if;
  select lower(email) into target_email
  from profiles
  where id = target and school_id = current_school_id() and role = 'student';
  if target_email is null then
    raise exception 'student not found in your school';
  end if;
  update profiles
  set pin_hash = crypt(pin, gen_salt('bf')), updated_at = now()
  where id = target;
  update auth.users
  set encrypted_password = crypt('pp-pin:' || pin || ':' || target_email, gen_salt('bf')),
      updated_at = now()
  where id = target;
end;
$$;

-- Bring the seeded demo student onto the same scheme (PIN 12345).
update auth.users
set encrypted_password = crypt(
      'pp-pin:12345:bobby.parnell@springwood.sch.uk',
      gen_salt('bf')
    ),
    updated_at = now()
where id = 'a0000000-0000-4000-8000-000000000001';
