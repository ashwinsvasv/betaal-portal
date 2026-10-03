'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueCard } from '@/components/IssueCard';
import { IssueCategory, IssueStatus } from '@/types';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  PlusCircle,
  HelpCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

const CATEGORIES: ('All' | IssueCategory)[] = [
  'All',
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

const STATUSES: ('All' | IssueStatus)[] = [
  'All',
  'Raised',
  'Acknowledged',
  'In Progress',
  'Completed',
  'Escalated L1',
  'Closed',
];

export default function PublicFeedPage() {
  const { issues, currentUser } = useSunwai();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | IssueCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | IssueStatus>('All');
  const [selectedHostel, setSelectedHostel] = useState('All');
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes');

  // Filter public issues
  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        // Public feed shows only public issues unless user raised the private issue
        if (issue.visibility === 'private' && issue.raised_by !== currentUser.id) {
          return false;
        }

        // Search query
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

        // Category filter
        if (selectedCategory !== 'All' && issue.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'All' && issue.status !== selectedStatus) {
          return false;
        }

        // Hostel filter
        if (selectedHostel !== 'All' && issue.hostel !== selectedHostel) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'votes') {
          return b.vote_count - a.vote_count;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [issues, searchQuery, selectedCategory, selectedStatus, selectedHostel, sortBy, currentUser]);

  // Statistics counters
  const publicIssues = issues.filter((i) => i.visibility === 'public');
  const totalOpen = publicIssues.filter(
    (i) => i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
  ).length;
  const totalResolved = publicIssues.filter(
    (i) => i.status === 'Completed' || i.status === 'Closed'
  ).length;
  const totalPriority = publicIssues.filter((i) => i.is_priority).length;
  const totalEscalated = publicIssues.filter(
    (i) => i.status === 'Escalated L1' || i.status === 'Escalated L2'
  ).length;

  return (
    <div className="space-y-6">
      {/* Exit Test Spotlight Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Sprint 1 Exit Test Scenario
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Hot-Water Geysers in Hostel 3
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Every issue gets an owner, a 48h deadline, and zero silent drops.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Previously, a hot-water request had 200+ WhatsApp votes and went nowhere. In Sunwai,
              it routes to Hostel Rep H3 with Infra & IT Secretary copied, starts a 48h clock, and triggers council escalation if ignored.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/issue/issue-hot-water"
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Test Hot-Water Story</span>
              <span className="bg-slate-950/20 px-1.5 py-0.5 rounded text-[11px]">214 votes</span>
            </Link>
            <Link
              href="/raise"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise New Issue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Active Issues</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalOpen}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Resolved / Closed</div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{totalResolved}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Priority Threshold</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{totalPriority}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Escalated L1/L2</div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{totalEscalated}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Top search & sort row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues by title, keywords, hostel, or category..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSortBy('votes')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-all ${
                  sortBy === 'votes'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" /> Most Upvoted
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-all ${
                  sortBy === 'newest'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" /> Newest First
              </button>
            </div>
          </div>
        </div>

        {/* Secondary filters: Category pills */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Filter by Category:</span>
            <span>
              Showing {filteredIssues.length} of {publicIssues.length} issues
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status & Hostel Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Hostel:</span>
            <select
              value={selectedHostel}
              onChange={(e) => setSelectedHostel(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Hostels / Campus</option>
              <option value="Hostel 1">Hostel 1</option>
              <option value="Hostel 2">Hostel 2</option>
              <option value="Hostel 3">Hostel 3</option>
              <option value="Hostel 4">Hostel 4</option>
              <option value="Hostel 5">Hostel 5</option>
            </select>
          </div>

          {(selectedCategory !== 'All' ||
            selectedStatus !== 'All' ||
            selectedHostel !== 'All' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedHostel('All');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium underline ml-auto"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Issues Feed List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No issues found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No issues match your current filter criteria. Try adjusting the search term or category.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedHostel('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredIssues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}
