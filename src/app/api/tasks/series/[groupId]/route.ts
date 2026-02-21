import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth';

type Params = { params: Promise<{ groupId: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can delete task series' }, { status: 403 });
  }

  const { groupId } = await params;

  const { error } = await supabaseAdmin
    .from('tasks')
    .delete()
    .eq('recurrence_group_id', groupId);

  if (error) {
    console.error('Error deleting task series:', error);
    return NextResponse.json({ error: 'Failed to delete series' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
