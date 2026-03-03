import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.VAPID_SUBJECT = 'mailto:test@test.com';
process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-public-key';
process.env.VAPID_PRIVATE_KEY = 'test-vapid-private-key';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress console.error in tests unless explicitly needed
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
  originalError(...args);
};
