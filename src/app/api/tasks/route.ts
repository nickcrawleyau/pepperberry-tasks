import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { CATEGORIES, LOCATIONS, PRIORITIES, RECURRENCE_PATTERNS, AREAS, MAX_SUBTASKS } from '@/lib/constants';
import { sendPushToUser } from '@/lib/notifications';
import { logActivity, logActivityBatch } from '@/lib/activity';

function generateDueDates(
  pattern: string,
  start: string,
  end: string
): string[] {
  const dates: string[] = [];
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  while (current <= endDate && dates.length < 365) {
    dates.push(current.toISOString().split('T')[0]);

    switch (pattern) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'fortnightly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'two_monthly':
        current.setMonth(current.getMonth() + 2);
        break;
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'six_monthly':
        current.setMonth(current.getMonth() + 6);
        break;
      case 'annual':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return dates;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('new_job')) {
    return NextResponse.json({ error: 'Not authorized to create tasks' }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    priority,
    category,
    location,
    area,
    assigned_to,
    due_date,
    recurrence_pattern,
    recurrence_start,
    recurrence_end,
    subtasks,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (category && !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }
  if (location && !LOCATIONS.includes(location)) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }
  if (priority && !PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  }
  if (area && !AREAS.includes(area)) {
    return NextResponse.json({ error: 'Invalid area' }, { status: 400 });
  }
  if (subtasks && (!Array.isArray(subtasks) || subtasks.length > MAX_SUBTASKS)) {
    return NextResponse.json({ error: `Maximum ${MAX_SUBTASKS} sub-tasks allowed` }, { status: 400 });
  }

  // Repeating task
  if (recurrence_pattern) {
    if (!RECURRENCE_PATTERNS.includes(recurrence_pattern)) {
      return NextResponse.json({ error: 'Invalid recurrence pattern' }, { status: 400 });
    }
    if (!recurrence_start || !recurrence_end) {
      return NextResponse.json({ error: 'Start and end dates are required for repeating tasks' }, { status: 400 });
    }
    if (recurrence_end < recurrence_start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const dueDates = generateDueDates(recurrence_pattern, recurrence_start, recurrence_end);

    if (dueDates.length === 0) {
      return NextResponse.json({ error: 'No occurrences in the given date range' }, { status: 400 });
    }

    const groupId = crypto.randomUUID();

    const rows = dueDates.map((date) => ({
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || 'medium',
      category: category || 'general',
      location: location || null,
      area: area || null,
      assigned_to: assigned_to || null,
      created_by: session.userId,
      due_date: date,
      recurrence_pattern,
      recurrence_group_id: groupId,
    }));

    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .insert(rows)
      .select('id, due_date')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error creating recurring tasks:', error);
      return NextResponse.json({ error: 'Failed to create tasks' }, { status: 500 });
    }

    // Insert subtasks for each task in the series
    if (tasks && tasks.length > 0 && subtasks && subtasks.length > 0) {
      const validSubtasks = subtasks.filter((s: { title: string }) => s.title?.trim());
      if (validSubtasks.length > 0) {
        const subtaskRows = tasks.flatMap((t) =>
          validSubtasks.map((s: { title: string; sort_order?: number }, i: number) => ({
            task_id: t.id,
            title: s.title.trim(),
            sort_order: s.sort_order ?? i,
          }))
        );
        await supabaseAdmin.from('task_subtasks').insert(subtaskRows);
      }
    }

    // Log activity for all tasks in the series (batch insert)
    if (tasks && tasks.length > 0) {
      const taskIds = tasks.map((t) => t.id);
      logActivityBatch(taskIds, session.userId, 'created', 'Task created');
      if (assigned_to) {
        const { data: assignee } = await supabaseAdmin
          .from('users')
          .select('name')
          .eq('id', assigned_to)
          .single();
        logActivityBatch(taskIds, session.userId, 'assigned', `Assigned to ${assignee?.name || 'someone'}`);
        sendPushToUser(assigned_to, {
          title: 'New tasks assigned',
          body: `${tasks.length} "${title.trim()}" tasks have been assigned to you`,
          url: `/tasks/${tasks[0].id}`,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ task: tasks[0], count: tasks.length }, { status: 201 });
  }

  // One-off task
  const { data: task, error } = await supabaseAdmin
    .from('tasks')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || 'medium',
      category: category || 'general',
      location: location || null,
      area: area || null,
      assigned_to: assigned_to || null,
      created_by: session.userId,
      due_date: due_date || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }

  // Insert subtasks for one-off task
  if (task && subtasks && subtasks.length > 0) {
    const validSubtasks = subtasks.filter((s: { title: string }) => s.title?.trim());
    if (validSubtasks.length > 0) {
      const subtaskRows = validSubtasks.map((s: { title: string; sort_order?: number }, i: number) => ({
        task_id: task.id,
        title: s.title.trim(),
        sort_order: s.sort_order ?? i,
      }));
      await supabaseAdmin.from('task_subtasks').insert(subtaskRows);
    }
  }

  if (task) {
    logActivity(task.id, session.userId, 'created', 'Task created');
    if (assigned_to) {
      const { data: assignee } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', assigned_to)
        .single();
      logActivity(task.id, session.userId, 'assigned', `Assigned to ${assignee?.name || 'someone'}`);
      sendPushToUser(assigned_to, {
        title: 'New task assigned',
        body: `"${title.trim()}" has been assigned to you`,
        url: `/tasks/${task.id}`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ task }, { status: 201 });
}
