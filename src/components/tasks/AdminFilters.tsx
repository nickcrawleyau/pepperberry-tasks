'use client';

import {
  PRIORITIES,
  PRIORITY_LABELS,
  AREAS,
  AREA_LABELS,
  AREA_LOCATIONS,
  LOCATION_LABELS,
} from '@/lib/constants';

export interface AdminFilterValues {
  priority: string;
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
    'appearance-none rounded-lg border border-fw-surface bg-fw-surface pl-3 pr-7 py-2 text-xs text-fw-text focus:outline-none focus:ring-2 focus:ring-fw-accent/50 focus:border-fw-accent/50 transition min-w-0';

  const hasActiveFilters =
    filters.priority || filters.location || filters.assignedTo;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap">
        {/* Priority */}
        <div className="relative">
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

        {/* Location */}
        <div className="relative">
          <select
            value={filters.location}
            onChange={(e) => update('location', e.target.value)}
            className={selectClass}
          >
            <option value="">Location</option>
            {AREAS.map((a) => (
              <optgroup key={a} label={AREA_LABELS[a]}>
                {AREA_LOCATIONS[a].map((l) => (
                  <option key={l} value={l}>
                    {LOCATION_LABELS[l]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <DropdownArrow />
        </div>

        {/* Assigned To */}
        <div className="relative">
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
                location: '',
                assignedTo: '',
              })
            }
            className="text-xs text-fw-text/50 hover:text-fw-text/80 transition px-2 py-2"
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
        className="h-3 w-3 text-fw-text/50"
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
