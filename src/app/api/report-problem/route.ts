import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

const NICK_USER_ID = 'a1000000-0000-0000-0000-000000000001';
const MAX_LENGTH = 500;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { content } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  if (content.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Message must be ${MAX_LENGTH} characters or less` }, { status: 400 });
  }

  // Insert as a direct message to Nick
  const { error } = await supabaseAdmin
    .from('direct_messages')
    .insert({
      sender_id: session.userId,
      recipient_id: NICK_USER_ID,
      content: `[Problem Report] ${content.trim()}`,
    });

  if (error) {
    console.error('Failed to save problem report:', error);
    return NextResponse.json({ error: 'Failed to send report' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
