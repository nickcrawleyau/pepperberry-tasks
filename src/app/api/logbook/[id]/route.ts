import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('logbook')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { note } = body;

  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    return NextResponse.json({ error: 'Note is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('logbook_entries')
    .update({ note: note.trim() })
    .eq('id', id)
    .select('*, author:users!created_by(name)')
    .single();

  if (error) {
    console.error('Logbook update error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('logbook')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { id } = await params;

  // Get photos to clean up storage
  const { data: photos } = await supabaseAdmin
    .from('logbook_photos')
    .select('storage_path')
    .eq('entry_id', id);

  if (photos && photos.length > 0) {
    await supabaseAdmin.storage
      .from('logbook-photos')
      .remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabaseAdmin
    .from('logbook_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Logbook delete error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
