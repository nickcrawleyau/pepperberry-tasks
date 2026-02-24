'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteSeriesButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirming(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirming]);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/series/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-500">Delete entire series?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
        >
          {loading ? '...' : 'Yes, delete all'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-lg border border-fw-text/20 text-xs font-medium text-fw-text/80 hover:bg-stone-200 transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-500 hover:bg-red-900/30 transition"
    >
      Delete Series
    </button>
  );
}
