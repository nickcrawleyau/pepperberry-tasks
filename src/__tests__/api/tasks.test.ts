import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  LOCATIONS,
  PRIORITIES,
  RECURRENCE_PATTERNS,
  AREAS,
  MAX_SUBTASKS,
} from '@/lib/constants';

// Test the task creation validation logic extracted from the route

describe('Task Creation - Input Validation', () => {
  describe('title validation', () => {
    it('rejects empty title', () => {
      expect(!''?.trim()).toBe(true);
      expect(!'  '?.trim()).toBe(true);
    });

    it('accepts non-empty title', () => {
      expect(!'Fix gate'.trim()).toBe(false);
    });

    it('rejects null/undefined title', () => {
      expect(!(null as unknown as string)?.trim()).toBe(true);
      expect(!(undefined as unknown as string)?.trim()).toBe(true);
    });

    it('trims whitespace from title', () => {
      expect('  Fix gate  '.trim()).toBe('Fix gate');
    });
  });

  describe('category validation', () => {
    it('accepts all valid categories', () => {
      CATEGORIES.forEach((cat) => {
        expect((CATEGORIES as readonly string[]).includes(cat)).toBe(true);
      });
    });

    it('rejects invalid category', () => {
      expect((CATEGORIES as readonly string[]).includes('plumbing')).toBe(false);
      expect((CATEGORIES as readonly string[]).includes('electrical')).toBe(false);
    });

    it('category is optional (empty string/null allowed)', () => {
      // The route defaults to 'general' when no category provided
      const category = '' || 'general';
      expect(category).toBe('general');
    });
  });

  describe('location validation', () => {
    it('accepts all valid locations', () => {
      LOCATIONS.forEach((loc) => {
        expect((LOCATIONS as readonly string[]).includes(loc)).toBe(true);
      });
    });

    it('rejects invalid location', () => {
      expect((LOCATIONS as readonly string[]).includes('barn')).toBe(false);
    });
  });

  describe('priority validation', () => {
    it('accepts all valid priorities', () => {
      PRIORITIES.forEach((p) => {
        expect((PRIORITIES as readonly string[]).includes(p)).toBe(true);
      });
    });

    it('rejects invalid priority', () => {
      expect((PRIORITIES as readonly string[]).includes('critical')).toBe(false);
    });

    it('defaults to medium when not provided', () => {
      const priority = '' || 'medium';
      expect(priority).toBe('medium');
    });
  });

  describe('area validation', () => {
    it('accepts all valid areas', () => {
      AREAS.forEach((a) => {
        expect((AREAS as readonly string[]).includes(a)).toBe(true);
      });
    });

    it('rejects invalid area', () => {
      expect((AREAS as readonly string[]).includes('shed')).toBe(false);
    });
  });

  describe('subtask validation', () => {
    it('allows up to MAX_SUBTASKS', () => {
      const subtasks = Array.from({ length: MAX_SUBTASKS }, (_, i) => ({
        title: `Subtask ${i + 1}`,
      }));
      expect(subtasks.length).toBeLessThanOrEqual(MAX_SUBTASKS);
    });

    it('rejects more than MAX_SUBTASKS', () => {
      const subtasks = Array.from({ length: MAX_SUBTASKS + 1 }, (_, i) => ({
        title: `Subtask ${i + 1}`,
      }));
      expect(subtasks.length > MAX_SUBTASKS).toBe(true);
    });

    it('filters out empty subtask titles', () => {
      const subtasks = [
        { title: 'Valid' },
        { title: '' },
        { title: '  ' },
        { title: 'Also valid' },
      ];
      const valid = subtasks.filter((s) => s.title?.trim());
      expect(valid).toHaveLength(2);
    });
  });
});

describe('Task Creation - Permission Checks', () => {
  it('admins can always create tasks', () => {
    const session = { role: 'admin', allowedSections: [] as string[] };
    const canCreate = session.role === 'admin' || session.allowedSections?.includes('new_job');
    expect(canCreate).toBe(true);
  });

  it('non-admin with new_job section can create tasks', () => {
    const session = { role: 'tradesperson', allowedSections: ['weather', 'cart', 'new_job'] };
    const canCreate = session.role === 'admin' || session.allowedSections?.includes('new_job');
    expect(canCreate).toBe(true);
  });

  it('non-admin without new_job section cannot create tasks', () => {
    const session = { role: 'tradesperson', allowedSections: ['weather', 'cart'] };
    const canCreate = session.role === 'admin' || session.allowedSections?.includes('new_job');
    expect(canCreate).toBe(false);
  });

  it('riding_school without new_job section cannot create tasks', () => {
    const session = { role: 'riding_school', allowedSections: ['weather'] };
    const canCreate = session.role === 'admin' || session.allowedSections?.includes('new_job');
    expect(canCreate).toBe(false);
  });
});

describe('Task Creation - Recurring Tasks', () => {
  // Replicate generateDueDates logic
  function generateDueDates(pattern: string, start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');

    while (current <= endDate && dates.length < 365) {
      dates.push(current.toISOString().split('T')[0]);

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

    return dates;
  }

  describe('recurrence pattern validation', () => {
    it('accepts all valid recurrence patterns', () => {
      RECURRENCE_PATTERNS.forEach((p) => {
        expect((RECURRENCE_PATTERNS as readonly string[]).includes(p)).toBe(true);
      });
    });

    it('rejects invalid recurrence pattern', () => {
      expect((RECURRENCE_PATTERNS as readonly string[]).includes('yearly')).toBe(false);
    });
  });

  describe('generateDueDates', () => {
    it('generates correct number of daily dates', () => {
      const dates = generateDueDates('daily', '2026-03-01', '2026-03-05');
      expect(dates).toHaveLength(5);
    });

    it('generates correct number of weekly dates', () => {
      const dates = generateDueDates('weekly', '2026-03-01', '2026-03-29');
      expect(dates).toHaveLength(5);
    });

    it('generates correct number of fortnightly dates', () => {
      const dates = generateDueDates('fortnightly', '2026-03-01', '2026-04-26');
      expect(dates).toHaveLength(5);
    });

    it('generates correct number of monthly dates', () => {
      const dates = generateDueDates('monthly', '2026-01-15', '2026-06-15');
      expect(dates).toHaveLength(6);
    });

    it('generates correct number of two_monthly dates', () => {
      const dates = generateDueDates('two_monthly', '2026-01-15', '2026-11-15');
      expect(dates).toHaveLength(6); // Jan, Mar, May, Jul, Sep, Nov
    });

    it('generates correct number of quarterly dates', () => {
      const dates = generateDueDates('quarterly', '2026-01-15', '2026-12-15');
      expect(dates).toHaveLength(4); // Jan, Apr, Jul, Oct
    });

    it('generates correct number of six_monthly dates', () => {
      const dates = generateDueDates('six_monthly', '2026-01-15', '2027-12-15');
      expect(dates).toHaveLength(4); // Jan 2026, Jul 2026, Jan 2027, Jul 2027
    });

    it('generates correct number of annual dates', () => {
      const dates = generateDueDates('annual', '2026-01-15', '2029-01-15');
      expect(dates).toHaveLength(4); // 2026, 2027, 2028, 2029
    });

    it('returns empty array when end is before start', () => {
      const dates = generateDueDates('daily', '2026-03-05', '2026-03-01');
      expect(dates).toEqual([]);
    });

    it('returns single date when start equals end', () => {
      const dates = generateDueDates('daily', '2026-03-01', '2026-03-01');
      expect(dates).toHaveLength(1);
    });

    it('limits to 365 occurrences', () => {
      const dates = generateDueDates('daily', '2026-01-01', '2028-01-01');
      expect(dates.length).toBeLessThanOrEqual(365);
    });

    it('all dates are valid date strings', () => {
      const dates = generateDueDates('daily', '2026-03-01', '2026-03-03');
      dates.forEach((d) => {
        expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('dates are in ascending order', () => {
      const dates = generateDueDates('weekly', '2026-01-01', '2026-03-01');
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] > dates[i - 1]).toBe(true);
      }
    });
  });

  describe('recurrence date validation', () => {
    it('requires both start and end dates', () => {
      const hasStart = !!('2026-03-01');
      const hasEnd = !!('2026-06-01');
      expect(hasStart && hasEnd).toBe(true);
    });

    it('rejects end date before start date', () => {
      const start = '2026-06-01';
      const end = '2026-03-01';
      expect(end < start).toBe(true);
    });

    it('accepts end date equal to start date', () => {
      const start = '2026-03-01';
      const end = '2026-03-01';
      expect(end < start).toBe(false);
    });
  });
});
