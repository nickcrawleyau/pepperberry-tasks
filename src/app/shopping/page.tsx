import { getSession, getSessionExpiry } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ShoppingList from '@/components/shopping/ShoppingList';
import SessionTimer from '@/components/SessionTimer';
import LogoutButton from '@/components/LogoutButton';
import UnreadBadges from '@/components/UnreadBadges';
import { ShoppingItem } from '@/lib/types';

export default async function ShoppingPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin' && !session.allowedSections?.includes('cart')) redirect('/dashboard');

  const sessionExpiry = await getSessionExpiry();

  const [{ data }, { data: adminData }] = await Promise.all([
    supabaseAdmin
      .from('shopping_items')
      .select('*, adder:users!added_by(name), assignee:users!assigned_to(name)')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('role', 'admin')
      .eq('is_active', true)
      .order('name'),
  ]);

  const items: ShoppingItem[] = data || [];
  const admins: { id: string; name: string }[] = adminData || [];

  return (
    <div className="min-h-screen bg-fw-bg">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-fw-text/50 hover:text-fw-text/80 transition p-2 -m-2"
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
            <span className="text-xs">Home</span>
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <h1 className="text-lg font-medium text-fw-text truncate">Need to Buy</h1>
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
        <ShoppingList initialItems={items} admins={admins} isAdmin={session.role === 'admin'} />
      </main>
    </div>
  );
}
