import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSession, COOKIE_NAME } from '@/lib/auth';

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
    .select('id, name, role, pin_hash, is_active')
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

  // Create JWT session
  const token = await createSession({
    userId: user.id,
    name: user.name,
    role: user.role,
  });

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}
