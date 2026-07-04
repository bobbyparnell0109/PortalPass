-- Server-side bulk import support. The bulk-import edge function runs with
-- the service role: it creates auth users through the GoTrue admin API and
-- inserts profile/student rows directly (service role bypasses RLS). The
-- one thing it cannot do from JavaScript is bcrypt the PIN the same way
-- admin_set_pin does, so this helper hashes a whole batch in one round trip.
--
-- Locked down to the service role only: browser clients (anon/authenticated)
-- cannot call it, so it grants no new powers to end users.

create or replace function service_set_pin_hashes(items jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare item jsonb;
begin
  for item in select jsonb_array_elements(items) loop
    update profiles
    set pin_hash = crypt(item->>'pin', gen_salt('bf')), updated_at = now()
    where id = (item->>'id')::uuid and role = 'student';
  end loop;
end;
$$;

revoke execute on function service_set_pin_hashes(jsonb) from public;
revoke execute on function service_set_pin_hashes(jsonb) from anon;
revoke execute on function service_set_pin_hashes(jsonb) from authenticated;
grant execute on function service_set_pin_hashes(jsonb) to service_role;
