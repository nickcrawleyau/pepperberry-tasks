import { vi } from 'vitest';
import type { SessionPayload } from '@/lib/auth';

// ── Supabase Mock ──────────────────────────────────────

type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

export function createMockQueryBuilder(resolvedData: unknown = null, resolvedError: unknown = null): MockQueryBuilder {
  const result = { data: resolvedData, error: resolvedError };
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  // Make the builder itself thenable (for queries that don't end with .single())
  Object.defineProperty(builder, 'then', {
    value: (resolve: (val: unknown) => void) => resolve(result),
    configurable: true,
  });
  return builder;
}

export function createMockSupabase() {
  const storage = {
    from: vi.fn().mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      upload: vi.fn().mockResolvedValue({ data: { path: 'test/photo.jpg' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/photo.jpg' } }),
    }),
  };

  return {
    from: vi.fn().mockReturnValue(createMockQueryBuilder()),
    storage,
  };
}

// ── Auth Mocks ─────────────────────────────────────────

export function mockGetSession(session: SessionPayload | null) {
  return vi.fn().mockResolvedValue(session);
}

export function mockCookies(cookieMap: Record<string, string> = {}) {
  return vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => cookieMap[name] ? { value: cookieMap[name] } : undefined),
    set: vi.fn(),
    delete: vi.fn(),
  });
}

// ── NextRequest/NextResponse Mocks ─────────────────────

export function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  options?: {
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
    cookies?: Record<string, string>;
  }
): Request {
  const url = new URL('http://localhost:3000/api/test');
  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', 'application/json');

  const request = new Request(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

// ── Geolocation Mock ───────────────────────────────────

export function mockGeolocationSuccess(lat: number, lng: number) {
  const mockPosition = {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
  (navigator.geolocation.getCurrentPosition as ReturnType<typeof vi.fn>)
    .mockImplementation((success: PositionCallback) => success(mockPosition as GeolocationPosition));
}

export function mockGeolocationError(code = 1, message = 'User denied geolocation') {
  (navigator.geolocation.getCurrentPosition as ReturnType<typeof vi.fn>)
    .mockImplementation((_success: PositionCallback, error: PositionErrorCallback) => {
      if (error) {
        error({ code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      }
    });
}

export function mockGeolocationUnavailable() {
  Object.defineProperty(navigator, 'geolocation', { value: undefined, writable: true });
}

// ── Fetch Mock Helper ──────────────────────────────────

export function mockFetchResponse(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  });
}
