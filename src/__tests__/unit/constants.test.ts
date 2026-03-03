import { describe, it, expect } from 'vitest';
import {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  LOCATIONS,
  RECURRENCE_PATTERNS,
  AREAS,
  SHOPPING_CATEGORIES,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  RECURRENCE_LABELS,
  AREA_LABELS,
  LOCATION_LABELS,
  SHOPPING_CATEGORY_LABELS,
  AREA_LOCATIONS,
  AREA_CATEGORIES,
  MAX_SUBTASKS,
  MAX_PHOTOS_PER_TASK,
  MAX_PHOTO_SIZE_BYTES,
  MAX_CHAT_MESSAGE_LENGTH,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/constants';

describe('Constants', () => {
  describe('enum arrays are non-empty', () => {
    it.each([
      ['STATUSES', STATUSES],
      ['PRIORITIES', PRIORITIES],
      ['CATEGORIES', CATEGORIES],
      ['LOCATIONS', LOCATIONS],
      ['RECURRENCE_PATTERNS', RECURRENCE_PATTERNS],
      ['AREAS', AREAS],
      ['SHOPPING_CATEGORIES', SHOPPING_CATEGORIES],
      ['ACCEPTED_IMAGE_TYPES', ACCEPTED_IMAGE_TYPES],
    ])('%s is non-empty', (_name, arr) => {
      expect(arr.length).toBeGreaterThan(0);
    });
  });

  describe('expected enum values exist', () => {
    it('STATUSES contains todo, in_progress, done', () => {
      expect(STATUSES).toContain('todo');
      expect(STATUSES).toContain('in_progress');
      expect(STATUSES).toContain('done');
    });

    it('PRIORITIES contains low through urgent', () => {
      expect(PRIORITIES).toContain('low');
      expect(PRIORITIES).toContain('medium');
      expect(PRIORITIES).toContain('high');
      expect(PRIORITIES).toContain('urgent');
    });

    it('CATEGORIES contains core categories', () => {
      expect(CATEGORIES).toContain('maintenance');
      expect(CATEGORIES).toContain('riding_school');
      expect(CATEGORIES).toContain('horses');
      expect(CATEGORIES).toContain('fencing');
      expect(CATEGORIES).toContain('general');
    });

    it('SHOPPING_CATEGORIES contains hardware, hay, feed, other', () => {
      expect(SHOPPING_CATEGORIES).toContain('hardware');
      expect(SHOPPING_CATEGORIES).toContain('hay');
      expect(SHOPPING_CATEGORIES).toContain('feed');
      expect(SHOPPING_CATEGORIES).toContain('other');
    });

    it('RECURRENCE_PATTERNS contains all patterns', () => {
      expect(RECURRENCE_PATTERNS).toContain('daily');
      expect(RECURRENCE_PATTERNS).toContain('weekly');
      expect(RECURRENCE_PATTERNS).toContain('fortnightly');
      expect(RECURRENCE_PATTERNS).toContain('monthly');
      expect(RECURRENCE_PATTERNS).toContain('two_monthly');
      expect(RECURRENCE_PATTERNS).toContain('quarterly');
      expect(RECURRENCE_PATTERNS).toContain('six_monthly');
      expect(RECURRENCE_PATTERNS).toContain('annual');
    });
  });

  describe('label maps cover all enum values', () => {
    it('STATUS_LABELS has an entry for every status', () => {
      STATUSES.forEach((status) => {
        expect(STATUS_LABELS[status]).toBeDefined();
        expect(typeof STATUS_LABELS[status]).toBe('string');
        expect(STATUS_LABELS[status].length).toBeGreaterThan(0);
      });
    });

    it('PRIORITY_LABELS has an entry for every priority', () => {
      PRIORITIES.forEach((p) => {
        expect(PRIORITY_LABELS[p]).toBeDefined();
        expect(PRIORITY_LABELS[p].length).toBeGreaterThan(0);
      });
    });

    it('CATEGORY_LABELS has an entry for every category', () => {
      CATEGORIES.forEach((c) => {
        expect(CATEGORY_LABELS[c]).toBeDefined();
        expect(CATEGORY_LABELS[c].length).toBeGreaterThan(0);
      });
    });

    it('RECURRENCE_LABELS has an entry for every recurrence pattern', () => {
      RECURRENCE_PATTERNS.forEach((r) => {
        expect(RECURRENCE_LABELS[r]).toBeDefined();
        expect(RECURRENCE_LABELS[r].length).toBeGreaterThan(0);
      });
    });

    it('AREA_LABELS has an entry for every area', () => {
      AREAS.forEach((a) => {
        expect(AREA_LABELS[a]).toBeDefined();
        expect(AREA_LABELS[a].length).toBeGreaterThan(0);
      });
    });

    it('LOCATION_LABELS has an entry for every location', () => {
      LOCATIONS.forEach((l) => {
        expect(LOCATION_LABELS[l]).toBeDefined();
        expect(LOCATION_LABELS[l].length).toBeGreaterThan(0);
      });
    });

    it('SHOPPING_CATEGORY_LABELS has an entry for every shopping category', () => {
      SHOPPING_CATEGORIES.forEach((c) => {
        expect(SHOPPING_CATEGORY_LABELS[c]).toBeDefined();
        expect(SHOPPING_CATEGORY_LABELS[c].length).toBeGreaterThan(0);
      });
    });
  });

  describe('AREA_LOCATIONS contains only valid locations', () => {
    it('every area key is a valid AREAS value', () => {
      Object.keys(AREA_LOCATIONS).forEach((area) => {
        expect((AREAS as readonly string[]).includes(area)).toBe(true);
      });
    });

    it('every location in area mapping is a valid LOCATIONS value', () => {
      Object.values(AREA_LOCATIONS).forEach((locations) => {
        locations.forEach((loc) => {
          expect((LOCATIONS as readonly string[]).includes(loc)).toBe(true);
        });
      });
    });

    it('every area has at least one location', () => {
      Object.values(AREA_LOCATIONS).forEach((locations) => {
        expect(locations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AREA_CATEGORIES contains only valid categories', () => {
    it('every area key is a valid AREAS value', () => {
      Object.keys(AREA_CATEGORIES).forEach((area) => {
        expect((AREAS as readonly string[]).includes(area)).toBe(true);
      });
    });

    it('every category in area mapping is a valid CATEGORIES value', () => {
      Object.values(AREA_CATEGORIES).forEach((categories) => {
        categories.forEach((cat) => {
          expect((CATEGORIES as readonly string[]).includes(cat)).toBe(true);
        });
      });
    });

    it('every area has at least one category', () => {
      Object.values(AREA_CATEGORIES).forEach((categories) => {
        expect(categories.length).toBeGreaterThan(0);
      });
    });
  });

  describe('limits are valid positive values', () => {
    it('MAX_SUBTASKS is a positive integer', () => {
      expect(MAX_SUBTASKS).toBeGreaterThan(0);
      expect(Number.isInteger(MAX_SUBTASKS)).toBe(true);
    });

    it('MAX_PHOTOS_PER_TASK is a positive integer', () => {
      expect(MAX_PHOTOS_PER_TASK).toBeGreaterThan(0);
      expect(Number.isInteger(MAX_PHOTOS_PER_TASK)).toBe(true);
    });

    it('MAX_PHOTO_SIZE_BYTES is 5MB', () => {
      expect(MAX_PHOTO_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });

    it('MAX_CHAT_MESSAGE_LENGTH is a positive integer', () => {
      expect(MAX_CHAT_MESSAGE_LENGTH).toBeGreaterThan(0);
      expect(Number.isInteger(MAX_CHAT_MESSAGE_LENGTH)).toBe(true);
    });
  });

  describe('ACCEPTED_IMAGE_TYPES contains expected formats', () => {
    it('includes JPEG', () => {
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/jpeg');
    });

    it('includes PNG', () => {
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/png');
    });

    it('includes WebP', () => {
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/webp');
    });

    it('includes HEIC for iPhone photos', () => {
      expect(ACCEPTED_IMAGE_TYPES).toContain('image/heic');
    });

    it('all entries are valid MIME types', () => {
      ACCEPTED_IMAGE_TYPES.forEach((type) => {
        expect(type).toMatch(/^image\//);
      });
    });
  });
});
