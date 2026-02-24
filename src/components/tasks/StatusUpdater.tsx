'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS } from '@/lib/constants';

const STATUSES = ['todo', 'in_progress', 'done'] as const;

const STATUS_STYLES: Record<string, string> = {
  todo: 'border-fw-text/20 text-fw-text/80 hover:bg-fw-bg',
  in_progress: 'border-amber-300 text-fw-accent hover:bg-amber-50',
  done: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50',
};

const ACTIVE_STYLES: Record<string, string> = {
  todo: 'bg-fw-bg border-fw-text/20 text-fw-text',
  in_progress: 'bg-fw-accent/10 border-fw-accent text-fw-accent',
  done: 'bg-emerald-900/30 border-emerald-500 text-emerald-500',
};

interface StatusUpdaterProps {
  taskId: string;
  currentStatus: string;
}

export default function StatusUpdater({ taskId, currentStatus }: StatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => handleStatusChange(s)}
          disabled={loading}
          className={`
            px-3 py-1.5 rounded-lg border text-xs font-medium transition
            ${s === status ? ACTIVE_STYLES[s] : STATUS_STYLES[s]}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
