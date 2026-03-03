import { getSession, getSessionExpiry } from '@/lib/auth';
import { fetchTasks } from '@/lib/tasks';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import TaskList from '@/components/tasks/TaskList';
import DashboardStats from '@/components/dashboard/DashboardStats';
import UnreadBadges from '@/components/UnreadBadges';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import SessionTimer from '@/components/SessionTimer';
import ReportProblem from '@/components/ReportProblem';
import TodaysJobsReminder from '@/components/TodaysJobsReminder';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const [tasks, sessionExpiry] = await Promise.all([
    fetchTasks(session),
    getSessionExpiry(),
  ]);

  // Fetch active users for admin filter dropdown
  let users: { id: string; name: string }[] = [];
  if (session.role === 'admin') {
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    users = data || [];
  }

  // Fetch unread chat counts if user has chat access
  const hasChat = session.role === 'admin' || session.allowedSections?.includes('chat');
  let newBoardCount = 0;
  let newDmCount = 0;

  if (hasChat) {
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('board_last_seen_at, dm_last_seen_at')
      .eq('id', session.userId)
      .single();

    if (userData) {
      const [{ count: boardCount }, { count: dmCount }] = await Promise.all([
        supabaseAdmin
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', userData.board_last_seen_at),
        supabaseAdmin
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', session.userId)
          .gt('created_at', userData.dm_last_seen_at),
      ]);
      newBoardCount = boardCount || 0;
      newDmCount = dmCount || 0;
    }
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todaysTasks = tasks.filter(
    (t) => t.status !== 'done' && t.due_date === todayStr && t.assigned_to === session.userId
  );

  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const greeting =
    session.role === 'admin'
      ? `${openCount} open job${openCount !== 1 ? 's' : ''}`
      : `${openCount} job${openCount !== 1 ? 's' : ''} for you`;

  return (
    <div className="min-h-screen bg-fw-bg">
      <KeyboardShortcuts role={session.role} />
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <img src="/PBLogo.png" alt="Pepperberry" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-fw-text">{session.name}</p>
              {sessionExpiry && <SessionTimer expiresAt={sessionExpiry} />}
            </div>
            <UnreadBadges />
            <LogoutButton />
          </div>
        </div>
        {/* Navigation buttons */}
        <div className="max-w-2xl mx-auto px-5 pb-3 flex items-center gap-2 flex-wrap">
          {(session.role === 'admin' || session.allowedSections?.includes('new_job')) && (
              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 active:bg-orange-600 transition shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                New Job
              </Link>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-hover text-white ring-2 ring-fw-accent text-sm font-medium transition shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            Jobs
          </Link>
          {(session.role === 'admin' || session.allowedSections?.includes('cart')) && (
            <Link
              href="/shopping"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              To get
            </Link>
          )}
          {(session.role === 'admin' || session.allowedSections?.includes('chat')) && (
            <Link
              href="/chat"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Messages
            </Link>
          )}
          {(session.role === 'admin' || session.allowedSections?.includes('logbook')) && (
            <Link
              href="/logbook"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              Log Book
            </Link>
          )}
          {(session.role === 'admin' || session.allowedSections?.includes('weather')) && (
            <Link
              href="/weather"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              Weather
            </Link>
          )}
          {(session.role === 'admin' || session.allowedSections?.includes('watering')) && (
            <Link
              href="/watering"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
              Watering
            </Link>
          )}
          {session.role === 'admin' && (
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              Report
            </Link>
          )}
          {session.role === 'admin' && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Users
            </Link>
          )}
          <ReportProblem />
        </div>
      </header>

      <TodaysJobsReminder todaysTasks={todaysTasks} />

      <main className="max-w-2xl mx-auto px-5 py-6">

        {/* Chat notifications */}
        {(newBoardCount > 0 || newDmCount > 0) && (
          <div className="space-y-2 mb-4">
            {newBoardCount > 0 && (
              <Link
                href="/chat?tab=board"
                className="flex items-center justify-between bg-fw-accent/10 border border-fw-accent/30 rounded-xl px-4 py-3 hover:bg-fw-accent/20 transition"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fw-accent">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-fw-text">
                    {newBoardCount} new board message{newBoardCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fw-text/50">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            )}
            {newDmCount > 0 && (
              <Link
                href="/chat?tab=messages"
                className="flex items-center justify-between bg-fw-accent/10 border border-fw-accent/30 rounded-xl px-4 py-3 hover:bg-fw-accent/20 transition"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fw-accent">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="text-sm font-medium text-fw-text">
                    {newDmCount} new direct message{newDmCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fw-text/50">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            )}
          </div>
        )}

        {/* Page title */}
        <h1 className="text-lg font-semibold text-fw-text mb-4">Home</h1>

        {/* Summary stats (admin only) */}
        {session.role === 'admin' && <DashboardStats tasks={tasks} />}

        {/* Task count */}
        <p className="text-sm text-fw-text/50 mb-4">{greeting}</p>

        {/* Task list with role-aware filters and sorting */}
        <TaskList tasks={tasks} role={session.role} users={users} />
      </main>
    </div>
  );
}
