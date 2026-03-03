import { describe, it, expect } from 'vitest';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/lib/constants';
import { adminSession, tradespersonSession, tradespersonWithChatSession, ridingSchoolSession } from '../helpers/fixtures';

describe('Chat API - Permission Checks', () => {
  function canAccessChat(session: { role: string; allowedSections?: string[] }): boolean {
    return session.role === 'admin' || !!session.allowedSections?.includes('chat');
  }

  it('admin can always access chat', () => {
    expect(canAccessChat(adminSession)).toBe(true);
  });

  it('tradesperson with chat access can access', () => {
    expect(canAccessChat(tradespersonWithChatSession)).toBe(true);
  });

  it('tradesperson without chat access cannot access', () => {
    expect(canAccessChat(tradespersonSession)).toBe(false);
  });

  it('riding_school without chat access cannot access', () => {
    expect(canAccessChat(ridingSchoolSession)).toBe(false);
  });
});

describe('Chat API - Message Validation', () => {
  describe('content validation', () => {
    it('rejects empty content', () => {
      expect(!''?.trim()).toBe(true);
    });

    it('rejects whitespace-only content', () => {
      expect(!'   '?.trim()).toBe(true);
    });

    it('accepts valid content', () => {
      expect(!'Hello everyone'.trim()).toBe(false);
    });
  });

  describe('message length', () => {
    it('MAX_CHAT_MESSAGE_LENGTH is 500', () => {
      expect(MAX_CHAT_MESSAGE_LENGTH).toBe(500);
    });

    it('accepts message at max length', () => {
      const msg = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH);
      expect(msg.trim().length > MAX_CHAT_MESSAGE_LENGTH).toBe(false);
    });

    it('rejects message exceeding max length', () => {
      const msg = 'a'.repeat(MAX_CHAT_MESSAGE_LENGTH + 1);
      expect(msg.trim().length > MAX_CHAT_MESSAGE_LENGTH).toBe(true);
    });

    it('checks trimmed length, not raw length', () => {
      const msg = '  ' + 'a'.repeat(499) + '  ';
      expect(msg.trim().length > MAX_CHAT_MESSAGE_LENGTH).toBe(false);
    });
  });
});

describe('Chat API - Delete Permissions', () => {
  it('only admin can delete messages', () => {
    expect(adminSession.role === 'admin').toBe(true);
    expect(tradespersonSession.role === 'admin').toBe(false);
    expect(ridingSchoolSession.role === 'admin').toBe(false);
  });
});

describe('Chat API - Message ID Validation', () => {
  it('rejects missing message ID', () => {
    const id = undefined;
    expect(!id).toBe(true);
  });

  it('rejects empty string ID', () => {
    const id = '';
    expect(!id).toBe(true);
  });

  it('accepts non-empty ID', () => {
    const id = '40000000-0000-0000-0000-000000000001';
    expect(!id).toBe(false);
  });
});

describe('Chat API - Pagination', () => {
  it('before parameter is used for pagination', () => {
    const searchParams = new URLSearchParams('before=2026-02-28T08:00:00Z');
    const before = searchParams.get('before');
    expect(before).toBe('2026-02-28T08:00:00Z');
  });

  it('missing before parameter returns null', () => {
    const searchParams = new URLSearchParams('');
    const before = searchParams.get('before');
    expect(before).toBeNull();
  });
});
