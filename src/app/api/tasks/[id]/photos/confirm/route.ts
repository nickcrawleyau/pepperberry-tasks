import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const { storagePath } = await request.json();

  if (!storagePath || typeof storagePath !== 'string') {
    return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 });
  }

  if (!storagePath.startsWith(`${id}/`)) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
  }

  // Verify the user has access to this task
  const { data: task } = await supabaseAdmin
    .from('tasks')
    .select('assigned_to, category')
    .eq('id', id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (session.role !== 'admin') {
    if (session.role === 'tradesperson' && task.assigned_to !== session.userId) {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }
    if (session.role === 'riding_school' && task.category !== 'riding_school') {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }
  }

  const { data: photo, error: insertError } = await supabaseAdmin
    .from('task_photos')
    .insert({
      task_id: id,
      storage_path: storagePath,
      uploaded_by: session.userId,
    })
    .select('id, storage_path, uploaded_by, created_at')
    .single();

  if (insertError) {
    await supabaseAdmin.storage.from('task-photos').remove([storagePath]);
    console.error('DB insert error:', insertError);
    return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 });
  }

  return NextResponse.json({
    photo: { ...photo, uploader: { name: session.name } },
  });
}
