import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('chat')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { userId } = await params;

  const { searchParams } = new URL(request.url);
  const before = searchParams.get('before');

  let query = supabaseAdmin
    .from('direct_messages')
    .select('*, sender:users!sender_id(name), recipient:users!recipient_id(name)')
    .or(
      `and(sender_id.eq.${session.userId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${session.userId})`
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin' && !session.allowedSections?.includes('chat')) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
  }

  const { userId } = await params;
  const { content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.trim().length > MAX_CHAT_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message must be ${MAX_CHAT_MESSAGE_LENGTH} characters or less` }, { status: 400 });
  }

  if (userId === session.userId) {
    return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('direct_messages')
    .insert({
      sender_id: session.userId,
      recipient_id: userId,
      content: content.trim(),
    })
    .select('*, sender:users!sender_id(name), recipient:users!recipient_id(name)')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  await params; // consume params to satisfy Next.js
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('direct_messages')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
