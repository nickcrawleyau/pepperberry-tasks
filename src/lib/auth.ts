import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = 'pb-session';

export interface SessionPayload {
  userId: string;
  name: string;
  role: 'admin' | 'tradesperson' | 'riding_school';
  mustSetPin?: boolean;
  allowedSections?: string[];
}

/** Seconds from now until midnight AEST (UTC+11) */
function secondsUntilMidnightAEST(): number {
  const now = new Date();
  // Midnight AEST = 13:00 UTC (previous day) or next occurrence
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const currentSecondOfDay = utcHours * 3600 + utcMinutes * 60 + utcSeconds;
  // Midnight AEST = 13:00 UTC
  const midnightAESTinUTC = 13 * 3600;
  let diff = midnightAESTinUTC - currentSecondOfDay;
  if (diff <= 0) diff += 86400;
  return diff;
}

const MAX_SESSION_SECONDS = 3 * 3600; // 3 hours

export async function createSession(payload: SessionPayload): Promise<string> {
  const expirySeconds = Math.min(secondsUntilMidnightAEST(), MAX_SESSION_SECONDS);
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expirySeconds}s`)
    .sign(SECRET);
  return token;
}

export { secondsUntilMidnightAEST, MAX_SESSION_SECONDS };

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
  return verifySession(token);
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
