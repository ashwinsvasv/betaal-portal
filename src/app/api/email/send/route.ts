import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveDestination } from '@/lib/email-routing';

export const dynamic = 'force-dynamic';

const smtpReady = () =>
  process.env.EMAIL_LIVE === 'true' && Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

// Simple in-memory throttle: 60 messages per minute per server instance.
let windowStart = Date.now();
let windowCount = 0;

/** GET: report how email is configured (no secrets). */
export async function GET() {
  return NextResponse.json({
    live: smtpReady(),
    sandbox: process.env.EMAIL_SANDBOX_MAILBOX || null,
  });
}

export async function POST(request: Request) {
  const sandbox = process.env.EMAIL_SANDBOX_MAILBOX || undefined;

  // Without a sandbox mailbox, mail goes to real recipients, so require a signed-in user.
  if (!sandbox) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: 'Sign in to send email.' }, { status: 401 });
    }
  }

  let payload: { recipient?: string; subject?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }
  const { recipient, subject, body } = payload;
  if (!recipient || !subject || !body || !/^[^\s@]+@[^\s@]+$/.test(recipient)) {
    return NextResponse.json(
      { ok: false, error: 'Recipient, subject and body are required.' },
      { status: 400 }
    );
  }

  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    windowCount = 0;
  }
  if (++windowCount > 60) {
    return NextResponse.json({ ok: false, error: 'Too many emails. Try again in a minute.' }, { status: 429 });
  }

  const to = resolveDestination(recipient, sandbox);
  const finalSubject = to !== recipient ? `${subject} (for ${recipient})` : subject;

  if (!smtpReady()) {
    console.log(`[email:simulated] to=${to} subject="${finalSubject}"`);
    return NextResponse.json({ ok: true, mode: 'simulated', to });
  }

  try {
    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Sunwai <${process.env.SMTP_USER}>`,
      to,
      subject: finalSubject,
      text: body,
    });
    return NextResponse.json({ ok: true, mode: 'live', to });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SMTP error';
    console.error('[email:error]', message);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
