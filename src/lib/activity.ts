import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Log a task activity event. Fire-and-forget — never blocks or throws.
 */
export function logActivity(
  taskId: string,
  userId: string,
  action: string,
  detail: string
) {
  supabaseAdmin
    .from('task_activity')
    .insert({ task_id: taskId, user_id: userId, action, detail })
    .then(({ error }) => {
      if (error) console.error('Failed to log activity:', error);
    });
}
