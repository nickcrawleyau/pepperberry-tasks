-- Migration: Create logbook_entries and logbook_photos tables
-- Created: 2026-03-01
-- Rollback: DROP TABLE IF EXISTS logbook_photos; DROP TABLE IF EXISTS logbook_entries;

-- logbook_entries table
CREATE TABLE IF NOT EXISTS logbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_logbook_entries_date ON logbook_entries(entry_date DESC);

-- Auto-update updated_at
CREATE TRIGGER set_logbook_entries_updated_at
  BEFORE UPDATE ON logbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON logbook_entries
  FOR ALL USING (true) WITH CHECK (true);

-- logbook_photos table
CREATE TABLE IF NOT EXISTS logbook_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES logbook_entries(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_logbook_photos_entry_id ON logbook_photos(entry_id);

-- Enable RLS
ALTER TABLE logbook_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON logbook_photos
  FOR ALL USING (true) WITH CHECK (true);
