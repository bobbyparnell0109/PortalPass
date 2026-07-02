-- Fix RLS gaps found in end-to-end testing: thread_participants and
-- parent_students had RLS enabled with no SELECT policy, so policy
-- subqueries referencing them evaluated to empty and hid rows the user
-- was entitled to (threads listed nothing; parent grade checks failed).

-- Security definer avoids infinite recursion when thread_participants'
-- own policy needs to check membership of the same table.
create or replace function is_thread_participant(tid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from thread_participants
    where thread_id = tid and profile_id = auth.uid()
  )
$$;

create policy tp_read on thread_participants for select
  using (is_thread_participant(thread_id) or current_role_is('admin'));

-- Parents see their own links; students see who is linked to them.
create policy parent_students_read on parent_students for select
  using (
    parent_id = auth.uid()
    or student_id = auth.uid()
    or current_role_is('admin')
  );

-- Rebuild the messaging policies on the helper so they no longer depend
-- on direct subqueries against a RLS-guarded table.
drop policy threads_participant_read on message_threads;
create policy threads_participant_read on message_threads for select
  using (
    is_thread_participant(id)
    or (school_id = current_school_id() and current_role_is('admin'))
  );

drop policy messages_participant_read on messages;
create policy messages_participant_read on messages for select
  using (is_thread_participant(thread_id) or current_role_is('admin'));

drop policy messages_participant_send on messages;
create policy messages_participant_send on messages for insert
  with check (sender_id = auth.uid() and is_thread_participant(thread_id));
