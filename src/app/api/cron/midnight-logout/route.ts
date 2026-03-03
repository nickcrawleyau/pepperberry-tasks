import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!safeCompare(authHeader, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if it's midnight in Sydney
  const now = new Date();
  const sydneyHour = parseInt(
    now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', hour12: false })
  );

  if (sydneyHour !== 0) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Set force_logout_at on ALL users to force session invalidation
  const { error } = await supabaseAdmin
    .from('users')
    .update({ force_logout_at: now.toISOString() })
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all rows

  if (error) {
    console.error('Cron: failed to set force_logout_at:', error);
    return NextResponse.json({ error: 'Failed to update users' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, forced_logout: true });
}
