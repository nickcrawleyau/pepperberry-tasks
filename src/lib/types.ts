export interface User {
  id: string;
  name: string;
  role: 'admin' | 'tradesperson' | 'riding_school';
  trade_type: string | null;
  is_active: boolean;
  must_set_pin: boolean;
  last_login: string | null;
  phone: string | null;
  allowed_sections: string[] | null;
  board_last_seen_at: string | null;
  dm_last_seen_at: string | null;
  failed_login_count: number;
  failed_logins_since: string | null;
  force_logout_at: string | null;
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
  area: string | null;
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
  subtask_total?: number;
  subtask_done?: number;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
  created_at: string;
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

export interface ShoppingItem {
  id: string;
  title: string;
  category: 'hardware' | 'hay' | 'feed' | 'other';
  added_by: string;
  assigned_to: string | null;
  is_bought: boolean;
  created_at: string;
  adder?: { name: string } | null;
  assignee?: { name: string } | null;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { name: string } | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  sender?: { name: string } | null;
  recipient?: { name: string } | null;
}

export interface Conversation {
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_at: string;
}

export interface LogbookEntry {
  id: string;
  entry_date: string;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: { name: string } | null;
  photos?: LogbookPhoto[];
}

export interface LogbookPhoto {
  id: string;
  entry_id: string;
  storage_path: string;
  uploaded_by: string;
  created_at: string;
  uploader?: { name: string } | null;
}
