'use client';

import React, { useState } from 'react';
import { useSunwai } from '@/lib/store';
import { IssueCard } from '@/components/IssueCard';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Flame,
  ShieldCheck,
  UserCheck,
  FileCheck2,
  XCircle,
  PlayCircle,
  X,
  Share2,
} from 'lucide-react';
import Link from 'next/link';

export default function OwnerInboxPage() {
  const {
    currentUser,
    getUserRole,
    issues,
    roles,
    setCurrentUser,
    users,
    acknowledgeIssue,
    startWork,
    postProgressUpdate,
    completeIssue,
    rejectIssue,
    redirectIssue,
  } = useSunwai();

  const userRole = getUserRole(currentUser.id);

  const [filterTab, setFilterTab] = useState<'all' | 'unacknowledged' | 'in_progress' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'votes' | 'age'>('deadline');

  // Modal states for action triggers directly from inbox
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'none' | 'ack' | 'start' | 'update' | 'complete' | 'reject' | 'redirect'>('none');
  const [actionNote, setActionNote] = useState('');
  const [actionPhotoUrl, setActionPhotoUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Duplicate request');
  const [targetRoleId, setTargetRoleId] = useState('');
  const [modalError, setModalError] = useState('');

  // If the user doesn't hold a role, let them quickly switch to an owner
  if (!userRole) {
    const councilUsers = users.filter((u) => getUserRole(u.id));

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Inbox className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Owner Inbox Mode</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          You are currently signed in as <strong>{currentUser.name}</strong> (Student). The Owner Inbox is reserved for Student Council Secretaries and Hostel Representatives to manage their assigned tickets.
        </p>

        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block mb-3 uppercase tracking-wide">
            Switch to a Role Holder to Test the Inbox:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            {councilUsers.slice(0, 4).map((u) => {
              const r = getUserRole(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => setCurrentUser(u)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-colors flex items-center gap-2.5"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {u.name}
                    </span>
                    <span className="text-[11px] text-blue-700 block truncate">
                      {r?.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Get issues assigned to this role
  const assignedIssues = issues.filter(
    (i) => i.owner_role_id === userRole.id && i.status !== 'Closed' && i.status !== 'Withdrawn'
  );

  const now = new Date().getTime();

  // Filter logic
  const filteredIssues = assignedIssues
    .filter((issue) => {
      const isOverdue =
        issue.status === 'Raised' && new Date(issue.ack_deadline).getTime() < now;

      if (filterTab === 'unacknowledged') {
        return issue.status === 'Raised' || issue.status === 'Escalated L1';
      }
      if (filterTab === 'in_progress') {
        return issue.status === 'In Progress' || issue.status === 'Acknowledged';
      }
      if (filterTab === 'overdue') {
        return isOverdue || issue.status === 'Escalated L1';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.ack_deadline).getTime() - new Date(b.ack_deadline).getTime();
      }
      if (sortBy === 'votes') {
        return b.vote_count - a.vote_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const overdueCount = assignedIssues.filter(
    (i) =>
      (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now) ||
      i.status === 'Escalated L1'
  ).length;

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId) return;
    setModalError('');

    if (modalType === 'ack') {
      if (!actionNote.trim()) {
        setModalError('Acknowledgment note is required.');
        return;
      }
      acknowledgeIssue(selectedIssueId, actionNote.trim());
    } else if (modalType === 'start') {
      if (!actionNote.trim()) {
        setModalError('Description of work started is required.');
        return;
      }
      startWork(selectedIssueId, actionNote.trim());
    } else if (modalType === 'update') {
      if (!actionNote.trim()) {
        setModalError('Progress update note is required.');
        return;
      }
      postProgressUpdate(selectedIssueId, actionNote.trim(), actionPhotoUrl.trim() || undefined);
    } else if (modalType === 'complete') {
      if (!actionNote.trim()) {
        setModalError('Proof description and resolution details are required.');
        return;
      }
      completeIssue(selectedIssueId, actionNote.trim(), actionPhotoUrl.trim() || undefined);
    } else if (modalType === 'reject') {
      if (!actionNote.trim()) {
        setModalError('Detailed rejection reason is required.');
        return;
      }
      rejectIssue(selectedIssueId, rejectionReason, actionNote.trim());
    } else if (modalType === 'redirect') {
      if (!targetRoleId) {
        setModalError('Please select a target role.');
        return;
      }
      if (!actionNote.trim()) {
        setModalError('Redirect justification is required.');
        return;
      }
      redirectIssue(selectedIssueId, targetRoleId, actionNote.trim());
    }

    setModalType('none');
    setSelectedIssueId(null);
    setActionNote('');
    setActionPhotoUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-blue-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-400/20 text-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                Official Role Inbox
              </span>
              <span className="text-xs text-blue-200 font-mono">{userRole.inbox_email}</span>
            </div>
            <h1 className="text-2xl font-black">{userRole.name}</h1>
            <p className="text-xs sm:text-sm text-blue-100">
              Logged in as <strong>{currentUser.name}</strong> · Responsible for resolving assigned issues within 48h SLA.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/15">
              <div className="text-xl font-black">{assignedIssues.length}</div>
              <div className="text-[10px] text-blue-200 uppercase font-semibold">Active Items</div>
            </div>
            <div className="bg-rose-500/20 px-4 py-2 rounded-xl text-center border border-rose-500/30">
              <div className="text-xl font-black text-rose-300">{overdueCount}</div>
              <div className="text-[10px] text-rose-200 uppercase font-semibold">Overdue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert */}
      {overdueCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              <strong>{overdueCount} issue(s)</strong> have breached their 48-hour response deadline and escalated to the President!
            </span>
          </div>
          <button
            onClick={() => setFilterTab('overdue')}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0"
          >
            View Overdue Issues
          </button>
        </div>
      )}

      {/* Filters & Sorting Controls (C1) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tab filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Assigned ({assignedIssues.length})
          </button>
          <button
            onClick={() => setFilterTab('unacknowledged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'unacknowledged'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Awaiting Ack
          </button>
          <button
            onClick={() => setFilterTab('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'in_progress'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Overdue ({overdueCount})
          </button>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
          <span className="text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="deadline">Earliest SLA Deadline</option>
            <option value="votes">Most Upvoted First</option>
            <option value="age">Newest First</option>
          </select>
        </div>
      </div>

      {/* Issues list */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Inbox Clean!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No issues match the selected filter. All assigned tickets are handled or within SLA.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isOverdue =
              issue.status === 'Raised' && new Date(issue.ack_deadline).getTime() < now;

            return (
              <div
                key={issue.id}
                className={`rounded-xl overflow-hidden transition-all ${
                  isOverdue ? 'ring-2 ring-rose-500 shadow-md' : ''
                }`}
              >
                <IssueCard issue={issue} />

                {/* Quick Owner Action Bar (C2, C3, C4, C5) */}
                <div className="bg-slate-100/90 border-x border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      Owner Quick Actions:
                    </span>

                    {/* C2: Acknowledge */}
                    {(issue.status === 'Raised' || issue.status === 'Escalated L1') && (
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setModalType('ack');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                      </button>
                    )}

                    {/* C3: Move to In Progress */}
                    {issue.status === 'Acknowledged' && (
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setModalType('start');
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold flex items-center gap-1 shadow-sm"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Start Work
                      </button>
                    )}

                    {/* C3: Post Progress Update */}
                    {issue.status === 'In Progress' && (
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setModalType('update');
                        }}
                        className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" /> Post Update
                      </button>
                    )}

                    {/* C4: Mark as Completed */}
                    {issue.status === 'In Progress' && (
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setModalType('complete');
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 shadow-sm"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" /> Complete Fix
                      </button>
                    )}

                    {/* C4: Reject */}
                    {issue.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setModalType('reject');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded font-medium"
                      >
                        Reject
                      </button>
                    )}

                    {/* C5: Redirect */}
                    {issue.redirect_count < 2 && issue.status !== 'Completed' && (
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setModalType('redirect');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium"
                      >
                        Redirect
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/issue/${issue.id}`}
                    className="text-blue-700 hover:text-blue-900 font-semibold"
                  >
                    Open Full Ticket →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACTION MODAL FOR INBOX */}
      {modalType !== 'none' && selectedIssueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm capitalize">
                {modalType === 'ack'
                  ? 'Acknowledge Issue'
                  : modalType === 'start'
                  ? 'Commence Work (In Progress)'
                  : modalType === 'update'
                  ? 'Post Weekly Progress Update'
                  : modalType === 'complete'
                  ? 'Close Issue as Completed'
                  : modalType === 'reject'
                  ? 'Reject Issue'
                  : 'Redirect Issue to Role'}
              </h3>
              <button
                onClick={() => {
                  setModalType('none');
                  setSelectedIssueId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              {modalType === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Rejection Reason:
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="Duplicate request">Duplicate request</option>
                    <option value="Out of Student Council jurisdiction">
                      Out of Student Council jurisdiction
                    </option>
                    <option value="Policy/Institute regulation constraint">
                      Policy/Institute regulation constraint
                    </option>
                    <option value="Insufficient details provided">
                      Insufficient details provided
                    </option>
                  </select>
                </div>
              )}

              {modalType === 'redirect' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reassign to Role:
                  </label>
                  <select
                    value={targetRoleId}
                    onChange={(e) => setTargetRoleId(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="">Select target role...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.inbox_email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {modalType === 'ack'
                    ? 'Acknowledgment Note to Student:'
                    : modalType === 'complete'
                    ? 'Resolution Description & Proof Note:'
                    : modalType === 'reject'
                    ? 'Rejection Justification:'
                    : modalType === 'redirect'
                    ? 'Reason for Redirecting:'
                    : 'Progress Note:'}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Enter notes..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              {(modalType === 'complete' || modalType === 'update') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proof Photo URL (Optional):
                  </label>
                  <input
                    type="url"
                    value={actionPhotoUrl}
                    onChange={(e) => setActionPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              )}

              {modalError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-200">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalType('none');
                    setSelectedIssueId(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
