import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE_NAME = 'pb-session-v2';

export interface SessionPayload {
  userId: string;
  name: string;
  role: 'admin' | 'tradesperson' | 'riding_school';
  mustSetPin?: boolean;
  allowedSections?: string[];
}

/** Seconds from now until midnight Sydney time (handles AEST/AEDT automatically) */
function secondsUntilMidnightSydney(): number {
  const now = new Date();
  // Get current Sydney time using Intl to handle DST automatically
  const sydneyStr = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour12: false });
  // Parse "DD/MM/YYYY, HH:MM:SS" format
  const timePart = sydneyStr.split(', ')[1];
  const [h, m, s] = timePart.split(':').map(Number);
  const currentSecondsInSydney = h * 3600 + m * 60 + s;
  return 86400 - currentSecondsInSydney;
}

const MAX_SESSION_SECONDS = 3 * 3600; // 3 hours

export async function createSession(payload: SessionPayload): Promise<string> {
  const expirySeconds = Math.min(secondsUntilMidnightSydney(), MAX_SESSION_SECONDS);
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expirySeconds}s`)
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const session = payload as unknown as SessionPayload;

    // Check if user was force-logged-out
    if (payload.iat) {
      const { data } = await supabaseAdmin
        .from('users')
        .select('force_logout_at')
        .eq('id', session.userId)
        .single();

      if (data?.force_logout_at) {
        const logoutTime = new Date(data.force_logout_at).getTime() / 1000;
        if (payload.iat < logoutTime) {
          return null;
        }
      }
    }

    return session;
  } catch {
    return null;
  }
}

export async function getSessionExpiry(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload.exp as number) ?? null;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
