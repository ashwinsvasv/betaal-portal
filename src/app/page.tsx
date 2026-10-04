'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';
import { IssueCategory } from '@/types';

const CATEGORIES: ('All categories' | IssueCategory)[] = [
  'All categories',
  'Infra & IT',
  'Hostel life',
  'Mess and food',
  'Academics',
  'Sports facilities and events',
  'Events',
  'Cultural',
  'Finance and reimbursements',
  'Other / not sure',
];

function AllIssuesContent() {
  const { issues, currentUser, getUserRole } = useSunwai();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState<'All categories' | IssueCategory>('All categories');
  const [statusFilter, setStatusFilter] = useState<'Open' | 'Resolved' | 'Everything'>('Open');
  const [sortFilter, setSortFilter] = useState<'Most votes' | 'Newest'>('Most votes');

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const currentUserRole = currentUser ? getUserRole(currentUser.id) : undefined;
  const isPresident = currentUserRole?.name === 'President';

  // Filter & Sort Issues
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Privacy rule: private issues are invisible to unauthorized users
        if (issue.visibility === 'private') {
          const isOwner = currentUserRole ? issue.owner_role_id === currentUserRole.id : false;
          const isRaiser = currentUser ? issue.raised_by === currentUser.id : false;
          if (!isOwner && !isPresident && !isRaiser) return false;
        }

        // Held for review rule: invisible until approved except to raiser, admin, president
        if (issue.held_for_review) {
          const isRaiser = currentUser ? issue.raised_by === currentUser.id : false;
          const isAdmin = currentUser?.email === 'techadmin@iiml.ac.in';
          if (!isRaiser && !isAdmin && !isPresident) return false;
        }

        // Status Toggle (Open / Resolved / Everything)
        const isClosed = issue.status === 'Closed' || issue.status === 'Withdrawn' || issue.status === 'Rejected';
        if (statusFilter === 'Open' && isClosed) return false;
        if (statusFilter === 'Resolved' && !isClosed) return false;

        // Category Filter
        if (selectedCategory !== 'All categories' && issue.category !== selectedCategory) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = issue.title.toLowerCase().includes(q);
          const matchDetails = issue.details.toLowerCase().includes(q);
          const matchCategory = issue.category.toLowerCase().includes(q);
          const matchHostel = issue.hostel.toLowerCase().includes(q);
          if (!matchTitle && !matchDetails && !matchCategory && !matchHostel) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortFilter === 'Most votes') {
          return b.vote_count - a.vote_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    issues,
    searchQuery,
    selectedCategory,
    statusFilter,
    sortFilter,
    currentUser,
    currentUserRole,
    isPresident,
  ]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-gray-200/60 pb-4">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-serif text-[#0f172a] font-bold leading-tight">
            All issues
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#64748b] mt-0.5">
            Every campus grievance, its assigned student council owner, and strict accountability SLA.
          </p>
        </div>
        <div className="text-[12px] font-semibold text-[#64748b] bg-white px-3 py-1.5 rounded-full border border-gray-200/80 shadow-xs self-start">
          {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'} found
        </div>
      </div>

      {/* Controls Row: Search + Category + 2 Small Toggles */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search box & Category dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues, keywords..."
              className="w-full bg-white border border-[#dde2ea] text-[#16213e] placeholder-[#94a3b8] text-[14px] pl-3 pr-8 py-2 rounded-xl focus:border-[#2563eb] transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-white border border-[#dde2ea] text-[#16213e] text-[14px] px-3 py-2 rounded-xl focus:border-[#2563eb] transition-colors shadow-xs"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Two Small Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Toggle: Open / Resolved / Everything */}
          <div className="bg-[#eef2f6] p-1 rounded-xl flex items-center gap-1 text-[13px] border border-gray-200/60">
            {(['Open', 'Resolved', 'Everything'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-white text-[#0f172a] font-semibold shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort Toggle: Most votes / Newest */}
          <div className="bg-[#eef2f6] p-1 rounded-xl flex items-center gap-1 text-[13px] border border-gray-200/60">
            {(['Most votes', 'Newest'] as const).map((sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => setSortFilter(sort)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  sortFilter === sort
                    ? 'bg-white text-[#0f172a] font-semibold shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Single White Panel containing the Issue List */}
      <div className="bg-white rounded-2xl border border-gray-200/80 divide-y divide-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-16 text-center text-[15px] text-[#64748b]">
            <p className="font-medium text-gray-700">No issues match your criteria.</p>
            <p className="text-sm text-gray-400 mt-1">Try fewer words, clear filters, or raise it as a new issue.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} showVote={true} />
          ))
        )}
      </div>
    </div>
  );
}

export default function AllIssuesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400 text-sm">Loading issues...</div>}>
      <AllIssuesContent />
    </Suspense>
  );
}
