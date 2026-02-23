import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  const body = await request.json();
  const { name, pin, role, trade_type, phone } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
  }
  if (!role || !['admin', 'tradesperson', 'riding_school'].includes(role)) {
    return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
  }

  const pin_hash = await bcrypt.hash(pin, 10);

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      name: name.trim(),
      pin_hash,
      role,
      trade_type: trade_type || null,
      phone: phone?.trim() || null,
    })
    .select('id, name, role, trade_type, is_active, created_at, phone')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A user with that name already exists' }, { status: 409 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }

  return NextResponse.json({ user }, { status: 201 });
}
