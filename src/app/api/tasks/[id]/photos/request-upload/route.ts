import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { MAX_PHOTOS_PER_TASK } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  const { data: task, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select('id, assigned_to, category')
    .eq('id', id)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (session.role === 'tradesperson' && task.assigned_to !== session.userId) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }
  if (session.role === 'riding_school' && task.category !== 'riding_school') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { count } = await supabaseAdmin
    .from('task_photos')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', id);

  if ((count ?? 0) >= MAX_PHOTOS_PER_TASK) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS_PER_TASK} photos per task` },
      { status: 400 }
    );
  }

  const storagePath = `${id}/${crypto.randomUUID()}.jpg`;

  const { data, error } = await supabaseAdmin.storage
    .from('task-photos')
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error('Failed to create signed upload URL:', JSON.stringify(error));
    return NextResponse.json({ error: 'Failed to prepare upload: ' + (error.message || 'unknown') }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storagePath,
    token: data.token,
  });
}
