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
    const { issue_id } = body;

    if (!issue_id) {
      return NextResponse.json({ error: 'Missing issue_id' }, { status: 400 });
    }

    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({ status: 'simulated' });
    }

    const userId = session?.user?.sunwaiUserId || 'user-student-1';

    // Fetch user and issue details for eligibility verification
    const [userRes, issueRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').eq('id', userId).single(),
      supabaseAdmin.from('issues').select('*').eq('id', issue_id).single(),
    ]);

    const voter = userRes.data;
    const issue = issueRes.data;

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Check if vote already exists
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('issue_id', issue_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      // Remove vote
      await supabaseAdmin
        .from('votes')
        .delete()
        .eq('issue_id', issue_id)
        .eq('user_id', userId);
      return NextResponse.json({ status: 'unvoted' });
    } else {
      // Verify scope eligibility before adding vote
      if (voter) {
        if ((issue.scope === 'my hostel' || issue.scope === 'my room') && issue.hostel) {
          if (voter.hostel && issue.hostel.toLowerCase() !== voter.hostel.toLowerCase()) {
            return NextResponse.json(
              { error: `Voting restricted to ${issue.hostel} residents.` },
              { status: 403 }
            );
          }
        }

        if (issue.scope === 'my section' && issue.section) {
          if (voter.section && issue.section.toLowerCase() !== voter.section.toLowerCase()) {
            return NextResponse.json(
              { error: `Voting restricted to ${issue.section} students.` },
              { status: 403 }
            );
          }
        }
      }

      // Add vote
      await supabaseAdmin
        .from('votes')
        .insert([{ issue_id, user_id: userId }]);
      return NextResponse.json({ status: 'voted' });
    }
  } catch (error: any) {
    console.error('API /api/issues/vote error:', error);
    return NextResponse.json({ error: error.message || 'Vote failed' }, { status: 500 });
  }
}
