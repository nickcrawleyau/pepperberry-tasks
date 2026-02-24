-- Migration: Create pin_reset_requests table
-- Created: 2026-02-24
-- Rollback: DROP TABLE public.pin_reset_requests;

-- UP MIGRATION

CREATE TABLE public.pin_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  requested_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pin_reset_requests_user ON public.pin_reset_requests (user_id, requested_at DESC);

ALTER TABLE public.pin_reset_requests ENABLE ROW LEVEL SECURITY;
