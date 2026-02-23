import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { MAX_PHOTOS_PER_TASK, MAX_PHOTO_SIZE_BYTES } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  // Verify the user has access to this task
  const { data: task, error: fetchError } = await supabaseAdmin
    .from('tasks')
    .select('id, assigned_to, category')
    .eq('id', id)
    .single();

  if (fetchError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Permission check
  if (session.role === 'tradesperson' && task.assigned_to !== session.userId) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }
  if (session.role === 'riding_school' && task.category !== 'riding_school') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  // Check photo count limit
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

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type (accept any image/* since client compresses to JPEG)
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop() || 'jpg';
  const storagePath = `${id}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('task-photos')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }

  // Insert database record
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
    // Clean up uploaded file if DB insert fails
    await supabaseAdmin.storage.from('task-photos').remove([storagePath]);
    console.error('DB insert error:', insertError);
    return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 });
  }

  return NextResponse.json({
    photo: { ...photo, uploader: { name: session.name } },
  });
}
