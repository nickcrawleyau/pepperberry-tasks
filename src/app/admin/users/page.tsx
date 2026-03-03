import { getSession, getSessionExpiry } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserManagement from './UserManagement';
import SessionTimer from '@/components/SessionTimer';
import LogoutButton from '@/components/LogoutButton';
import UnreadBadges from '@/components/UnreadBadges';

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin') redirect('/dashboard');

  const sessionExpiry = await getSessionExpiry();

  // Fetch users and login history (last 14 days) in parallel
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [{ data: rawUsers }, { data: loginData }, { data: lastLocations }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, name, role, trade_type, is_active, created_at, last_login, phone, allowed_sections, failed_login_count, failed_logins_since')
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('login_history')
      .select('user_id, logged_in_at')
      .gte('logged_in_at', fourteenDaysAgo.toISOString())
      .order('logged_in_at', { ascending: false }),
    supabaseAdmin
      .from('login_history')
      .select('user_id, latitude, longitude, ip_address, logged_in_at')
      .not('latitude', 'is', null)
      .order('logged_in_at', { ascending: false }),
  ]);

  // Group login counts by user per day (YYYY-MM-DD in AEST)
  const loginsByUser: Record<string, Record<string, number>> = {};
  (loginData || []).forEach((entry: { user_id: string; logged_in_at: string }) => {
    const dateStr = new Date(entry.logged_in_at).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    if (!loginsByUser[entry.user_id]) loginsByUser[entry.user_id] = {};
    loginsByUser[entry.user_id][dateStr] = (loginsByUser[entry.user_id][dateStr] || 0) + 1;
  });

  // Build map of last login location per user (first match = most recent)
  const lastLocationByUser: Record<string, { lat: number; lng: number; ip: string | null; at: string }> = {};
  for (const loc of lastLocations || []) {
    if (!lastLocationByUser[loc.user_id] && loc.latitude != null && loc.longitude != null) {
      lastLocationByUser[loc.user_id] = {
        lat: loc.latitude,
        lng: loc.longitude,
        ip: loc.ip_address,
        at: loc.logged_in_at,
      };
    }
  }

  const users = (rawUsers || []).sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-fw-bg">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-fw-text/50 hover:text-fw-text/80 transition p-2 -m-2"
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
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <h1 className="text-lg font-medium text-fw-text truncate">Manage Users</h1>
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
        <UserManagement initialUsers={users || []} currentUserId={session.userId} loginsByUser={loginsByUser} lastLocationByUser={lastLocationByUser} />
      </main>
    </div>
  );
}
