'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Task } from '@/lib/types';
import { PRIORITY_LABELS, LOCATION_LABELS } from '@/lib/constants';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-fw-accent/20 text-fw-accent',
  low: 'bg-fw-text/10 text-fw-text/50',
};

interface TodaysJobsReminderProps {
  todaysTasks: Task[];
}

export default function TodaysJobsReminder({ todaysTasks }: TodaysJobsReminderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (todaysTasks.length === 0) return;
    const shown = sessionStorage.getItem('today-reminder-shown');
    if (!shown) setVisible(true);
  }, [todaysTasks.length]);

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem('today-reminder-shown', '1');
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm bg-fw-surface rounded-xl border border-fw-text/20 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3">
          <p className="text-lg font-semibold text-fw-text">
            Today&apos;s Jobs
          </p>
          <p className="text-xs text-fw-text/50 mt-0.5">
            {todaysTasks.length} job{todaysTasks.length !== 1 ? 's' : ''} due today
          </p>
        </div>

        <div className="max-h-72 overflow-y-auto px-5 space-y-2">
          {todaysTasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              onClick={dismiss}
              className="flex items-start gap-3 p-3 rounded-lg bg-fw-bg/50 hover:bg-fw-bg transition"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fw-text truncate">
                  {task.title}
                </p>
                {task.location && (
                  <p className="text-xs text-fw-text/40 mt-0.5">
                    {LOCATION_LABELS[task.location] || task.location}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}
              >
                {PRIORITY_LABELS[task.priority] || task.priority}
              </span>
            </Link>
          ))}
        </div>

        <div className="px-5 py-4">
          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover active:bg-fw-hover transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
