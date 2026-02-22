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

    // Sort: workers get priority-first, admins get newest-first (already from server)
    if (!isAdmin) {
      result = [...result].sort((a, b) => {
        const pw = (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
        if (pw !== 0) return pw;

        // Due date: soonest first, nulls last
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return 0;
      });
    }

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
          <div className="text-center py-12">
            <p className="text-sm text-stone-500">No tasks found</p>
          </div>
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
