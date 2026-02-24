import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const hasChat = session.role === 'admin' || session.allowedSections?.includes('chat');
  if (!hasChat) {
    return NextResponse.json({ board: 0, dm: 0 });
  }

  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('board_last_seen_at, dm_last_seen_at')
    .eq('id', session.userId)
    .single();

  if (!userData) {
    return NextResponse.json({ board: 0, dm: 0 });
  }

  const [{ count: boardCount }, { count: dmCount }] = await Promise.all([
    supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', userData.board_last_seen_at),
    supabaseAdmin
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', session.userId)
      .gt('created_at', userData.dm_last_seen_at),
  ]);

  return NextResponse.json({ board: boardCount || 0, dm: dmCount || 0 });
}
