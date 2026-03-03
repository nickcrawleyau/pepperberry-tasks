import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('logbook')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('logbook_entries')
    .select('*, author:users!created_by(name), photos:logbook_photos(id, entry_id, storage_path, uploaded_by, created_at, uploader:users!uploaded_by(name))')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Logbook fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }

  return NextResponse.json({ entries: data || [] });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('logbook')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const body = await request.json();
  const { entry_date, note } = body;

  if (!entry_date || typeof entry_date !== 'string') {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    return NextResponse.json({ error: 'Note is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('logbook_entries')
    .insert({
      entry_date,
      note: note.trim(),
      created_by: session.userId,
    })
    .select('*, author:users!created_by(name)')
    .single();

  if (error) {
    console.error('Logbook insert error:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }

  return NextResponse.json({ entry: { ...data, photos: [] } });
}
