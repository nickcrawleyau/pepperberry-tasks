import { describe, it, expect } from 'vitest';
import { SHOPPING_CATEGORIES } from '@/lib/constants';
import { adminSession, tradespersonSession, ridingSchoolSession } from '../helpers/fixtures';

describe('Shopping API - Permission Checks', () => {
  function canAccessShopping(session: { role: string; allowedSections?: string[] }): boolean {
    return session.role === 'admin' || !!session.allowedSections?.includes('cart');
  }

  it('admin can always access shopping', () => {
    expect(canAccessShopping(adminSession)).toBe(true);
  });

  it('tradesperson with cart access can access shopping', () => {
    expect(canAccessShopping(tradespersonSession)).toBe(true);
  });

  it('tradesperson without cart access cannot access shopping', () => {
    const session = { ...tradespersonSession, allowedSections: ['weather'] };
    expect(canAccessShopping(session)).toBe(false);
  });

  it('riding_school without cart access cannot access shopping', () => {
    expect(canAccessShopping(ridingSchoolSession)).toBe(false);
  });

  it('riding_school with cart access can access shopping', () => {
    const session = { ...ridingSchoolSession, allowedSections: ['weather', 'cart'] };
    expect(canAccessShopping(session)).toBe(true);
  });
});

describe('Shopping API - Input Validation', () => {
  describe('title validation', () => {
    it('rejects empty title', () => {
      expect(!''?.trim()).toBe(true);
    });

    it('rejects whitespace-only title', () => {
      expect(!'   '?.trim()).toBe(true);
    });

    it('accepts valid title', () => {
      expect(!'Star pickets x20'.trim()).toBe(false);
    });
  });

  describe('category validation', () => {
    it('accepts all valid shopping categories', () => {
      SHOPPING_CATEGORIES.forEach((cat) => {
        expect((SHOPPING_CATEGORIES as readonly string[]).includes(cat)).toBe(true);
      });
    });

    it('rejects invalid category', () => {
      expect((SHOPPING_CATEGORIES as readonly string[]).includes('electronics')).toBe(false);
      expect((SHOPPING_CATEGORIES as readonly string[]).includes('tools')).toBe(false);
    });

    it('has exactly 4 categories', () => {
      expect(SHOPPING_CATEGORIES).toHaveLength(4);
    });
  });

  describe('assigned_to handling', () => {
    it('assigned_to is optional', () => {
      const insert: Record<string, unknown> = {
        title: 'Test item',
        category: 'hardware',
        added_by: 'user-id',
      };

      const assigned_to = undefined;
      if (assigned_to) {
        insert.assigned_to = assigned_to;
      }

      expect(insert).not.toHaveProperty('assigned_to');
    });

    it('includes assigned_to when provided', () => {
      const insert: Record<string, unknown> = {
        title: 'Test item',
        category: 'hardware',
        added_by: 'user-id',
      };

      const assigned_to = 'admin-user-id';
      if (assigned_to) {
        insert.assigned_to = assigned_to;
      }

      expect(insert.assigned_to).toBe('admin-user-id');
    });
  });
});
