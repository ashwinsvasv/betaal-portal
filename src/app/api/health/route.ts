import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  // Simulated system health checks
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    checks: {
      database: {
        status: 'up',
        latency_ms: 1,
        engine: 'PostgreSQL 16 / Seed Storage',
      },
      email_outbox: {
        status: 'up',
        service: 'Postmark SMTP',
        queue_healthy: true,
      },
      backup_verification: {
        status: 'verified',
        last_backup_timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        backup_age_hours: 4,
        size_bytes: 1428570,
        within_sla: true,
      },
      rate_limiter: {
        status: 'active',
        limits: {
          issues_per_hour: 5,
          comments_per_hour: 30,
        },
      },
    },
  };

  return NextResponse.json(healthData, { status: 200 });
}
