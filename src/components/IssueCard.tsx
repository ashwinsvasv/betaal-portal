'use client';

import React from 'react';
import Link from 'next/link';
import { Issue } from '@/types';
import { useSunwai } from '@/lib/store';
import {
  ChevronUp,
  Clock,
  MessageSquare,
  AlertTriangle,
  Flame,
  Camera,
  ShieldCheck,
  Building,
  User as UserIcon,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface Props {
  issue: Issue;
}

export function IssueCard({ issue }: Props) {
  const {
    currentUser,
    userVotes,
    upvoteIssue,
    getUserById,
    getRoleById,
    comments,
    getUserRole,
  } = useSunwai();

  const isVoted = userVotes.has(issue.id);
  const raiser = getUserById(issue.raised_by);
  const ownerRole = getRoleById(issue.owner_role_id);
  const currentUserRole = getUserRole(currentUser.id);
  const isPresident = currentUserRole?.name === 'President';
  const isOwner = currentUserRole?.id === issue.owner_role_id;

  const issueCommentsCount = comments.filter((c) => c.issue_id === issue.id).length;

  // Status badge styling
  const getStatusBadge = () => {
    switch (issue.status) {
      case 'Raised':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Acknowledged':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Escalated L1':
      case 'Escalated L2':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold animate-pulse';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Withdrawn':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Severity styling (C6)
  const getSeverityBadge = () => {
    if (issue.severity === 'Critical') {
      return 'bg-rose-600 text-white border-rose-700 font-black flex items-center gap-1';
    }
    if (issue.severity === 'High') {
      return 'bg-orange-100 text-orange-800 border-orange-200 font-bold';
    }
    return null;
  };

  // Time remaining calculation for acknowledgment & SLAs
  const getDeadlineText = () => {
    if (issue.status === 'Raised') {
      const remainingMs = new Date(issue.ack_deadline).getTime() - new Date().getTime();
      const hours = Math.round(remainingMs / (1000 * 3600));
      if (hours <= 0) return 'Ack overdue (48h breached)';
      return `Ack due in ~${hours}h`;
    }
    if (issue.status.startsWith('Escalated')) {
      return '48h Ack deadline breached';
    }
    if (issue.status === 'In Progress' && issue.next_update_due) {
      const remainingDays = Math.max(
        0,
        Math.round(
          (new Date(issue.next_update_due).getTime() - new Date().getTime()) / (1000 * 86400)
        )
      );
      return `Weekly update due in ${remainingDays}d`;
    }
    if (issue.status === 'Completed') {
      const remainingReviewDays = Math.max(
        0,
        Math.round(
          (7 * 86400 * 1000 - (Date.now() - new Date(issue.updated_at).getTime())) / (1000 * 86400)
        )
      );
      return `7-day review (~${remainingReviewDays}d left)`;
    }
    return null;
  };

  const deadlineInfo = getDeadlineText();

  // Public Identity Rule (Tech spec requirement)
  const canSeeFullIdentity = isOwner || isPresident || issue.raised_by === currentUser.id;
  const authorDisplay = canSeeFullIdentity
    ? `${raiser?.name || 'Student'} (${raiser?.roll_no || ''})`
    : `${raiser?.course || 'PGP'} ${raiser?.batch || 'Batch'} student`;

  return (
    <div className={`bg-white rounded-xl border transition-all p-5 flex gap-4 ${
      issue.severity === 'Critical' ? 'border-rose-300 shadow-md ring-1 ring-rose-200' : 'border-slate-200 shadow-sm hover:shadow-md'
    }`}>
      {/* Upvote Button Column */}
      <div className="flex flex-col items-center">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            upvoteIssue(issue.id);
          }}
          className={`flex flex-col items-center justify-center w-12 h-14 rounded-xl border transition-all ${
            isVoted
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50'
          }`}
          title={isVoted ? 'Remove upvote' : 'Upvote this issue'}
        >
          <ChevronUp
            className={`w-5 h-5 transition-transform ${
              isVoted ? 'stroke-[3] scale-110' : 'stroke-[2]'
            }`}
          />
          <span className="text-xs font-bold font-mono leading-none mt-0.5">
            {issue.vote_count}
          </span>
        </button>

        {issue.is_priority && (
          <div
            className="mt-2 text-rose-600 flex items-center justify-center"
            title="Priority Issue (>10% campus votes threshold crossed)"
          >
            <Flame className="w-5 h-5 fill-rose-500 animate-bounce" />
          </div>
        )}
      </div>

      {/* Main Content Details */}
      <div className="flex-1 min-w-0">
        {/* Badges & Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Status badge */}
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusBadge()}`}
          >
            {issue.status}
          </span>

          {/* Severity flag (C6) */}
          {getSeverityBadge() && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getSeverityBadge()}`}>
              {issue.severity === 'Critical' && <AlertTriangle className="w-3 h-3" />}
              {issue.severity} Severity
            </span>
          )}

          {/* Priority flag */}
          {issue.is_priority && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-600 text-white flex items-center gap-1 shadow-sm">
              <Flame className="w-3 h-3 fill-white" /> Priority (200+ votes)
            </span>
          )}

          {/* Reopened flag */}
          {issue.is_reopened && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white">
              Reopened by Student
            </span>
          )}

          {/* Redirect counter badge (C5) */}
          {issue.redirect_count > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-mono font-bold">
              Redirected ({issue.redirect_count}/2)
            </span>
          )}

          {/* Category */}
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            {issue.category}
          </span>

          {/* Hostel / Scope */}
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
            <Building className="w-3 h-3 text-slate-400" />
            {issue.scope === 'whole campus' ? 'Whole Campus' : issue.hostel}
          </span>

          {/* Private tag if private */}
          {issue.visibility === 'private' && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
              Private
            </span>
          )}

          {/* Held for review badge (A5) */}
          {issue.held_for_review && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Held for Review
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-emerald-700 transition-colors">
          <Link href={`/issue/${issue.id}`}>{issue.title}</Link>
        </h3>

        {/* Snippet */}
        <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {issue.details}
        </p>

        {/* Photo thumbnail indicator */}
        {issue.photos && issue.photos.length > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span>{issue.photos.length} photo(s) attached</span>
            </div>
          </div>
        )}

        {/* Footer Details */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Owner Role */}
            <div className="flex items-center gap-1 bg-blue-50/80 text-blue-900 px-2 py-1 rounded border border-blue-100 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Owner: {ownerRole?.name || 'Unassigned'}</span>
            </div>

            {/* Public Identity Rule */}
            <div className="flex items-center gap-1 text-slate-500">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{authorDisplay}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Deadline / Timer indicator */}
            {deadlineInfo && (
              <div
                className={`flex items-center gap-1 font-medium ${
                  issue.status.startsWith('Escalated')
                    ? 'text-rose-600 font-bold'
                    : 'text-slate-500'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{deadlineInfo}</span>
              </div>
            )}

            {/* Comment count */}
            <div className="flex items-center gap-1 text-slate-500">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{issueCommentsCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
