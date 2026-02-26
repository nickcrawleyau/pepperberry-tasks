'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'tradesperson', label: 'Tradie' },
  { value: 'riding_school', label: 'Regal Riding' },
] as const;

const TRADE_TYPES = [
  'fencer',
  'plumber',
  'electrician',
  'handyman',
  'landscaper',
  'housekeeper',
  'general',
  'animal_carer',
] as const;

const SECTIONS = [
  { value: 'new_job', label: 'New Job' },
  { value: 'weather', label: 'Weather' },
  { value: 'cart', label: 'Cart' },
  { value: 'chat', label: 'Messages' },
] as const;

interface User {
  id: string;
  name: string;
  role: string;
  trade_type: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  phone: string | null;
  allowed_sections: string[];
  failed_login_count: number;
  failed_logins_since: string;
}

interface UserManagementProps {
  initialUsers: User[];
  currentUserId: string;
  loginsByUser: Record<string, Record<string, number>>;
}

export default function UserManagement({ initialUsers, currentUserId, loginsByUser }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [logoutAllDone, setLogoutAllDone] = useState(false);

  async function handleLogoutAll() {
    setLogoutAllLoading(true);
    try {
      const res = await fetch('/api/auth/logout-all', { method: 'POST' });
      if (res.ok) {
        setLogoutAllDone(true);
        setTimeout(() => setLogoutAllDone(false), 3000);
      }
    } finally {
      setLogoutAllLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add User
          </button>
        )}
        <button
          onClick={handleLogoutAll}
          disabled={logoutAllLoading || logoutAllDone}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-900/20 transition disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {logoutAllDone ? 'All users logged out' : logoutAllLoading ? 'Logging out...' : 'Log out all users'}
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <AddUserForm
          onDone={(user) => {
            if (user) setUsers([...users, user]);
            setShowAddForm(false);
          }}
        />
      )}

      {/* User List */}
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id}>
            {editingId === user.id ? (
              <EditUserForm
                user={user}
                onDone={(updated) => {
                  if (updated) {
                    setUsers(users.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
                    router.refresh();
                  }
                  setEditingId(null);
                }}
              />
            ) : (
              <UserRow
                user={user}
                isSelf={user.id === currentUserId}
                isDeleting={deletingId === user.id}
                deleteLoading={deleteLoading}
                loginCounts={loginsByUser[user.id] || {}}
                onEdit={() => setEditingId(user.id)}
                onToggleActive={async () => {
                  const res = await fetch(`/api/users/${user.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: !user.is_active }),
                  });
                  if (res.ok) {
                    setUsers(
                      users.map((u) =>
                        u.id === user.id ? { ...u, is_active: !u.is_active } : u
                      )
                    );
                  }
                }}
                onDeleteClick={() => setDeletingId(user.id)}
                onDeleteCancel={() => setDeletingId(null)}
                onDeleteConfirm={async () => {
                  setDeleteLoading(true);
                  try {
                    const res = await fetch(`/api/users/${user.id}`, {
                      method: 'DELETE',
                    });
                    if (res.ok) {
                      setUsers(users.filter((u) => u.id !== user.id));
                      router.refresh();
                    }
                  } finally {
                    setDeleteLoading(false);
                    setDeletingId(null);
                  }
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLastLogin(dateStr: string): string {
  const date = new Date(dateStr);
  const dayName = date.toLocaleDateString('en-AU', { weekday: 'long', timeZone: 'Australia/Sydney' });
  const day = date.toLocaleDateString('en-AU', { day: 'numeric', timeZone: 'Australia/Sydney' });
  const month = date.toLocaleDateString('en-AU', { month: 'numeric', timeZone: 'Australia/Sydney' });
  const year = date.toLocaleDateString('en-AU', { year: '2-digit', timeZone: 'Australia/Sydney' });
  const time = date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Australia/Sydney' });
  return `${dayName} ${day}/${month}/${year} at ${time}`;
}

/** Check if failed login counter is within the 7-day window */
function isFailedLoginsActive(sinceStr: string): boolean {
  if (!sinceStr) return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(sinceStr).getTime() >= sevenDaysAgo;
}

/** Check if user has an active session right now (same Sydney day + within 3h) */
function isLoggedInNow(lastLogin: string | null): boolean {
  if (!lastLogin) return false;
  const now = new Date();
  const loginTime = new Date(lastLogin);
  const threeHoursMs = 3 * 60 * 60 * 1000;
  if (now.getTime() - loginTime.getTime() > threeHoursMs) return false;
  const todaySydney = now.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  const loginDaySydney = loginTime.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
  return loginDaySydney === todaySydney;
}

function UserRow({
  user,
  isSelf,
  isDeleting,
  deleteLoading,
  loginCounts,
  onEdit,
  onToggleActive,
  onDeleteClick,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  user: User;
  isSelf: boolean;
  isDeleting: boolean;
  deleteLoading: boolean;
  loginCounts: Record<string, number>;
  onEdit: () => void;
  onToggleActive: () => void;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const roleLabel =
    user.role === 'riding_school'
      ? 'Regal Riding'
      : user.role === 'tradesperson'
        ? user.trade_type
          ? user.trade_type.charAt(0).toUpperCase() + user.trade_type.slice(1)
          : 'Tradie'
        : 'Admin';

  return (
    <div
      className={`bg-fw-surface rounded-xl border p-4 ${
        isSelf ? 'border-emerald-400 border-2' : 'border-fw-surface'
      } ${!user.is_active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isLoggedInNow(user.last_login) ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                user.role === 'admin'
                  ? 'bg-fw-surface text-fw-text/80'
                  : user.role === 'tradesperson'
                    ? 'bg-fw-accent/20 text-fw-accent'
                    : 'bg-emerald-900/40 text-emerald-500'
              }`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-fw-text">{user.name}</p>
            <p className="text-xs text-fw-text/50">{roleLabel}</p>
            {user.phone && (
              <a
                href={`tel:${user.phone.replace(/\s/g, '')}`}
                className="text-xs text-fw-accent hover:text-fw-accent transition"
              >
                {user.phone}
              </a>
            )}
            <p className="text-xs text-fw-text/40">
              {user.last_login
                ? `Last login: ${formatLastLogin(user.last_login)}`
                : 'Never logged in'}
            </p>
            {isFailedLoginsActive(user.failed_logins_since) && user.failed_login_count > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-xs font-medium text-red-500">
                  {user.failed_login_count} failed login{user.failed_login_count !== 1 ? 's' : ''} this week
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEdit}
            title="Edit user"
            className="p-1.5 rounded-lg text-fw-text/40 hover:text-fw-text/80 hover:bg-fw-bg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          {!isSelf && (
            <button
              onClick={onDeleteClick}
              title="Delete user"
              className="p-1.5 rounded-lg text-fw-text/40 hover:text-red-600 hover:bg-red-900/30 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}
          <button
            onClick={onToggleActive}
            role="switch"
            aria-checked={user.is_active}
            aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              user.is_active ? 'bg-emerald-600' : 'bg-stone-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-fw-surface shadow transition-transform ${
                user.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 14-day login history */}
      <LoginHistory loginCounts={loginCounts || {}} />

      {isDeleting && (
        <div className="mt-3 pt-3 border-t border-fw-surface">
          <p className="text-xs text-fw-text/50 mb-2">
            Delete <span className="text-fw-text font-medium">{user.name}</span>? Their open tasks will be transferred to you.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onDeleteConfirm}
              disabled={deleteLoading}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={onDeleteCancel}
              disabled={deleteLoading}
              className="px-3 py-1.5 rounded-lg border border-fw-text/20 text-xs font-medium text-fw-text/80 hover:bg-fw-surface transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginHistory({ loginCounts }: { loginCounts: Record<string, number> }) {
  // Build array of last 14 days (oldest first)
  const days: { date: string; label: string; count: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    const dayLabel = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', timeZone: 'Australia/Sydney' });
    days.push({
      date: dateStr,
      label: dayLabel,
      count: loginCounts[dateStr] || 0,
    });
  }

  return (
    <div className="mt-2 pt-2 border-t border-fw-surface">
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-fw-text/30 w-6 shrink-0">14d</span>
        <div className="flex gap-0.5 flex-1">
          {days.map((day) => (
            <div
              key={day.date}
              title={`${day.label}: ${day.count} login${day.count !== 1 ? 's' : ''}`}
              className={`flex-1 h-2.5 rounded-sm ${
                day.count > 3
                  ? 'bg-red-500'
                  : day.count > 0
                    ? 'bg-emerald-500'
                    : 'bg-fw-bg'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: (user: User | null) => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('tradesperson');
  const [tradeType, setTradeType] = useState('');
  const [phone, setPhone] = useState('');
  const [allowedSections, setAllowedSections] = useState<string[]>(['weather', 'cart', 'chat']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          pin,
          role,
          trade_type: role === 'tradesperson' ? tradeType || null : null,
          phone: phone.trim() || null,
          allowed_sections: role === 'admin' ? ['weather', 'cart', 'chat'] : allowedSections,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }
      onDone(data.user);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface placeholder:text-fw-text/30 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';
  const selectClass =
    'w-full rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-fw-surface rounded-xl border border-fw-surface p-5 space-y-4"
    >
      <p className="text-sm font-medium text-fw-text">Add New User</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">PIN *</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 digits"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">Role *</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={selectClass}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {role === 'tradesperson' && (
          <div>
            <label className="block text-xs font-medium text-fw-text/50 mb-1">Specialty</label>
            <select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-fw-text/50 mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="04XX XXX XXX"
          className={inputClass}
        />
      </div>

      {role !== 'admin' && (
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">Sections</label>
          <div className="flex gap-4">
            {SECTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm text-fw-text/80">
                <input
                  type="checkbox"
                  checked={allowedSections.includes(s.value)}
                  onChange={(e) => {
                    setAllowedSections(
                      e.target.checked
                        ? [...allowedSections, s.value]
                        : allowedSections.filter((v) => v !== s.value)
                    );
                  }}
                  className="rounded border-fw-text/20 text-fw-accent focus:ring-fw-accent"
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="px-4 py-2 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditUserForm({
  user,
  onDone,
}: {
  user: User;
  onDone: (updated: Partial<User> | null) => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [tradeType, setTradeType] = useState(user.trade_type || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [allowedSections, setAllowedSections] = useState<string[]>(user.allowed_sections || ['weather', 'cart']);
  const [newPin, setNewPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const updates: Record<string, unknown> = {};
    if (name.trim() !== user.name) updates.name = name.trim();
    if (role !== user.role) updates.role = role;
    if (role === 'tradesperson') {
      if (tradeType !== (user.trade_type || '')) updates.trade_type = tradeType || null;
    } else if (user.trade_type) {
      updates.trade_type = null;
    }
    if (newPin) updates.pin = newPin;
    if (phone.trim() !== (user.phone || '')) {
      updates.phone = phone.trim() || null;
    }
    const currentSections = user.allowed_sections || ['weather', 'cart', 'chat'];
    if (JSON.stringify([...allowedSections].sort()) !== JSON.stringify([...currentSections].sort())) {
      updates.allowed_sections = allowedSections;
    }

    if (Object.keys(updates).length === 0) {
      onDone(null);
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update user');
        return;
      }

      onDone({
        name: name.trim(),
        role,
        trade_type: role === 'tradesperson' ? tradeType || null : null,
        phone: phone.trim() || null,
        allowed_sections: role === 'admin' ? ['weather', 'cart', 'chat'] : allowedSections,
      });
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface placeholder:text-fw-text/30 focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';
  const selectClass =
    'w-full rounded-lg border border-fw-surface px-3 py-2 text-sm text-fw-text bg-fw-surface focus:outline-none focus:ring-2 focus:ring-fw-accent focus:border-transparent transition';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-fw-surface rounded-xl border-2 border-fw-text/20 p-5 space-y-4"
    >
      <p className="text-sm font-medium text-fw-text">Edit User</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">
            Reset PIN <span className="text-fw-text/50 font-normal">(leave blank to keep)</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="New 4-digit PIN"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={selectClass}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {role === 'tradesperson' && (
          <div>
            <label className="block text-xs font-medium text-fw-text/50 mb-1">Specialty</label>
            <select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value)}
              className={selectClass}
            >
              <option value="">None</option>
              {TRADE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-fw-text/50 mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="04XX XXX XXX"
          className={inputClass}
        />
      </div>

      {role !== 'admin' && (
        <div>
          <label className="block text-xs font-medium text-fw-text/50 mb-1">Sections</label>
          <div className="flex gap-4">
            {SECTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-sm text-fw-text/80">
                <input
                  type="checkbox"
                  checked={allowedSections.includes(s.value)}
                  onChange={(e) => {
                    setAllowedSections(
                      e.target.checked
                        ? [...allowedSections, s.value]
                        : allowedSections.filter((v) => v !== s.value)
                    );
                  }}
                  className="rounded border-fw-text/20 text-fw-accent focus:ring-fw-accent"
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-fw-accent text-white text-sm font-medium hover:bg-fw-hover transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="px-4 py-2 rounded-lg border border-fw-text/20 text-sm font-medium text-fw-text/80 hover:bg-fw-surface transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
