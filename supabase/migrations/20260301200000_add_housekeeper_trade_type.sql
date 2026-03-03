-- Migration: Add housekeeper to trade_type constraint
-- Created: 2026-03-01
-- Rollback: Re-run previous constraint without housekeeper

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_trade_type_check;

ALTER TABLE public.users ADD CONSTRAINT users_trade_type_check CHECK (
  trade_type IS NULL OR trade_type IN (
    'fencer', 'plumber', 'electrician', 'handyman',
    'landscaper', 'housekeeper', 'general', 'animal_carer'
  )
);
