'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'tradesperson', label: 'Tradesperson' },
  { value: 'riding_school', label: 'Riding School' },
] as const;

const TRADE_TYPES = [
  'fencer',
  'plumber',
  'electrician',
  'handyman',
  'landscaper',
  'general',
  'animal_carer',
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
}

interface UserManagementProps {
  initialUsers: User[];
  currentUserId: string;
}

export default function UserManagement({ initialUsers, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Add User Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition"
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
  const dayName = date.toLocaleDateString('en-AU', { weekday: 'long' });
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = String(date.getFullYear()).slice(-2);
  return `${dayName} ${day}/${month}/${year}`;
}

/** Check if user logged in after the most recent midnight AEST (13:00 UTC) */
function isLoggedInToday(lastLogin: string | null): boolean {
  if (!lastLogin) return false;
  const now = new Date();
  const utcHours = now.getUTCHours();
  // Most recent midnight AEST = today 13:00 UTC if current UTC >= 13, else yesterday 13:00 UTC
  const midnightAEST = new Date(now);
  midnightAEST.setUTCMinutes(0, 0, 0);
  if (utcHours >= 13) {
    midnightAEST.setUTCHours(13);
  } else {
    midnightAEST.setUTCHours(13);
    midnightAEST.setUTCDate(midnightAEST.getUTCDate() - 1);
  }
  return new Date(lastLogin) >= midnightAEST;
}

function UserRow({
  user,
  isSelf,
  isDeleting,
  deleteLoading,
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
  onEdit: () => void;
  onToggleActive: () => void;
  onDeleteClick: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const roleLabel =
    user.role === 'riding_school'
      ? 'Riding School'
      : user.role === 'tradesperson'
        ? user.trade_type
          ? user.trade_type.charAt(0).toUpperCase() + user.trade_type.slice(1)
          : 'Tradesperson'
        : 'Admin';

  return (
    <div
      className={`bg-white rounded-xl border p-4 ${
        isSelf ? 'border-emerald-400 border-2' : 'border-stone-200'
      } ${!user.is_active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isLoggedInToday(user.last_login) ? 'ring-2 ring-emerald-500' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                user.role === 'admin'
                  ? 'bg-stone-200 text-stone-700'
                  : user.role === 'tradesperson'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-900">{user.name}</p>
            <p className="text-xs text-stone-500">{roleLabel}</p>
            {user.phone && (
              <a
                href={`tel:${user.phone.replace(/\s/g, '')}`}
                className="text-xs text-amber-600 hover:text-amber-500 transition"
              >
                {user.phone}
              </a>
            )}
            <p className="text-xs text-stone-400">
              {user.last_login
                ? `Last login: ${formatLastLogin(user.last_login)}`
                : 'Never logged in'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEdit}
            title="Edit user"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
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
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
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
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                user.is_active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {isDeleting && (
        <div className="mt-3 pt-3 border-t border-stone-200">
          <p className="text-xs text-stone-500 mb-2">
            Delete <span className="text-stone-900 font-medium">{user.name}</span>? Their open tasks will be transferred to you.
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
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: (user: User | null) => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('tradesperson');
  const [tradeType, setTradeType] = useState('');
  const [phone, setPhone] = useState('');
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
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 bg-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';
  const selectClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-stone-200 p-5 space-y-4"
    >
      <p className="text-sm font-medium text-stone-900">Add New User</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Name *</label>
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
          <label className="block text-xs font-medium text-stone-500 mb-1">PIN *</label>
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
          <label className="block text-xs font-medium text-stone-500 mb-1">Role *</label>
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
            <label className="block text-xs font-medium text-stone-500 mb-1">Specialty</label>
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
        <label className="block text-xs font-medium text-stone-500 mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="04XX XXX XXX"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
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
      });
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 bg-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';
  const selectClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border-2 border-stone-300 p-5 space-y-4"
    >
      <p className="text-sm font-medium text-stone-900">Edit User</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">
            Reset PIN <span className="text-stone-500 font-normal">(leave blank to keep)</span>
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
          <label className="block text-xs font-medium text-stone-500 mb-1">Role</label>
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
            <label className="block text-xs font-medium text-stone-500 mb-1">Specialty</label>
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
        <label className="block text-xs font-medium text-stone-500 mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="04XX XXX XXX"
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="px-4 py-2 rounded-lg border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
