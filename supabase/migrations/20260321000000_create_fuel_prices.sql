-- Migration: Create fuel_prices table for caching FuelCheck API responses
-- Created: 2026-03-21
-- Rollback: DROP TABLE IF EXISTS public.fuel_prices;

CREATE TABLE IF NOT EXISTS public.fuel_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  station_code TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_brand TEXT NOT NULL,
  suburb TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('U91', 'P98', 'PDL')),
  price NUMERIC NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient history queries (last N fetches per station+fuel_type)
CREATE INDEX idx_fuel_prices_lookup ON public.fuel_prices (station_code, fuel_type, fetched_at DESC);

-- Index for cache freshness check
CREATE INDEX idx_fuel_prices_fetched_at ON public.fuel_prices (fetched_at DESC);

-- No RLS needed — read-only data, access controlled at app level
