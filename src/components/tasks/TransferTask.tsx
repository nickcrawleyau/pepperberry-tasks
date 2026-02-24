'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TransferUser {
  id: string;
  name: string;
}

interface TransferTaskProps {
  taskId: string;
  currentAssignedTo: string | null;
  users: TransferUser[];
}

export default function TransferTask({ taskId, currentAssignedTo, users }: TransferTaskProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const availableUsers = users.filter((u) => u.id !== currentAssignedTo);

  // Close panel on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !comment.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/tasks/${taskId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: selectedUser, comment: comment.trim() }),
      });

      if (res.ok) {
        setOpen(false);
        setSelectedUser('');
        setComment('');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Transfer failed');
      }
    } catch {
      setError('Transfer failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg bg-fw-accent text-white text-xs font-bold uppercase tracking-wide hover:bg-fw-hover transition flex items-center gap-1.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 3h5v5" />
          <path d="M8 3H3v5" />
          <path d="M21 3l-7 7" />
          <path d="M3 3l7 7" />
          <path d="M16 21h5v-5" />
          <path d="M8 21H3v-5" />
          <path d="M21 21l-7-7" />
          <path d="M3 21l7-7" />
        </svg>
        Transfer
      </button>

      {open && (
        <form
          onSubmit={handleTransfer}
          className="absolute right-0 top-full mt-2 w-72 bg-fw-surface rounded-xl border border-fw-surface shadow-lg p-4 space-y-3 z-50"
        >
          <p className="text-sm font-medium text-fw-text">Transfer job</p>

          <div>
            <label className="block text-xs text-fw-text/50 mb-1">Transfer to</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-lg border border-fw-surface bg-fw-surface px-3 py-2 text-sm text-fw-text focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            >
              <option value="">Select a user...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-fw-text/50 mb-1">Reason</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Why is this job being transferred?"
              rows={2}
              className="w-full rounded-lg border border-fw-surface bg-fw-surface px-3 py-2 text-sm text-fw-text placeholder:text-fw-text/30 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!selectedUser || !comment.trim() || loading}
              className="flex-1 px-3 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Transferring...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSelectedUser('');
                setComment('');
                setError('');
              }}
              className="px-3 py-2 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-stone-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
