import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    updates.name = body.name.trim();
  }
  if (body.role !== undefined) {
    if (!['admin', 'tradesperson', 'riding_school'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    updates.role = body.role;
  }
  if (body.trade_type !== undefined) {
    updates.trade_type = body.trade_type || null;
  }
  if (body.is_active !== undefined) {
    updates.is_active = Boolean(body.is_active);
  }
  if (body.pin !== undefined) {
    if (!/^\d{4}$/.test(body.pin)) {
      return NextResponse.json({ error: 'PIN must be 4 digits' }, { status: 400 });
    }
    updates.pin_hash = await bcrypt.hash(body.pin, 10);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A user with that name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
