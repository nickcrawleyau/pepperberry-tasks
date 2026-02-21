-- ===========================================
-- TASK ACTIVITY LOG TABLE
-- ===========================================
create table public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id),
  action text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index idx_task_activity_task_id on public.task_activity (task_id);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
alter table public.task_activity enable row level security;

-- All operations go through supabaseAdmin (service role), which bypasses RLS.
