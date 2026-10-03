import { NextResponse } from 'next/server';
import { generateDailyDigests } from '@/lib/deadline-checker';
import { SEED_ISSUES, SEED_ROLES } from '@/lib/seed-data';

export async function GET() {
  try {
    const digests = generateDailyDigests(SEED_ISSUES, SEED_ROLES);

    return NextResponse.json({
      status: 'success',
      digestsDispatched: digests.length,
      recipients: digests.map((d) => d.recipient),
      sampleSubject: digests[0]?.subject,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Daily digest failed' },
      { status: 500 }
    );
  }
}
