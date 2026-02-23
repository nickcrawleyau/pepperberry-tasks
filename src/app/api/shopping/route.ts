import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SHOPPING_CATEGORIES } from '@/lib/constants';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('shopping_items')
    .select('*, adder:users!added_by(name)')
    .order('is_bought', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { title, category } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!SHOPPING_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('shopping_items')
    .insert({
      title: title.trim(),
      category,
      added_by: session.userId,
    })
    .select('*, adder:users!added_by(name)')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
