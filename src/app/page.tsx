'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserOption {
  name: string;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fw-bg" />}>
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
  const [forgotPinSent, setForgotPinSent] = useState(false);
  const [forgotPinLoading, setForgotPinLoading] = useState(false);
  const geoRef = useRef<{ lat: number; lng: number } | null>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch('/api/auth/users?_t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch(() => {
        setError('Could not load users. Please refresh.');
      })
      .finally(() => setUsersLoading(false));

    // Request geolocation eagerly on page load so it's ready by login time
    try {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          geoRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        },
        () => {},
        { timeout: 15000, maximumAge: 120000 }
      );
    } catch { /* geolocation unavailable */ }
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

    // Auto-submit on 4th digit
    if (value && index === 3 && next.every((d) => d !== '')) {
      setTimeout(() => {
        const form = pinRefs.current[0]?.closest('form');
        form?.requestSubmit();
      }, 100);
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

    // Auto-submit if full PIN pasted
    if (pasted.length === 4) {
      setTimeout(() => {
        const form = pinRefs.current[0]?.closest('form');
        form?.requestSubmit();
      }, 100);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPin = pin.join('');
    if (!selectedUser || fullPin.length < 4) return;

    setError('');
    setLoading(true);

    // Use whatever geolocation we have — never block login waiting for it
    const loc = geoRef.current;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedUser,
          pin: fullPin,
          latitude: loc?.lat ?? null,
          longitude: loc?.lng ?? null,
        }),
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

  const nextPinIndex = pin.findIndex((d) => d === '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-fw-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/PBLogo.png"
            alt="Pepperberry Farm"
            className="w-40 mx-auto object-contain rounded-2xl"
          />
        </div>

        {/* Logged out message */}
        {loggedOut && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-fw-surface border border-fw-surface px-4 py-3 text-sm text-fw-text/60">
            <svg className="w-4 h-4 flex-shrink-0 text-fw-text/50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
          className="bg-fw-bg rounded-2xl border border-fw-surface p-8 shadow-2xl shadow-black/60"
        >
          <div className="space-y-6">
            {/* Private notice */}
            <p className="text-center text-xs text-white tracking-wide uppercase">Private and Confidential</p>

            {/* User Select */}
            <div>
              <div className="relative">
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => {
                    setSelectedUser(e.target.value);
                    setPin(['', '', '', '']);
                    setError('');
                    setForgotPinSent(false);
                    if (e.target.value) {
                      setTimeout(() => pinRefs.current[0]?.focus(), 50);
                      // Re-request geolocation on user gesture (helps if initial request was denied)
                      try {
                        navigator.geolocation?.getCurrentPosition(
                          (pos) => {
                            geoRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                          },
                          () => {},
                          { timeout: 15000, maximumAge: 120000 }
                        );
                      } catch { /* geolocation unavailable */ }
                    }
                  }}
                  disabled={usersLoading}
                  className="w-full appearance-none rounded-lg border border-fw-surface bg-fw-surface px-4 py-3 text-sm text-fw-text focus:outline-none focus:ring-2 focus:ring-fw-accent/50 focus:border-fw-accent/50 transition disabled:opacity-50"
                >
                  <option value="">
                    {usersLoading ? 'Loading...' : 'Login as...'}
                  </option>
                  {users.map((u) => (
                    <option key={u.name} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-4 w-4 text-fw-text/40"
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

            {/* PIN Input - always visible, ghosted until user selected */}
            <div className={`transition-opacity duration-300 ${selectedUser ? 'opacity-100' : 'opacity-30'}`}>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <input
                      ref={(el) => { pinRefs.current[i] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      onPaste={i === 0 ? handlePinPaste : undefined}
                      tabIndex={selectedUser ? 0 : -1}
                      disabled={!selectedUser}
                      aria-label={`PIN digit ${i + 1}`}
                      className={`w-14 h-14 text-center text-xl rounded-lg border bg-fw-surface text-fw-text focus:outline-none transition disabled:cursor-not-allowed ${
                        digit
                          ? 'border-fw-accent'
                          : 'border-fw-surface'
                      }`}
                    />
                    <div
                      className={`h-1 rounded-full mt-2 transition-all duration-300 ${
                        selectedUser && (i === nextPinIndex || (nextPinIndex === -1 && digit))
                          ? 'w-14 bg-fw-accent'
                          : selectedUser && digit
                            ? 'w-14 bg-fw-accent/40'
                            : 'w-14 bg-transparent'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Forgot PIN / confirmation / error — fixed-height container */}
            <div className="min-h-[36px] flex items-center justify-center">
              {selectedUser && !forgotPinSent && !error && !loading && (
                <button
                  type="button"
                  disabled={forgotPinLoading}
                  onClick={async () => {
                    setForgotPinLoading(true);
                    try {
                      await fetch('/api/auth/forgot-pin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: selectedUser }),
                      });
                      setForgotPinSent(true);
                    } catch {
                      // silently handle
                    } finally {
                      setForgotPinLoading(false);
                    }
                  }}
                  className="text-xs text-fw-text/40 hover:text-fw-accent transition disabled:opacity-50"
                >
                  {forgotPinLoading ? 'Sending...' : 'Forgot PIN?'}
                </button>
              )}

              {forgotPinSent && (
                <div className="flex items-center gap-2 text-sm text-fw-accent bg-fw-accent/20 rounded-lg px-4 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Your admin has been notified. They will reset your PIN.</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/30 rounded-lg px-4 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {loading && (
                <svg className="w-5 h-5 animate-spin text-fw-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
            <p className="text-center text-[10px] text-fw-text/50 pt-2">version | amber-fern</p>
            <p className="text-center text-[10px] text-fw-text/50">Property of Nick Crawley &copy;2026</p>
          </div>
        </form>
      </div>
    </div>
  );
}
