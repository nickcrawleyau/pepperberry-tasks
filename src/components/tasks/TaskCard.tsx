'use client';

import { useRouter } from 'next/navigation';
import { Task } from '@/lib/types';
import {
  LOCATION_LABELS,
  AREA_LABELS,
} from '@/lib/constants';

const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-stone-500',
  medium: 'bg-stone-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

const AREA_STRIPE: Record<string, string> = {
  garden: 'bg-emerald-500',
  paddocks: 'bg-amber-600',
  house: 'bg-sky-500',
  animals: 'bg-purple-500',
  cars_bikes: 'bg-rose-500',
  equipment: 'bg-cyan-500',
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

interface TaskCardProps {
  task: Task;
  onMarkDone?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskCard({ task, onMarkDone, onDelete }: TaskCardProps) {
  const router = useRouter();
  const overdue = isOverdue(task);
  const isUrgent = task.priority === 'urgent';
  const stripe = task.area ? AREA_STRIPE[task.area] || 'bg-fw-text/20' : 'bg-fw-text/20';
  const showActions = !!(onMarkDone || onDelete);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/tasks/${task.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.id}`); }}
      className={`block rounded-xl border transition overflow-hidden cursor-pointer ${
        isUrgent
          ? 'bg-red-900/30 border-red-500/30 hover:border-red-400'
          : 'bg-fw-surface border-fw-surface hover:border-fw-text/30'
      }`}
    >
      <div className="flex">
        {/* Area color stripe */}
        <div className={`w-1.5 shrink-0 ${stripe}`} />

        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium leading-snug ${task.status === 'done' ? 'line-through text-fw-text/50' : 'text-fw-text'}`}>
                {isUrgent && (
                  <span className="inline-block bg-red-500 text-white text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mr-1.5 align-middle">
                    Urgent
                  </span>
                )}
                {task.title}
              </h3>
            </div>
            {/* Priority dot */}
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${PRIORITY_DOT[task.priority]}`} aria-label={`Priority: ${task.priority}`} role="img" />
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fw-text/50">
              {task.area && (
                <span>{AREA_LABELS[task.area]}</span>
              )}
              <span>{LOCATION_LABELS[task.location] || task.location}</span>
              {task.assigned_user?.name && (
                <span>{task.assigned_user.name}</span>
              )}
              {task.created_user?.name && task.created_user.name !== task.assigned_user?.name && (
                <span className="italic text-fw-text/40">added by {task.created_user.name}</span>
              )}
              {task.due_date && (
                <span className={overdue ? 'text-red-500 font-medium' : ''}>
                  {task.recurrence_pattern && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-0.5 -mt-0.5" aria-hidden="true">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                  )}
                  {formatDate(task.due_date)}
                </span>
              )}
              {(task.subtask_total ?? 0) > 0 && (
                <span className="text-fw-accent font-medium">
                  {task.subtask_done ?? 0}/{task.subtask_total}
                </span>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => router.push(`/tasks/${task.id}/edit`)}
                  className="p-3 rounded-lg text-fw-text/40 hover:text-fw-accent hover:bg-fw-text/5 transition"
                  aria-label="Edit task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
                {/* Mark done */}
                {task.status !== 'done' && onMarkDone && (
                  <button
                    type="button"
                    onClick={() => onMarkDone(task.id)}
                    className="p-3 rounded-lg text-fw-text/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition"
                    aria-label="Mark done"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                )}
                {/* Delete */}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    className="p-3 rounded-lg text-fw-text/40 hover:text-red-400 hover:bg-red-500/10 transition"
                    aria-label="Delete task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
