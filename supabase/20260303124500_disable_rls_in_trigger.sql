-- Ensure the teacher-profile trigger can insert regardless of the invoking
-- user's auth state by temporarily turning off row-level security inside the
-- function.  This is safer than trying to craft a policy that allows "anon"
-- inserts, and it keeps the teachers table protected according to normal
-- policies during regular application use.

create or replace function public.rpc_create_teacher_profile()
returns trigger as $$
declare
  uname text;
begin
  -- disable RLS for the duration of this statement; the function is defined
  -- as security definer so it runs with the privileges of its owner, and the
  -- config change only affects the current transaction.
  perform set_config('row_security', 'off', true);

  uname := coalesce(
    (new.raw_user_meta_data ->> 'username')::text,
    (new.user_metadata     ->> 'username')::text,
    new.email
  );

  insert into public.teachers(id, username, created_at)
  values (new.id, uname, now());

  return new;
exception when others then
  raise notice 'rpc_create_teacher_profile failed: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

-- make sure the auth.users trigger exists and points at the new function
-- older Postgres versions (and Supabase's managed setup) don't support
-- "CREATE TRIGGER IF NOT EXISTS", so we drop it first to avoid syntax
-- errors and then recreate it unconditionally.
DROP TRIGGER IF EXISTS create_teacher_after_signup ON auth.users;
create trigger create_teacher_after_signup
  after insert on auth.users
  for each row
  execute procedure public.rpc_create_teacher_profile();
