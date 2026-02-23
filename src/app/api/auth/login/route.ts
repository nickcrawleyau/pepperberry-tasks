import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSession, secondsUntilMidnightAEST, MAX_SESSION_SECONDS, COOKIE_NAME } from '@/lib/auth';
import { sendPushToUser } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, pin } = body;

  if (!name || !pin) {
    return NextResponse.json({ error: 'Name and PIN are required' }, { status: 400 });
  }

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
  }

  // Fetch user including pin_hash (service role bypasses RLS)
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, role, pin_hash, is_active, must_set_pin')
    .eq('name', name)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid name or PIN' }, { status: 401 });
  }

  if (!user.is_active) {
    return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
  }

  // Verify PIN — pgcrypto bf and bcryptjs use the same bcrypt format
  const pinValid = await bcrypt.compare(pin, user.pin_hash);

  if (!pinValid) {
    return NextResponse.json({ error: 'Invalid name or PIN' }, { status: 401 });
  }

  // Record last login time
  await supabaseAdmin
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // Notify Nick when someone logs in (don't block on it)
  notifyNickOfLogin(user.name).catch(() => {});

  // Create JWT session
  const token = await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    mustSetPin: user.must_set_pin ?? false,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
    must_set_pin: user.must_set_pin ?? false,
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.min(secondsUntilMidnightAEST(), MAX_SESSION_SECONDS),
    path: '/',
  });

  return response;
}

async function notifyNickOfLogin(loginName: string) {
  // Find Nick (admin) to notify
  const { data: nick } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('name', 'Nick')
    .eq('role', 'admin')
    .single();

  if (!nick) return;

  // Don't notify Nick about his own login
  if (loginName === 'Nick') return;

  await sendPushToUser(nick.id, {
    title: 'User Login',
    body: `${loginName} just logged in`,
    url: '/admin/users',
  });
}
