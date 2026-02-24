'use client';

import { useState } from 'react';

export default function ReportProblem() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/report-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setSent(true);
        setContent('');
        setTimeout(() => {
          setOpen(false);
          setSent(false);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send report');
      }
    } catch {
      setError('Failed to send report');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-900/50 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        Report Issue
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-fw-surface rounded-xl border border-fw-surface shadow-xl p-5 space-y-4">
            {sent ? (
              <div className="text-center py-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto text-emerald-500 mb-2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="text-sm font-medium text-fw-text">Report sent to Nick</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-fw-text">Report a Problem</h3>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setError(''); }}
                    className="text-fw-text/40 hover:text-fw-text/80 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <p className="text-xs text-fw-text/50">Describe what&apos;s not working. This will be sent to Nick.</p>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's the problem?"
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-lg border border-fw-text/20 bg-fw-bg px-3 py-2 text-sm text-fw-text placeholder:text-fw-text/30 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition resize-none"
                  autoFocus
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-fw-text/30">{content.length}/500</span>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={!content.trim() || loading}
                  className="w-full px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Report'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
