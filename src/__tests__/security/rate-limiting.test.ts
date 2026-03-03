import { describe, it, expect } from 'vitest';

describe('Rate Limiting', () => {
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

  function createRateLimiter() {
    const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

    function isLocked(ip: string, now: number): boolean {
      const entry = failedAttempts.get(ip);
      if (!entry) return false;
      if (entry.lockedUntil > now) return true;
      if (entry.lockedUntil <= now && entry.count >= MAX_ATTEMPTS) {
        failedAttempts.delete(ip);
      }
      return false;
    }

    function recordFailure(ip: string, now: number) {
      const entry = failedAttempts.get(ip);
      const count = (entry?.count ?? 0) + 1;
      failedAttempts.set(ip, {
        count,
        lockedUntil: count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0,
      });
    }

    function clearFailures(ip: string) {
      failedAttempts.delete(ip);
    }

    function getAttemptCount(ip: string): number {
      return failedAttempts.get(ip)?.count ?? 0;
    }

    return { isLocked, recordFailure, clearFailures, getAttemptCount };
  }

  it('allows login attempts before reaching limit', () => {
    const limiter = createRateLimiter();
    const now = Date.now();

    expect(limiter.isLocked('10.0.0.1', now)).toBe(false);
    limiter.recordFailure('10.0.0.1', now);
    expect(limiter.isLocked('10.0.0.1', now)).toBe(false);
    limiter.recordFailure('10.0.0.1', now);
    expect(limiter.isLocked('10.0.0.1', now)).toBe(false);
  });

  it('locks after 3 failed attempts', () => {
    const limiter = createRateLimiter();
    const now = Date.now();

    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);

    expect(limiter.isLocked('10.0.0.1', now)).toBe(true);
    expect(limiter.getAttemptCount('10.0.0.1')).toBe(3);
  });

  it('lockout lasts 30 minutes', () => {
    const limiter = createRateLimiter();
    const now = Date.now();

    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);

    // Still locked at 29 minutes
    expect(limiter.isLocked('10.0.0.1', now + 29 * 60 * 1000)).toBe(true);

    // Unlocked at 31 minutes
    expect(limiter.isLocked('10.0.0.1', now + 31 * 60 * 1000)).toBe(false);
  });

  it('successful login clears failure count', () => {
    const limiter = createRateLimiter();
    const now = Date.now();

    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);
    expect(limiter.getAttemptCount('10.0.0.1')).toBe(2);

    limiter.clearFailures('10.0.0.1');
    expect(limiter.getAttemptCount('10.0.0.1')).toBe(0);
  });

  it('tracks IPs independently', () => {
    const limiter = createRateLimiter();
    const now = Date.now();

    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);
    limiter.recordFailure('10.0.0.1', now);

    limiter.recordFailure('10.0.0.2', now);

    expect(limiter.isLocked('10.0.0.1', now)).toBe(true);
    expect(limiter.isLocked('10.0.0.2', now)).toBe(false);
  });

  it('calculates minutes remaining correctly', () => {
    const now = Date.now();
    const lockedUntil = now + 15 * 60 * 1000; // 15 minutes from now
    const minsLeft = Math.ceil((lockedUntil - now) / 60000);
    expect(minsLeft).toBe(15);
  });

  it('handles unknown IPs as not locked', () => {
    const limiter = createRateLimiter();
    expect(limiter.isLocked('never-seen', Date.now())).toBe(false);
  });

  it('in-memory storage resets on restart', () => {
    // Note: This is a known limitation — rate limiting is lost on server restart
    const limiter1 = createRateLimiter();
    limiter1.recordFailure('10.0.0.1', Date.now());

    // Simulating server restart
    const limiter2 = createRateLimiter();
    expect(limiter2.getAttemptCount('10.0.0.1')).toBe(0);
  });
});
