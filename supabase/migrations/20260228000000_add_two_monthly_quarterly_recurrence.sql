-- Migration: Add two_monthly and quarterly recurrence patterns
-- Created: 2026-02-28
-- Rollback: ALTER TABLE public.tasks DROP CONSTRAINT tasks_recurrence_pattern_check; ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_pattern_check CHECK (recurrence_pattern IN ('daily', 'weekly', 'fortnightly', 'monthly'));

-- UP MIGRATION
ALTER TABLE public.tasks DROP CONSTRAINT tasks_recurrence_pattern_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_pattern_check
  CHECK (recurrence_pattern IN ('daily', 'weekly', 'fortnightly', 'monthly', 'two_monthly', 'quarterly'));
