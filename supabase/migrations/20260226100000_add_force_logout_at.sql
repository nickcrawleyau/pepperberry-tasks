-- Migration: Add force_logout_at column to users
-- Created: 2026-02-26
-- Rollback: ALTER TABLE public.users DROP COLUMN IF EXISTS force_logout_at;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS force_logout_at TIMESTAMPTZ DEFAULT NULL;
