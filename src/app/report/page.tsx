import { getSession, getSessionExpiry } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReportView from '@/components/report/ReportView';
import SessionTimer from '@/components/SessionTimer';
import LogoutButton from '@/components/LogoutButton';
import UnreadBadges from '@/components/UnreadBadges';

export default async function ReportPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin') redirect('/dashboard');

  const sessionExpiry = await getSessionExpiry();

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const [
    { data: allTasks },
    { data: recentActivity },
    { data: users },
    { data: completedRecent },
    { data: recentLogins },
  ] = await Promise.all([
    supabaseAdmin
      .from('tasks')
      .select('id, title, status, priority, area, assigned_to, due_date, completed_at, created_at, assigned_user:users!tasks_assigned_to_fkey(name)')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('task_activity')
      .select('id, task_id, user_id, action, detail, created_at, user:users!task_activity_user_id_fkey(name), task:tasks!task_activity_task_id_fkey(title)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('users')
      .select('id, name, role, trade_type, is_active')
      .eq('is_active', true)
      .order('name'),
    supabaseAdmin
      .from('tasks')
      .select('id, assigned_to, completed_at, assigned_user:users!tasks_assigned_to_fkey(name)')
      .eq('status', 'done')
      .gte('completed_at', fourWeeksAgo.toISOString()),
    supabaseAdmin
      .from('login_history')
      .select('user_id, logged_in_at, latitude, longitude, ip_address, user:users!login_history_user_id_fkey(name)')
      .order('logged_in_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="min-h-screen bg-fw-bg">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-fw-text/50 hover:text-fw-text/80 transition p-2 -m-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <h1 className="text-lg font-medium text-fw-text truncate">Report</h1>
          </div>
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-sm font-medium text-fw-text hidden sm:block">{session.name}</p>
            {sessionExpiry && <SessionTimer expiresAt={sessionExpiry} />}
          </div>
          <UnreadBadges />
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <ReportView
          allTasks={allTasks || []}
          recentActivity={recentActivity || []}
          users={users || []}
          completedRecent={completedRecent || []}
          recentLogins={recentLogins || []}
        />
      </main>
    </div>
  );
}
