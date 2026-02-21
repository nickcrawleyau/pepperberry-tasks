-- Add recurrence support to tasks
alter table public.tasks
  add column recurrence_pattern text,
  add column recurrence_group_id uuid;

-- Constrain recurrence_pattern to valid values
alter table public.tasks
  add constraint tasks_recurrence_pattern_check
  check (recurrence_pattern in ('daily', 'weekly', 'fortnightly', 'monthly'));

-- Index for efficient series lookups
create index idx_tasks_recurrence_group on public.tasks (recurrence_group_id)
  where recurrence_group_id is not null;
