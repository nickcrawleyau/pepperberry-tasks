import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { CATEGORIES, LOCATIONS, PRIORITIES, STATUSES, STATUS_LABELS, AREAS, MAX_SUBTASKS } from '@/lib/constants';
import { sendPushToUser, notifyUsersExcluding } from '@/lib/notifications';
import { logActivity } from '@/lib/activity';

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
    .select('id, assigned_to, category, title, created_by, status, priority')
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

    const statusUpdate: Record<string, unknown> = { status };
    if (status === 'done') {
      statusUpdate.completed_at = new Date().toISOString();
    } else if (task.status === 'done') {
      statusUpdate.completed_at = null;
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .update(statusUpdate)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    logActivity(id, session.userId, 'status_changed', `Status changed from ${STATUS_LABELS[task.status] || task.status} to ${STATUS_LABELS[status] || status}`);

    if (task.created_by) {
      sendPushToUser(task.created_by, {
        title: 'Task status updated',
        body: `"${task.title}" is now ${STATUS_LABELS[status] || status}`,
        url: `/tasks/${id}`,
      }).catch(() => {});
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
    if (body.status === 'done') {
      updates.completed_at = new Date().toISOString();
    } else if (task.status === 'done') {
      updates.completed_at = null;
    }
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }
    updates.priority = body.priority;
  }
  if (body.category !== undefined) {
    if (body.category && !CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    updates.category = body.category || 'general';
  }
  if (body.location !== undefined) {
    if (body.location && !LOCATIONS.includes(body.location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }
    updates.location = body.location || null;
  }
  if (body.area !== undefined) {
    if (body.area && !AREAS.includes(body.area)) {
      return NextResponse.json({ error: 'Invalid area' }, { status: 400 });
    }
    updates.area = body.area || null;
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

  // Handle subtask updates if provided
  if (body.subtasks !== undefined && Array.isArray(body.subtasks)) {
    if (body.subtasks.length > MAX_SUBTASKS) {
      return NextResponse.json({ error: `Maximum ${MAX_SUBTASKS} sub-tasks allowed` }, { status: 400 });
    }

    // Delete all existing subtasks and re-insert
    await supabaseAdmin.from('task_subtasks').delete().eq('task_id', id);

    const validSubtasks = body.subtasks.filter((s: { title: string }) => s.title?.trim());
    if (validSubtasks.length > 0) {
      const subtaskRows = validSubtasks.map((s: { title: string; sort_order?: number }, i: number) => ({
        task_id: id,
        title: s.title.trim(),
        sort_order: s.sort_order ?? i,
      }));
      await supabaseAdmin.from('task_subtasks').insert(subtaskRows);
    }
  }

  // Log activity for each changed field
  if (body.status !== undefined && body.status !== task.status) {
    logActivity(id, session.userId, 'status_changed', `Status changed from ${STATUS_LABELS[task.status] || task.status} to ${STATUS_LABELS[body.status] || body.status}`);
  }
  if (body.assigned_to !== undefined && body.assigned_to !== task.assigned_to) {
    if (body.assigned_to) {
      const { data: assignee } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', body.assigned_to)
        .single();
      logActivity(id, session.userId, 'assigned', `Assigned to ${assignee?.name || 'someone'}`);
    } else {
      logActivity(id, session.userId, 'assigned', 'Unassigned');
    }
  }
  if (body.priority !== undefined && body.priority !== task.priority) {
    logActivity(id, session.userId, 'edited', `Priority changed to ${body.priority}`);
  }
  if (body.title !== undefined && body.title.trim() !== task.title) {
    logActivity(id, session.userId, 'edited', 'Title updated');
  }

  // Notify on reassignment
  if (body.assigned_to !== undefined && body.assigned_to !== task.assigned_to && body.assigned_to) {
    sendPushToUser(body.assigned_to, {
      title: 'Task assigned to you',
      body: `"${task.title}" has been assigned to you`,
      url: `/tasks/${id}`,
    }).catch(() => {});
  }

  // Notify on status change
  if (body.status !== undefined && body.status !== task.status) {
    const effectiveAssignee = body.assigned_to !== undefined ? body.assigned_to : task.assigned_to;
    notifyUsersExcluding(
      [effectiveAssignee, task.created_by].filter(Boolean) as string[],
      session.userId,
      {
        title: 'Task status updated',
        body: `"${task.title}" is now ${STATUS_LABELS[body.status] || body.status}`,
        url: `/tasks/${id}`,
      }
    ).catch(() => {});
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

  // Clean up photos from storage before deleting (DB records cascade-delete)
  const { data: taskPhotos } = await supabaseAdmin
    .from('task_photos')
    .select('storage_path')
    .eq('task_id', id);

  if (taskPhotos && taskPhotos.length > 0) {
    await supabaseAdmin.storage
      .from('task-photos')
      .remove(taskPhotos.map((p) => p.storage_path));
  }

  const { error } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
