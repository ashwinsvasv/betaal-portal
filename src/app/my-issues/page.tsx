'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueCard } from '@/components/IssueCard';
import {
  Bookmark,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Edit3,
  X,
  FileCheck2,
} from 'lucide-react';

export default function MyIssuesPage() {
  const {
    issues,
    currentUser,
    deleteIssue,
    withdrawIssue,
    editIssue,
    confirmResolution,
    reopenIssue,
  } = useSunwai();

  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [reopenIssueId, setReopenIssueId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');

  // Issues raised by current user
  const myIssues = issues.filter((i) => i.raised_by === currentUser.id);

  const handleStartEdit = (issue: any) => {
    setEditingIssueId(issue.id);
    setEditTitle(issue.title);
    setEditDetails(issue.details);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIssueId && editTitle.trim()) {
      editIssue(editingIssueId, editTitle.trim(), editDetails.trim());
      setEditingIssueId(null);
    }
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reopenIssueId && reopenReason.trim()) {
      reopenIssue(reopenIssueId, reopenReason.trim());
      setReopenIssueId(null);
      setReopenReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-emerald-600" />
            <span>My Raised Issues</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track progress, respond to completed fixes, or edit pending tickets raised by you.
          </p>
        </div>

        <Link
          href="/raise"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Raise New Issue
        </Link>
      </div>

      {/* User stats banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Student Profile:</span>
          <span className="font-bold text-slate-800">{currentUser.name}</span>
          <span className="font-mono text-slate-400">({currentUser.roll_no})</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
            {currentUser.hostel}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <span>
            Total Issues Raised: <strong className="text-slate-900">{myIssues.length}</strong>
          </span>
          <span>
            Resolved: <strong className="text-emerald-600">{myIssues.filter((i) => i.status === 'Completed' || i.status === 'Closed').length}</strong>
          </span>
        </div>
      </div>

      {/* List */}
      {myIssues.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">You haven't raised any issues yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Notice a problem in mess, infrastructure, academic schedule, or sports? Raise an issue to assign an owner.
          </p>
          <Link
            href="/raise"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
          >
            + Raise First Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myIssues.map((issue) => {
            const canEditOrDelete = issue.status === 'Raised' && issue.vote_count <= 1;
            const canWithdraw =
              (issue.vote_count > 1 || issue.status !== 'Raised') &&
              issue.status !== 'Withdrawn' &&
              issue.status !== 'Closed';
            const isCompleted = issue.status === 'Completed';

            return (
              <div key={issue.id} className="space-y-2">
                <IssueCard issue={issue} />

                {/* S4/S5/S9 Action Toolbar for student's own issue */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-100/70 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Issue Actions:</span>

                    {/* S9: Confirm or Reopen within 7 days */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 bg-emerald-100/70 px-2.5 py-1 rounded-md border border-emerald-300">
                        <span className="font-bold text-emerald-900">Marked Completed:</span>
                        <button
                          onClick={() => confirmResolution(issue.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Fix
                        </button>
                        <button
                          onClick={() => {
                            setReopenIssueId(issue.id);
                            setReopenReason('');
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold flex items-center gap-1 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reopen Issue
                        </button>
                      </div>
                    )}

                    {/* S5: Edit before votes */}
                    {canEditOrDelete && (
                      <button
                        onClick={() => handleStartEdit(issue)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded font-medium flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Edit
                      </button>
                    )}

                    {/* S5: Delete before votes */}
                    {canEditOrDelete && (
                      <button
                        onClick={() => {
                          if (confirm('Permanently delete this issue?')) {
                            deleteIssue(issue.id);
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}

                    {/* S5: Withdraw after votes or ack */}
                    {canWithdraw && (
                      <button
                        onClick={() => {
                          if (confirm('Withdraw this issue? It will remain archived as withdrawn.')) {
                            withdrawIssue(issue.id);
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-zinc-600 border border-slate-200 rounded font-medium flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Withdraw Issue
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/issue/${issue.id}`}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold"
                  >
                    View Details & Timeline →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Issue Modal */}
      {editingIssueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Edit Issue (Before Votes/Ack)</h3>
              <button onClick={() => setEditingIssueId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Details</label>
                <textarea
                  rows={4}
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIssueId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Issue Modal */}
      {reopenIssueId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reopen Issue (Resolution Incomplete)</h3>
              <button onClick={() => setReopenIssueId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReopenSubmit} className="space-y-3">
              <p className="text-xs text-slate-600">
                Reopening moves the issue back to <strong>In Progress</strong> with the same owner and adds a visible "reopened" badge.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason why the fix was incomplete / unsatisfactory:
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. The geyser in East wing is still tripping the breaker after 5 minutes..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenIssueId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Reopen Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
