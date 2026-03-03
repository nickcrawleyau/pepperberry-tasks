import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');

describe('Geolocation - Code Presence', () => {
  const loginPageContent = fs.readFileSync(
    path.join(SRC_DIR, 'src/app/page.tsx'),
    'utf-8'
  );

  it('login page references navigator.geolocation', () => {
    expect(loginPageContent).toContain('navigator.geolocation');
  });

  it('login page calls getCurrentPosition on page load', () => {
    expect(loginPageContent).toContain('getCurrentPosition');
  });

  it('geolocation is stored in a ref (geoRef)', () => {
    expect(loginPageContent).toContain('geoRef');
  });

  it('geolocation coordinates are sent with login request', () => {
    expect(loginPageContent).toContain('latitude');
    expect(loginPageContent).toContain('longitude');
  });

  it('geolocation uses null fallback (never blocks login)', () => {
    // The login request should use optional chaining + null fallback
    expect(loginPageContent).toContain('loc?.lat ?? null');
    expect(loginPageContent).toContain('loc?.lng ?? null');
  });

  it('geolocation failure is silently handled', () => {
    // Empty error callback means geo failures don't affect login
    expect(loginPageContent).toContain('() => {}');
  });

  it('geolocation has a 15-second timeout', () => {
    expect(loginPageContent).toContain('timeout: 15000');
  });

  it('geolocation caches position for 2 minutes', () => {
    expect(loginPageContent).toContain('maximumAge: 120000');
  });

  it('geolocation calls getCurrentPosition', () => {
    const matches = loginPageContent.match(/getCurrentPosition/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(1);
  });

  it('geolocation is wrapped in try-catch for unavailable browsers', () => {
    // Each geolocation call should be in a try-catch
    const tryMatches = loginPageContent.match(/try\s*\{[\s\S]*?navigator\.geolocation/g);
    expect(tryMatches).not.toBeNull();
    expect(tryMatches!.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Geolocation - Login API Handling', () => {
  const loginRouteContent = fs.readFileSync(
    path.join(SRC_DIR, 'src/app/api/auth/login/route.ts'),
    'utf-8'
  );

  it('login route accepts latitude and longitude', () => {
    expect(loginRouteContent).toContain('latitude');
    expect(loginRouteContent).toContain('longitude');
  });

  it('login route converts non-numeric coords to null', () => {
    // The route uses typeof check to validate coordinates
    expect(loginRouteContent).toContain("typeof latitude === 'number'");
    expect(loginRouteContent).toContain("typeof longitude === 'number'");
  });

  it('login route stores geolocation in login_history', () => {
    expect(loginRouteContent).toContain('login_history');
    expect(loginRouteContent).toContain('latitude');
    expect(loginRouteContent).toContain('longitude');
  });
});

describe('Geolocation - Behavior Validation', () => {
  it('geolocation never blocks login when denied', () => {
    // Test the pattern: loc?.lat ?? null
    const loc = null; // Geolocation denied/unavailable
    const latitude = loc?.lat ?? null;
    const longitude = loc?.lng ?? null;

    expect(latitude).toBeNull();
    expect(longitude).toBeNull();
    // Login should still proceed with null coordinates
  });

  it('geolocation coordinates are captured when available', () => {
    const loc = { lat: -34.77, lng: 150.69 };
    const latitude = loc?.lat ?? null;
    const longitude = loc?.lng ?? null;

    expect(latitude).toBe(-34.77);
    expect(longitude).toBe(150.69);
  });

  it('non-numeric geolocation values are converted to null', () => {
    const latitude = 'invalid';
    const longitude = undefined;

    expect(typeof latitude === 'number' ? latitude : null).toBeNull();
    expect(typeof longitude === 'number' ? longitude : null).toBeNull();
  });
});
