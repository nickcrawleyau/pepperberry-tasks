'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CATEGORIES,
  LOCATIONS,
  PRIORITIES,
  STATUSES,
  CATEGORY_LABELS,
  LOCATION_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/lib/constants';

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  location: string;
  assigned_to: string | null;
  due_date: string | null;
}

interface UserOption {
  id: string;
  name: string;
  role: string;
  trade_type: string | null;
}

interface EditTaskFormProps {
  task: TaskData;
  users: UserOption[];
}

export default function EditTaskForm({ task, users }: EditTaskFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [category, setCategory] = useState(task.category);
  const [location, setLocation] = useState(task.location);
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          category,
          location,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update task');
        return;
      }

      router.push(`/tasks/${task.id}`);
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
        <div>
          <label htmlFor="title" className={labelClass}>Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className={labelClass}>Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={selectClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelClass}>Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className={selectClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className={labelClass}>Location *</label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className={selectClass}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{LOCATION_LABELS[l]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assign to & Due date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="assigned_to" className={labelClass}>Assign to</label>
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

          <div>
            <label htmlFor="due_date" className={labelClass}>Due date</label>
            <input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-stone-800 py-2.5 text-sm font-medium text-white hover:bg-stone-700 active:bg-stone-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="px-5 py-2.5 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
