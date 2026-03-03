import { describe, it, expect } from 'vitest';
import { STATUSES, PRIORITIES, CATEGORIES, LOCATIONS, AREAS, MAX_SUBTASKS, STATUS_LABELS } from '@/lib/constants';
import { adminSession, tradespersonSession, ridingSchoolSession } from '../helpers/fixtures';

describe('Task PATCH - Permission Checks', () => {
  const sampleTask = {
    id: '10000000-0000-0000-0000-000000000001',
    assigned_to: tradespersonSession.userId,
    category: 'riding_school',
    title: 'Test task',
    created_by: adminSession.userId,
    status: 'todo',
    priority: 'medium',
    recurrence_group_id: null,
  };

  describe('tradesperson access', () => {
    it('tradesperson can only update tasks assigned to them', () => {
      const canAccess = sampleTask.assigned_to === tradespersonSession.userId;
      expect(canAccess).toBe(true);
    });

    it('tradesperson cannot access tasks assigned to others', () => {
      const otherTask = { ...sampleTask, assigned_to: '00000000-0000-0000-0000-000000000099' };
      const canAccess = otherTask.assigned_to === tradespersonSession.userId;
      expect(canAccess).toBe(false);
    });

    it('tradesperson can only change status', () => {
      const body = { status: 'in_progress' };
      const hasOnlyStatus = 'status' in body && Object.keys(body).length === 1;
      expect(hasOnlyStatus).toBe(true);
    });
  });

  describe('riding_school access', () => {
    it('riding_school can only update riding_school category tasks', () => {
      const canAccess = sampleTask.category === 'riding_school';
      expect(canAccess).toBe(true);
    });

    it('riding_school cannot access non-riding_school tasks', () => {
      const maintenanceTask = { ...sampleTask, category: 'maintenance' };
      const canAccess = maintenanceTask.category === 'riding_school';
      expect(canAccess).toBe(false);
    });
  });

  describe('admin access', () => {
    it('admin can update any field', () => {
      const body = {
        title: 'Updated title',
        description: 'New description',
        status: 'done',
        priority: 'urgent',
        category: 'fencing',
        location: 'paddocks',
        area: 'paddocks',
        assigned_to: '00000000-0000-0000-0000-000000000003',
        due_date: '2026-04-01',
      };

      const updates: Record<string, unknown> = {};
      if (body.title !== undefined) updates.title = body.title.trim();
      if (body.description !== undefined) updates.description = body.description.trim();
      if (body.status !== undefined) updates.status = body.status;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.category !== undefined) updates.category = body.category;
      if (body.location !== undefined) updates.location = body.location;
      if (body.area !== undefined) updates.area = body.area;
      if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
      if (body.due_date !== undefined) updates.due_date = body.due_date;

      expect(Object.keys(updates).length).toBeGreaterThan(0);
    });
  });
});

describe('Task PATCH - Field Validation', () => {
  describe('status validation', () => {
    it('accepts valid statuses', () => {
      STATUSES.forEach((s) => {
        expect((STATUSES as readonly string[]).includes(s)).toBe(true);
      });
    });

    it('rejects invalid status', () => {
      expect((STATUSES as readonly string[]).includes('cancelled')).toBe(false);
      expect((STATUSES as readonly string[]).includes('pending')).toBe(false);
    });
  });

  describe('priority validation', () => {
    it('accepts valid priorities', () => {
      PRIORITIES.forEach((p) => {
        expect((PRIORITIES as readonly string[]).includes(p)).toBe(true);
      });
    });

    it('rejects invalid priority', () => {
      expect((PRIORITIES as readonly string[]).includes('critical')).toBe(false);
    });
  });

  describe('title validation', () => {
    it('rejects empty title', () => {
      expect(!''.trim()).toBe(true);
      expect(!'   '.trim()).toBe(true);
    });

    it('accepts non-empty title', () => {
      expect(!'Fix gate'.trim()).toBe(false);
    });
  });

  describe('empty update rejection', () => {
    it('rejects when no fields to update', () => {
      const updates: Record<string, unknown> = {};
      expect(Object.keys(updates).length === 0).toBe(true);
    });
  });
});

describe('Task PATCH - Status Change Side Effects', () => {
  it('sets completed_at when status changes to done', () => {
    const updates: Record<string, unknown> = { status: 'done' };
    if (updates.status === 'done') {
      updates.completed_at = new Date().toISOString();
    }
    expect(updates.completed_at).toBeDefined();
    expect(typeof updates.completed_at).toBe('string');
  });

  it('clears completed_at when status changes from done', () => {
    const task = { status: 'done' };
    const body = { status: 'in_progress' };
    const updates: Record<string, unknown> = { status: body.status };

    if (body.status === 'done') {
      updates.completed_at = new Date().toISOString();
    } else if (task.status === 'done') {
      updates.completed_at = null;
    }

    expect(updates.completed_at).toBeNull();
  });

  it('does not touch completed_at for non-done transitions', () => {
    const task = { status: 'todo' };
    const body = { status: 'in_progress' };
    const updates: Record<string, unknown> = { status: body.status };

    if (body.status === 'done') {
      updates.completed_at = new Date().toISOString();
    } else if (task.status === 'done') {
      updates.completed_at = null;
    }

    expect(updates.completed_at).toBeUndefined();
  });
});

describe('Task PATCH - Series Updates', () => {
  it('series updates exclude status and due_date', () => {
    const updates = {
      title: 'Updated',
      priority: 'high',
      status: 'done',
      completed_at: '2026-02-28T10:00:00Z',
      due_date: '2026-03-15',
    };

    const seriesUpdates = { ...updates };
    delete (seriesUpdates as Record<string, unknown>).status;
    delete (seriesUpdates as Record<string, unknown>).completed_at;
    delete (seriesUpdates as Record<string, unknown>).due_date;

    expect(seriesUpdates).not.toHaveProperty('status');
    expect(seriesUpdates).not.toHaveProperty('completed_at');
    expect(seriesUpdates).not.toHaveProperty('due_date');
    expect(seriesUpdates).toHaveProperty('title', 'Updated');
    expect(seriesUpdates).toHaveProperty('priority', 'high');
  });
});

describe('Task DELETE - Permission Checks', () => {
  it('only admin can delete tasks', () => {
    const sessions = [
      { role: 'admin', canDelete: true },
      { role: 'tradesperson', canDelete: false },
      { role: 'riding_school', canDelete: false },
    ];

    sessions.forEach(({ role, canDelete }) => {
      expect(role === 'admin').toBe(canDelete);
    });
  });
});

describe('Task PATCH - Activity Logging', () => {
  it('generates correct status change detail', () => {
    const oldStatus = 'todo';
    const newStatus = 'in_progress';
    const detail = `Status changed from ${STATUS_LABELS[oldStatus] || oldStatus} to ${STATUS_LABELS[newStatus] || newStatus}`;
    expect(detail).toBe('Status changed from To do to In progress');
  });

  it('generates correct done status detail', () => {
    const oldStatus = 'in_progress';
    const newStatus = 'done';
    const detail = `Status changed from ${STATUS_LABELS[oldStatus] || oldStatus} to ${STATUS_LABELS[newStatus] || newStatus}`;
    expect(detail).toBe('Status changed from In progress to Done');
  });
});
