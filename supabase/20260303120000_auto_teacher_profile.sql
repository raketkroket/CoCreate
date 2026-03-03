-- Automatically create a corresponding `teachers` row whenever a new auth.user
-- is inserted.  This runs inside the database with service-role privileges,
-- so it isn't affected by the `teachers` table's RLS policies and avoids the
-- "not authorized" errors that happen when the frontend tries to insert the
-- row before the user has a valid session (e.g. when email confirmation is
-- required).

-- The trigger pulls the username from the new user's metadata.  The front end
-- already passes `options: { data: { username } }` when calling
-- `supabase.auth.signUp`, which ends up in `auth.users.raw_user_meta_data`.

create or replace function public.rpc_create_teacher_profile()
returns trigger as $$
begin
  insert into public.teachers(id, username, created_at)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'username')::text,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- attach the trigger to auth.users
create trigger create_teacher_after_signup
  after insert on auth.users
  for each row
  execute procedure public.rpc_create_teacher_profile();
