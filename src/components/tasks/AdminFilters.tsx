'use client';

import {
  PRIORITIES,
  PRIORITY_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  LOCATIONS,
  LOCATION_LABELS,
} from '@/lib/constants';

export interface AdminFilterValues {
  priority: string;
  category: string;
  location: string;
  assignedTo: string;
}

interface UserOption {
  id: string;
  name: string;
}

interface AdminFiltersProps {
  filters: AdminFilterValues;
  onFiltersChange: (filters: AdminFilterValues) => void;
  users: UserOption[];
}

export default function AdminFilters({
  filters,
  onFiltersChange,
  users,
}: AdminFiltersProps) {
  function update(key: keyof AdminFilterValues, value: string) {
    onFiltersChange({ ...filters, [key]: value });
  }

  const selectClass =
    'appearance-none rounded-lg border border-stone-700 bg-stone-800 pl-3 pr-7 py-2 text-xs text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600/50 transition min-w-0';

  const hasActiveFilters =
    filters.priority || filters.category || filters.location || filters.assignedTo;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {/* Priority */}
        <div className="relative shrink-0">
          <select
            value={filters.priority}
            onChange={(e) => update('priority', e.target.value)}
            className={selectClass}
          >
            <option value="">Priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
          <DropdownArrow />
        </div>

        {/* Category */}
        <div className="relative shrink-0">
          <select
            value={filters.category}
            onChange={(e) => update('category', e.target.value)}
            className={selectClass}
          >
            <option value="">Category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <DropdownArrow />
        </div>

        {/* Location */}
        <div className="relative shrink-0">
          <select
            value={filters.location}
            onChange={(e) => update('location', e.target.value)}
            className={selectClass}
          >
            <option value="">Location</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {LOCATION_LABELS[l]}
              </option>
            ))}
          </select>
          <DropdownArrow />
        </div>

        {/* Assigned To */}
        <div className="relative shrink-0">
          <select
            value={filters.assignedTo}
            onChange={(e) => update('assignedTo', e.target.value)}
            className={selectClass}
          >
            <option value="">Assigned to</option>
            <option value="__unassigned__">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <DropdownArrow />
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                priority: '',
                category: '',
                location: '',
                assignedTo: '',
              })
            }
            className="shrink-0 text-xs text-stone-500 hover:text-stone-300 transition px-2 py-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function DropdownArrow() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
      <svg
        className="h-3 w-3 text-stone-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
