import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import EditTaskForm from './EditTaskForm';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin') redirect('/dashboard');

  const { id } = await params;

  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !task) notFound();

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, name, role, trade_type')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href={`/tasks/${id}`}
            className="text-stone-500 hover:text-stone-700 transition"
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
          <div className="flex items-center gap-2.5">
            <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            <h1 className="text-lg font-medium text-stone-900">Edit Task</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <EditTaskForm task={task} users={users || []} />
      </main>
    </div>
  );
}
