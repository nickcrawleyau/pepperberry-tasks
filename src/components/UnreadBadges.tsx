'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UnreadBadges() {
  const [board, setBoard] = useState(0);
  const [dm, setDm] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchCounts() {
      try {
        const res = await fetch('/api/chat/unread');
        if (res.ok && mounted) {
          const data = await res.json();
          setBoard(data.board);
          setDm(data.dm);
        }
      } catch { /* ignore */ }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* Board messages */}
      <Link
        href="/chat?tab=board"
        title={board > 0 ? `${board} new board message${board !== 1 ? 's' : ''}` : 'Board'}
        className="relative p-1.5"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={board > 0 ? 'text-fw-accent' : 'text-fw-text/25'}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {board > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-fw-accent text-white text-[9px] font-bold px-1">
            {board > 99 ? '99+' : board}
          </span>
        )}
      </Link>

      {/* Direct messages */}
      <Link
        href="/chat?tab=messages"
        title={dm > 0 ? `${dm} new direct message${dm !== 1 ? 's' : ''}` : 'Messages'}
        className="relative p-1.5"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={dm > 0 ? 'text-fw-accent' : 'text-fw-text/25'}
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {dm > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-fw-accent text-white text-[9px] font-bold px-1">
            {dm > 99 ? '99+' : dm}
          </span>
        )}
      </Link>
    </div>
  );
}
