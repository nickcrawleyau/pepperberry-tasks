import { getSession } from '@/lib/auth';
import { fetchTasks } from '@/lib/tasks';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import TaskList from '@/components/tasks/TaskList';
import DashboardStats from '@/components/dashboard/DashboardStats';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const tasks = await fetchTasks(session);

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
      ? `${openCount} open task${openCount !== 1 ? 's' : ''}`
      : `${openCount} task${openCount !== 1 ? 's' : ''} for you`;

  return (
    <div className="min-h-screen bg-stone-950">
      <header className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-stone-100">
              Pepperberry
            </h1>
            <p className="text-xs text-stone-500">Task Board</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-200">
                {session.name}
              </p>
              <p className="text-xs text-stone-500 capitalize">
                {session.role.replace('_', ' ')}
              </p>
            </div>
            <PushNotificationPrompt />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        {/* Admin action bar */}
        {session.role === 'admin' && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <Link
              href="/tasks/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 active:bg-amber-700 transition"
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
              New Task
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-700 text-sm font-medium text-stone-300 hover:bg-stone-800 transition"
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
            <a
              href="/api/tasks/export"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-700 text-sm font-medium text-stone-300 hover:bg-stone-800 transition"
              title="Export CSV"
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </a>
          </div>
        )}

        {/* Summary stats (admin only) */}
        {session.role === 'admin' && <DashboardStats tasks={tasks} />}

        {/* Task count */}
        <p className="text-sm text-stone-400 mb-4">{greeting}</p>

        {/* Task list with role-aware filters and sorting */}
        <TaskList tasks={tasks} role={session.role} users={users} />
      </main>
    </div>
  );
}
