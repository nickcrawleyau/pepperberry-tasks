import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin' && !session.allowedSections?.includes('watering')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('watering_history')
    .select('relay_id, zone_name, event, duration_seconds, recorded_at')
    .gte('recorded_at', sevenDaysAgo)
    .order('recorded_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }

  return NextResponse.json({ history: data || [] });
}
