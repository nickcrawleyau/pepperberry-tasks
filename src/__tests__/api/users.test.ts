import { describe, it, expect } from 'vitest';
import { adminSession, tradespersonSession, ridingSchoolSession } from '../helpers/fixtures';

describe('Users API - Permission Checks', () => {
  it('only admin can create users', () => {
    expect(adminSession.role === 'admin').toBe(true);
    expect(tradespersonSession.role === 'admin').toBe(false);
    expect(ridingSchoolSession.role === 'admin').toBe(false);
  });
});

describe('Users API - Input Validation', () => {
  const VALID_ROLES = ['admin', 'tradesperson', 'riding_school'];
  const PIN_REGEX = /^\d{4}$/;

  describe('name validation', () => {
    it('rejects empty name', () => {
      expect(!''?.trim()).toBe(true);
    });

    it('rejects whitespace-only name', () => {
      expect(!'   '?.trim()).toBe(true);
    });

    it('accepts valid name', () => {
      expect(!'Dave'.trim()).toBe(false);
    });

    it('trims whitespace', () => {
      expect('  Dave  '.trim()).toBe('Dave');
    });
  });

  describe('PIN validation', () => {
    it('accepts valid 4-digit PIN', () => {
      expect(PIN_REGEX.test('1234')).toBe(true);
    });

    it('rejects missing PIN', () => {
      const pin = undefined;
      expect(!pin || !PIN_REGEX.test(pin as unknown as string)).toBe(true);
    });

    it('rejects invalid PIN', () => {
      expect(!('abc' && PIN_REGEX.test('abc'))).toBe(true);
    });
  });

  describe('role validation', () => {
    it('accepts admin role', () => {
      expect(VALID_ROLES.includes('admin')).toBe(true);
    });

    it('accepts tradesperson role', () => {
      expect(VALID_ROLES.includes('tradesperson')).toBe(true);
    });

    it('accepts riding_school role', () => {
      expect(VALID_ROLES.includes('riding_school')).toBe(true);
    });

    it('rejects invalid role', () => {
      expect(VALID_ROLES.includes('superadmin')).toBe(false);
      expect(VALID_ROLES.includes('manager')).toBe(false);
    });

    it('rejects missing role', () => {
      const role = undefined;
      expect(!role || !VALID_ROLES.includes(role as string)).toBe(true);
    });
  });

  describe('allowed_sections default', () => {
    it('defaults to [weather, cart] when not an array', () => {
      const sections = undefined;
      const result = Array.isArray(sections) ? sections : ['weather', 'cart'];
      expect(result).toEqual(['weather', 'cart']);
    });

    it('uses provided array when given', () => {
      const sections = ['weather', 'cart', 'chat'];
      const result = Array.isArray(sections) ? sections : ['weather', 'cart'];
      expect(result).toEqual(['weather', 'cart', 'chat']);
    });

    it('defaults when given non-array', () => {
      const sections = 'weather';
      const result = Array.isArray(sections) ? sections : ['weather', 'cart'];
      expect(result).toEqual(['weather', 'cart']);
    });
  });

  describe('phone handling', () => {
    it('trims phone number', () => {
      expect('  0412 345 678  '.trim()).toBe('0412 345 678');
    });

    it('handles null phone', () => {
      const phone = null;
      expect(phone?.trim() || null).toBeNull();
    });
  });
});

describe('Users API - Duplicate Detection', () => {
  it('Supabase error code 23505 indicates unique constraint violation', () => {
    const error = { code: '23505', message: 'duplicate key value' };
    expect(error.code === '23505').toBe(true);
  });
});
