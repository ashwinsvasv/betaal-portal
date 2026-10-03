'use client';

import React from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';

export default function MyIssuesPage() {
  const { issues, currentUser } = useSunwai();

  // Issues raised by current user
  const myIssues = issues.filter((i) => i.raised_by === currentUser.id);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">
          My issues
        </h1>
        <p className="text-[15px] text-[#5b6478] mt-1">
          Issues you have raised, their assigned owners, and current progress.
        </p>
      </div>

      {/* The Single White Panel containing the Issue List (without vote buttons) */}
      <div className="bg-white rounded-[12px] border border-[#dde2ea] divide-y divide-[#dde2ea]">
        {myIssues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-[15px] text-[#5b6478]">
              You haven't raised any issues yet.
            </p>
            <Link
              href="/raise"
              className="inline-block bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
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
