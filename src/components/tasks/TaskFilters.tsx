'use client';

import { STATUS_LABELS } from '@/lib/constants';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: STATUS_LABELS.todo },
  { key: 'in_progress', label: STATUS_LABELS.in_progress },
  { key: 'done', label: STATUS_LABELS.done },
] as const;

interface TaskFiltersProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  counts: Record<string, number>;
}

export default function TaskFilters({
  activeStatus,
  onStatusChange,
  counts,
}: TaskFiltersProps) {
  return (
    <div className="flex gap-1 bg-fw-bg rounded-lg p-1">
      {TABS.map((tab) => {
        const isActive = activeStatus === tab.key;
        const count = tab.key === 'all' ? counts.all : counts[tab.key] ?? 0;
        return (
          <button
            key={tab.key}
            onClick={() => onStatusChange(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition
              ${isActive
                ? 'bg-fw-surface text-fw-text shadow-sm'
                : 'text-fw-text/50 hover:text-fw-text'
              }
            `}
          >
            {tab.label}
            <span
              className={`
                text-[10px] tabular-nums
                ${isActive ? 'text-fw-text/50' : 'text-fw-text/50'}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
