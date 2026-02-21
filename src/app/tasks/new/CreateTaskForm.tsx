'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CATEGORIES,
  LOCATIONS,
  PRIORITIES,
  RECURRENCE_PATTERNS,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
} from '@/lib/constants';

interface UserOption {
  id: string;
  name: string;
  role: string;
  trade_type: string | null;
}

interface CreateTaskFormProps {
  users: UserOption[];
}

function todayString(): string {
  return new Date().toLocaleDateString('en-CA');
}

function countOccurrences(pattern: string, start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  const current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  let count = 0;
  while (current <= endDate && count < 365) {
    count++;
    switch (pattern) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'fortnightly':
        current.setDate(current.getDate() + 14);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }
  return count;
}

export default function CreateTaskForm({ users }: CreateTaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [recurrenceStart, setRecurrenceStart] = useState(todayString());
  const [recurrenceEnd, setRecurrenceEnd] = useState('');

  const isRepeating = recurrencePattern !== '';

  const occurrenceCount = useMemo(() => {
    if (!isRepeating || !recurrenceStart || !recurrenceEnd) return 0;
    return countOccurrences(recurrencePattern, recurrenceStart, recurrenceEnd);
  }, [isRepeating, recurrencePattern, recurrenceStart, recurrenceEnd]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        category,
        location,
        assigned_to: assignedTo || null,
      };

      if (isRepeating) {
        payload.recurrence_pattern = recurrencePattern;
        payload.recurrence_start = recurrenceStart;
        payload.recurrence_end = recurrenceEnd;
      } else {
        payload.due_date = dueDate || null;
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create task');
        return;
      }

      router.push(`/tasks/${data.task.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';
  const inputClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';
  const labelClass = 'block text-xs font-medium text-stone-500 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, notes, or instructions..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
        {/* Priority & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="priority" className={labelClass}>
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={selectClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className={labelClass}>
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Select...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Assign to */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className={labelClass}>
              Location *
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className={selectClass}
            >
              <option value="">Select...</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {LOCATION_LABELS[l]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assigned_to" className={labelClass}>
              Assign to
            </label>
            <select
              id="assigned_to"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={selectClass}
            >
              <option value="">Unassigned</option>
              {users
                .filter((u) => u.role !== 'admin')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {u.trade_type ? ` (${u.trade_type})` : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule section */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="repeat" className={labelClass}>
              Repeat
            </label>
            <select
              id="repeat"
              value={recurrencePattern}
              onChange={(e) => setRecurrencePattern(e.target.value)}
              className={selectClass}
            >
              <option value="">Does not repeat</option>
              {RECURRENCE_PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {RECURRENCE_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {!isRepeating && (
            <div>
              <label htmlFor="due_date" className={labelClass}>
                Due date
              </label>
              <input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {isRepeating && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recurrence_start" className={labelClass}>
                  Start date *
                </label>
                <input
                  id="recurrence_start"
                  type="date"
                  value={recurrenceStart}
                  onChange={(e) => setRecurrenceStart(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="recurrence_end" className={labelClass}>
                  End date *
                </label>
                <input
                  id="recurrence_end"
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {occurrenceCount > 0 && (
              <p className="text-xs text-stone-400">
                This will create {occurrenceCount} task{occurrenceCount !== 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || (isRepeating && occurrenceCount === 0)}
          className="flex-1 rounded-lg bg-stone-800 py-2.5 text-sm font-medium text-white hover:bg-stone-700 active:bg-stone-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Creating...'
            : isRepeating
              ? `Create ${occurrenceCount} Task${occurrenceCount !== 1 ? 's' : ''}`
              : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
