import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession, createSession, secondsUntilMidnightAEST, MAX_SESSION_SECONDS, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const { pin } = body;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
  }

  const pin_hash = await bcrypt.hash(pin, 10);

  const { error } = await supabaseAdmin
    .from('users')
    .update({ pin_hash, must_set_pin: false })
    .eq('id', session.userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
  }

  // Re-issue JWT with mustSetPin = false
  const newToken = await createSession({
    userId: session.userId,
    name: session.name,
    role: session.role,
    mustSetPin: false,
  });

  const response = NextResponse.json({ ok: true });

  response.cookies.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.min(secondsUntilMidnightAEST(), MAX_SESSION_SECONDS),
    path: '/',
  });

  return response;
}
