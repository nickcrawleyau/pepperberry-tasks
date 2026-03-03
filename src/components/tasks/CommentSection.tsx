'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskComment } from '@/lib/types';
import { useToast } from '@/components/ui/ToastProvider';

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

interface CommentSectionProps {
  taskId: string;
  comments: TaskComment[];
}

export default function CommentSection({ taskId, comments: initialComments }: CommentSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data.comment]);
        setContent('');
        toast('Comment posted');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-fw-text mb-3">
        Comments
        {comments.length > 0 && (
          <span className="ml-1.5 text-fw-text/50 font-normal">
            ({comments.length})
          </span>
        )}
      </h3>

      {comments.length > 0 ? (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-fw-surface rounded-lg px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-fw-text/80">
                  {comment.user?.name || 'Unknown'}
                </span>
                <span className="text-xs text-fw-text/50">
                  {timeAgo(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-fw-text leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-fw-text/50 mb-4">No comments yet</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
          maxLength={1000}
          className="w-full rounded-lg border border-fw-text/10 bg-fw-surface px-3 py-2 text-sm text-fw-text placeholder:text-fw-text/50 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-fw-text/50">{content.length}/1000</span>
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
