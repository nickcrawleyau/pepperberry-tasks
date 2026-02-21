-- Ensure pgcrypto is available in the extensions schema
create extension if not exists pgcrypto with schema extensions;

-- Function to verify a user's PIN against their stored hash
create or replace function public.verify_pin(user_name text, input_pin text)
returns boolean as $$
  select exists (
    select 1 from public.users
    where name = user_name
      and pin_hash = extensions.crypt(input_pin, pin_hash)
      and is_active = true
  );
$$ language sql security definer;
