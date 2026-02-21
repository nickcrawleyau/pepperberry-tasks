import { getSession } from '@/lib/auth';
import { fetchTasks } from '@/lib/tasks';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import TaskList from '@/components/tasks/TaskList';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const tasks = await fetchTasks(session);

  const greeting =
    session.role === 'admin'
      ? `${tasks.filter((t) => t.status !== 'done').length} open tasks`
      : `${tasks.filter((t) => t.status !== 'done').length} tasks for you`;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-stone-800">
              Pepperberry
            </h1>
            <p className="text-xs text-stone-400">Task Board</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-stone-700">
                {session.name}
              </p>
              <p className="text-xs text-stone-400 capitalize">
                {session.role.replace('_', ' ')}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-stone-500">{greeting}</p>
          {session.role === 'admin' && (
            <div className="flex items-center gap-2">
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
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
              <Link
                href="/tasks/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 active:bg-stone-900 transition"
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
            </div>
          )}
        </div>

        <TaskList tasks={tasks} />
      </main>
    </div>
  );
}
