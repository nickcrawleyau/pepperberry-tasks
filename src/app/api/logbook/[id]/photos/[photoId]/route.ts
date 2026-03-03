import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string; photoId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('logbook')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { id, photoId } = await params;

  const { data: photo, error: fetchError } = await supabaseAdmin
    .from('logbook_photos')
    .select('id, entry_id, storage_path, uploaded_by')
    .eq('id', photoId)
    .eq('entry_id', id)
    .single();

  if (fetchError || !photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (session.role !== 'admin' && photo.uploaded_by !== session.userId) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  await supabaseAdmin.storage.from('logbook-photos').remove([photo.storage_path]);

  const { error: deleteError } = await supabaseAdmin
    .from('logbook_photos')
    .delete()
    .eq('id', photoId);

  if (deleteError) {
    console.error('Error deleting photo:', deleteError);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
