import { NextResponse } from 'next/server';

/**
 * Guards cron endpoints. Vercel Cron automatically sends
 * `Authorization: Bearer <CRON_SECRET>` when the CRON_SECRET env var is set.
 * Returns a 401 response if the caller is not authorised, otherwise null.
 */
export function requireCronAuth(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed in production; allow local development without a secret.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 401 });
    }
    return null;
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
