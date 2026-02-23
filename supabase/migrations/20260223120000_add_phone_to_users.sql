-- Migration: Add phone column to users table
-- Created: 2026-02-23
-- Rollback: ALTER TABLE public.users DROP COLUMN phone;

ALTER TABLE public.users ADD COLUMN phone TEXT;
