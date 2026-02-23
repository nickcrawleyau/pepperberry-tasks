'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserOption {
  id: string;
  name: string;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loggedOut = searchParams.get('logged_out') === '1';
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch(() => {
        setError('Could not load users. Please refresh.');
      })
      .finally(() => setUsersLoading(false));
  }, []);

  function handlePinChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError('');

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  }

  function handlePinPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const next = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setPin(next);
    setError('');

    const focusIndex = Math.min(pasted.length, 3);
    pinRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPin = pin.join('');
    if (!selectedUser || fullPin.length < 4) return;

    setError('');
    setLoading(true);

    const user = users.find((u) => u.id === selectedUser);
    if (!user) return;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.name, pin: fullPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setPin(['', '', '', '']);
        pinRefs.current[0]?.focus();
        return;
      }

      router.push(data.must_set_pin ? '/set-pin' : '/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fullPin = pin.join('');
  const canSubmit = selectedUser && fullPin.length === 4 && !loading;
  const nextPinIndex = pin.findIndex((d) => d === '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/PBFlavicon.jpg"
            alt="Pepperberry Farm"
            className="w-40 mx-auto object-contain rounded-2xl"
          />
        </div>

        {/* Logged out message */}
        {loggedOut && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-stone-800 border border-stone-700 px-4 py-3 text-sm text-stone-300">
            <svg className="w-4 h-4 flex-shrink-0 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logged out
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-stone-900 rounded-2xl border border-stone-700 p-8 shadow-xl shadow-black/20"
        >
          <div className="space-y-6">
            {/* User Select */}
            <div>
              <div className="relative">
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setError('');
                    if (e.target.value) pinRefs.current[0]?.focus();
                  }}
                  disabled={usersLoading}
                  className="w-full appearance-none rounded-lg border border-stone-700 bg-stone-800 px-4 py-3 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-600/50 transition disabled:opacity-50"
                >
                  <option value="">
                    {usersLoading ? 'Loading...' : 'Select your name'}
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* PIN Input */}
            <div>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { pinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    onPaste={i === 0 ? handlePinPaste : undefined}
                    aria-label={`PIN digit ${i + 1}`}
                    className={`w-14 h-14 text-center text-xl rounded-lg border bg-stone-800 text-stone-100 focus:outline-none transition ${
                      i === nextPinIndex
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                        : 'border-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/30 rounded-lg px-4 py-2.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-lg bg-amber-600 py-3 text-sm font-medium text-white hover:bg-amber-500 active:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
