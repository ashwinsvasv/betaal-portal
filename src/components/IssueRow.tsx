'use client';
import { formatDateTime } from '@/lib/format-date';

import React from 'react';
import Link from 'next/link';
import { Issue } from '@/types';
import { useSunwai } from '@/lib/store';
import { AccountabilityPill } from './AccountabilityPill';
import { CategoryBadge } from '@/lib/category-config';
import {
  ChevronUp,
  Building2,
  Globe,
  Lock,
  Flame,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
} from 'lucide-react';

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
  const raiser = getUserById(issue.raised_by);
  const ownerRole = getRoleById(issue.owner_role_id);
  const currentUserRole = currentUser ? getUserRole(currentUser.id) : undefined;
  const isPresident = currentUserRole?.name === 'President';
  const isOwner = currentUserRole ? currentUserRole.id === issue.owner_role_id : false;
  const isRaiser = currentUser ? issue.raised_by === currentUser.id : false;

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
    ? `${raiser?.name || 'Student'} (${raiser?.hostel || 'Hostel'})`
    : `a ${raiser?.course || 'PGP'} ${raiser?.batch || '42'} student`;

  // Issue number
  const issueNum = issue.id.replace('issue-', '').slice(-4);

  // Scope label & Icon
  const isCampus = issue.scope === 'whole campus';
  const scopeLabel = isCampus ? 'Whole campus' : issue.hostel;

  // Status Stepper Level (1: Raised, 2: Acknowledged, 3: In Progress, 4: Completed/Closed)
  const getStepProgress = () => {
    switch (issue.status) {
      case 'Raised':
        return 1;
      case 'Acknowledged':
        return 2;
      case 'In Progress':
        return 3;
      case 'Completed':
      case 'Closed':
        return 4;
      default:
        return 1;
    }
  };
  const stepLevel = getStepProgress();
  const isResolved = issue.status === 'Completed' || issue.status === 'Closed';

  return (
    <div className="p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4.5 hover:bg-slate-50/70 transition-all duration-150 border-b border-gray-100 last:border-b-0 group">
      {/* Left: Vote Box (only if showVote is true) */}
      {showVote && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            upvoteIssue(issue.id);
          }}
          className={`shrink-0 w-11 sm:w-12 h-13 rounded-xl border flex flex-col items-center justify-center transition-all ${
            isVoted
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/30'
          }`}
          title={isVoted ? 'Remove vote' : 'Vote for this issue'}
        >
          <ChevronUp className={`w-4 h-4 transition-transform ${isVoted ? 'stroke-[2.5]' : 'stroke-2 group-hover:-translate-y-0.5'}`} />
          <span className="text-[13px] font-bold leading-none mt-0.5 select-none font-sans">
            {issue.vote_count}
          </span>
        </button>
      )}

      {/* Right Column */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Top Badges Row */}
        <div className="flex items-center gap-2 flex-wrap text-[12px]">
          {/* Issue ID */}
          <span className="font-mono text-slate-400 font-medium text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
            #{issueNum}
          </span>

          {/* Category Badge with Lucide Icon */}
          <CategoryBadge category={issue.category} size="xs" />

          {/* Location Scope */}
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md">
            {isCampus ? (
              <Globe className="w-3 h-3 text-slate-500 shrink-0" />
            ) : (
              <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span>{scopeLabel}</span>
          </span>

          {/* Private Badge */}
          {issue.visibility === 'private' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              <Lock className="w-3 h-3 shrink-0" />
              <span>Private</span>
            </span>
          )}

          {/* Priority Flag */}
          {issue.is_priority && (
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              <Flame className="w-3 h-3 shrink-0" />
              <span>Priority</span>
            </span>
          )}

          {/* Photos indicator */}
          {issue.photos && issue.photos.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md ml-auto">
              <ImageIcon className="w-3 h-3 text-slate-400" />
              <span>{issue.photos.length}</span>
            </span>
          )}
        </div>

        {/* Title: Links to issue detail */}
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-serif font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
            <Link href={`/issue/${issue.id}`} className="hover:underline">
              {issue.title}
            </Link>
          </h2>

          {/* Short details preview snippet */}
          {issue.details && (
            <p className="text-[13px] text-slate-500 line-clamp-1 mt-0.5">
              {issue.details}
            </p>
          )}
        </div>

        {/* Bottom Line: Accountability Pill, Stepper & Meta Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <AccountabilityPill issue={issue} ownerRole={ownerRole} />
            
            <span className="text-[12px] text-slate-500">
              by <span className="font-medium text-slate-700">{authorDisplay}</span> · {formatDateTime(issue.created_at)} ({getAgeString()})
            </span>
          </div>

          <div className="flex items-center gap-3 text-[12px] text-slate-500 self-start sm:self-auto shrink-0">
            {/* Resolution indicator if resolved */}
            {isResolved && (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolved</span>
              </span>
            )}

            {/* Comments Counter */}
            <Link
              href={`/issue/${issue.id}#comments`}
              className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>{commentCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
