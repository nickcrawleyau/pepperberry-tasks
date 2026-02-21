import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { CATEGORIES, LOCATIONS, PRIORITIES, RECURRENCE_PATTERNS } from '@/lib/constants';

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
    }
  }

  return dates;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can create tasks' }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    description,
    priority,
    category,
    location,
    assigned_to,
    due_date,
    recurrence_pattern,
    recurrence_start,
    recurrence_end,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (!category || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
  }
  if (!location || !LOCATIONS.includes(location)) {
    return NextResponse.json({ error: 'Valid location is required' }, { status: 400 });
  }
  if (priority && !PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
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
      category,
      location,
      assigned_to: assigned_to || null,
      created_by: session.userId,
      due_date: date,
      recurrence_pattern,
      recurrence_group_id: groupId,
    }));

    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .insert(rows)
      .select('id')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error creating recurring tasks:', error);
      return NextResponse.json({ error: 'Failed to create tasks' }, { status: 500 });
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
      category,
      location,
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

  return NextResponse.json({ task }, { status: 201 });
}
