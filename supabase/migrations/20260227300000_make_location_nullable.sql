-- Migration: Make location column nullable
-- Created: 2026-02-27

ALTER TABLE public.tasks ALTER COLUMN location DROP NOT NULL;
