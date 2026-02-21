import Link from 'next/link';
import { Task } from '@/lib/types';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  LOCATION_LABELS,
} from '@/lib/constants';

const STATUS_STYLES: Record<string, string> = {
  todo: 'bg-stone-100 text-stone-600',
  in_progress: 'bg-amber-50 text-amber-700',
  done: 'bg-emerald-50 text-emerald-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-stone-400',
  medium: 'text-stone-600',
  high: 'text-orange-600',
  urgent: 'text-red-600 font-semibold',
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

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block bg-white rounded-xl border border-stone-200 p-5 hover:border-stone-300 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-stone-800 leading-snug">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 text-xs text-stone-400 line-clamp-2">
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

        <span className="text-stone-400">
          {LOCATION_LABELS[task.location] || task.location}
        </span>

        <span className="text-stone-400">
          {CATEGORY_LABELS[task.category] || task.category}
        </span>

        {task.assigned_user?.name && (
          <span className="text-stone-500">
            {task.assigned_user.name}
          </span>
        )}

        {task.due_date && (
          <span className={overdue ? 'text-red-500 font-medium' : 'text-stone-400'}>
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
