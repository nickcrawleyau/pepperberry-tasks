import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ force_logout_at: new Date().toISOString() })
    .neq('id', session.userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to log out users' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
