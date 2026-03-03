-- Migration: Create logbook-photos storage bucket
-- Created: 2026-03-01
-- Rollback: DELETE FROM storage.buckets WHERE id = 'logbook-photos';

INSERT INTO storage.buckets (id, name, public)
VALUES ('logbook-photos', 'logbook-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to logbook photos
CREATE POLICY "Public read access for logbook photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logbook-photos');
