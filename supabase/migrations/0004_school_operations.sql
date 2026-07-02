-- School operations: everything an admin needs to run their school from
-- the PortalPass admin system — branding, roster management, timetabling.

-- Admins manage their own school record (name, colours, hours, dates).
create policy school_admin_update on schools for update
  using (id = current_school_id() and current_role_is('admin'));

-- Admins create and maintain people in their school. The auth.users row is
-- created client-side via a secondary signUp (or an invite email in
-- production); the admin then attaches the profile.
create policy profile_admin_insert on profiles for insert
  with check (school_id = current_school_id() and current_role_is('admin'));
create policy profile_admin_update on profiles for update
  using (school_id = current_school_id() and current_role_is('admin'));

create policy staff_admin_write on staff for all
  using (school_id = current_school_id() and current_role_is('admin'))
  with check (school_id = current_school_id() and current_role_is('admin'));

create policy parent_students_admin_write on parent_students for all
  using (current_role_is('admin'))
  with check (current_role_is('admin'));

-- Timetable building blocks.
create policy subjects_admin_write on subjects for all
  using (school_id = current_school_id() and current_role_is('admin'))
  with check (school_id = current_school_id() and current_role_is('admin'));
create policy rooms_admin_write on rooms for all
  using (school_id = current_school_id() and current_role_is('admin'))
  with check (school_id = current_school_id() and current_role_is('admin'));
create policy lessons_admin_write on lessons for all
  using (school_id = current_school_id() and current_role_is('admin'))
  with check (school_id = current_school_id() and current_role_is('admin'));
create policy enrolments_admin_write on lesson_enrolments for all
  using (current_role_is('admin'))
  with check (current_role_is('admin'));

-- Events and announcements were already staff-writable; add calendar too.
create policy events_staff_write on calendar_events for all
  using (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  with check (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')));

-- Admins set or reset a student's PIN (e.g. on enrolment or when forgotten).
create or replace function admin_set_pin(target uuid, pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not current_role_is('admin') then
    raise exception 'admins only';
  end if;
  if length(pin) < 4 or length(pin) > 6 or pin !~ '^[0-9]+$' then
    raise exception 'PIN must be 4-6 digits';
  end if;
  update profiles
  set pin_hash = crypt(pin, gen_salt('bf')), updated_at = now()
  where id = target and school_id = current_school_id() and role = 'student';
  if not found then
    raise exception 'student not found in your school';
  end if;
end;
$$;
