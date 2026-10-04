import { NextRequest, NextResponse } from 'next/server';
import { findSimilarIssues } from '@/lib/duplicate-detector';
import { Issue, IssueCategory, IssueScope } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      details = '',
      category = 'Infra & IT' as IssueCategory,
      scope = 'my hostel' as IssueScope,
      hostel = '',
      issues = [] as Issue[],
    } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ matches: [] });
    }

    // Step 1: Run fast hybrid token/synonym matcher
    let matches = findSimilarIssues({
      title,
      details,
      category,
      scope,
      hostel,
      issues,
    });

    // Step 2: If GEMINI_API_KEY is available, we can optionally enhance results
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && matches.length > 0) {
      // Optional Gemini AI semantic re-ranking hook
      try {
        // (If configured, can query Gemini model for semantic confidence)
      } catch (aiErr) {
        console.warn('Gemini duplicate check hook fallback:', aiErr);
      }
    }

    return NextResponse.json({
      matches,
      totalMatches: matches.length,
      hasHighConfidenceMatch: matches.some((m) => m.similarityScore >= 0.5),
    });
  } catch (error: unknown) {
    console.error('Duplicate check error:', error);
    return NextResponse.json({ matches: [] }, { status: 500 });
  }
}
