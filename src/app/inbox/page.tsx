'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';

export default function MyInboxPage() {
  const { currentUser, getUserRole, issues, roles } = useSunwai();

  const userRole = currentUser ? getUserRole(currentUser.id) : undefined;
  const [activeTab, setActiveTab] = useState<'needs_action' | 'waiting_on_student' | 'done'>('needs_action');

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <h1 className="text-[22px] font-serif font-bold text-[#0f172a]">Please sign in</h1>
        <p className="text-[14px] text-[#64748b]">
          Sign in with your council account to access your assigned tickets and SLA updates.
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

  // If user does not hold a council role
  if (!userRole) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <h1 className="text-[22px] font-serif font-bold text-[#0f172a]">Access restricted</h1>
        <p className="text-[14px] text-[#64748b]">
          You are currently signed in as a general student ({currentUser.course} {currentUser.batch}). Inboxes are reserved for elected council representatives, hostel reps, and section CRs.
        </p>
        <div>
          <Link
            href="/"
            className="inline-block bg-gray-100 hover:bg-gray-200 text-[#0f172a] text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            Back to all issues
          </Link>
        </div>
      </div>
    );
  }

  // Issues assigned to this role (or for President, assigned or escalated)
  const isPresident = userRole.name === 'President';
  const roleIssues = issues.filter(
    (i) => i.owner_role_id === userRole.id || (isPresident && i.status.startsWith('Escalated'))
  );

  // Partition into the 3 specified tabs
  const needsActionIssues = roleIssues.filter(
    (i) =>
      i.status === 'Raised' ||
      i.status === 'Acknowledged' ||
      i.status === 'In Progress' ||
      i.status.startsWith('Escalated')
  );

  const waitingOnStudentIssues = roleIssues.filter(
    (i) => i.status === 'Completed'
  );

  const doneIssues = roleIssues.filter(
    (i) => i.status === 'Closed' || i.status === 'Withdrawn' || i.status === 'Rejected'
  );

  let currentList = needsActionIssues;
  if (activeTab === 'waiting_on_student') currentList = waitingOnStudentIssues;
  if (activeTab === 'done') currentList = doneIssues;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">
          My inbox
        </h1>
        <p className="text-[15px] text-[#5b6478] mt-1">
          {userRole.name} · {userRole.inbox_email}
        </p>
      </div>

      {/* 3 Tabs showing counts (Section 2) */}
      <div className="flex items-center gap-2 border-b border-[#dde2ea] pb-2 text-[14px]">
        <button
          type="button"
          onClick={() => setActiveTab('needs_action')}
          className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
            activeTab === 'needs_action'
              ? 'bg-[#eaedfb] text-[#2f45c5]'
              : 'text-[#5b6478] hover:text-[#16213e]'
          }`}
        >
          Needs action ({needsActionIssues.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('waiting_on_student')}
          className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
            activeTab === 'waiting_on_student'
              ? 'bg-[#eaedfb] text-[#2f45c5]'
              : 'text-[#5b6478] hover:text-[#16213e]'
          }`}
        >
          Waiting on student ({waitingOnStudentIssues.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('done')}
          className={`px-3 py-1.5 rounded-[6px] font-medium transition-colors ${
            activeTab === 'done'
              ? 'bg-[#eaedfb] text-[#2f45c5]'
              : 'text-[#5b6478] hover:text-[#16213e]'
          }`}
        >
          Done ({doneIssues.length})
        </button>
      </div>

      {/* The Single White Panel containing the Issue List */}
      <div className="bg-white rounded-[12px] border border-[#dde2ea] divide-y divide-[#dde2ea]">
        {currentList.length === 0 ? (
          <div className="p-12 text-center text-[15px] text-[#5b6478]">
            {activeTab === 'needs_action'
              ? 'No issues currently need your attention. You are all caught up!'
              : activeTab === 'waiting_on_student'
              ? 'No issues currently waiting for student review.'
              : 'No resolved or closed issues recorded yet.'}
          </div>
        ) : (
          currentList.map((issue) => (
            <IssueRow key={issue.id} issue={issue} showVote={true} />
          ))
        )}
      </div>
    </div>
  );
}
