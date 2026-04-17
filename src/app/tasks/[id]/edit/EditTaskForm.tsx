'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import {
  AREAS,
  AREA_LABELS,
  PRIORITIES,
  STATUSES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  RECURRENCE_LABELS,
  MAX_SUBTASKS,
} from '@/lib/constants';

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  location: string;
  area: string | null;
  assigned_to: string | null;
  due_date: string | null;
  recurrence_pattern: string | null;
  recurrence_group_id: string | null;
}

interface SubtaskData {
  id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
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
  subtasks: SubtaskData[];
}

export default function EditTaskForm({ task, users, subtasks: initialSubtasks }: EditTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [category] = useState(task.category);
  const [location] = useState(task.location);
  const [area, setArea] = useState(task.area || '');
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [applyToAll, setApplyToAll] = useState(false);

  // Subtask editing: track existing (with id) and new ones
  const [subtasks, setSubtasks] = useState<{ id?: string; title: string }[]>(
    initialSubtasks.map((s) => ({ id: s.id, title: s.title }))
  );

  function handleAreaChange(newArea: string) {
    setArea(newArea);
  }

  function addSubtask() {
    if (subtasks.length < MAX_SUBTASKS) {
      setSubtasks([...subtasks, { title: '' }]);
    }
  }

  function updateSubtask(index: number, value: string) {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], title: value };
    setSubtasks(updated);
  }

  function removeSubtask(index: number) {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        category,
        location: location || null,
        area: area || null,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        subtasks: subtasks
          .filter((s) => s.title.trim())
          .map((s, i) => ({ id: s.id, title: s.title.trim(), sort_order: i })),
        ...(applyToAll && task.recurrence_group_id
          ? { apply_to_series: true }
          : {}),
      };

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update task');
        setLoading(false);
        return;
      }

      toast('Changes saved');
      router.push(`/tasks/${task.id}`);
      // Keep loading=true so "Saving..." stays visible during navigation
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const selectBase =
    'w-full rounded-lg px-3 py-2.5 text-sm text-fw-text bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';
  const selectDefault = `${selectBase} border border-fw-text/20`;
  const selectFilled = `${selectBase} border border-fw-accent`;
  const inputClass =
    'w-full rounded-lg border border-fw-text/20 px-3 py-2.5 text-sm text-fw-text bg-fw-surface placeholder:text-fw-text/50 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';
  const labelClass = 'block text-xs font-medium text-fw-text/50 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {task.recurrence_pattern && task.recurrence_group_id && (
        <div className="bg-fw-surface rounded-xl border border-fw-surface p-4 space-y-3">
          <p className="text-xs text-fw-text/50">
            This job repeats {RECURRENCE_LABELS[task.recurrence_pattern]?.toLowerCase()}. Apply changes to:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setApplyToAll(false)}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition text-center ${
                !applyToAll
                  ? 'bg-fw-accent/20 border border-fw-accent text-fw-accent'
                  : 'border border-fw-text/20 text-fw-text/70 hover:border-fw-accent'
              }`}
            >
              This job only
            </button>
            <button
              type="button"
              onClick={() => setApplyToAll(true)}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition text-center ${
                applyToAll
                  ? 'bg-fw-accent/20 border border-fw-accent text-fw-accent'
                  : 'border border-fw-text/20 text-fw-text/70 hover:border-fw-accent'
              }`}
            >
              All in series
            </button>
          </div>
        </div>
      )}

      <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-5">
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

      {/* Area selector */}
      <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-3">
        <p className={labelClass}>Area</p>
        <div className="grid grid-cols-4 gap-2">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => handleAreaChange(area === a ? '' : a)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition text-center ${
                area === a
                  ? 'bg-fw-accent/20 border border-fw-accent text-fw-accent'
                  : 'border border-fw-text/20 text-fw-text/70 hover:border-fw-accent'
              }`}
            >
              {AREA_LABELS[a]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-5">
        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className={labelClass}>Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectFilled}
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
              className={selectFilled}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
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
              className={assignedTo ? selectFilled : selectDefault}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
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

      {/* Sub-tasks */}
      <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-fw-text/50">Sub-tasks</p>
          <span className="text-xs text-fw-text/40">{subtasks.length}/{MAX_SUBTASKS}</span>
        </div>

        {subtasks.map((st, i) => (
          <div key={st.id || `new-${i}`} className="flex items-center gap-2">
            <span className="text-xs text-fw-text/50 w-5 text-center">{i + 1}</span>
            <input
              type="text"
              value={st.title}
              onChange={(e) => updateSubtask(i, e.target.value)}
              placeholder="Sub-task description..."
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeSubtask(i)}
              className="p-1.5 text-fw-text/40 hover:text-red-500 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ))}

        {subtasks.length < MAX_SUBTASKS && (
          <button
            type="button"
            onClick={addSubtask}
            className="flex items-center gap-2 text-sm text-fw-accent hover:text-fw-hover transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
            Add sub-task
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <div className="flex gap-3 w-full min-w-0">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-w-0 rounded-lg bg-fw-accent py-2.5 text-sm font-medium text-white hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed truncate"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="shrink-0 px-5 py-2.5 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
