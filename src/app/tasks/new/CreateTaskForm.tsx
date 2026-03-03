'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import {
  AREAS,
  AREA_LABELS,
  PRIORITIES,
  RECURRENCE_PATTERNS,
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  MAX_SUBTASKS,
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
      case 'two_monthly':
        current.setMonth(current.getMonth() + 2);
        break;
      case 'quarterly':
        current.setMonth(current.getMonth() + 3);
        break;
      case 'six_monthly':
        current.setMonth(current.getMonth() + 6);
        break;
      case 'annual':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }
  return count;
}

const AREA_ICONS: Record<string, React.ReactNode> = {
  garden: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  ),
  paddocks: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
      <path d="M3 6v12" /><path d="M21 6v12" /><path d="M12 6v12" />
    </svg>
  ),
  house: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  animals: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </svg>
  ),
  cars_bikes: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </svg>
  ),
  equipment: (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

export default function CreateTaskForm({ users }: CreateTaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Step 1: type
  const [isRepeating, setIsRepeating] = useState(false);

  // Step 2: area
  const [area, setArea] = useState('');

  // Step 3: details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category] = useState('');
  const [location] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState('');
  const [recurrenceStart, setRecurrenceStart] = useState(todayString());
  const [recurrenceEnd, setRecurrenceEnd] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('en-CA');
  });

  // Step 4: subtasks
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const occurrenceCount = useMemo(() => {
    if (!isRepeating || !recurrencePattern || !recurrenceStart || !recurrenceEnd) return 0;
    return countOccurrences(recurrencePattern, recurrenceStart, recurrenceEnd);
  }, [isRepeating, recurrencePattern, recurrenceStart, recurrenceEnd]);

  function handleAreaSelect(a: string) {
    setArea(a);
    setStep(3);
  }

  function addSubtask() {
    if (subtasks.length < MAX_SUBTASKS) {
      setSubtasks([...subtasks, '']);
    }
  }

  function updateSubtask(index: number, value: string) {
    const updated = [...subtasks];
    updated[index] = value;
    setSubtasks(updated);
  }

  function removeSubtask(index: number) {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);

    try {
      const validSubtasks = subtasks.filter((s) => s.trim());
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        category: category || 'general',
        location: location || null,
        area,
        assigned_to: assignedTo || null,
        subtasks: validSubtasks.map((s, i) => ({ title: s.trim(), sort_order: i })),
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
        setError(data.error || 'Failed to create job');
        return;
      }

      toast('Job created');
      router.push(`/tasks/${data.task.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmitDetails =
    title.trim() &&
    (!isRepeating || (recurrencePattern && recurrenceStart && recurrenceEnd && occurrenceCount > 0));

  const selectBase =
    'w-full rounded-lg px-3 py-2.5 text-sm text-fw-text bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';
  const selectDefault = `${selectBase} border border-fw-text/20`;
  const selectFilled = `${selectBase} border border-fw-accent`;
  const inputClass =
    'w-full rounded-lg border border-fw-text/20 px-3 py-2.5 text-sm text-fw-text bg-fw-surface placeholder:text-fw-text/50 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';
  const labelClass = 'block text-xs font-medium text-fw-text/50 mb-1.5';

  return (
    <div className="space-y-5">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition ${
              s === step
                ? 'bg-fw-accent scale-110'
                : s < step
                  ? 'bg-fw-accent/50'
                  : 'bg-fw-text/20'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Type */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-fw-text/70 text-center">What kind of job?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setIsRepeating(false); setStep(2); }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-fw-text/20 bg-fw-surface hover:border-fw-accent transition text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-fw-accent">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span className="text-sm font-medium text-fw-text">One-off</span>
              <span className="text-xs text-fw-text/40">Single job with optional due date</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsRepeating(true); setStep(2); }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-fw-text/20 bg-fw-surface hover:border-fw-accent transition text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-fw-accent">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              <span className="text-sm font-medium text-fw-text">Repeating</span>
              <span className="text-xs text-fw-text/40">Recurring schedule</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Step 2: Area */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-fw-text/70 text-center">Which area?</p>
          <div className="grid grid-cols-2 gap-3">
            {AREAS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => handleAreaSelect(a)}
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border transition text-center ${
                  area === a
                    ? 'border-fw-accent bg-fw-accent/10'
                    : 'border-fw-text/20 bg-fw-surface hover:border-fw-accent'
                }`}
              >
                <span className="text-fw-accent">{AREA_ICONS[a]}</span>
                <span className="text-sm font-medium text-fw-text">{AREA_LABELS[a]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-2.5 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
          >
            Back
          </button>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-5">
            <div>
              <label htmlFor="title" className={labelClass}>Title *</label>
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
            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
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

          <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-5">
            <div>
              <label htmlFor="priority" className={labelClass}>Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={priority ? selectFilled : selectDefault}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>

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
          </div>

          {/* Schedule */}
          <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-5">
            {isRepeating ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="repeat" className={labelClass}>Repeat *</label>
                    <select
                      id="repeat"
                      value={recurrencePattern}
                      onChange={(e) => setRecurrencePattern(e.target.value)}
                      required
                      className={recurrencePattern ? selectFilled : selectDefault}
                    >
                      <option value="">Select...</option>
                      {RECURRENCE_PATTERNS.map((p) => (
                        <option key={p} value={p}>{RECURRENCE_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>
                  <div />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="recurrence_start" className={labelClass}>Start date *</label>
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
                    <label htmlFor="recurrence_end" className={labelClass}>End date *</label>
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
                  <p className="text-xs text-fw-text/50">
                    This will create {occurrenceCount} job{occurrenceCount !== 1 ? 's' : ''}
                  </p>
                )}
              </>
            ) : (
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
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canSubmitDetails}
              onClick={() => setStep(4)}
              className="flex-1 rounded-lg bg-fw-accent py-2.5 text-sm font-medium text-white hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Subtasks */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-fw-text">Sub-tasks</p>
              <span className="text-xs text-fw-text/40">Optional — up to {MAX_SUBTASKS}</span>
            </div>

            {subtasks.map((st, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-fw-text/50 w-5 text-center">{i + 1}</span>
                <input
                  type="text"
                  value={st}
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

            {subtasks.length === 0 && (
              <p className="text-xs text-fw-text/50 text-center py-4">
                No sub-tasks. You can skip this step.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
            >
              Back
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 rounded-lg bg-fw-accent py-2.5 text-sm font-medium text-white hover:bg-fw-hover active:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Creating...'
                : isRepeating
                  ? `Create ${occurrenceCount} Job${occurrenceCount !== 1 ? 's' : ''}`
                  : 'Create Job'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
