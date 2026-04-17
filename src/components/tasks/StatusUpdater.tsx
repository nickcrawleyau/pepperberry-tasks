'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/components/ui/ToastProvider';

const STATUSES = ['todo', 'in_progress', 'done'] as const;

const STATUS_STYLES: Record<string, string> = {
  todo: 'border-fw-text/20 text-fw-text/80 hover:bg-fw-text/5',
  in_progress: 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10',
  done: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10',
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
  const { toast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status || loading) return;
    setLoading(true);
    setError('');

    const previousStatus = status;

    // Mark as done: await the update, then navigate
    if (newStatus === 'done') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'done' }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
      } catch {
        // Timeout or network error — navigate anyway
      }
      toast('Status updated');
      window.location.href = '/dashboard';
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast('Status updated');
        setStatus(newStatus);
        router.refresh();
      } else {
        setError('Failed to update. Try again.');
        setStatus(previousStatus);
      }
    } catch {
      setError('Connection error. Try again.');
      setStatus(previousStatus);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            disabled={loading}
            className={`
              flex-1 px-3 py-2.5 rounded-lg border text-xs font-medium transition
              ${s === status ? ACTIVE_STYLES[s] : STATUS_STYLES[s]}
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
