import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';
import { MAX_PHOTOS_PER_LOGBOOK_ENTRY, MAX_PHOTO_SIZE_BYTES } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('logbook')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { id } = await params;

  // Verify entry exists
  const { data: entry } = await supabaseAdmin
    .from('logbook_entries')
    .select('id')
    .eq('id', id)
    .single();

  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  // Check photo count limit
  const { count } = await supabaseAdmin
    .from('logbook_photos')
    .select('id', { count: 'exact', head: true })
    .eq('entry_id', id);

  if ((count ?? 0) >= MAX_PHOTOS_PER_LOGBOOK_ENTRY) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS_PER_LOGBOOK_ENTRY} photos per entry` },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const contentType = file.type || 'image/jpeg';
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 });
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'];
  const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const fileExt = ALLOWED_EXTS.includes(rawExt) ? rawExt : 'jpg';
  const storagePath = `logbook/${id}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('logbook-photos')
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }

  const { data: photo, error: insertError } = await supabaseAdmin
    .from('logbook_photos')
    .insert({
      entry_id: id,
      storage_path: storagePath,
      uploaded_by: session.userId,
    })
    .select('id, entry_id, storage_path, uploaded_by, created_at')
    .single();

  if (insertError) {
    await supabaseAdmin.storage.from('logbook-photos').remove([storagePath]);
    console.error('DB insert error:', insertError);
    return NextResponse.json({ error: 'Failed to save photo record' }, { status: 500 });
  }

  return NextResponse.json({
    photo: { ...photo, uploader: { name: session.name } },
  });
}
