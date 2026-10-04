import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Server-side gate: every page requires a valid session, except the sign-in page.
 * (API routes do their own auth; /api/auth is NextAuth itself, cron uses CRON_SECRET.)
 * Demo mode has no real session, so it is skipped there.
 */
export async function middleware(req: NextRequest) {
  if (DEMO_MODE) return NextResponse.next();

  // Allow access if active demo persona is selected
  const isDemo = req.cookies.get('betaal_demo_session')?.value === '1';
  if (isDemo) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Exclude: sign-in, all API routes, Next internals, and static assets.
  matcher: ['/((?!signin|api|_next/static|_next/image|favicon.ico|logo.png|logo-dark.png|.*\\.png|betaal-shield.svg).*)'],
};
