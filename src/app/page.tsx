'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';
import { IssueCategory } from '@/types';
import { ALL_CATEGORIES, getCategoryMeta } from '@/lib/category-config';
import {
  Search,
  List,
  LayoutGrid,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Globe,
  Layers,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';

function AllIssuesContent() {
  const { issues, currentUser, getUserRole } = useSunwai();
  const searchParams = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState<'All' | IssueCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'PendingAck' | 'InProgress' | 'Priority' | 'Resolved'>('Open');
  const [scopeFilter, setScopeFilter] = useState<'All' | 'MyHostel' | 'WholeCampus'>('All');
  const [sortFilter, setSortFilter] = useState<'Most votes' | 'Newest' | 'Urgent SLA'>('Most votes');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [urlSearch]);

  const currentUserRole = currentUser ? getUserRole(currentUser.id) : undefined;
  const isPresident = currentUserRole?.name === 'President';

  // If user is not signed in, gate access to issues
  if (!currentUser) {
    return (
      <div className="space-y-8 py-4">
        {/* Hero Gate Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider">
              <span>IIM Lucknow Student Council</span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-bold text-slate-900 tracking-tight leading-tight">
              Sunwai 1.0 Grievance Portal
            </h1>
            <p className="text-[14px] sm:text-[15px] text-slate-600 max-w-lg mx-auto leading-relaxed">
              Every campus grievance has an assigned owner, strict 48-hour SLA response clock, and transparent progress updates. Sign in with your official account to browse and raise issues.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-semibold px-6 py-3 rounded-full transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <span>Sign in with IIML Google</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900">Direct Accountability</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Automatic routing to elected Cabinet Secretaries and Hostel Reps with enforceable response deadlines.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900">Duplicate Prevention</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Real-time detection finds existing reports so students can upvote and hit the 200+ Priority threshold faster.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-2.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900">Student Privacy</h3>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Public posts anonymize student identities, and private submissions remain strictly between the raiser and council.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate status metric numbers across accessible issues
  const baseAccessibleIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (issue.visibility === 'private') {
        const isOwner = currentUserRole ? issue.owner_role_id === currentUserRole.id : false;
        const isRaiser = currentUser ? issue.raised_by === currentUser.id : false;
        if (!isOwner && !isPresident && !isRaiser) return false;
      }
      if (issue.held_for_review) {
        const isRaiser = currentUser ? issue.raised_by === currentUser.id : false;
        const isAdmin = currentUser?.email === 'techadmin@iiml.ac.in';
        if (!isRaiser && !isAdmin && !isPresident) return false;
      }
      return true;
    });
  }, [issues, currentUser, currentUserRole, isPresident]);

  // Counts for Metric Strips
  const metricCounts = useMemo(() => {
    const total = baseAccessibleIssues.length;
    const open = baseAccessibleIssues.filter(
      (i) => i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
    ).length;
    const pendingAck = baseAccessibleIssues.filter((i) => i.status === 'Raised').length;
    const inProgress = baseAccessibleIssues.filter((i) => i.status === 'In Progress' || i.status === 'Acknowledged').length;
    const priority = baseAccessibleIssues.filter((i) => i.is_priority || i.vote_count >= 200).length;
    const resolved = baseAccessibleIssues.filter((i) => i.status === 'Closed' || i.status === 'Completed').length;

    return { total, open, pendingAck, inProgress, priority, resolved };
  }, [baseAccessibleIssues]);

  // Category Open Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach((cat) => {
      counts[cat] = baseAccessibleIssues.filter(
        (i) => i.category === cat && i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
      ).length;
    });
    return counts;
  }, [baseAccessibleIssues]);

  // Filtered & Sorted Issues
  const filteredIssues = useMemo(() => {
    return baseAccessibleIssues
      .filter((issue) => {
        // Status Filter
        const isClosed = issue.status === 'Closed' || issue.status === 'Withdrawn' || issue.status === 'Rejected';
        if (statusFilter === 'Open' && isClosed) return false;
        if (statusFilter === 'PendingAck' && issue.status !== 'Raised') return false;
        if (statusFilter === 'InProgress' && issue.status !== 'In Progress' && issue.status !== 'Acknowledged') return false;
        if (statusFilter === 'Priority' && (!issue.is_priority && issue.vote_count < 200)) return false;
        if (statusFilter === 'Resolved' && !isClosed && issue.status !== 'Completed') return false;

        // Category Filter
        if (selectedCategory !== 'All' && issue.category !== selectedCategory) {
          return false;
        }

        // Scope Filter
        if (scopeFilter === 'MyHostel') {
          if (!currentUser?.hostel || issue.hostel !== currentUser.hostel) return false;
        } else if (scopeFilter === 'WholeCampus') {
          if (issue.scope !== 'whole campus') return false;
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
        if (sortFilter === 'Urgent SLA') {
          const aAck = new Date(a.ack_deadline).getTime();
          const bAck = new Date(b.ack_deadline).getTime();
          return aAck - bAck;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    baseAccessibleIssues,
    searchQuery,
    selectedCategory,
    statusFilter,
    scopeFilter,
    sortFilter,
    currentUser,
  ]);

  // Grouped issues by category
  const groupedIssues = useMemo(() => {
    const groups: { category: IssueCategory; items: typeof filteredIssues }[] = [];
    ALL_CATEGORIES.forEach((cat) => {
      const items = filteredIssues.filter((i) => i.category === cat);
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });
    return groups;
  }, [filteredIssues]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick SLA Metric Strip */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 tracking-tight leading-tight">
              Campus Grievances & Accountability
            </h1>
            <p className="text-[14px] sm:text-[15px] text-slate-600 mt-1">
              Browse issues, track council SLA response times, and upvote improvements across IIM Lucknow.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-[13px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-full">
              {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'} shown
            </span>
          </div>
        </div>

        {/* Status Pipeline Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => setStatusFilter('Open')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              statusFilter === 'Open'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-medium ${statusFilter === 'Open' ? 'text-blue-100' : 'text-slate-500'}`}>
                Open Issues
              </span>
              <Clock className={`w-4 h-4 ${statusFilter === 'Open' ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <span className="text-[20px] font-bold mt-1 font-sans">{metricCounts.open}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PendingAck')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              statusFilter === 'PendingAck'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-medium ${statusFilter === 'PendingAck' ? 'text-amber-100' : 'text-slate-500'}`}>
                Pending SLA
              </span>
              <AlertTriangle className={`w-4 h-4 ${statusFilter === 'PendingAck' ? 'text-white' : 'text-amber-600'}`} />
            </div>
            <span className="text-[20px] font-bold mt-1 font-sans">{metricCounts.pendingAck}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('InProgress')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              statusFilter === 'InProgress'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-medium ${statusFilter === 'InProgress' ? 'text-indigo-100' : 'text-slate-500'}`}>
                In Progress
              </span>
              <Sparkles className={`w-4 h-4 ${statusFilter === 'InProgress' ? 'text-white' : 'text-indigo-600'}`} />
            </div>
            <span className="text-[20px] font-bold mt-1 font-sans">{metricCounts.inProgress}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Priority')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              statusFilter === 'Priority'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-medium ${statusFilter === 'Priority' ? 'text-rose-100' : 'text-slate-500'}`}>
                Priority (200+)
              </span>
              <Flame className={`w-4 h-4 ${statusFilter === 'Priority' ? 'text-white' : 'text-rose-600'}`} />
            </div>
            <span className="text-[20px] font-bold mt-1 font-sans">{metricCounts.priority}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('Resolved')}
            className={`col-span-2 sm:col-span-1 p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              statusFilter === 'Resolved'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-600/20'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-medium ${statusFilter === 'Resolved' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Resolved
              </span>
              <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'Resolved' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <span className="text-[20px] font-bold mt-1 font-sans">{metricCounts.resolved}</span>
          </button>
        </div>
      </div>

      {/* 2. Category Navigation Tile Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[13px] font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Browse by Category</span>
          </span>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="text-[12px] text-blue-600 hover:text-blue-800 font-medium"
            >
              Reset to All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {/* All Tile */}
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Layers className={`w-4 h-4 shrink-0 ${selectedCategory === 'All' ? 'text-white' : 'text-slate-600'}`} />
              <span className="text-[13px] font-semibold truncate">All Categories</span>
            </div>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                selectedCategory === 'All' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {metricCounts.open}
            </span>
          </button>

          {/* Category Tiles */}
          {ALL_CATEGORIES.map((cat) => {
            const meta = getCategoryMeta(cat);
            const Icon = meta.icon;
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'All' : cat)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                  isSelected
                    ? `${meta.activeRing} shadow-xs font-semibold`
                    : `bg-white hover:${meta.bgClass} border-slate-200/80 text-slate-700`
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? meta.textClass : 'text-slate-500'}`} />
                  <span className="text-[13px] truncate">{meta.label}</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-white/80 shadow-2xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, room, mess, wi-fi, geyser..."
              className="w-full bg-slate-50/70 border border-slate-200/90 text-slate-900 placeholder-slate-400 text-[14px] pl-9.5 pr-8 py-2 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scope & Sort Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scope Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[12px] font-medium">
              <button
                type="button"
                onClick={() => setScopeFilter('All')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  scopeFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Scope
              </button>
              {currentUser?.hostel && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('MyHostel')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    scopeFilter === 'MyHostel' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>{currentUser.hostel}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setScopeFilter('WholeCampus')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  scopeFilter === 'WholeCampus' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Campus</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200/90 text-slate-800 text-[13px] font-medium px-3 py-2 rounded-xl focus:border-blue-600 focus:bg-white transition-colors"
            >
              <option value="Most votes">Most votes</option>
              <option value="Newest">Newest first</option>
              <option value="Urgent SLA">Urgent SLA</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-[12px] font-medium ml-auto sm:ml-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List view"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                title="Grouped by category"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grouped' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Issues Feed: List Mode or Grouped Mode */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-[18px] font-bold text-slate-900">No matching issues found</h2>
          <p className="text-[14px] text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `No issues matched your search query "${searchQuery}". Try clearing filters or using different keywords.`
              : 'There are currently no active grievances matching the selected filters.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStatusFilter('Open');
              setScopeFilter('All');
            }}
            className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 inline-block mt-2"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {filteredIssues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} showVote={true} />
          ))}
        </div>
      ) : (
        /* Grouped View Mode */
        <div className="space-y-6">
          {groupedIssues.map(({ category, items }) => {
            const meta = getCategoryMeta(category);
            const Icon = meta.icon;

            return (
              <div key={category} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {/* Category Group Header */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.pillBg} ${meta.pillText} border ${meta.borderClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[16px] sm:text-[17px] font-bold text-slate-900">
                        {meta.label}
                      </h2>
                      <p className="text-[12px] text-slate-500">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {items.length} {items.length === 1 ? 'issue' : 'issues'}
                  </span>
                </div>

                {/* Issues inside this category */}
                <div className="divide-y divide-slate-100">
                  {items.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} showVote={true} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AllIssuesPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500">
          Loading campus issues...
        </div>
      }
    >
      <AllIssuesContent />
    </Suspense>
  );
}
