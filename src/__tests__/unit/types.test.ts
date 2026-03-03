import { describe, it, expect } from 'vitest';
import type { User, Task, ShoppingItem, ChatMessage, DirectMessage, TaskSubtask, TaskPhoto, TaskActivity, TaskComment, Conversation } from '@/lib/types';
import { adminUser, tradesperson, sampleTask, shoppingItems, chatMessages, directMessages } from '../helpers/fixtures';

// Type guard functions for runtime validation
function isValidUser(obj: unknown): obj is User {
  if (typeof obj !== 'object' || obj === null) return false;
  const u = obj as Record<string, unknown>;
  return (
    typeof u.id === 'string' &&
    typeof u.name === 'string' &&
    typeof u.role === 'string' &&
    ['admin', 'tradesperson', 'riding_school'].includes(u.role as string) &&
    typeof u.is_active === 'boolean' &&
    typeof u.must_set_pin === 'boolean' &&
    typeof u.created_at === 'string'
  );
}

function isValidTask(obj: unknown): obj is Task {
  if (typeof obj !== 'object' || obj === null) return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.status === 'string' &&
    ['todo', 'in_progress', 'done'].includes(t.status as string) &&
    typeof t.priority === 'string' &&
    ['low', 'medium', 'high', 'urgent'].includes(t.priority as string) &&
    typeof t.category === 'string' &&
    typeof t.created_by === 'string' &&
    typeof t.created_at === 'string'
  );
}

function isValidShoppingItem(obj: unknown): obj is ShoppingItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.category === 'string' &&
    ['hardware', 'hay', 'feed', 'other'].includes(s.category as string) &&
    typeof s.added_by === 'string' &&
    typeof s.is_bought === 'boolean' &&
    typeof s.created_at === 'string'
  );
}

function isValidChatMessage(obj: unknown): obj is ChatMessage {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.user_id === 'string' &&
    typeof m.content === 'string' &&
    typeof m.created_at === 'string'
  );
}

function isValidDirectMessage(obj: unknown): obj is DirectMessage {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m.id === 'string' &&
    typeof m.sender_id === 'string' &&
    typeof m.recipient_id === 'string' &&
    typeof m.content === 'string' &&
    typeof m.created_at === 'string'
  );
}

describe('Type Guards - Runtime Validation', () => {
  describe('isValidUser', () => {
    it('accepts a valid admin user', () => {
      expect(isValidUser(adminUser)).toBe(true);
    });

    it('accepts a valid tradesperson', () => {
      expect(isValidUser(tradesperson)).toBe(true);
    });

    it('rejects null', () => {
      expect(isValidUser(null)).toBe(false);
    });

    it('rejects empty object', () => {
      expect(isValidUser({})).toBe(false);
    });

    it('rejects user with invalid role', () => {
      expect(isValidUser({ ...adminUser, role: 'superadmin' })).toBe(false);
    });

    it('rejects user with missing id', () => {
      const { id, ...userWithoutId } = adminUser;
      expect(isValidUser(userWithoutId)).toBe(false);
    });
  });

  describe('isValidTask', () => {
    it('accepts a valid task', () => {
      expect(isValidTask(sampleTask)).toBe(true);
    });

    it('rejects task with invalid status', () => {
      expect(isValidTask({ ...sampleTask, status: 'cancelled' })).toBe(false);
    });

    it('rejects task with invalid priority', () => {
      expect(isValidTask({ ...sampleTask, priority: 'critical' })).toBe(false);
    });

    it('rejects null', () => {
      expect(isValidTask(null)).toBe(false);
    });
  });

  describe('isValidShoppingItem', () => {
    it('accepts valid shopping items', () => {
      shoppingItems.forEach((item) => {
        expect(isValidShoppingItem(item)).toBe(true);
      });
    });

    it('rejects item with invalid category', () => {
      expect(isValidShoppingItem({ ...shoppingItems[0], category: 'electronics' })).toBe(false);
    });
  });

  describe('isValidChatMessage', () => {
    it('accepts valid chat messages', () => {
      chatMessages.forEach((msg) => {
        expect(isValidChatMessage(msg)).toBe(true);
      });
    });

    it('rejects message without content', () => {
      const { content, ...incomplete } = chatMessages[0];
      expect(isValidChatMessage(incomplete)).toBe(false);
    });
  });

  describe('isValidDirectMessage', () => {
    it('accepts valid direct messages', () => {
      directMessages.forEach((msg) => {
        expect(isValidDirectMessage(msg)).toBe(true);
      });
    });

    it('rejects DM without sender_id', () => {
      const { sender_id, ...incomplete } = directMessages[0];
      expect(isValidDirectMessage(incomplete)).toBe(false);
    });
  });
});

describe('Fixture Data Integrity', () => {
  it('all user IDs are unique', () => {
    const users = [adminUser, tradesperson];
    const ids = users.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('task assigned_to references a valid user ID', () => {
    expect(sampleTask.assigned_to).toBe(tradesperson.id);
  });

  it('task created_by references a valid user ID', () => {
    expect(sampleTask.created_by).toBe(adminUser.id);
  });

  it('shopping item IDs are UUIDs', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    shoppingItems.forEach((item) => {
      expect(item.id).toMatch(uuidRegex);
    });
  });

  it('dates are valid ISO 8601', () => {
    const dateStr = sampleTask.created_at;
    const parsed = new Date(dateStr);
    expect(parsed.getTime()).not.toBeNaN();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
