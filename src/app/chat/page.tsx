import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatView from '@/components/chat/ChatView';
import { ChatMessage, Conversation } from '@/lib/types';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/');
  if (session.role !== 'admin' && !session.allowedSections?.includes('chat')) redirect('/dashboard');

  // Fetch initial board messages, conversations, and active users in parallel
  const [{ data: messagesData }, { data: usersData }] = await Promise.all([
    supabaseAdmin
      .from('chat_messages')
      .select('*, user:users!user_id(name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('users')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ]);

  // Build conversations list server-side
  const { data: dmsData } = await supabaseAdmin
    .from('direct_messages')
    .select('id, sender_id, recipient_id, content, created_at, sender:users!sender_id(name), recipient:users!recipient_id(name)')
    .or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`)
    .order('created_at', { ascending: false });

  const conversationMap = new Map<string, Conversation>();
  for (const dm of dmsData || []) {
    const isMe = dm.sender_id === session.userId;
    const partnerId = isMe ? dm.recipient_id : dm.sender_id;
    const partnerName = isMe
      ? (dm.recipient as unknown as { name: string } | null)?.name || 'Unknown'
      : (dm.sender as unknown as { name: string } | null)?.name || 'Unknown';

    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        user_id: partnerId,
        user_name: partnerName,
        last_message: dm.content,
        last_message_at: dm.created_at,
      });
    }
  }

  const conversations = Array.from(conversationMap.values())
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

  const messages: ChatMessage[] = messagesData || [];
  const users: { id: string; name: string }[] = (usersData || []).filter(
    (u: { id: string }) => u.id !== session.userId
  );

  const { tab } = await searchParams;
  const initialTab = tab === 'messages' ? 'messages' : 'board';

  return (
    <div className="min-h-screen bg-fw-bg">
      <header className="bg-fw-surface border-b border-fw-surface sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-fw-text/50 hover:text-fw-text/80 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard">
              <img src="/PBLogo.png" alt="Pepperberry" className="w-7 h-7 object-contain" />
            </Link>
            <h1 className="text-lg font-medium text-fw-text">Chat</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <ChatView
          initialMessages={messages}
          initialConversations={conversations}
          users={users}
          currentUserId={session.userId}
          currentUserName={session.name}
          initialTab={initialTab}
          isAdmin={session.role === 'admin'}
        />
      </main>
    </div>
  );
}
