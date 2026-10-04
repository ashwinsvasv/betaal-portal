import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, isDbConfigured } from '@/lib/supabase';
import { SEED_ISSUES, SEED_USERS, SEED_ROLES } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    // If Supabase is not configured or in DEMO mode without DB credentials, return fallback data
    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({
        issues: SEED_ISSUES,
        users: SEED_USERS,
        roles: SEED_ROLES,
        source: 'local_fallback',
      });
    }

    // Fetch live data from Supabase
    const [issuesRes, usersRes, rolesRes, votesRes] = await Promise.all([
      supabaseAdmin.from('issues').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('users').select('*'),
      supabaseAdmin.from('roles').select('*'),
      session?.user?.email
        ? supabaseAdmin.from('votes').select('issue_id').eq('user_id', session.user.sunwaiUserId || '')
        : Promise.resolve({ data: [] }),
    ]);

    if (issuesRes.error) throw issuesRes.error;
    if (usersRes.error) throw usersRes.error;
    if (rolesRes.error) throw rolesRes.error;

    return NextResponse.json({
      issues: issuesRes.data || [],
      users: usersRes.data || [],
      roles: rolesRes.data || [],
      userVotes: (votesRes.data || []).map((v: any) => v.issue_id),
      source: 'supabase',
    });
  } catch (error: any) {
    console.error('API /api/issues GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (!session && !demoMode) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      details,
      category,
      scope,
      hostel,
      visibility,
      owner_role_id,
      cc_role_ids = [],
      photos = [],
      raised_by,
    } = body;

    if (!title || !details || !category || !scope || !owner_role_id) {
      return NextResponse.json({ error: 'Missing required issue fields' }, { status: 400 });
    }

    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({
        status: 'simulated',
        message: 'Saved in memory (Database not configured)',
      });
    }

    const issueId = `issue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ackDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const newIssue = {
      id: issueId,
      raised_by: raised_by || session?.user?.sunwaiUserId || 'user-student-1',
      title,
      details,
      category,
      scope,
      hostel: hostel || '',
      visibility: visibility || 'public',
      status: 'Raised',
      severity: 'Normal',
      owner_role_id,
      cc_role_ids,
      ack_deadline: ackDeadline,
      vote_count: 1,
      redirect_count: 0,
      is_priority: false,
      is_reopened: false,
      reopen_count: 0,
      photos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from('issues').insert([newIssue]).select().single();
    if (error) throw error;

    // Auto-record creator's vote
    await supabaseAdmin.from('votes').insert([
      { issue_id: issueId, user_id: newIssue.raised_by }
    ]);

    // Initial status update
    await supabaseAdmin.from('status_updates').insert([
      {
        id: `upd-${Date.now()}`,
        issue_id: issueId,
        actor_id: newIssue.raised_by,
        from_status: 'Raised',
        to_status: 'Raised',
        note: 'Issue raised and 48-hour reply clock initialized.',
        created_at: new Date().toISOString(),
      }
    ]);

    return NextResponse.json({ issue: data, status: 'created' }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/issues POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create issue' }, { status: 500 });
  }
}
