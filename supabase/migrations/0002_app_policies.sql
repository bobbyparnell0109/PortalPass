-- Policies and helpers the client app needs on top of the base schema.

-- Students and parents need to see staff names (timetable, messages) and
-- parents need their children's profiles.
create policy profile_staff_visible on profiles for select
  using (school_id = current_school_id() and role in ('staff', 'admin'));
create policy profile_children_visible on profiles for select
  using (is_parent_of(id));

-- Staff records (titles, subjects, on-site flag) are school-visible.
create policy staff_school_read on staff for select
  using (school_id = current_school_id());

-- Assessment metadata backs the grades screens.
create policy assessments_read on assessments for select
  using (school_id = current_school_id());

-- Students see their own enrolments; staff and admins see all.
create policy enrolments_read on lesson_enrolments for select
  using (
    student_id = auth.uid()
    or current_role_is('staff')
    or current_role_is('admin')
  );

-- Students create their own submission rows when ticking homework off.
create policy hw_sub_student_insert on homework_submissions for insert
  with check (student_id = auth.uid());

-- Demo top-ups: a managing parent may insert a top-up for their child.
-- In production this is done by the Stripe webhook via the service role;
-- this policy exists so the demo flow works end to end without Stripe.
create policy lunch_parent_topup on lunch_transactions for insert
  with check (
    type = 'topup'
    and amount_pence > 0
    and initiated_by = auth.uid()
    and exists (
      select 1 from parent_students
      where parent_id = auth.uid()
        and student_id = lunch_transactions.student_id
        and can_manage_lunch
    )
  );

-- Keep the denormalised balance in sync with the ledger. Security definer
-- because the inserting parent has no UPDATE right on students.
create or replace function apply_lunch_transaction() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update students
  set lunch_balance_pence = lunch_balance_pence + new.amount_pence,
      updated_at = now()
  where id = new.student_id;
  return new;
end;
$$;

create trigger lunch_tx_balance
after insert on lunch_transactions
for each row execute function apply_lunch_transaction();

-- One row per student with live attendance percentage. security_invoker
-- keeps RLS from the underlying tables, so callers only see students they
-- are already allowed to see.
create view students_overview
with (security_invoker = on) as
select
  st.id,
  p.first_name,
  p.last_name,
  p.email,
  p.avatar_emoji,
  st.school_id,
  st.year_group,
  st.form,
  st.house,
  st.status,
  st.lunch_balance_pence,
  st.streak_days,
  coalesce(
    round(
      100.0 * count(ar.id) filter (where ar.status in ('present', 'late'))
        / nullif(count(ar.id), 0),
      1
    ),
    100
  ) as attendance_pct
from students st
join profiles p on p.id = st.id
left join attendance_records ar
  on ar.student_id = st.id and not ar.is_deleted
where not st.is_deleted
group by st.id, p.first_name, p.last_name, p.email, p.avatar_emoji,
  st.school_id, st.year_group, st.form, st.house, st.status,
  st.lunch_balance_pence, st.streak_days;
