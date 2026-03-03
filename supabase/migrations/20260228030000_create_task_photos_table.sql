CREATE TABLE IF NOT EXISTS task_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_photos_task_id ON task_photos(task_id);
