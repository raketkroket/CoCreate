-- Modify the trigger function to tolerate missing metadata and avoid
-- blowing up the whole sign-up transaction.  Previously a NULL username
-- would cause the insert into `teachers` (which has `username text not null`)
-- to fail, resulting in the client seeing a 500 "Database error saving new user".
--
-- The new function coalesces between the various metadata fields and finally
-- uses the user's email if nothing else is provided.  Any unexpected error is
-- caught and turned into a NOTICE so it doesn't abort the sign-up.

create or replace function public.rpc_create_teacher_profile()
returns trigger as $$
declare
  uname text;
begin
  -- extract username from either raw_user_meta_data (older versions of GoTrue)
  -- or the newer user_metadata field; fall back to email to ensure we never
  -- insert a null value.
  uname := coalesce(
    (new.raw_user_meta_data ->> 'username')::text,
    (new.user_metadata     ->> 'username')::text,
    new.email
  );

  insert into public.teachers(id, username, created_at)
  values (new.id, uname, now());

  return new;
exception when others then
  -- don't let a trigger problem stop the user from being created; log so we
  -- can troubleshoot.
  raise notice 'rpc_create_teacher_profile failed: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer;
