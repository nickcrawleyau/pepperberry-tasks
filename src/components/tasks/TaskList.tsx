'use client';

import { useState, useMemo } from 'react';
import { Task } from '@/lib/types';
import TaskCard from './TaskCard';
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

export default function TaskList({ tasks, role, users = [] }: TaskListProps) {
  const [activeStatus, setActiveStatus] = useState('all');
  const [adminFilters, setAdminFilters] = useState<AdminFilterValues>({
    priority: '',
    category: '',
    location: '',
    assignedTo: '',
  });

  const isAdmin = role === 'admin';

  const filtered = useMemo(() => {
    let result = tasks;

    // Status filter (all roles)
    if (activeStatus !== 'all') {
      result = result.filter((t) => t.status === activeStatus);
    }

    // Admin-only filters
    if (isAdmin) {
      if (adminFilters.priority) {
        result = result.filter((t) => t.priority === adminFilters.priority);
      }
      if (adminFilters.category) {
        result = result.filter((t) => t.category === adminFilters.category);
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
    }

    // Sort: urgent tasks always first, then priority-based for workers
    result = [...result].sort((a, b) => {
      // Urgent tasks always come first
      const aUrgent = a.priority === 'urgent' ? 1 : 0;
      const bUrgent = b.priority === 'urgent' ? 1 : 0;
      if (aUrgent !== bUrgent) return bUrgent - aUrgent;

      // For non-admin, also sort by remaining priority levels
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

    return result;
  }, [tasks, activeStatus, adminFilters, isAdmin]);

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

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

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          tasks.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto text-stone-300 mb-4"
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
              <p className="text-sm font-medium text-stone-700 mb-1">All caught up!</p>
              <p className="text-xs text-stone-400">No jobs right now. Enjoy the quiet.</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 mx-auto text-stone-300 mb-4"
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
              <p className="text-sm font-medium text-stone-700 mb-1">No jobs match your filters</p>
              <p className="text-xs text-stone-400">Try adjusting your filters to see more jobs.</p>
            </div>
          )
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
