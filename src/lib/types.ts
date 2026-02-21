export interface User {
  id: string;
  name: string;
  role: 'admin' | 'tradesperson' | 'riding_school';
  trade_type: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  location: string;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  recurrence_pattern: string | null;
  recurrence_group_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: { name: string } | null;
  created_user?: { name: string } | null;
}

export interface TaskPhoto {
  id: string;
  task_id: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
  uploader?: { name: string } | null;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  detail: string;
  created_at: string;
  user?: { name: string } | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { name: string } | null;
}
