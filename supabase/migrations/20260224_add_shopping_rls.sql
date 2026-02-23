-- Migration: Enable RLS on shopping_items table
-- Created: 2026-02-24
-- Rollback: DROP POLICY IF EXISTS on shopping_items; ALTER TABLE public.shopping_items DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to shopping_items"
  ON public.shopping_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
