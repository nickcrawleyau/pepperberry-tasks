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
}

interface UserManagementProps {
  initialUsers: User[];
}

export default function UserManagement({ initialUsers }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Add User Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition"
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
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user,
  onEdit,
  onToggleActive,
}: {
  user: User;
  onEdit: () => void;
  onToggleActive: () => void;
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
      className={`bg-white rounded-xl border border-stone-200 p-4 flex items-center justify-between ${
        !user.is_active ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-stone-800 text-white'
              : user.role === 'tradesperson'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-stone-800">{user.name}</p>
          <p className="text-xs text-stone-400">{roleLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!user.is_active && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
            Inactive
          </span>
        )}
        <button
          onClick={onEdit}
          className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 transition"
        >
          Edit
        </button>
        <button
          onClick={onToggleActive}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
            user.is_active
              ? 'border-red-200 text-red-500 hover:bg-red-50'
              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

function AddUserForm({ onDone }: { onDone: (user: User | null) => void }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('tradesperson');
  const [tradeType, setTradeType] = useState('');
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
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';
  const selectClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-stone-200 p-5 space-y-4"
    >
      <p className="text-sm font-medium text-stone-700">Add New User</p>

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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || pin.length < 4}
          className="px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
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
      });
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';
  const selectClass =
    'w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border-2 border-stone-300 p-5 space-y-4"
    >
      <p className="text-sm font-medium text-stone-700">Edit User</p>

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
            Reset PIN <span className="text-stone-400 font-normal">(leave blank to keep)</span>
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => onDone(null)}
          className="px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
