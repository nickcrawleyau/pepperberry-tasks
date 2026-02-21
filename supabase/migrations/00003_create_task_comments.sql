-- ===========================================
-- TASK COMMENTS TABLE
-- ===========================================
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.users(id),
  content text not null,
  created_at timestamptz not null default now()
);

-- Index for fetching comments by task
create index idx_task_comments_task_id on public.task_comments (task_id);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
alter table public.task_comments enable row level security;

-- Admins: full access to all comments
create policy "Admins have full access to comments"
  on public.task_comments
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Tradespeople: can view comments on their assigned tasks
create policy "Tradespeople can view comments on assigned tasks"
  on public.task_comments
  for select
  using (
    exists (
      select 1 from public.tasks t
      join public.users u on u.id = auth.uid()
      where t.id = task_id
        and u.role = 'tradesperson'
        and t.assigned_to = auth.uid()
    )
  );

-- Tradespeople: can add comments to their assigned tasks
create policy "Tradespeople can add comments to assigned tasks"
  on public.task_comments
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      join public.users u on u.id = auth.uid()
      where t.id = task_id
        and u.role = 'tradesperson'
        and t.assigned_to = auth.uid()
    )
  );

-- Riding school: can view comments on riding_school tasks
create policy "Riding school can view comments on riding_school tasks"
  on public.task_comments
  for select
  using (
    exists (
      select 1 from public.tasks t
      join public.users u on u.id = auth.uid()
      where t.id = task_id
        and u.role = 'riding_school'
        and t.category = 'riding_school'
    )
  );

-- Riding school: can add comments to riding_school tasks
create policy "Riding school can add comments to riding_school tasks"
  on public.task_comments
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      join public.users u on u.id = auth.uid()
      where t.id = task_id
        and u.role = 'riding_school'
        and t.category = 'riding_school'
    )
  );
