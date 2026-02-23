'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SetPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleDigit(
    index: number,
    value: string,
    current: string[],
    setter: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const next = [...current];
    next[index] = value;
    setter(next);
    setError('');

    if (value && index < 3) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent,
    current: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) {
    if (e.key === 'Backspace' && !current[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(
    e: React.ClipboardEvent,
    setter: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const next = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setter(next);
    setError('');
    refs.current[Math.min(pasted.length, 3)]?.focus();
  }

  function handleEnterSubmit(e: React.FormEvent) {
    e.preventDefault();
    const full = pin.join('');
    if (full.length < 4) return;
    setStep('confirm');
    setTimeout(() => confirmRefs.current[0]?.focus(), 50);
  }

  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPin = pin.join('');
    const fullConfirm = confirmPin.join('');

    if (fullConfirm.length < 4) return;

    if (fullPin !== fullConfirm) {
      setError('PINs do not match. Try again.');
      setConfirmPin(['', '', '', '']);
      confirmRefs.current[0]?.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      });

      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to set PIN');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const enterFull = pin.join('').length === 4;
  const confirmFull = confirmPin.join('').length === 4;
  const nextPinIndex = pin.findIndex((d) => d === '');
  const nextConfirmIndex = confirmPin.findIndex((d) => d === '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/PBFlavicon.jpg"
            alt="Pepperberry Farm"
            className="w-40 mx-auto object-contain rounded-2xl"
          />
        </div>

        <div className="bg-stone-900 rounded-2xl border border-stone-700 p-8 shadow-xl shadow-black/20">
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-stone-100">Set Your PIN</h2>
            <p className="text-xs text-stone-400 mt-1">
              {step === 'enter'
                ? 'Choose a 4-digit PIN you\'ll use to sign in.'
                : 'Enter your PIN again to confirm.'}
            </p>
          </div>

          {step === 'enter' ? (
            <form onSubmit={handleEnterSubmit} className="space-y-6">
              <div className="flex gap-3 justify-center">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { pinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigit(i, e.target.value, pin, setPin, pinRefs)}
                    onKeyDown={(e) => handleKeyDown(i, e, pin, pinRefs)}
                    onPaste={i === 0 ? (e) => handlePaste(e, setPin, pinRefs) : undefined}
                    autoFocus={i === 0}
                    aria-label={`New PIN digit ${i + 1}`}
                    className={`w-14 h-14 text-center text-xl rounded-lg border bg-stone-800 text-stone-100 focus:outline-none transition ${
                      i === nextPinIndex
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                        : 'border-stone-700'
                    }`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={!enterFull}
                className="w-full rounded-lg bg-amber-600 py-3 text-sm font-medium text-white hover:bg-amber-500 active:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmSubmit} className="space-y-6">
              <div className="flex gap-3 justify-center">
                {confirmPin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { confirmRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigit(i, e.target.value, confirmPin, setConfirmPin, confirmRefs)}
                    onKeyDown={(e) => handleKeyDown(i, e, confirmPin, confirmRefs)}
                    onPaste={i === 0 ? (e) => handlePaste(e, setConfirmPin, confirmRefs) : undefined}
                    aria-label={`Confirm PIN digit ${i + 1}`}
                    className={`w-14 h-14 text-center text-xl rounded-lg border bg-stone-800 text-stone-100 focus:outline-none transition ${
                      i === nextConfirmIndex
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                        : 'border-stone-700'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/30 rounded-lg px-4 py-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={!confirmFull || loading}
                  className="w-full rounded-lg bg-amber-600 py-3 text-sm font-medium text-white hover:bg-amber-500 active:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Setting PIN...
                    </span>
                  ) : (
                    'Confirm & Continue'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('enter');
                    setPin(['', '', '', '']);
                    setConfirmPin(['', '', '', '']);
                    setError('');
                    setTimeout(() => pinRefs.current[0]?.focus(), 50);
                  }}
                  className="w-full rounded-lg border border-stone-700 py-2.5 text-xs font-medium text-stone-400 hover:text-stone-200 hover:border-stone-500 transition"
                >
                  Start Over
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
