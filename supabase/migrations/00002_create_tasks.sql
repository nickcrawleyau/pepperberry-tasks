-- ===========================================
-- TASKS TABLE
-- ===========================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  category text not null check (
    category in ('maintenance', 'riding_school', 'horses', 'donkeys', 'fencing', 'general')
  ),
  location text not null check (
    location in (
      'workshop', 'house', 'Big_Paddock', 'Front_paddock', 'Back_paddock',
      'driveway', 'riding_arena', 'stables', 'Front_garden', 'Back_garden',
      'VegebtalePatch', 'front_gate'
    )
  ),
  assigned_to uuid references public.users(id),
  created_by uuid not null references public.users(id),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_tasks_assigned_to on public.tasks (assigned_to);
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_category on public.tasks (category);
create index idx_tasks_created_by on public.tasks (created_by);

-- Auto-update updated_at on row change
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.update_updated_at();

-- Auto-set completed_at when status changes to 'done'
create or replace function public.set_completed_at()
returns trigger as $$
begin
  if new.status = 'done' and (old.status is distinct from 'done') then
    new.completed_at = now();
  elsif new.status != 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tasks_set_completed_at
  before update on public.tasks
  for each row
  execute function public.set_completed_at();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
alter table public.tasks enable row level security;

-- Admins: full access to all tasks
create policy "Admins have full access to tasks"
  on public.tasks
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Tradespeople: can only see tasks assigned to them
create policy "Tradespeople can view assigned tasks"
  on public.tasks
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'tradesperson'
    )
    and assigned_to = auth.uid()
  );

-- Tradespeople: can update their assigned tasks (status, comments, photos)
create policy "Tradespeople can update assigned tasks"
  on public.tasks
  for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'tradesperson'
    )
    and assigned_to = auth.uid()
  );

-- Riding school: can see only riding_school category tasks
create policy "Riding school can view riding_school tasks"
  on public.tasks
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'riding_school'
    )
    and category = 'riding_school'
  );

-- Riding school: can update riding_school category tasks
create policy "Riding school can update riding_school tasks"
  on public.tasks
  for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'riding_school'
    )
    and category = 'riding_school'
  );
