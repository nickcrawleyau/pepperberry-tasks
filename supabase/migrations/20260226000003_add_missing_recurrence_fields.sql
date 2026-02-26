-- Add missing recurrence columns (00005 was recorded but columns don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'recurrence_pattern'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence_pattern text;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_pattern_check
      CHECK (recurrence_pattern IN ('daily', 'weekly', 'fortnightly', 'monthly'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'recurrence_group_id'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence_group_id uuid;
    CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_group ON public.tasks (recurrence_group_id)
      WHERE recurrence_group_id IS NOT NULL;
  END IF;
END;
$$;
