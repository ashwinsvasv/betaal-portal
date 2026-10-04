import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, isDbConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('issue_id');

    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({ comments: [], updates: [] });
    }

    let commentsQuery = supabaseAdmin.from('comments').select('*').order('created_at', { ascending: true });
    let updatesQuery = supabaseAdmin.from('status_updates').select('*').order('created_at', { ascending: true });

    if (issueId) {
      commentsQuery = commentsQuery.eq('issue_id', issueId);
      updatesQuery = updatesQuery.eq('issue_id', issueId);
    }

    const [cRes, uRes] = await Promise.all([commentsQuery, updatesQuery]);

    return NextResponse.json({
      comments: cRes.data || [],
      updates: uRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const { issue_id, body: commentBody } = body;

    if (!issue_id || !commentBody) {
      return NextResponse.json({ error: 'Missing issue_id or comment body' }, { status: 400 });
    }

    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({ status: 'simulated' });
    }

    const authorId = session?.user?.sunwaiUserId || 'user-student-1';
    const commentId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

    const { data, error } = await supabaseAdmin.from('comments').insert([
      {
        id: commentId,
        issue_id,
        author_id: authorId,
        body: commentBody,
        removed_by_admin: false,
        created_at: new Date().toISOString(),
      }
    ]).select().single();

    if (error) throw error;

    return NextResponse.json({ comment: data, status: 'created' }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/comments POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to post comment' }, { status: 500 });
  }
}
