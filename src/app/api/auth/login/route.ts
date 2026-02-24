import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSession, COOKIE_NAME } from '@/lib/auth';
import { sendPushToUser } from '@/lib/notifications';

// Rate limiting: 3 failed attempts then 30-min lockout per IP
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();

  // Check rate limit
  const entry = failedAttempts.get(ip);
  if (entry) {
    if (entry.lockedUntil > now) {
      const minsLeft = Math.ceil((entry.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${minsLeft} min` },
        { status: 429 }
      );
    }
    if (entry.lockedUntil <= now && entry.count >= MAX_ATTEMPTS) {
      failedAttempts.delete(ip);
    }
  }

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
    .select('id, name, role, pin_hash, is_active, must_set_pin, allowed_sections')
    .eq('name', name)
    .single();

  if (error || !user) {
    recordFailure(ip, now);
    const entry2 = failedAttempts.get(ip);
    if (entry2 && entry2.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!user.is_active) {
    return NextResponse.json({ error: 'Account is disabled' }, { status: 403 });
  }

  // Verify PIN — pgcrypto bf and bcryptjs use the same bcrypt format
  const pinValid = await bcrypt.compare(pin, user.pin_hash);

  if (!pinValid) {
    recordFailure(ip, now);
    const entry2 = failedAttempts.get(ip);
    if (entry2 && entry2.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Successful login — clear failures
  failedAttempts.delete(ip);

  // Record last login time + login history
  const loginTime = new Date().toISOString();
  await Promise.all([
    supabaseAdmin.from('users').update({ last_login: loginTime }).eq('id', user.id),
    supabaseAdmin.from('login_history').insert({ user_id: user.id, logged_in_at: loginTime }),
  ]);

  // Notify Nick when someone logs in (don't block on it)
  notifyNickOfLogin(user.name).catch(() => {});

  // Create JWT session
  const token = await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
    mustSetPin: user.must_set_pin ?? false,
    allowedSections: user.allowed_sections ?? ['weather', 'cart'],
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
    must_set_pin: user.must_set_pin ?? false,
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}

function recordFailure(ip: string, now: number) {
  const entry = failedAttempts.get(ip);
  const count = (entry?.count ?? 0) + 1;
  failedAttempts.set(ip, {
    count,
    lockedUntil: count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0,
  });
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
