'use client';

import React, { useState, useMemo } from 'react';
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

export default function AllIssuesPage() {
  const { issues, currentUser, getUserRole } = useSunwai();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All categories' | IssueCategory>('All categories');
  const [statusFilter, setStatusFilter] = useState<'Open' | 'Resolved' | 'Everything'>('Open');
  const [sortFilter, setSortFilter] = useState<'Most votes' | 'Newest'>('Most votes');

  const currentUserRole = getUserRole(currentUser.id);
  const isPresident = currentUserRole?.name === 'President';

  // Filter & Sort Issues
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Privacy rule: private issues are invisible to unauthorized users
        if (issue.visibility === 'private') {
          const isOwner = issue.owner_role_id === currentUserRole?.id;
          const isRaiser = issue.raised_by === currentUser.id;
          if (!isOwner && !isPresident && !isRaiser) return false;
        }

        // Held for review rule: invisible until approved except to raiser, admin, president
        if (issue.held_for_review) {
          const isRaiser = issue.raised_by === currentUser.id;
          const isAdmin = currentUser.email === 'techadmin@iiml.ac.in';
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
      <div>
        <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">
          All issues
        </h1>
        <p className="text-[15px] text-[#5b6478] mt-1">
          Every campus issue raised by students, its assigned council owner, and deadline.
        </p>
      </div>

      {/* Controls Row: Search + Category + 2 Small Toggles */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search box & Category dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="w-full sm:w-64 bg-white border border-[#dde2ea] text-[#16213e] placeholder-[#5b6478] text-[14px] px-3 py-2 rounded-[8px] transition-colors"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="bg-white border border-[#dde2ea] text-[#16213e] text-[14px] px-3 py-2 rounded-[8px] transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Two Small Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Toggle: Open / Resolved / Everything */}
          <div className="bg-[#eef1f6] p-1 rounded-[8px] flex items-center gap-1 text-[13px]">
            {(['Open', 'Resolved', 'Everything'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-[6px] transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-[#16213e] font-medium'
                    : 'text-[#5b6478] hover:text-[#16213e]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort Toggle: Most votes / Newest */}
          <div className="bg-[#eef1f6] p-1 rounded-[8px] flex items-center gap-1 text-[13px]">
            {(['Most votes', 'Newest'] as const).map((sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => setSortFilter(sort)}
                className={`px-3 py-1 rounded-[6px] transition-colors ${
                  sortFilter === sort
                    ? 'bg-white text-[#16213e] font-medium'
                    : 'text-[#5b6478] hover:text-[#16213e]'
                }`}
              >
                {sort}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Single White Panel containing the Issue List */}
      <div className="bg-white rounded-[12px] border border-[#dde2ea] divide-y divide-[#dde2ea]">
        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-[15px] text-[#5b6478]">
            No issues match. Try fewer words, or raise it as a new issue.
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
