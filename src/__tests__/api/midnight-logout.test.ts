import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');

describe('Midnight Logout Cron', () => {
  const routePath = path.join(SRC_DIR, 'src/app/api/cron/midnight-logout/route.ts');

  it('route file exists', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('authenticates with CRON_SECRET', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('CRON_SECRET');
  });

  it('uses timingSafeEqual for auth', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('timingSafeEqual');
  });

  it('uses supabaseAdmin', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('supabaseAdmin');
  });

  it('sets force_logout_at on users', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('force_logout_at');
  });

  it('exports force-dynamic', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("export const dynamic = 'force-dynamic'");
  });

  it('checks Sydney timezone for midnight', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('Australia/Sydney');
  });

  it('skips when not midnight', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('skipped');
  });
});

describe('Midnight Logout Timezone Logic', () => {
  function getSydneyHour(date: Date): number {
    return parseInt(
      date.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour: 'numeric', hour12: false })
    );
  }

  it('13:00 UTC is midnight Sydney during AEDT (Oct-Apr)', () => {
    // 2026-01-15 13:00 UTC → 2026-01-16 00:00 AEDT (UTC+11)
    const date = new Date('2026-01-15T13:00:00Z');
    expect(getSydneyHour(date)).toBe(0);
  });

  it('14:00 UTC is midnight Sydney during AEST (Apr-Oct)', () => {
    // 2026-07-15 14:00 UTC → 2026-07-16 00:00 AEST (UTC+10)
    const date = new Date('2026-07-15T14:00:00Z');
    expect(getSydneyHour(date)).toBe(0);
  });

  it('13:00 UTC is NOT midnight Sydney during AEST', () => {
    // 2026-07-15 13:00 UTC → 2026-07-15 23:00 AEST
    const date = new Date('2026-07-15T13:00:00Z');
    expect(getSydneyHour(date)).not.toBe(0);
  });

  it('14:00 UTC is NOT midnight Sydney during AEDT', () => {
    // 2026-01-15 14:00 UTC → 2026-01-16 01:00 AEDT
    const date = new Date('2026-01-15T14:00:00Z');
    expect(getSydneyHour(date)).not.toBe(0);
  });
});

describe('Vercel Cron Config', () => {
  it('vercel.json includes midnight-logout cron', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.join(SRC_DIR, 'vercel.json'), 'utf-8')
    );
    const midnightCron = vercelConfig.crons.find(
      (c: { path: string }) => c.path === '/api/cron/midnight-logout'
    );
    expect(midnightCron).toBeDefined();
  });

  it('cron runs at 13:00 UTC for midnight Sydney', () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.join(SRC_DIR, 'vercel.json'), 'utf-8')
    );
    const midnightCron = vercelConfig.crons.find(
      (c: { path: string }) => c.path === '/api/cron/midnight-logout'
    );
    expect(midnightCron.schedule).toBe('0 13 * * *');
  });
});
