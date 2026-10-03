'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import { Timeline } from '@/components/Timeline';
import { CommentSection } from '@/components/CommentSection';
import { IssueSeverity } from '@/types';
import {
  ChevronUp,
  Clock,
  Building,
  User as UserIcon,
  ShieldCheck,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  XCircle,
  FileCheck2,
  ArrowRight,
  Share2,
  ArrowLeft,
  X,
  PlayCircle,
  Sparkles,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;

  const {
    issues,
    currentUser,
    userVotes,
    upvoteIssue,
    acknowledgeIssue,
    startWork,
    postProgressUpdate,
    completeIssue,
    rejectIssue,
    redirectIssue,
    setIssueSeverity,
    confirmResolution,
    reopenIssue,
    withdrawIssue,
    deleteIssue,
    getUserById,
    getRoleById,
    getUserRole,
    statusUpdates,
    roles,
  } = useSunwai();

  const issue = issues.find((i) => i.id === issueId);

  // Modals / Action form states
  const [activeModal, setActiveModal] = useState<
    'none' | 'acknowledge' | 'in_progress' | 'update' | 'complete' | 'reject' | 'redirect' | 'reopen'
  >('none');
  const [actionNote, setActionNote] = useState('');
  const [actionPhotoUrl, setActionPhotoUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Duplicate request');
  const [redirectRoleId, setRedirectRoleId] = useState('');
  const [modalError, setModalError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  if (!issue) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Issue Not Found</h2>
        <p className="text-xs text-slate-500">The issue may have been removed or deleted.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Public Feed
        </Link>
      </div>
    );
  }

  const raiser = getUserById(issue.raised_by);
  const ownerRole = getRoleById(issue.owner_role_id);
  const currentUserRole = getUserRole(currentUser.id);
  const isPresident = currentUserRole?.name === 'President';
  const isOwner = currentUserRole?.id === issue.owner_role_id;
  const isRaiser = issue.raised_by === currentUser.id;
  const isVoted = userVotes.has(issue.id);
  const isCouncilMember = Boolean(currentUserRole);

  const issueUpdates = statusUpdates.filter((u) => u.issue_id === issue.id);

  // Public Identity Rule
  const canSeeFullIdentity = isOwner || isPresident || isRaiser;
  const authorDisplay = canSeeFullIdentity
    ? `${raiser?.name || 'Student'} (${raiser?.roll_no || ''}, ${raiser?.hostel || ''})`
    : `${raiser?.course || 'PGP'} Batch ${raiser?.batch || '41'} student`;

  // Status Badge Styling
  const getStatusBadge = () => {
    switch (issue.status) {
      case 'Raised':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Acknowledged':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Escalated L1':
      case 'Escalated L2':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Withdrawn':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (activeModal === 'acknowledge') {
      if (!actionNote.trim()) {
        setModalError('Please enter an acknowledgment note to the student.');
        return;
      }
      acknowledgeIssue(issue.id, actionNote.trim());
      setNotification('Issue acknowledged. 48-hour SLA deadline cleared.');
    } else if (activeModal === 'in_progress') {
      if (!actionNote.trim()) {
        setModalError('Please describe the immediate next action being taken.');
        return;
      }
      startWork(issue.id, actionNote.trim());
      setNotification('Issue moved to In Progress. Weekly update schedule activated.');
    } else if (activeModal === 'update') {
      if (!actionNote.trim()) {
        setModalError('Please write an update note on progress.');
        return;
      }
      postProgressUpdate(issue.id, actionNote.trim(), actionPhotoUrl.trim() || undefined);
      setNotification('Weekly progress update recorded to timeline.');
    } else if (activeModal === 'complete') {
      if (!actionNote.trim()) {
        setModalError('Resolution details and proof description are required.');
        return;
      }
      completeIssue(issue.id, actionNote.trim(), actionPhotoUrl.trim() || undefined);
      setNotification('Issue marked Completed. 7-day student review window opened.');
    } else if (activeModal === 'reject') {
      if (!actionNote.trim()) {
        setModalError('Detailed justification for rejection is required.');
        return;
      }
      rejectIssue(issue.id, rejectionReason, actionNote.trim());
      setNotification('Issue rejected with formal justification.');
    } else if (activeModal === 'redirect') {
      if (!redirectRoleId) {
        setModalError('Please select the target council role.');
        return;
      }
      if (!actionNote.trim()) {
        setModalError('Reason for redirect is required.');
        return;
      }
      const res = redirectIssue(issue.id, redirectRoleId, actionNote.trim());
      setNotification(res.message);
    } else if (activeModal === 'reopen') {
      if (!actionNote.trim()) {
        setModalError('Please state why the resolution was unsatisfactory.');
        return;
      }
      reopenIssue(issue.id, actionNote.trim());
      setNotification('Issue reopened by student and returned to In Progress.');
    }

    setActiveModal('none');
    setActionNote('');
    setActionPhotoUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/" className="flex items-center gap-1 hover:text-emerald-700 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Feed
        </Link>
        <span className="font-mono">Issue #{issue.id.slice(-6)}</span>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Issue Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Top Badges & Upvote */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getStatusBadge()}`}>
                {issue.status}
              </span>

              {/* Severity Flag Badge (C6) */}
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${
                  issue.severity === 'Critical'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm animate-pulse'
                    : issue.severity === 'High'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {issue.severity === 'Critical' && <AlertTriangle className="w-3.5 h-3.5" />}
                {issue.severity} Severity
              </span>

              {issue.is_priority && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-white" /> Priority Issue (200+ votes)
                </span>
              )}

              {issue.is_reopened && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500 text-white">
                  Reopened by Student
                </span>
              )}

              {/* Redirect Counter (C5) */}
              {issue.redirect_count > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 border border-purple-200 font-mono font-bold">
                  Redirected ({issue.redirect_count}/2)
                </span>
              )}

              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                {issue.category}
              </span>

              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1 font-medium">
                <Building className="w-3 h-3 text-slate-400" />
                {issue.scope === 'whole campus' ? 'Whole Campus' : issue.hostel}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {issue.title}
            </h1>
          </div>

          {/* Upvote Button */}
          <button
            onClick={() => upvoteIssue(issue.id)}
            className={`flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-xl border transition-all ${
              isVoted
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
            }`}
          >
            <ChevronUp className={`w-6 h-6 ${isVoted ? 'stroke-[3]' : 'stroke-[2]'}`} />
            <span className="text-xs font-bold font-mono">{issue.vote_count}</span>
          </button>
        </div>

        {/* Issue Details Body */}
        <p className="text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-4">
          {issue.details}
        </p>

        {/* Attached Photos */}
        {issue.photos && issue.photos.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Attached Photographs ({issue.photos.length})
            </h4>
            <div className="flex flex-wrap gap-3">
              {issue.photos.map((photo, i) => (
                <a
                  key={i}
                  href={photo}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block w-36 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-emerald-500 transition-all"
                >
                  <img
                    src={photo}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Ownership & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Assigned Owner:</span>
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{ownerRole?.name || 'Unassigned'}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{ownerRole?.inbox_email}</span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">Raised By:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>{authorDisplay}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {new Date(issue.created_at).toLocaleDateString('en-IN', {
                dateStyle: 'medium',
              })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5 font-medium">SLA Deadlines:</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                {issue.status === 'Raised'
                  ? `Ack due: ${new Date(issue.ack_deadline).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : issue.status === 'In Progress'
                  ? 'Weekly update in 7d'
                  : 'SLA Met'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {issue.redirect_count > 0 ? `Redirect ${issue.redirect_count}/2` : 'Primary assignment'}
            </span>
          </div>
        </div>

        {/* C6 Severity Setter (for Cabinet Members & President) */}
        {isCouncilMember && issue.status !== 'Closed' && issue.status !== 'Withdrawn' && (
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-700">Council Severity Override (C6):</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(['Normal', 'High', 'Critical'] as IssueSeverity[]).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setIssueSeverity(issue.id, sev)}
                  className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
                    issue.severity === sev
                      ? sev === 'Critical'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : sev === 'High'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ACTION CONTROLS BAR: For Assigned Owner, President, and Student */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* OWNER ACTIONS (C1 to C5) */}
            {(isOwner || isPresident) && issue.status !== 'Closed' && issue.status !== 'Withdrawn' && (
              <>
                {/* C2: Acknowledge */}
                {(issue.status === 'Raised' || issue.status === 'Escalated L1') && (
                  <button
                    onClick={() => setActiveModal('acknowledge')}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Acknowledge Issue
                  </button>
                )}

                {/* C3: Move to In Progress */}
                {issue.status === 'Acknowledged' && (
                  <button
                    onClick={() => setActiveModal('in_progress')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <PlayCircle className="w-4 h-4" /> Start Work (In Progress)
                  </button>
                )}

                {/* C3: Post Progress Update */}
                {issue.status === 'In Progress' && (
                  <button
                    onClick={() => setActiveModal('update')}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Clock className="w-4 h-4" /> Post Progress Update
                  </button>
                )}

                {/* C4: Mark Completed */}
                {issue.status === 'In Progress' && (
                  <button
                    onClick={() => setActiveModal('complete')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <FileCheck2 className="w-4 h-4" /> Close as Completed
                  </button>
                )}

                {/* C4: Reject Issue */}
                {issue.status !== 'Completed' && (
                  <button
                    onClick={() => setActiveModal('reject')}
                    className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-xs font-medium border border-slate-200 transition-all"
                  >
                    Reject Issue
                  </button>
                )}

                {/* C5: Redirect Issue (with 2-redirect check) */}
                {issue.status !== 'Completed' && (
                  <button
                    onClick={() => setActiveModal('redirect')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-all"
                  >
                    Redirect ({issue.redirect_count}/2)
                  </button>
                )}
              </>
            )}

            {/* S9: STUDENT VERIFICATION ACTIONS (Confirm or Reopen) */}
            {isRaiser && issue.status === 'Completed' && (
              <div className="flex items-center gap-2 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">7-Day Resolution Review:</span>
                <button
                  onClick={() => confirmResolution(issue.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Fix (Close)
                </button>
                <button
                  onClick={() => setActiveModal('reopen')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen (Not Fixed)
                </button>
              </div>
            )}

            {/* S5: Delete or Withdraw for Raiser */}
            {isRaiser && issue.status === 'Raised' && issue.vote_count <= 1 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this issue?')) {
                    deleteIssue(issue.id);
                    router.push('/');
                  }
                }}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 font-medium"
              >
                Delete Issue
              </button>
            )}

            {isRaiser && (issue.vote_count > 1 || issue.status !== 'Raised') && issue.status !== 'Withdrawn' && issue.status !== 'Closed' && (
              <button
                onClick={() => {
                  if (confirm('Withdraw this issue? It will remain visible in the archive as withdrawn.')) {
                    withdrawIssue(issue.id);
                  }
                }}
                className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg border border-zinc-200 font-medium"
              >
                Withdraw Issue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Timeline & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Append-only Status Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Lifecycle Audit Trail</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Append-Only Log</span>
          </div>

          <Timeline updates={issueUpdates} />
        </div>

        {/* Comment Thread */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <CommentSection issueId={issue.id} />
        </div>
      </div>

      {/* POPUP ACTION MODAL */}
      {activeModal !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm capitalize">
                {activeModal.replace('_', ' ')}: {issue.title}
              </h3>
              <button onClick={() => setActiveModal('none')} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              {activeModal === 'reject' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Category:
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

              {/* Redirect Rule (C5): 2-redirect check warning */}
              {activeModal === 'redirect' && (
                <div className="space-y-2">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs text-purple-900">
                    <span className="font-bold block mb-0.5">Redirect Rule (C5):</span>
                    {issue.redirect_count === 0 && 'This will be Redirect #1 of 2. 48-hour clock will restart for new owner.'}
                    {issue.redirect_count === 1 && '⚠️ Attention: This is the 2nd and FINAL direct redirect. Any subsequent redirect will automatically route to the President.'}
                    {issue.redirect_count >= 2 && 'Notice: Maximum 2 redirects reached. This ticket will automatically route to the President for final determination.'}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Redirect to Role:
                    </label>
                    <select
                      value={redirectRoleId}
                      onChange={(e) => setRedirectRoleId(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      disabled={issue.redirect_count >= 2}
                    >
                      <option value="">Select Target Council Role...</option>
                      {roles
                        .filter((r) => r.id !== issue.owner_role_id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.inbox_email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeModal === 'acknowledge'
                    ? 'Acknowledgment Note (Visible to student & timeline):'
                    : activeModal === 'complete'
                    ? 'Resolution Details & Proof Description:'
                    : activeModal === 'reject'
                    ? 'Detailed Reason for Rejection:'
                    : activeModal === 'redirect'
                    ? 'Reason for Redirect:'
                    : activeModal === 'reopen'
                    ? 'Why is this issue still unresolved?:'
                    : 'Progress Update Note:'}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Enter details..."
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {(activeModal === 'complete' || activeModal === 'update') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proof Photo URL (Optional):
                  </label>
                  <input
                    type="url"
                    value={actionPhotoUrl}
                    onChange={(e) => setActionPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
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
                  onClick={() => setActiveModal('none')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
