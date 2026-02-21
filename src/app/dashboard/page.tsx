import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-stone-800">
              Pepperberry Farm
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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-light text-stone-800 mb-6">
          Welcome back, {session.name}
        </h2>
        <p className="text-sm text-stone-500">
          Tasks and dashboard coming soon.
        </p>
      </main>
    </div>
  );
}
