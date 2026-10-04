'use client';

import React from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';

export default function MyIssuesPage() {
  const { issues, currentUser } = useSunwai();

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <h1 className="text-[22px] font-serif font-bold text-[#0f172a]">Please sign in</h1>
        <p className="text-[14px] text-[#64748b]">
          Sign in with your IIM Lucknow account to view the issues you have raised and track their resolution progress.
        </p>
        <Link
          href="/signin"
          className="inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors shadow-xs"
        >
          Sign in with IIML Google
        </Link>
      </div>
    );
  }

  // Issues raised by current user
  const myIssues = issues.filter((i) => i.raised_by === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[30px] font-serif font-bold text-[#0f172a] leading-tight">
          My issues
        </h1>
        <p className="text-[15px] text-[#64748b] mt-1">
          Issues you have raised, their assigned owners, and current progress.
        </p>
      </div>

      {/* The Single White Panel containing the Issue List (without vote buttons) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        {myIssues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-[15px] text-[#64748b]">
              You haven&apos;t raised any issues yet.
            </p>
            <Link
              href="/raise"
              className="inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors shadow-xs"
            >
              Raise an issue
            </Link>
          </div>
        ) : (
          myIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} showVote={false} />
          ))
        )}
      </div>
    </div>
  );
}
