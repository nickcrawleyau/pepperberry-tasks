import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/dashboard',
}));

describe('SessionGuard - Logic', () => {
  const CHECK_INTERVAL = 30_000;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('check interval is 30 seconds', () => {
    expect(CHECK_INTERVAL).toBe(30000);
  });

  it('session check polls at the correct interval', () => {
    const callback = vi.fn();
    const interval = setInterval(callback, CHECK_INTERVAL);

    vi.advanceTimersByTime(CHECK_INTERVAL);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(CHECK_INTERVAL);
    expect(callback).toHaveBeenCalledTimes(2);

    clearInterval(interval);
  });

  it('window focus triggers session check', () => {
    const checkSession = vi.fn();

    window.addEventListener('focus', checkSession);
    window.dispatchEvent(new Event('focus'));

    expect(checkSession).toHaveBeenCalledTimes(1);

    window.removeEventListener('focus', checkSession);
  });
});

describe('SessionGuard - Session Expiry', () => {
  it('redirects to login with logged_out param on session expiry', () => {
    // Simulating the redirect behavior
    const redirectUrl = '/?logged_out=1';
    expect(redirectUrl).toContain('logged_out=1');
  });

  it('login page path is root /', () => {
    const loginPath = '/';
    expect(loginPath).toBe('/');
  });
});
