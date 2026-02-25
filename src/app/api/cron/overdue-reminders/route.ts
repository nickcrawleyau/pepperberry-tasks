import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendPushToUser } from '@/lib/notifications';
import { timingSafeEqual } from 'crypto';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!safeCompare(authHeader, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch overdue tasks (due_date < today AND not done)
  const { data: overdueTasks, error } = await supabaseAdmin
    .from('tasks')
    .select('id, title, assigned_to, created_by')
    .lt('due_date', today)
    .neq('status', 'done');

  if (error) {
    console.error('Cron: failed to fetch overdue tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }

  if (!overdueTasks || overdueTasks.length === 0) {
    return NextResponse.json({ ok: true, overdue: 0, notified: 0 });
  }

  // Group by assignee
  const byAssignee = new Map<string, number>();
  for (const t of overdueTasks) {
    if (t.assigned_to) {
      byAssignee.set(t.assigned_to, (byAssignee.get(t.assigned_to) || 0) + 1);
    }
  }

  // Notify each assignee
  const notifications: Promise<void>[] = [];

  byAssignee.forEach((count, userId) => {
    notifications.push(
      sendPushToUser(userId, {
        title: 'Overdue tasks',
        body: `You have ${count} overdue task${count !== 1 ? 's' : ''} that need attention`,
        url: '/dashboard',
      })
    );
  });

  // Notify all admins with total count
  const { data: admins } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true);

  if (admins) {
    for (const admin of admins) {
      // Skip if admin is already notified as an assignee
      if (!byAssignee.has(admin.id)) {
        notifications.push(
          sendPushToUser(admin.id, {
            title: 'Overdue tasks',
            body: `${overdueTasks.length} task${overdueTasks.length !== 1 ? 's are' : ' is'} overdue across the property`,
            url: '/dashboard',
          })
        );
      }
    }
  }

  await Promise.allSettled(notifications);

  return NextResponse.json({
    ok: true,
    overdue: overdueTasks.length,
    notified: byAssignee.size + (admins?.filter((a) => !byAssignee.has(a.id)).length || 0),
  });
}
