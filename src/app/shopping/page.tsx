import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ShoppingList from '@/components/shopping/ShoppingList';
import { ShoppingItem } from '@/lib/types';

export default async function ShoppingPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const { data } = await supabaseAdmin
    .from('shopping_items')
    .select('*, adder:users!added_by(name)')
    .order('is_bought', { ascending: true })
    .order('created_at', { ascending: false });

  const items: ShoppingItem[] = data || [];

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
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
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <h1 className="text-lg font-medium text-stone-900">Need to Buy</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <ShoppingList
          initialItems={items}
          userId={session.userId}
          role={session.role}
        />
      </main>
    </div>
  );
}
