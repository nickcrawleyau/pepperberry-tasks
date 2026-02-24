import Link from 'next/link';
import { Task } from '@/lib/types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  LOCATION_LABELS,
} from '@/lib/constants';

const STATUS_STYLES: Record<string, string> = {
  todo: 'bg-fw-bg text-fw-text/80',
  in_progress: 'bg-fw-accent/10 text-fw-accent',
  done: 'bg-emerald-900/30 text-emerald-600',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-fw-text/50',
  medium: 'text-fw-text/80',
  high: 'text-orange-500',
  urgent: 'text-red-500 font-semibold',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
  });
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date(new Date().toDateString());
}

export default function TaskCard({ task }: { task: Task }) {
  const overdue = isOverdue(task);
  const isUrgent = task.priority === 'urgent';

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={`block rounded-xl border p-5 transition ${
        isUrgent
          ? 'bg-red-900/30 border-red-500/30 border-l-4 border-l-red-500 hover:border-red-400'
          : 'bg-fw-surface border-fw-surface hover:border-fw-text/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-fw-text/50' : 'text-fw-text'}`}>
            {isUrgent && (
              <span className="inline-block bg-red-500 text-white text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mr-1.5 align-middle">
                Urgent
              </span>
            )}
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 text-xs text-fw-text/50 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        <span className={PRIORITY_STYLES[task.priority]}>
          {PRIORITY_LABELS[task.priority]}
        </span>

        <span className="text-fw-text/50">
          {LOCATION_LABELS[task.location] || task.location}
        </span>

        <span className="text-fw-text/50">
          {CATEGORY_LABELS[task.category] || task.category}
        </span>

        {task.assigned_user?.name && (
          <span className="text-fw-text/50">
            {task.assigned_user.name}
          </span>
        )}

        {task.due_date && (
          <span className={overdue ? 'text-red-500 font-medium' : 'text-fw-text/50'}>
            {task.recurrence_pattern && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline-block mr-0.5 -mt-0.5"
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            )}
            {overdue ? 'Overdue — ' : 'Due '}
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </Link>
  );
}
