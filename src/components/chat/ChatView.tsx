'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, DirectMessage, Conversation } from '@/lib/types';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/lib/constants';

interface ChatViewProps {
  initialMessages: ChatMessage[];
  initialConversations: Conversation[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserName: string;
  initialTab?: 'board' | 'messages';
  isAdmin?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function markSeen(type: 'board' | 'dm') {
  fetch('/api/chat/seen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  }).catch(() => {});
}

export default function ChatView({
  initialMessages,
  initialConversations,
  users,
  currentUserId,
  currentUserName,
  initialTab = 'board',
  isAdmin = false,
}: ChatViewProps) {
  const [tab, setTab] = useState<'board' | 'messages'>(initialTab);

  // Mark as seen on mount and tab change
  useEffect(() => {
    markSeen(tab === 'board' ? 'board' : 'dm');
  }, [tab]);

  return (
    <div className="min-w-0 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-fw-surface rounded-lg p-1">
        <button
          onClick={() => setTab('board')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            tab === 'board'
              ? 'bg-fw-surface text-fw-text shadow-sm'
              : 'text-fw-text/50 hover:text-fw-text/80'
          }`}
        >
          Chatboard
        </button>
        <button
          onClick={() => setTab('messages')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            tab === 'messages'
              ? 'bg-fw-surface text-fw-text shadow-sm'
              : 'text-fw-text/50 hover:text-fw-text/80'
          }`}
        >
          Messages
        </button>
      </div>

      {tab === 'board' ? (
        <BoardTab
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isAdmin={isAdmin}
        />
      ) : (
        <MessagesTab
          initialConversations={initialConversations}
          users={users}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

// ─── Board Tab ─────────────────────────────────────────

function BoardTab({
  initialMessages,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  initialMessages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([...initialMessages].reverse());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Poll for new messages every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data: ChatMessage[] = await res.json();
          setMessages([...data].reverse());
        }
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (res.ok) {
        const msg: ChatMessage = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInput('');
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 220px)' }}>
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <p className="text-sm text-fw-text/40 text-center py-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === currentUserId;
          const name = msg.user?.name || (isMe ? currentUserName : 'Unknown');
          return (
            <div key={msg.id} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-fw-surface flex items-center justify-center text-xs font-medium text-fw-text/70 shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-fw-text">{name}</span>
                  <span className="text-xs text-fw-text/40">{timeAgo(msg.created_at)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-400 hover:text-red-500 transition ml-auto p-1.5 -m-1.5"
                      title="Delete message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-fw-text/80 whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-fw-surface min-w-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          placeholder="Write a message..."
          className="flex-1 min-w-0 rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface placeholder:text-fw-text/30 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

// ─── Messages Tab ──────────────────────────────────────

function MessagesTab({
  initialConversations,
  users,
  currentUserId,
  currentUserName,
  isAdmin,
}: {
  initialConversations: Conversation[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeThread, setActiveThread] = useState<{ userId: string; userName: string } | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Poll conversations every 15s
  useEffect(() => {
    if (activeThread) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/chat/conversations');
        if (res.ok) {
          const data: Conversation[] = await res.json();
          setConversations(data);
        }
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeThread]);

  if (activeThread) {
    return (
      <DMThread
        partnerId={activeThread.userId}
        partnerName={activeThread.userName}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        isAdmin={isAdmin}
        onBack={() => {
          setActiveThread(null);
          // Refresh conversations when returning
          fetch('/api/chat/conversations')
            .then((r) => r.json())
            .then(setConversations)
            .catch(() => {});
        }}
      />
    );
  }

  return (
    <div>
      {/* New Message button */}
      {!showNewMessage && (
        <button
          onClick={() => setShowNewMessage(true)}
          className="w-full mb-4 py-2.5 rounded-lg border border-dashed border-fw-text/20 text-sm text-fw-text/50 hover:border-fw-text/40 hover:text-fw-text/80 transition"
        >
          + New Message
        </button>
      )}

      {/* New message user picker */}
      {showNewMessage && (
        <div className="mb-4 bg-fw-surface rounded-xl border border-fw-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-fw-text">Send to</p>
            <button
              onClick={() => setShowNewMessage(false)}
              className="text-fw-text/40 hover:text-fw-text/70 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setShowNewMessage(false);
                  setActiveThread({ userId: u.id, userName: u.name });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-fw-surface transition text-left"
              >
                <div className="w-7 h-7 rounded-full bg-fw-surface flex items-center justify-center text-xs font-medium text-fw-text/70">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-fw-text/80">{u.name}</span>
              </button>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-fw-text/40 py-2">No other users available</p>
            )}
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.length === 0 && !showNewMessage && (
          <p className="text-sm text-fw-text/40 text-center py-8">No conversations yet</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv.user_id}
            onClick={() => setActiveThread({ userId: conv.user_id, userName: conv.user_name })}
            className="w-full bg-fw-surface rounded-xl border border-fw-surface p-4 hover:border-fw-text/20 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-fw-surface flex items-center justify-center text-sm font-medium text-fw-text/70 shrink-0">
                {conv.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-fw-text">{conv.user_name}</span>
                  <span className="text-xs text-fw-text/40">{timeAgo(conv.last_message_at)}</span>
                </div>
                <p className="text-xs text-fw-text/50 truncate">{conv.last_message}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DM Thread ─────────────────────────────────────────

function DMThread({
  partnerId,
  partnerName,
  currentUserId,
  currentUserName,
  isAdmin,
  onBack,
}: {
  partnerId: string;
  partnerName: string;
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch thread messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/dm/${partnerId}`);
      if (res.ok) {
        const data: DirectMessage[] = await res.json();
        setMessages([...data].reverse());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [partnerId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages.length, loading, scrollToBottom]);

  // Poll every 15s
  useEffect(() => {
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/dm/${partnerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (res.ok) {
        const msg: DirectMessage = await res.json();
        setMessages((prev) => [...prev, msg]);
        setInput('');
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/chat/dm/${partnerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 220px)' }}>
      {/* Thread header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-fw-surface">
        <button
          onClick={onBack}
          className="text-fw-text/50 hover:text-fw-text/80 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-fw-surface flex items-center justify-center text-sm font-medium text-fw-text/70">
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-fw-text">{partnerName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {loading && (
          <p className="text-sm text-fw-text/40 text-center py-8">Loading...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-fw-text/40 text-center py-8">No messages yet. Say hello!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const name = isMe ? currentUserName : partnerName;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  isMe
                    ? 'bg-fw-accent/20 text-fw-text'
                    : 'bg-fw-surface text-fw-text border border-fw-surface'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-0.5 min-w-0">
                  <span className="text-xs font-medium text-fw-text/70 truncate">{name}</span>
                  <span className="text-[10px] text-fw-text/40 shrink-0">{timeAgo(msg.created_at)}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-red-400 hover:text-red-500 transition p-1.5 -m-1.5"
                      title="Delete message"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-fw-surface min-w-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          placeholder="Write a message..."
          className="flex-1 min-w-0 rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface placeholder:text-fw-text/30 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
