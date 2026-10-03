import { NextResponse } from 'next/server';
import { runComprehensiveDeadlineCheck } from '@/lib/deadline-checker';
import { SEED_ISSUES, SEED_ROLES } from '@/lib/seed-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const offsetHours = Number(searchParams.get('offsetHours') || 0);

    const result = runComprehensiveDeadlineCheck({
      issues: SEED_ISSUES,
      roles: SEED_ROLES,
      simulatedTimeOffsetHours: offsetHours,
    });

    return NextResponse.json({
      status: 'success',
      report: result.report,
      escalatedL1Count: result.report.escalatedL1Count,
      escalatedL2Count: result.report.escalatedL2Count,
      remindersSent: result.report.remindersSent,
      autoClosedCount: result.report.autoClosedCount,
      logs: result.report.logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Deadline check failed' },
      { status: 500 }
    );
  }
}
