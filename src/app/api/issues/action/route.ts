import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, isDbConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (!session && !demoMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { issue_id, action, note, photo_url, new_owner_role_id, severity, reason } = body;

    if (!issue_id || !action) {
      return NextResponse.json({ error: 'Missing issue_id or action' }, { status: 400 });
    }

    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({ status: 'simulated' });
    }

    const userId = session?.user?.sunwaiUserId || 'user-pres';

    // Fetch existing issue
    const { data: issue, error: fetchErr } = await supabaseAdmin
      .from('issues')
      .select('*')
      .eq('id', issue_id)
      .single();

    if (fetchErr || !issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    let updatedFields: any = { updated_at: new Date().toISOString() };
    let toStatus = issue.status;

    if (action === 'acknowledge') {
      toStatus = 'Acknowledged';
      updatedFields.status = 'Acknowledged';
    } else if (action === 'start_work') {
      toStatus = 'In Progress';
      updatedFields.status = 'In Progress';
      updatedFields.next_update_due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (action === 'post_update') {
      updatedFields.next_update_due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (action === 'complete') {
      toStatus = 'Completed';
      updatedFields.status = 'Completed';
      updatedFields.closed_at = new Date().toISOString();
    } else if (action === 'reject') {
      toStatus = 'Rejected';
      updatedFields.status = 'Rejected';
      updatedFields.rejection_reason = reason || note;
      updatedFields.closed_at = new Date().toISOString();
    } else if (action === 'reopen') {
      toStatus = 'In Progress';
      updatedFields.status = 'In Progress';
      updatedFields.is_reopened = true;
      updatedFields.reopen_count = (issue.reopen_count || 0) + 1;
      updatedFields.next_update_due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (action === 'confirm_resolution') {
      toStatus = 'Closed';
      updatedFields.status = 'Closed';
      updatedFields.closed_at = new Date().toISOString();
    } else if (action === 'withdraw') {
      toStatus = 'Withdrawn';
      updatedFields.status = 'Withdrawn';
      updatedFields.withdrawn_at = new Date().toISOString();
    } else if (action === 'redirect' && new_owner_role_id) {
      toStatus = 'Raised';
      updatedFields.status = 'Raised';
      updatedFields.owner_role_id = new_owner_role_id;
      updatedFields.redirect_count = (issue.redirect_count || 0) + 1;
      updatedFields.ack_deadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    } else if (action === 'set_severity' && severity) {
      updatedFields.severity = severity;
    }

    const { error: updateErr } = await supabaseAdmin
      .from('issues')
      .update(updatedFields)
      .eq('id', issue_id);

    if (updateErr) throw updateErr;

    // Record status update if status changed or note provided
    if (note || toStatus !== issue.status) {
      await supabaseAdmin.from('status_updates').insert([
        {
          id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          issue_id,
          actor_id: userId,
          from_status: issue.status,
          to_status: toStatus,
          note: note || `Action: ${action}`,
          photo_url: photo_url || null,
          created_at: new Date().toISOString(),
        }
      ]);
    }

    return NextResponse.json({ status: 'success', updated: updatedFields });
  } catch (error: any) {
    console.error('API /api/issues/action error:', error);
    return NextResponse.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
