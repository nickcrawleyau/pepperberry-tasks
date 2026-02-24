import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = 'pb-session';

const PUBLIC_PATHS = ['/', '/api/auth/login', '/api/auth/users', '/api/auth/check', '/api/auth/forgot-pin'];
const SET_PIN_PATHS = ['/set-pin', '/api/auth/set-pin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // If user must set PIN, only allow set-pin paths
    if (payload.mustSetPin && !SET_PIN_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/set-pin', request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token — redirect to login
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|icon-.*\\.png|offline\\.html|PBLogo\\.png|PBFlavicon\\.jpg).*)'],
};
