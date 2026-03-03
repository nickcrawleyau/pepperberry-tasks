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

/**
 * Log activity for multiple tasks at once. Fire-and-forget.
 */
export function logActivityBatch(
  taskIds: string[],
  userId: string,
  action: string,
  detail: string
) {
  if (taskIds.length === 0) return;
  const rows = taskIds.map((taskId) => ({
    task_id: taskId,
    user_id: userId,
    action,
    detail,
  }));
  supabaseAdmin
    .from('task_activity')
    .insert(rows)
    .then(({ error }) => {
      if (error) console.error('Failed to batch log activity:', error);
    });
}
