import type { User, Task, ShoppingItem, ChatMessage, DirectMessage } from '@/lib/types';
import type { SessionPayload } from '@/lib/auth';

// ── Users ──────────────────────────────────────────────

export const adminUser: User = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Nick',
  role: 'admin',
  trade_type: null,
  is_active: true,
  must_set_pin: false,
  last_login: '2026-02-28T10:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

export const adminUser2: User = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Anna',
  role: 'admin',
  trade_type: null,
  is_active: true,
  must_set_pin: false,
  last_login: '2026-02-28T09:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

export const tradesperson: User = {
  id: '00000000-0000-0000-0000-000000000003',
  name: 'Dave',
  role: 'tradesperson',
  trade_type: 'fencer',
  is_active: true,
  must_set_pin: false,
  last_login: '2026-02-27T14:00:00Z',
  created_at: '2025-06-01T00:00:00Z',
};

export const ridingSchoolUser: User = {
  id: '00000000-0000-0000-0000-000000000004',
  name: 'Sarah',
  role: 'riding_school',
  trade_type: null,
  is_active: true,
  must_set_pin: false,
  last_login: '2026-02-27T08:00:00Z',
  created_at: '2025-06-01T00:00:00Z',
};

export const inactiveUser: User = {
  id: '00000000-0000-0000-0000-000000000005',
  name: 'OldBob',
  role: 'tradesperson',
  trade_type: 'plumber',
  is_active: false,
  must_set_pin: false,
  last_login: '2025-12-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

export const newUser: User = {
  id: '00000000-0000-0000-0000-000000000006',
  name: 'NewGuy',
  role: 'tradesperson',
  trade_type: 'handyman',
  is_active: true,
  must_set_pin: true,
  last_login: null,
  created_at: '2026-02-28T00:00:00Z',
};

// ── Sessions ───────────────────────────────────────────

export const adminSession: SessionPayload = {
  userId: adminUser.id,
  name: adminUser.name,
  role: 'admin',
  allowedSections: ['weather', 'cart', 'chat', 'new_job'],
};

export const tradespersonSession: SessionPayload = {
  userId: tradesperson.id,
  name: tradesperson.name,
  role: 'tradesperson',
  allowedSections: ['weather', 'cart'],
};

export const ridingSchoolSession: SessionPayload = {
  userId: ridingSchoolUser.id,
  name: ridingSchoolUser.name,
  role: 'riding_school',
  allowedSections: ['weather'],
};

export const tradespersonWithChatSession: SessionPayload = {
  userId: tradesperson.id,
  name: tradesperson.name,
  role: 'tradesperson',
  allowedSections: ['weather', 'cart', 'chat'],
};

export const tradespersonWithNewJobSession: SessionPayload = {
  userId: tradesperson.id,
  name: tradesperson.name,
  role: 'tradesperson',
  allowedSections: ['weather', 'cart', 'new_job'],
};

// ── Tasks ──────────────────────────────────────────────

export const sampleTask: Task = {
  id: '10000000-0000-0000-0000-000000000001',
  title: 'Fix front gate latch',
  description: 'The latch on the front gate is broken',
  status: 'todo',
  priority: 'high',
  category: 'maintenance',
  location: 'front_garden',
  area: 'garden',
  assigned_to: tradesperson.id,
  created_by: adminUser.id,
  due_date: '2026-03-05',
  recurrence_pattern: null,
  recurrence_group_id: null,
  completed_at: null,
  created_at: '2026-02-25T10:00:00Z',
  updated_at: '2026-02-25T10:00:00Z',
  assigned_user: { name: 'Dave' },
  created_user: { name: 'Nick' },
};

export const ridingSchoolTask: Task = {
  id: '10000000-0000-0000-0000-000000000002',
  title: 'Feed PB horses',
  description: 'Morning feed for the 3 PB horses',
  status: 'todo',
  priority: 'urgent',
  category: 'riding_school',
  location: 'paddocks',
  area: 'animals',
  assigned_to: ridingSchoolUser.id,
  created_by: adminUser.id,
  due_date: '2026-02-28',
  recurrence_pattern: 'daily',
  recurrence_group_id: '20000000-0000-0000-0000-000000000001',
  completed_at: null,
  created_at: '2026-02-01T00:00:00Z',
  updated_at: '2026-02-28T06:00:00Z',
  assigned_user: { name: 'Sarah' },
  created_user: { name: 'Nick' },
};

export const completedTask: Task = {
  id: '10000000-0000-0000-0000-000000000003',
  title: 'Mow front lawn',
  description: null,
  status: 'done',
  priority: 'medium',
  category: 'maintenance',
  location: 'front_garden',
  area: 'garden',
  assigned_to: tradesperson.id,
  created_by: adminUser.id,
  due_date: '2026-02-20',
  recurrence_pattern: null,
  recurrence_group_id: null,
  completed_at: '2026-02-20T15:30:00Z',
  created_at: '2026-02-18T10:00:00Z',
  updated_at: '2026-02-20T15:30:00Z',
  assigned_user: { name: 'Dave' },
  created_user: { name: 'Nick' },
};

export const overdueTask: Task = {
  id: '10000000-0000-0000-0000-000000000004',
  title: 'Repair fence in back paddock',
  description: 'Three posts need replacing',
  status: 'in_progress',
  priority: 'urgent',
  category: 'fencing',
  location: 'paddocks',
  area: 'paddocks',
  assigned_to: tradesperson.id,
  created_by: adminUser.id,
  due_date: '2026-02-20',
  recurrence_pattern: null,
  recurrence_group_id: null,
  completed_at: null,
  created_at: '2026-02-15T10:00:00Z',
  updated_at: '2026-02-22T09:00:00Z',
  assigned_user: { name: 'Dave' },
  created_user: { name: 'Nick' },
};

// ── Shopping Items ─────────────────────────────────────

export const shoppingItems: ShoppingItem[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    title: 'Star pickets x20',
    category: 'hardware',
    added_by: adminUser.id,
    assigned_to: adminUser.id,
    is_bought: false,
    created_at: '2026-02-27T10:00:00Z',
    adder: { name: 'Nick' },
    assignee: { name: 'Nick' },
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    title: 'Hay bales x10',
    category: 'hay',
    added_by: adminUser2.id,
    assigned_to: adminUser2.id,
    is_bought: false,
    created_at: '2026-02-26T10:00:00Z',
    adder: { name: 'Anna' },
    assignee: { name: 'Anna' },
  },
];

// ── Chat Messages ──────────────────────────────────────

export const chatMessages: ChatMessage[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    user_id: adminUser.id,
    content: 'Gate was left open yesterday — please check before leaving',
    created_at: '2026-02-28T08:00:00Z',
    user: { name: 'Nick' },
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    user_id: tradesperson.id,
    content: 'Sorry about that, will double check from now on',
    created_at: '2026-02-28T08:15:00Z',
    user: { name: 'Dave' },
  },
];

export const directMessages: DirectMessage[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    sender_id: adminUser.id,
    recipient_id: tradesperson.id,
    content: 'Can you come Thursday instead of Friday?',
    created_at: '2026-02-27T16:00:00Z',
    sender: { name: 'Nick' },
    recipient: { name: 'Dave' },
  },
];

// ── XSS payloads for security tests ────────────────────

export const xssPayloads = [
  '<script>alert("xss")</script>',
  '<img src="x" onerror="alert(1)">',
  'javascript:alert(1)',
  '<svg onload="alert(1)">',
  '"><script>alert(document.cookie)</script>',
  "'; DROP TABLE users; --",
  '<iframe src="javascript:alert(1)">',
  '{{constructor.constructor("alert(1)")()}}',
];

// ── SQL injection payloads ─────────────────────────────

export const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE tasks; --",
  "1; SELECT * FROM users",
  "' UNION SELECT pin_hash FROM users --",
  "Robert'); DROP TABLE users;--",
];
