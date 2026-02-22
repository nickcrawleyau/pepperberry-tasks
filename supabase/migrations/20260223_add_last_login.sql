-- Migration: Add last_login column to users
-- Created: 2026-02-23
-- Rollback: ALTER TABLE public.users DROP COLUMN last_login;

-- UP MIGRATION
ALTER TABLE public.users ADD COLUMN last_login TIMESTAMPTZ;
