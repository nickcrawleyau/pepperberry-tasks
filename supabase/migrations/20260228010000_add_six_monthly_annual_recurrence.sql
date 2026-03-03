-- Migration: Add six_monthly and annual recurrence patterns
-- Created: 2026-02-28
-- Rollback: ALTER TABLE public.tasks DROP CONSTRAINT tasks_recurrence_pattern_check; ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_pattern_check CHECK (recurrence_pattern IN ('daily', 'weekly', 'fortnightly', 'monthly', 'two_monthly', 'quarterly'));

-- UP MIGRATION
ALTER TABLE public.tasks DROP CONSTRAINT tasks_recurrence_pattern_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_pattern_check
  CHECK (recurrence_pattern IN ('daily', 'weekly', 'fortnightly', 'monthly', 'two_monthly', 'quarterly', 'six_monthly', 'annual'));
