'use client';

import { useState, useMemo, useCallback } from 'react';
import { Task } from '@/lib/types';
import TaskCard from './TaskCard';
import SwipeableTaskCard from './SwipeableTaskCard';
import TaskFilters from './TaskFilters';
import AdminFilters, { AdminFilterValues } from './AdminFilters';

const PRIORITY_WEIGHT: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

interface UserOption {
  id: string;
  name: string;
}

interface TaskListProps {
  tasks: Task[];
  role?: string;
  users?: UserOption[];
}

interface TimeBucket {
  key: string;
  label: string;
  accent?: string;
  tasks: Task[];
}

function startOfToday(): Date {
  return new Date(new Date().toDateString());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function sortTasks(tasks: Task[], isAdmin: boolean): Task[] {
  return [...tasks].sort((a, b) => {
    // Urgent first
    const aUrgent = a.priority === 'urgent' ? 1 : 0;
    const bUrgent = b.priority === 'urgent' ? 1 : 0;
    if (aUrgent !== bUrgent) return bUrgent - aUrgent;

    if (!isAdmin) {
      const pw = (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
      if (pw !== 0) return pw;
    }

    // Due date: soonest first, nulls last
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
}

export default function TaskList({ tasks, role, users = [] }: TaskListProps) {
  const [activeStatus, setActiveStatus] = useState('all');
  const [adminFilters, setAdminFilters] = useState<AdminFilterValues>({
    priority: '',
    location: '',
    assignedTo: '',
    createdBy: '',
  });
  const [collapsedBuckets, setCollapsedBuckets] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  const handleDelete = useCallback((taskId: string) => {
    setDeletedIds((prev) => new Set(prev).add(taskId));
    setOpenCardId(null);
    fetch(`/api/tasks/${taskId}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const handleMarkDone = useCallback((taskId: string) => {
    setDeletedIds((prev) => new Set(prev).add(taskId));
    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = tasks.filter((t) => !deletedIds.has(t.id));

    if (activeStatus === 'all') {
      result = result.filter((t) => t.status !== 'done');
    } else {
      result = result.filter((t) => t.status === activeStatus);
    }

    if (isAdmin) {
      if (adminFilters.priority) {
        result = result.filter((t) => t.priority === adminFilters.priority);
      }
      if (adminFilters.location) {
        result = result.filter((t) => t.location === adminFilters.location);
      }
      if (adminFilters.assignedTo) {
        if (adminFilters.assignedTo === '__unassigned__') {
          result = result.filter((t) => !t.assigned_to);
        } else {
          result = result.filter(
            (t) => t.assigned_to === adminFilters.assignedTo
          );
        }
      }
      if (adminFilters.createdBy) {
        result = result.filter((t) => t.created_by === adminFilters.createdBy);
      }
    }

    return result;
  }, [tasks, activeStatus, adminFilters, isAdmin, deletedIds]);

  const buckets = useMemo((): TimeBucket[] => {
    // Done tab: flat list sorted by completed_at descending
    if (activeStatus === 'done') {
      const sorted = [...filtered].sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bTime - aTime;
      });
      if (sorted.length === 0) return [];
      return [{ key: 'done', label: 'Completed', tasks: sorted }];
    }

    const today = startOfToday();
    // Start of this week (Monday)
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfThisWeek = addDays(today, -diffToMonday);
    const startOfNextWeek = addDays(startOfThisWeek, 7);
    const startOfWeekAfterNext = addDays(startOfThisWeek, 14);
    // Calendar month boundaries
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const startOfMonthAfterNext = new Date(today.getFullYear(), today.getMonth() + 2, 1);

    const overdue: Task[] = [];
    const thisWeek: Task[] = [];
    const nextWeek: Task[] = [];
    const thisMonth: Task[] = [];
    const nextMonth: Task[] = [];
    const later: Task[] = [];

    for (const t of filtered) {
      if (!t.due_date) {
        later.push(t);
        continue;
      }
      const due = new Date(t.due_date + 'T00:00:00');
      if (due < today) {
        overdue.push(t);
      } else if (due < startOfNextWeek) {
        thisWeek.push(t);
      } else if (due < startOfWeekAfterNext) {
        nextWeek.push(t);
      } else if (due < startOfNextMonth) {
        thisMonth.push(t);
      } else if (due < startOfMonthAfterNext) {
        nextMonth.push(t);
      } else {
        later.push(t);
      }
    }

    return [
      { key: 'overdue', label: 'Overdue', accent: 'text-red-500', tasks: sortTasks(overdue, isAdmin) },
      { key: 'thisWeek', label: 'This Week', tasks: sortTasks(thisWeek, isAdmin) },
      { key: 'nextWeek', label: 'Next Week', tasks: sortTasks(nextWeek, isAdmin) },
      { key: 'thisMonth', label: 'This Month', tasks: sortTasks(thisMonth, isAdmin) },
      { key: 'nextMonth', label: 'Next Month', tasks: sortTasks(nextMonth, isAdmin) },
      { key: 'later', label: 'Later', tasks: sortTasks(later, isAdmin) },
    ].filter((b) => b.tasks.length > 0);
  }, [filtered, isAdmin, activeStatus]);

  const liveTasks = tasks.filter((t) => !deletedIds.has(t.id));
  const counts = {
    all: liveTasks.filter((t) => t.status !== 'done').length,
    todo: liveTasks.filter((t) => t.status === 'todo').length,
    in_progress: liveTasks.filter((t) => t.status === 'in_progress').length,
    done: liveTasks.filter((t) => t.status === 'done').length,
  };

  function toggleBucket(key: string) {
    setCollapsedBuckets((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-3">
          <AdminFilters
            filters={adminFilters}
            onFiltersChange={setAdminFilters}
            users={users}
          />
        </div>
      )}

      <TaskFilters
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        counts={counts}
      />

      <div className="mt-4 space-y-4">
        {buckets.length === 0 ? (
          tasks.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto text-fw-text/30 mb-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-fw-text/80 mb-1">All caught up!</p>
              <p className="text-xs text-fw-text/50">No jobs right now. Enjoy the quiet.</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto text-fw-text/30 mb-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                />
              </svg>
              <p className="text-sm font-medium text-fw-text/80 mb-1">No jobs match your filters</p>
              <p className="text-xs text-fw-text/50">Try adjusting your filters to see more jobs.</p>
            </div>
          )
        ) : (
          buckets.map((bucket) => (
            <div key={bucket.key}>
              <button
                type="button"
                onClick={() => toggleBucket(bucket.key)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-fw-text/40 transition-transform ${collapsedBuckets[bucket.key] ? '-rotate-90' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span className={`text-xs font-semibold uppercase tracking-wider ${bucket.accent || 'text-fw-text/50'}`}>
                  {bucket.label}
                </span>
                <span className="text-xs text-fw-text/50">
                  {bucket.tasks.length}
                </span>
              </button>
              {!collapsedBuckets[bucket.key] && (
                <div className="space-y-2">
                  {bucket.tasks.map((task) =>
                    isAdmin ? (
                      <SwipeableTaskCard
                        key={task.id}
                        task={task}
                        onDelete={handleDelete}
                        onMarkDone={handleMarkDone}
                        isOpen={openCardId === task.id}
                        onOpenChange={(open) =>
                          setOpenCardId(open ? task.id : null)
                        }
                      />
                    ) : (
                      <TaskCard key={task.id} task={task} />
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
