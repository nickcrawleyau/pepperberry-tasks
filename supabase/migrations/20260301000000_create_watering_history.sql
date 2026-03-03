-- Migration: Create watering_history table for tracking zone run events
-- Created: 2026-03-01
-- Rollback: DROP TABLE IF EXISTS public.watering_history;

-- UP MIGRATION

CREATE TABLE IF NOT EXISTS public.watering_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  relay_id INTEGER NOT NULL,
  event TEXT NOT NULL,  -- 'running', 'stopped', 'suspended', 'resumed'
  duration_seconds INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient 7-day lookups per zone
CREATE INDEX idx_watering_history_recorded_at ON public.watering_history (recorded_at DESC);
CREATE INDEX idx_watering_history_relay_id ON public.watering_history (relay_id, recorded_at DESC);

-- Enable RLS
ALTER TABLE public.watering_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (server-side only, no client access needed)
CREATE POLICY "service_role_all" ON public.watering_history
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-cleanup: delete records older than 30 days (run via cron or on insert)
CREATE OR REPLACE FUNCTION cleanup_old_watering_history() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.watering_history WHERE recorded_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cleanup_watering_history
  AFTER INSERT ON public.watering_history
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_watering_history();
