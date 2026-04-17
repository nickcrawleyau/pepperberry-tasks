'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';

export default function DeleteTaskButton({ taskId }: { taskId: string }) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!confirming) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirming(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirming]);

  function handleDelete() {
    setLoading(true);
    setError('');
    // Fire delete and navigate immediately — dashboard loads fresh data
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE', keepalive: true }).catch(() => {});
    toast('Job deleted');
    window.location.href = '/dashboard';
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-red-500">Delete this job?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
        >
          {loading ? '...' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-fw-text/20 text-xs font-medium text-fw-text/80 hover:bg-fw-bg transition disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-400 w-full">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 rounded-lg border border-red-500/40 text-xs font-medium text-red-500 hover:bg-red-900/30 transition"
    >
      Delete
    </button>
  );
}
