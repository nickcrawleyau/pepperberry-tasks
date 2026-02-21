import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserManagement from './UserManagement';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin') redirect('/dashboard');

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, role, trade_type, is_active, created_at')
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-stone-400 hover:text-stone-600 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-medium text-stone-800">Manage Users</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <UserManagement initialUsers={users || []} />
      </main>
    </div>
  );
}
