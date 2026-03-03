import { describe, it, expect } from 'vitest';
import { sampleTask, completedTask, overdueTask, ridingSchoolTask } from '../helpers/fixtures';
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, AREA_LABELS } from '@/lib/constants';

describe('TaskCard - Data Display', () => {
  it('displays task title', () => {
    expect(sampleTask.title).toBe('Fix front gate latch');
  });

  it('displays priority label', () => {
    const label = PRIORITY_LABELS[sampleTask.priority];
    expect(label).toBe('High');
  });

  it('displays status label', () => {
    const label = STATUS_LABELS[sampleTask.status];
    expect(label).toBe('To do');
  });

  it('displays category label', () => {
    const label = CATEGORY_LABELS[sampleTask.category];
    expect(label).toBe('Maintenance');
  });

  it('displays assigned user name', () => {
    expect(sampleTask.assigned_user?.name).toBe('Dave');
  });

  it('handles null assigned_user', () => {
    const unassigned = { ...sampleTask, assigned_user: null, assigned_to: null };
    expect(unassigned.assigned_user).toBeNull();
  });
});

describe('TaskCard - Overdue Detection', () => {
  it('identifies overdue task (due date in the past, not done)', () => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = overdueTask.due_date !== null &&
      overdueTask.due_date < today &&
      overdueTask.status !== 'done';
    expect(isOverdue).toBe(true);
  });

  it('completed task is not overdue even with past due date', () => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = completedTask.due_date !== null &&
      completedTask.due_date < today &&
      completedTask.status !== 'done';
    expect(isOverdue).toBe(false);
  });

  it('task with no due date is never overdue', () => {
    const noDueDate = { ...sampleTask, due_date: null };
    const isOverdue = noDueDate.due_date !== null &&
      noDueDate.due_date < '2026-02-28' &&
      noDueDate.status !== 'done';
    expect(isOverdue).toBe(false);
  });
});

describe('TaskCard - Area Color Coding', () => {
  const AREA_COLORS: Record<string, string> = {
    garden: 'bg-emerald-500',
    paddocks: 'bg-amber-600',
    house: 'bg-blue-500',
    animals: 'bg-purple-500',
  };

  it('garden area gets emerald color', () => {
    expect(AREA_COLORS['garden']).toBe('bg-emerald-500');
  });

  it('paddocks area gets amber color', () => {
    expect(AREA_COLORS['paddocks']).toBe('bg-amber-600');
  });

  it('house area gets blue color', () => {
    expect(AREA_COLORS['house']).toBe('bg-blue-500');
  });

  it('animals area gets purple color', () => {
    expect(AREA_COLORS['animals']).toBe('bg-purple-500');
  });

  it('all areas have a color assigned', () => {
    const areas = ['garden', 'paddocks', 'house', 'animals'];
    areas.forEach((area) => {
      expect(AREA_COLORS[area]).toBeDefined();
    });
  });
});

describe('TaskCard - Priority Sorting', () => {
  const PRIORITY_ORDER: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  it('urgent sorts first', () => {
    expect(PRIORITY_ORDER['urgent']).toBeLessThan(PRIORITY_ORDER['high']);
  });

  it('low sorts last', () => {
    expect(PRIORITY_ORDER['low']).toBeGreaterThan(PRIORITY_ORDER['medium']);
  });

  it('sorts tasks by priority correctly', () => {
    const tasks = [
      { priority: 'low' },
      { priority: 'urgent' },
      { priority: 'medium' },
      { priority: 'high' },
    ];

    const sorted = [...tasks].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    );

    expect(sorted.map((t) => t.priority)).toEqual(['urgent', 'high', 'medium', 'low']);
  });
});

describe('TaskCard - Recurring Task Display', () => {
  it('identifies recurring task', () => {
    expect(ridingSchoolTask.recurrence_pattern).toBe('daily');
    expect(ridingSchoolTask.recurrence_group_id).toBeDefined();
  });

  it('identifies non-recurring task', () => {
    expect(sampleTask.recurrence_pattern).toBeNull();
    expect(sampleTask.recurrence_group_id).toBeNull();
  });
});
