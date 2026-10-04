'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';
import {
  FileText,
  ThumbsUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function MyIssuesPage() {
  const { issues, currentUser, userVotes, confirmResolution, reopenIssue } = useSunwai();
  const [activeTab, setActiveTab] = useState<'raised' | 'upvoted' | 'hostel'>('raised');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-xs">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-[22px] font-serif font-bold text-slate-900">Please sign in</h1>
        <p className="text-[14px] text-slate-600">
          Sign in with your IIM Lucknow account to track issues you have raised, check reply deadlines, and follow issues you upvoted.
        </p>
        <Link
          href="/signin"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors shadow-xs"
        >
          Sign in with IIML Google
        </Link>
      </div>
    );
  }

  // 1. Issues raised by current user
  const myRaisedIssues = useMemo(() => {
    return issues.filter((i) => i.raised_by === currentUser.id);
  }, [issues, currentUser.id]);

  // 2. Issues upvoted by current user
  const myUpvotedIssues = useMemo(() => {
    return issues.filter((i) => userVotes.has(i.id) && i.raised_by !== currentUser.id);
  }, [issues, userVotes, currentUser.id]);

  // 3. Issues in my hostel
  const myHostelIssues = useMemo(() => {
    if (!currentUser.hostel) return [];
    return issues.filter((i) => i.hostel === currentUser.hostel);
  }, [issues, currentUser.hostel]);

  // Pending resolution confirmation for raiser
  const pendingConfirmations = useMemo(() => {
    return myRaisedIssues.filter((i) => i.status === 'Completed');
  }, [myRaisedIssues]);

  // Active list based on tab
  const displayIssues = useMemo(() => {
    switch (activeTab) {
      case 'raised':
        return myRaisedIssues;
      case 'upvoted':
        return myUpvotedIssues;
      case 'hostel':
        return myHostelIssues;
      default:
        return myRaisedIssues;
    }
  }, [activeTab, myRaisedIssues, myUpvotedIssues, myHostelIssues]);

  const handleConfirm = (issueId: string) => {
    confirmResolution(issueId);
    setBannerNotice('Resolution confirmed! The grievance is now marked closed and resolved.');
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-serif font-bold text-slate-900 leading-tight">
            Student Grievance Hub
          </h1>
          <p className="text-[14px] sm:text-[15px] text-slate-600 mt-1">
            Track your tickets, confirm resolutions, and follow campus issues you care about.
          </p>
        </div>

        <Link
          href="/raise"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise new issue</span>
        </Link>
      </div>

      {/* Banner Notice */}
      {bannerNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[14px] p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-emerald-700 font-bold text-[12px] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pending Confirmation Callout */}
      {pendingConfirmations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-[15px]">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Resolution Pending Your Confirmation ({pendingConfirmations.length})</span>
          </div>
          <p className="text-[13px] text-amber-800">
            The council representative has marked the following ticket(s) as fixed. Please inspect the resolution and confirm or reopen within 7 days.
          </p>

          <div className="space-y-2">
            {pendingConfirmations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-amber-200/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link href={`/issue/${item.id}`} className="text-[14px] font-bold text-slate-900 hover:underline">
                    {item.title}
                  </Link>
                  <div className="text-[12px] text-slate-500 mt-0.5">
                    Assigned to council · Marked fixed recently
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleConfirm(item.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm fixed</span>
                  </button>
                  <Link
                    href={`/issue/${item.id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Review / Reopen
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('raised')}
          className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'raised'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Issues Raised by Me</span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {myRaisedIssues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upvoted')}
          className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'upvoted'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Issues I Upvoted</span>
          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {myUpvotedIssues.length}
          </span>
        </button>

        {currentUser.hostel && (
          <button
            type="button"
            onClick={() => setActiveTab('hostel')}
            className={`px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hostel'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{currentUser.hostel} Feed</span>
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {myHostelIssues.length}
            </span>
          </button>
        )}
      </div>

      {/* Tab Content List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {displayIssues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              {activeTab === 'raised' ? (
                <FileText className="w-6 h-6" />
              ) : activeTab === 'upvoted' ? (
                <ThumbsUp className="w-6 h-6" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <h2 className="text-[17px] font-serif font-bold text-slate-900">
              {activeTab === 'raised'
                ? "You haven't raised any issues yet"
                : activeTab === 'upvoted'
                ? "You haven't upvoted any other issues yet"
                : `No issues reported for ${currentUser.hostel}`}
            </h2>
            <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
              {activeTab === 'raised'
                ? 'Facing an issue with hot water, Wi-Fi, food, or academics? Raise a ticket and get official council accountability.'
                : activeTab === 'upvoted'
                ? 'Explore campus issues on the main feed and upvote those you support to prioritize resolution.'
                : 'Everything is running smoothly in your hostel!'}
            </p>
            {activeTab === 'raised' ? (
              <Link
                href="/raise"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
              >
                Raise an issue now
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Explore all issues
              </Link>
            )}
          </div>
        ) : (
          displayIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} showVote={activeTab !== 'raised'} />
          ))
        )}
      </div>
    </div>
  );
}
