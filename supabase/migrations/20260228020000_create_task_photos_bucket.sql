-- Create the task-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-photos', 'task-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to task photos
CREATE POLICY "Public read access for task photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-photos');
