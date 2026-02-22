import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }

  return NextResponse.json({ users });
}
