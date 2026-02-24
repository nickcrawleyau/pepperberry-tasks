import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendPushToUser } from '@/lib/notifications';

// In-memory rate limit: userId -> last request timestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ ok: true });
    }

    // In-memory rate limit check
    const lastRequest = rateLimitMap.get(userId);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
      return NextResponse.json({ ok: true });
    }

    // Verify user exists and is active
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // DB rate limit check (resilient to server restarts)
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_MS).toISOString();
    const { data: recentRequest } = await supabaseAdmin
      .from('pin_reset_requests')
      .select('id')
      .eq('user_id', userId)
      .gte('requested_at', oneHourAgo)
      .limit(1)
      .single();

    if (recentRequest) {
      rateLimitMap.set(userId, Date.now());
      return NextResponse.json({ ok: true });
    }

    // Insert request
    await supabaseAdmin
      .from('pin_reset_requests')
      .insert({ user_id: userId });

    // Update in-memory rate limit
    rateLimitMap.set(userId, Date.now());

    // Notify all active admins
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (admins && admins.length > 0) {
      await Promise.allSettled(
        admins.map((admin) =>
          sendPushToUser(admin.id, {
            title: 'PIN Reset Request',
            body: `${user.name} has forgotten their PIN and needs a reset.`,
            url: '/admin/users',
          })
        )
      );
    }
  } catch {
    // Silently fail — never leak info
  }

  return NextResponse.json({ ok: true });
}
