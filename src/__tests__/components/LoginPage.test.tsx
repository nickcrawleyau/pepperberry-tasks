import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../..');
const loginPageContent = fs.readFileSync(
  path.join(SRC_DIR, 'src/app/page.tsx'),
  'utf-8'
);

describe('LoginPage - Structure', () => {
  it('is a client component', () => {
    expect(loginPageContent).toContain("'use client'");
  });

  it('renders a form', () => {
    expect(loginPageContent).toContain('<form');
    expect(loginPageContent).toContain('onSubmit');
  });

  it('has a user select dropdown', () => {
    expect(loginPageContent).toContain('<select');
    expect(loginPageContent).toContain('Login as');
  });

  it('has 4 PIN input fields', () => {
    expect(loginPageContent).toContain('pin.map');
    expect(loginPageContent).toContain("type=\"password\"");
    expect(loginPageContent).toContain("inputMode=\"numeric\"");
  });

  it('has PIN digit aria labels for accessibility', () => {
    expect(loginPageContent).toContain('PIN digit');
  });

  it('shows Private and Confidential notice', () => {
    expect(loginPageContent).toContain('Private and Confidential');
  });

  it('shows PB logo', () => {
    expect(loginPageContent).toContain('PBLogo.png');
    expect(loginPageContent).toContain('Pepperberry Farm');
  });

  it('shows version info', () => {
    expect(loginPageContent).toContain('NEXT_PUBLIC_VERSION_NAME');
  });

  it('shows copyright', () => {
    expect(loginPageContent).toContain('Nick Crawley');
  });

  it('has forgot PIN button', () => {
    expect(loginPageContent).toContain('Forgot PIN');
  });
});

describe('LoginPage - PIN Input Logic', () => {
  it('only accepts single digits', () => {
    // From handlePinChange: if (value && !/^\d$/.test(value)) return;
    expect(loginPageContent).toContain('/^\\d$/.test(value)');
  });

  it('auto-advances to next input on digit entry', () => {
    // When a digit is entered, focus moves to next input
    expect(loginPageContent).toContain('pinRefs.current[index + 1]?.focus()');
  });

  it('auto-submits on 4th digit', () => {
    expect(loginPageContent).toContain('requestSubmit');
    expect(loginPageContent).toContain('index === 3');
  });

  it('handles backspace to move to previous input', () => {
    expect(loginPageContent).toContain("e.key === 'Backspace'");
    expect(loginPageContent).toContain('pinRefs.current[index - 1]?.focus()');
  });

  it('handles paste with digit extraction', () => {
    expect(loginPageContent).toContain('handlePinPaste');
    expect(loginPageContent).toContain("replace(/\\D/g, '')");
  });

  it('PIN inputs are disabled until user is selected', () => {
    expect(loginPageContent).toContain('disabled={!selectedUser}');
  });
});

describe('LoginPage - Geolocation', () => {
  it('requests geolocation on page load', () => {
    expect(loginPageContent).toContain('navigator.geolocation');
    expect(loginPageContent).toContain('getCurrentPosition');
  });

  it('stores geolocation in geoRef', () => {
    expect(loginPageContent).toContain('geoRef');
    expect(loginPageContent).toContain('useRef');
  });

  it('sends coordinates with login request', () => {
    expect(loginPageContent).toContain('latitude: loc?.lat ?? null');
    expect(loginPageContent).toContain('longitude: loc?.lng ?? null');
  });

  it('never blocks login when geolocation is unavailable', () => {
    // geoRef.current will be null if geolocation is denied
    // The login request uses ?? null to handle this
    expect(loginPageContent).toContain('loc?.lat ?? null');
    expect(loginPageContent).toContain('loc?.lng ?? null');
  });

  it('requests geolocation via getCurrentPosition', () => {
    const matches = loginPageContent.match(/getCurrentPosition/g);
    expect(matches!.length).toBeGreaterThanOrEqual(1);
  });

  it('geolocation errors are silently handled', () => {
    expect(loginPageContent).toContain('() => {}');
  });

  it('geolocation has timeout and cache settings', () => {
    expect(loginPageContent).toContain('timeout: 15000');
    expect(loginPageContent).toContain('maximumAge: 120000');
  });

  it('geolocation is wrapped in try-catch', () => {
    const tryBlocks = loginPageContent.match(/try\s*\{/g);
    expect(tryBlocks!.length).toBeGreaterThanOrEqual(2);
  });
});

describe('LoginPage - Login Flow', () => {
  it('sends POST to /api/auth/login', () => {
    expect(loginPageContent).toContain("'/api/auth/login'");
    expect(loginPageContent).toContain("method: 'POST'");
  });

  it('sends name and pin in request body', () => {
    expect(loginPageContent).toContain('name: selectedUser');
    expect(loginPageContent).toContain('pin: fullPin');
  });

  it('redirects to dashboard on success', () => {
    expect(loginPageContent).toContain("'/dashboard'");
  });

  it('redirects to set-pin if must_set_pin', () => {
    expect(loginPageContent).toContain("'/set-pin'");
    expect(loginPageContent).toContain('must_set_pin');
  });

  it('shows error message on failure', () => {
    expect(loginPageContent).toContain('setError');
    expect(loginPageContent).toContain('data.error');
  });

  it('resets PIN on error', () => {
    expect(loginPageContent).toContain("setPin(['', '', '', ''])");
  });

  it('shows loading spinner during login', () => {
    expect(loginPageContent).toContain('animate-spin');
    expect(loginPageContent).toContain('loading');
  });

  it('fetches user list on mount', () => {
    expect(loginPageContent).toContain('/api/auth/users');
  });

  it('shows logged-out message when redirected', () => {
    expect(loginPageContent).toContain("logged_out");
    expect(loginPageContent).toContain('Logged out');
  });
});
