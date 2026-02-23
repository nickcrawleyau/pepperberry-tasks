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
  if (body.phone !== undefined) {
    updates.phone = body.phone?.trim() || null;
  }
  if (body.allowed_sections !== undefined) {
    updates.allowed_sections = Array.isArray(body.allowed_sections) ? body.allowed_sections : ['weather', 'cart'];
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

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can manage users' }, { status: 403 });
  }

  const { id } = await params;

  // Prevent deleting yourself
  if (id === session.userId) {
    return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 });
  }

  // Transfer open tasks (not done) to the admin performing the delete
  const { error: transferError } = await supabaseAdmin
    .from('tasks')
    .update({ assigned_to: session.userId })
    .eq('assigned_to', id)
    .neq('status', 'done');

  if (transferError) {
    console.error('Error transferring tasks:', transferError);
    return NextResponse.json({ error: 'Failed to transfer tasks' }, { status: 500 });
  }

  // Nullify assigned_to on completed tasks so the FK doesn't block deletion
  const { error: nullifyError } = await supabaseAdmin
    .from('tasks')
    .update({ assigned_to: null })
    .eq('assigned_to', id)
    .eq('status', 'done');

  if (nullifyError) {
    console.error('Error nullifying completed tasks:', nullifyError);
    return NextResponse.json({ error: 'Failed to update completed tasks' }, { status: 500 });
  }

  // Nullify created_by references by setting them to the admin
  const { error: creatorError } = await supabaseAdmin
    .from('tasks')
    .update({ created_by: session.userId })
    .eq('created_by', id);

  if (creatorError) {
    console.error('Error transferring created tasks:', creatorError);
    return NextResponse.json({ error: 'Failed to transfer created tasks' }, { status: 500 });
  }

  // Delete push subscriptions
  await supabaseAdmin
    .from('push_subscriptions')
    .delete()
    .eq('user_id', id);

  // Delete activity log entries for this user
  await supabaseAdmin
    .from('task_activity')
    .update({ user_id: session.userId })
    .eq('user_id', id);

  // Delete comments by this user
  await supabaseAdmin
    .from('task_comments')
    .update({ user_id: session.userId })
    .eq('user_id', id);

  // Transfer photo ownership to the admin
  await supabaseAdmin
    .from('task_photos')
    .update({ uploaded_by: session.userId })
    .eq('uploaded_by', id);

  // Now delete the user
  const { error: deleteError } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Error deleting user:', deleteError);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
