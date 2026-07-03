-- Teacher operations: staff run their day in PortalPass — set homework,
-- create assessments and enter grades, give feedback on submissions.
-- Also lets admins issue teacher passwords at creation time.

create policy homework_staff_write on homework for all
  using (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  with check (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')));

create policy assessments_staff_write on assessments for all
  using (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')))
  with check (school_id = current_school_id() and (current_role_is('staff') or current_role_is('admin')));

create policy hw_sub_staff_write on homework_submissions for all
  using (current_role_is('staff') or current_role_is('admin'))
  with check (current_role_is('staff') or current_role_is('admin'));

-- Admin issues (or resets) a staff member's password — shown once in the
-- admin UI, changed by the teacher after first login in production.
create or replace function admin_set_staff_password(target uuid, pwd text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not current_role_is('admin') then
    raise exception 'admins only';
  end if;
  if length(pwd) < 8 then
    raise exception 'password must be at least 8 characters';
  end if;
  if not exists (
    select 1 from profiles
    where id = target and school_id = current_school_id() and role in ('staff', 'admin')
  ) then
    raise exception 'staff member not found in your school';
  end if;
  update auth.users
  set encrypted_password = crypt(pwd, gen_salt('bf')), updated_at = now()
  where id = target;
end;
$$;
