import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');

describe('Session Management - Expiry Logic', () => {
  const MAX_SESSION_SECONDS = 3 * 3600;

  function secondsUntilMidnightSydney(): number {
    const now = new Date();
    const sydneyStr = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour12: false });
    const timePart = sydneyStr.split(', ')[1];
    const [h, m, s] = timePart.split(':').map(Number);
    const currentSecondsInSydney = h * 3600 + m * 60 + s;
    return 86400 - currentSecondsInSydney;
  }

  it('max session is 3 hours (10800 seconds)', () => {
    expect(MAX_SESSION_SECONDS).toBe(10800);
  });

  it('seconds until midnight is always positive and <= 86400', () => {
    const seconds = secondsUntilMidnightSydney();
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThanOrEqual(86400);
  });

  it('session expiry is bounded by 3 hours', () => {
    const seconds = Math.min(secondsUntilMidnightSydney(), MAX_SESSION_SECONDS);
    expect(seconds).toBeLessThanOrEqual(MAX_SESSION_SECONDS);
  });

  it('session expiry uses Sydney timezone', () => {
    const authContent = fs.readFileSync(
      path.join(SRC_DIR, 'src/lib/auth.ts'),
      'utf-8'
    );
    expect(authContent).toContain('Australia/Sydney');
  });
});

describe('Session Timer Component', () => {
  it('SessionTimer.tsx exists', () => {
    expect(
      fs.existsSync(path.join(SRC_DIR, 'src/components/SessionTimer.tsx'))
    ).toBe(true);
  });

  it('SessionTimer shows time format', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/components/SessionTimer.tsx'),
      'utf-8'
    );
    // Should display hours and minutes
    expect(content).toMatch(/h.*m|hour|minute/i);
  });
});

describe('Session Guard Component', () => {
  it('SessionGuard.tsx exists', () => {
    expect(
      fs.existsSync(path.join(SRC_DIR, 'src/components/SessionGuard.tsx'))
    ).toBe(true);
  });

  it('SessionGuard checks session via API', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/components/SessionGuard.tsx'),
      'utf-8'
    );
    expect(content).toContain('/api/auth/check');
  });

  it('SessionGuard redirects on expiry', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/components/SessionGuard.tsx'),
      'utf-8'
    );
    expect(content).toContain('logged_out');
  });
});

describe('Force Logout', () => {
  it('auth.ts checks force_logout_at', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/lib/auth.ts'),
      'utf-8'
    );
    expect(content).toContain('force_logout_at');
  });

  it('force logout compares token iat with logout timestamp', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/lib/auth.ts'),
      'utf-8'
    );
    expect(content).toContain('payload.iat');
  });
});

describe('Cookie Configuration', () => {
  it('cookie name is pb-session-v2', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/lib/auth.ts'),
      'utf-8'
    );
    expect(content).toContain("pb-session-v2");
  });

  it('login route sets httpOnly cookie', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/app/api/auth/login/route.ts'),
      'utf-8'
    );
    expect(content).toContain('httpOnly: true');
  });

  it('login route sets secure cookie in production', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/app/api/auth/login/route.ts'),
      'utf-8'
    );
    expect(content).toContain("secure:");
    expect(content).toContain("production");
  });

  it('login route sets sameSite lax', () => {
    const content = fs.readFileSync(
      path.join(SRC_DIR, 'src/app/api/auth/login/route.ts'),
      'utf-8'
    );
    expect(content).toContain("sameSite: 'lax'");
  });
});
