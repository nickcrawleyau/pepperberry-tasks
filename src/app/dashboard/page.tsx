import { getSession } from '@/lib/auth';
import { fetchTasks } from '@/lib/tasks';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import TaskList from '@/components/tasks/TaskList';
import DashboardStats from '@/components/dashboard/DashboardStats';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const tasks = await fetchTasks(session);

  // Fetch current user's trade_type for header display
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('trade_type')
    .eq('id', session.userId)
    .single();

  const roleLabel =
    session.role === 'admin'
      ? 'Admin'
      : session.role === 'riding_school'
        ? 'Riding School'
        : currentUser?.trade_type
          ? currentUser.trade_type.charAt(0).toUpperCase() + currentUser.trade_type.slice(1).replace('_', ' ')
          : 'Tradesperson';

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
    <div className="min-h-screen bg-stone-50">
      <KeyboardShortcuts role={session.role} />
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/PBLogo.png" alt="Pepperberry" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
            <div>
              <h1 className="text-base sm:text-lg font-medium text-stone-900">
                🌿 Pepperberry Farm
              </h1>
              <p className="text-xs text-stone-500">Task Board</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-900">{session.name}</p>
              <p className="text-xs text-stone-400">{roleLabel}</p>
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
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-100 transition"
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
          </div>
        )}

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
