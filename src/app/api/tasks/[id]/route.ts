import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { CATEGORIES, LOCATIONS, PRIORITIES, STATUSES } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // Fetch the task to check permissions
  const { data: task, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select('id, assigned_to, category')
    .eq('id', id)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Non-admins can only update status on tasks they have access to
  if (session.role !== 'admin') {
    if (session.role === 'tradesperson' && task.assigned_to !== session.userId) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }
    if (session.role === 'riding_school' && task.category !== 'riding_school') {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }

    // Non-admins can only change status
    const { status } = body;
    if (!status || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .update({ status })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Admin: full edit
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    updates.title = body.title.trim();
  }
  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }
    updates.priority = body.priority;
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    updates.category = body.category;
  }
  if (body.location !== undefined) {
    if (!LOCATIONS.includes(body.location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }
    updates.location = body.location;
  }
  if (body.assigned_to !== undefined) {
    updates.assigned_to = body.assigned_to || null;
  }
  if (body.due_date !== undefined) {
    updates.due_date = body.due_date || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from('tasks')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete tasks' }, { status: 403 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
