'use client';

import React from 'react';
import Link from 'next/link';
import { Issue } from '@/types';
import { useSunwai } from '@/lib/store';
import { AccountabilityPill } from './AccountabilityPill';

interface Props {
  issue: Issue;
  showVote?: boolean;
}

export function IssueRow({ issue, showVote = true }: Props) {
  const {
    currentUser,
    userVotes,
    upvoteIssue,
    getRoleById,
    getUserById,
    getUserRole,
    comments,
  } = useSunwai();

  const isVoted = userVotes.has(issue.id);
  const ownerRole = getRoleById(issue.owner_role_id);
  const raiser = getUserById(issue.raised_by);
  const currentUserRole = getUserRole(currentUser.id);
  const isPresident = currentUserRole?.name === 'President';
  const isOwner = currentUserRole?.id === issue.owner_role_id;
  const isRaiser = issue.raised_by === currentUser.id;

  const commentCount = comments.filter((c) => c.issue_id === issue.id).length;

  // Format age: e.g. "3 days ago", "yesterday", "today"
  const getAgeString = () => {
    const created = new Date(issue.created_at).getTime();
    const diffHours = Math.floor((Date.now() - created) / (1000 * 3600));
    if (diffHours < 24) {
      return diffHours <= 1 ? 'just now' : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  // Public Identity Rule (Section 6):
  // "Other students see the raiser only as 'a PGP 42 student'. Only the owner and the President see the name."
  const authorDisplay = isOwner || isPresident || isRaiser
    ? raiser?.name || 'Student'
    : `a ${raiser?.course || 'PGP'} ${raiser?.batch || '42'} student`;

  // Issue number
  const issueNum = issue.id.replace('issue-', '').slice(-4);

  // Scope label
  const scopeLabel = issue.scope === 'whole campus' ? 'Whole campus' : issue.hostel;

  // At most ONE badge: "Private" takes precedence, otherwise "Priority"
  let badge: { label: string; className: string } | null = null;
  if (issue.visibility === 'private') {
    badge = {
      label: 'Private',
      className: 'bg-[#eaedfb] text-[#2f45c5]',
    };
  } else if (issue.is_priority) {
    badge = {
      label: 'Priority',
      className: 'bg-[#fdecea] text-[#b42318]',
    };
  }

  return (
    <div className="p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 hover:bg-[#fafbfc] transition-colors">
      {/* Left: Vote Box (only if showVote is true) */}
      {showVote && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            upvoteIssue(issue.id);
          }}
          className={`shrink-0 w-11 h-12 rounded-[8px] border flex flex-col items-center justify-center transition-colors ${
            isVoted
              ? 'bg-[#eaedfb] border-[#2f45c5] text-[#2f45c5]'
              : 'bg-white border-[#dde2ea] text-[#5b6478] hover:border-[#2f45c5] hover:text-[#2f45c5]'
          }`}
          title={isVoted ? 'Remove vote' : 'Vote for this issue'}
        >
          <span className="text-[10px] leading-none select-none">▲</span>
          <span className="text-[13px] font-semibold leading-none mt-1 select-none font-sans">
            {issue.vote_count}
          </span>
        </button>
      )}

      {/* Right Column */}
      <div className="flex-1 min-w-0">
        {/* Top Meta Line: #12  Mess & food  Whole campus + at most one badge */}
        <div className="flex items-center gap-2 text-[12px] text-[#5b6478] mb-1 flex-wrap">
          <span className="font-mono">#{issueNum}</span>
          <span>·</span>
          <span>{issue.category}</span>
          <span>·</span>
          <span>{scopeLabel}</span>

          {badge && (
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium ml-1 ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Title: serif, 18px, links to the issue */}
        <h2 className="text-[18px] font-serif text-[#16213e] leading-snug mb-2">
          <Link href={`/issue/${issue.id}`} className="hover:text-[#2f45c5] transition-colors">
            {issue.title}
          </Link>
        </h2>

        {/* Bottom Line: Accountability pill + small grey text */}
        <div className="flex items-center gap-2.5 flex-wrap text-[12px] text-[#5b6478]">
          <AccountabilityPill issue={issue} ownerRole={ownerRole} />
          <span>
            Raised {getAgeString()} by {authorDisplay}, {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>
    </div>
  );
}
