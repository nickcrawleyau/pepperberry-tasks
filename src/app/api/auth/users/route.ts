import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('name, role')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }

  return NextResponse.json({ users }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
