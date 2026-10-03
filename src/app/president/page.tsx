'use client';

import React, { useState } from 'react';
import { useSunwai } from '@/lib/store';
import { IssueCard } from '@/components/IssueCard';
import {
  LayoutDashboard,
  AlertTriangle,
  Flame,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  EyeOff,
  Building,
  RotateCcw,
  Zap,
  ArrowRight,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function PresidentDashboardPage() {
  const {
    currentUser,
    roles,
    issues,
    setCurrentUser,
    users,
    runDeadlineChecker,
    redirectIssue,
    acknowledgeIssue,
  } = useSunwai();

  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [reassignRoleId, setReassignRoleId] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [modalError, setModalError] = useState('');

  // Switch to president helper if not logged in as president
  const presidentRole = roles.find((r) => r.name === 'President');
  const presidentUser = users.find((u) => u.id === presidentRole?.holder_user_id) || users[0];
  const isPresident = currentUser.id === presidentUser?.id;

  // Campus-wide metrics
  const totalOpen = issues.filter(
    (i) => i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
  );

  const escalatedL1 = issues.filter((i) => i.status === 'Escalated L1');
  const escalatedL2 = issues.filter((i) => i.status === 'Escalated L2');
  const priorityIssues = issues.filter((i) => i.is_priority && i.status !== 'Closed');
  const privateIssues = issues.filter((i) => i.visibility === 'private');

  const now = new Date().getTime();
  const overdueIssues = issues.filter(
    (i) => i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now
  );

  // Breakdown by secretariat / role
  const roleBreakdown = roles
    .filter((r) => r.name !== 'President' && r.name !== 'Student Affairs Office')
    .map((role) => {
      const assigned = issues.filter((i) => i.owner_role_id === role.id);
      const open = assigned.filter((i) => i.status !== 'Closed' && i.status !== 'Withdrawn').length;
      const overdue = assigned.filter(
        (i) =>
          (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now) ||
          i.status === 'Escalated L1'
      ).length;
      const resolved = assigned.filter((i) => i.status === 'Completed' || i.status === 'Closed').length;

      return {
        role,
        open,
        overdue,
        resolved,
      };
    });

  const handleEscalationAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalationId) return;
    setModalError('');

    if (!reassignRoleId) {
      setModalError('Please select a council role or take direct ownership.');
      return;
    }
    if (!reassignNote.trim()) {
      setModalError('President directive note is required.');
      return;
    }

    if (reassignRoleId === presidentRole?.id) {
      acknowledgeIssue(selectedEscalationId, `President took direct intervention: ${reassignNote}`);
    } else {
      redirectIssue(selectedEscalationId, reassignRoleId, `Presidential reassignment: ${reassignNote}`);
    }

    setSelectedEscalationId(null);
    setReassignRoleId('');
    setReassignNote('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-purple-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
                Student Council Executive Portal
              </span>
              <span className="text-xs text-purple-200">Campus Oversight & Escalations</span>
            </div>
            <h1 className="text-2xl font-black">President Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Cross-secretariat accountability, 48-hour SLA breaches, and campus-wide issue resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isPresident && (
              <button
                onClick={() => setCurrentUser(presidentUser)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" /> Switch to President
              </button>
            )}
            <button
              onClick={() => runDeadlineChecker()}
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> Run Deadline Check
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Escalated (L1)</span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{escalatedL1.length}</div>
          <span className="text-[11px] text-slate-400">48h SLA missed by secretaries</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Priority Issues</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{priorityIssues.length}</div>
          <span className="text-[11px] text-slate-400">&gt;10% student body upvoted</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Campus Tickets</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalOpen.length}</div>
          <span className="text-[11px] text-slate-400">Across all 9 categories</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Confidential / Private</span>
            <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <EyeOff className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{privateIssues.length}</div>
          <span className="text-[11px] text-slate-400">P3: Visible only to President</span>
        </div>
      </div>

      {/* Escalation Queue (P2) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Escalated Issues Requiring Presidential Action</span>
            </h2>
            <p className="text-xs text-slate-500">
              P2: Issues unacknowledged within 48 hours escalate to Level 1. Reassign or assume ownership.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
            {escalatedL1.length} Action(s) Due
          </span>
        </div>

        {escalatedL1.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <span>No pending Escalated L1 issues. Council secretaries are meeting deadlines.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {escalatedL1.map((issue) => (
              <div
                key={issue.id}
                className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-600 text-white">
                      Escalated L1
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      {issue.category} · {issue.hostel}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{issue.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-1">{issue.details}</p>
                  <div className="text-[11px] text-rose-700 font-mono">
                    Failed to acknowledge in 48h · Breached by role #{issue.owner_role_id}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedEscalationId(issue.id);
                      setReassignRoleId(presidentRole?.id || '');
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Take Direct Ownership / Reassign
                  </button>
                  <Link
                    href={`/issue/${issue.id}`}
                    className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50"
                  >
                    View Ticket
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secretariat Area Performance Breakdown (P1) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-purple-600" />
          <span>Secretariat & Hostel Area Breakdown</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4">Council Role</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4 text-center">Open Tickets</th>
                <th className="py-3 px-4 text-center">Overdue (48h Breaches)</th>
                <th className="py-3 px-4 text-center">Resolved</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roleBreakdown.map((item) => (
                <tr key={item.role.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.role.name}</td>
                  <td className="py-3 px-4 text-slate-500">{item.role.category_domain || 'Hostel Block'}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{item.open}</td>
                  <td className="py-3 px-4 text-center">
                    {item.overdue > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                        {item.overdue}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                    {item.resolved}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.overdue > 0 ? (
                      <span className="text-rose-600 font-bold flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Requires Action
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Good Standing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Handling Modal */}
      {selectedEscalationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Handle Level 1 Escalation (Presidential Action)
              </h3>
              <button
                onClick={() => setSelectedEscalationId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEscalationAction} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Resolution Route:
                </label>
                <select
                  value={reassignRoleId}
                  onChange={(e) => setReassignRoleId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                  required
                >
                  <option value={presidentRole?.id}>
                    ⚡ Take Direct Presidential Ownership (Acknowledge & Expedite)
                  </option>
                  <optgroup label="Reassign to another Secretary">
                    {roles
                      .filter((r) => r.id !== presidentRole?.id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          Reassign to {r.name} ({r.inbox_email})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Directive Note:
                </label>
                <textarea
                  rows={3}
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                  placeholder="State the reason for reassignment or presidential intervention..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              {modalError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEscalationId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Execute Presidential Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
