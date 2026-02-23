import { getSession, getSessionExpiry } from '@/lib/auth';
import { fetchTasks } from '@/lib/tasks';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import TaskList from '@/components/tasks/TaskList';
import DashboardStats from '@/components/dashboard/DashboardStats';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import SessionTimer from '@/components/SessionTimer';

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

  const openCount = tasks.filter((t) => t.status !== 'done').length;
  const greeting =
    session.role === 'admin'
      ? `${openCount} open job${openCount !== 1 ? 's' : ''}`
      : `${openCount} job${openCount !== 1 ? 's' : ''} for you`;

  return (
    <div className="min-h-screen bg-stone-100">
      <KeyboardShortcuts role={session.role} />
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <img src="/PBLogo.png" alt="Pepperberry" className="w-9 h-9 sm:w-11 sm:h-11 object-contain" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-900">{session.name}</p>
              {sessionExpiry && <SessionTimer expiresAt={sessionExpiry} />}
            </div>
            <PushNotificationPrompt />
            <LogoutButton />
          </div>
        </div>
        {/* Navigation buttons */}
        <div className="max-w-2xl mx-auto px-5 pb-3 flex items-center gap-2 flex-wrap">
          {session.role === 'admin' && (
            <>
              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 active:bg-amber-700 transition"
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
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
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
            </>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
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
          <Link
            href="/weather"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
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
          <Link
            href="/shopping"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
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
            Cart
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">

        {/* Summary stats (admin only) */}
        {session.role === 'admin' && <DashboardStats tasks={tasks} />}

        {/* Task count */}
        <p className="text-sm text-stone-500 mb-4">{greeting}</p>

        {/* Task list with role-aware filters and sorting */}
        <TaskList tasks={tasks} role={session.role} users={users} />
      </main>
    </div>
  );
}
