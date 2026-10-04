'use client';
import { formatDateTime } from '@/lib/format-date';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { AccountabilityPill } from '@/components/AccountabilityPill';
import { CategoryBadge } from '@/lib/category-config';
import { checkVoteEligibility } from '@/lib/vote-eligibility';
import {
  ArrowLeft,
  ChevronUp,
  Building2,
  Globe,
  Lock,
  Flame,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  RotateCcw,
  Check,
  Wrench,
  ShieldCheck,
  Mail,
  User,
  Trash2,
  Edit3,
} from 'lucide-react';

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
    confirmResolution,
    reopenIssue,
    withdrawIssue,
    deleteIssue,
    editIssue,
    getUserById,
    getRoleById,
    getUserRole,
    statusUpdates,
    comments,
    addComment,
    roles,
    canUserViewIssue,
  } = useSunwai();

  const issue = issues.find((i) => i.id === issueId);

  // Local Action Form States
  const [noteText, setNoteText] = useState('');
  const [proofPhoto, setProofPhoto] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Duplicate issue');
  const [redirectRoleId, setRedirectRoleId] = useState('');
  const [reopenReasonText, setReopenReasonText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Raiser Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');

  if (!issue) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
        <h1 className="text-[20px] font-serif font-bold text-slate-900">Issue not found</h1>
        <p className="text-[14px] text-slate-500">This issue may have been removed or does not exist.</p>
        <Link href="/" className="inline-flex items-center gap-1 text-[14px] text-blue-600 font-semibold hover:underline mt-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Return to all issues</span>
        </Link>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-xs">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-[22px] font-bold text-slate-900">Please sign in</h1>
        <p className="text-[14px] text-slate-600">
          Sign in with your IIM Lucknow account to view grievance details, council response timelines, and participate in discussion.
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

  // Permission checks
  const canView = canUserViewIssue(currentUser, issue);
  if (!canView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-[600px] mx-auto text-center space-y-3 my-8 shadow-xs">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-[20px] font-serif font-bold text-slate-900">Access restricted</h1>
        <p className="text-[14px] text-slate-600">
          This issue is marked private. Private issues are confidential and visible only to the student who raised it, the assigned council owner, and the President.
        </p>
        <Link href="/" className="inline-block text-[14px] text-blue-600 font-semibold hover:underline mt-2">
          Return to all issues
        </Link>
      </div>
    );
  }

  const raiser = getUserById(issue.raised_by);
  const ownerRole = getRoleById(issue.owner_role_id);
  const currentUserRole = currentUser ? getUserRole(currentUser.id) : undefined;

  const isPresident = currentUserRole?.name === 'President';
  const isOwner = currentUser ? (currentUserRole?.id === issue.owner_role_id || isPresident) : false;
  const isRaiser = currentUser ? issue.raised_by === currentUser.id : false;
  const isVoted = userVotes.has(issue.id);
  const voteEligibility = checkVoteEligibility(currentUser, issue, raiser);

  const issueUpdates = statusUpdates.filter((u) => u.issue_id === issue.id);
  const issueComments = comments.filter((c) => c.issue_id === issue.id);

  // Public Identity Rule (Section 6)
  const canSeeFullIdentity = isOwner || isPresident || isRaiser;
  const authorDisplay = canSeeFullIdentity
    ? `${raiser?.name || 'Student'} (${raiser?.hostel || 'Hostel'})`
    : `a ${raiser?.course || 'PGP'} ${raiser?.batch || '42'} student`;

  const issueNum = issue.id.replace('issue-', '').slice(-4);
  const isCampus = issue.scope === 'whole campus';
  const scopeLabel = isCampus ? 'Whole campus' : issue.hostel;

  // Raiser edit/delete permissions
  const canEditOrDelete = isRaiser && issue.status === 'Raised' && issue.vote_count <= 1;
  const canWithdraw = isRaiser && issue.status !== 'Closed' && issue.status !== 'Withdrawn' && !canEditOrDelete;

  // Handlers
  const handleAcknowledge = () => {
    if (!noteText.trim()) {
      setErrorMessage('Add a short note when acknowledging.');
      return;
    }
    setErrorMessage('');
    acknowledgeIssue(issue.id, noteText.trim());
    setNoteText('');
    setBannerMessage('Acknowledged. The student has been emailed your note.');
  };

  const handleStartWork = () => {
    if (!noteText.trim()) {
      setErrorMessage('Add a short note on what work is starting.');
      return;
    }
    setErrorMessage('');
    startWork(issue.id, noteText.trim());
    setNoteText('');
    setBannerMessage('Moved to in progress. The student has been notified.');
  };

  const handlePostUpdate = () => {
    if (!noteText.trim()) {
      setErrorMessage('Add a short note describing the latest progress.');
      return;
    }
    setErrorMessage('');
    postProgressUpdate(issue.id, noteText.trim(), proofPhoto.trim() || undefined);
    setNoteText('');
    setProofPhoto('');
    setBannerMessage('Weekly update posted to timeline.');
  };

  const handleMarkFixed = () => {
    if (!noteText.trim()) {
      setErrorMessage('Add a note explaining how the issue was resolved.');
      return;
    }
    setErrorMessage('');
    completeIssue(issue.id, noteText.trim(), proofPhoto.trim() || undefined);
    setNoteText('');
    setProofPhoto('');
    setBannerMessage('Marked fixed. The student has 7 days to confirm resolution or reopen.');
  };

  const handleReject = () => {
    if (!noteText.trim()) {
      setErrorMessage('Add a note explaining the reason for rejection.');
      return;
    }
    setErrorMessage('');
    rejectIssue(issue.id, rejectionReason, noteText.trim());
    setNoteText('');
    setBannerMessage('Issue rejected with reason.');
  };

  const handleRedirect = () => {
    if (!redirectRoleId) {
      setErrorMessage('Select the council role to redirect this issue to.');
      return;
    }
    if (!noteText.trim()) {
      setErrorMessage('Add a note explaining why this belongs to another role.');
      return;
    }
    setErrorMessage('');
    const res = redirectIssue(issue.id, redirectRoleId, noteText.trim());
    setNoteText('');
    setBannerMessage(res.message);
  };

  const handleConfirmFixed = () => {
    confirmResolution(issue.id);
    setBannerMessage('Resolution confirmed. This issue is now resolved.');
  };

  const handleReopen = () => {
    if (!reopenReasonText.trim()) {
      setErrorMessage('Add a note explaining why the fix was incomplete.');
      return;
    }
    setErrorMessage('');
    reopenIssue(issue.id, reopenReasonText.trim());
    setReopenReasonText('');
    setBannerMessage('Issue reopened and returned to in progress.');
  };

  const handleWithdraw = () => {
    if (confirm('Withdraw this issue? It will be marked withdrawn and closed.')) {
      withdrawIssue(issue.id);
      setBannerMessage('Issue withdrawn.');
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this issue permanently?')) {
      deleteIssue(issue.id);
      router.push('/');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDetails.trim()) return;
    editIssue(issue.id, editTitle.trim(), editDetails.trim());
    setIsEditing(false);
    setBannerMessage('Issue updated.');
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setErrorMessage('');
    try {
      addComment(issue.id, commentText.trim());
      setCommentText('');
      setBannerMessage('Comment posted.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not post comment.';
      setErrorMessage(msg);
    }
  };

  // Milestone Stepper Logic
  const getStepState = (stepNumber: number) => {
    const status = issue.status;
    let current = 1;
    if (status === 'Acknowledged') current = 2;
    if (status === 'In Progress') current = 3;
    if (status === 'Completed' || status === 'Closed') current = 4;

    if (current > stepNumber) return 'completed';
    if (current === stepNumber) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Top Back Link */}
      <div>
        <Link
          href="/"
          className="text-[13px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all issues</span>
        </Link>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-[14px] p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-rose-700 font-bold text-[12px] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Banner */}
      {bannerMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[14px] p-3.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-emerald-700 font-bold text-[12px] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        {/* Left: Main Content */}
        <div className="space-y-6">
          {/* Header Card: Meta, Title, Deadline Pill & Stepper */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Top Badges */}
            <div className="flex items-center gap-2 flex-wrap text-[12px]">
              <span className="font-mono text-slate-400 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                #{issueNum}
              </span>
              <CategoryBadge category={issue.category} size="xs" />
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {isCampus ? <Globe className="w-3 h-3 text-slate-500" /> : <Building2 className="w-3 h-3 text-slate-500" />}
                <span>{scopeLabel}</span>
              </span>
              {issue.visibility === 'private' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </span>
              )}
              {issue.is_priority && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                  <Flame className="w-3 h-3" />
                  <span>Priority</span>
                </span>
              )}
            </div>

            {/* Issue Title */}
            <h1 className="text-[24px] sm:text-[28px] font-serif font-bold text-slate-900 leading-snug">
              {issue.title}
            </h1>

            {/* Accountability Pill & Meta */}
            <div className="flex items-center gap-3 flex-wrap">
              <AccountabilityPill issue={issue} ownerRole={ownerRole} />
              <span className="text-[13px] text-slate-500">
                Raised by <span className="font-medium text-slate-700">{authorDisplay}</span>
                {' '}on <span className="font-medium text-slate-700">{formatDateTime(issue.created_at)}</span>
              </span>
            </div>

            {/* Visual Resolution Stepper */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                Resolution Lifecycle
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { num: 1, label: 'Raised', desc: '48h Clock' },
                  { num: 2, label: 'Acknowledged', desc: 'Assigned' },
                  { num: 3, label: 'In Progress', desc: 'Weekly update' },
                  { num: 4, label: 'Resolved', desc: 'Verified' },
                ].map((st) => {
                  const state = getStepState(st.num);
                  return (
                    <div
                      key={st.num}
                      className={`p-2.5 rounded-xl border transition-all ${
                        state === 'completed'
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800'
                          : state === 'active'
                          ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-600/20'
                          : 'bg-slate-50/70 border-slate-200/70 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {state === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : state === 'active' ? (
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] font-bold">
                            {st.num}
                          </div>
                        )}
                        <span className="text-[12px] font-bold truncate">{st.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">{st.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Issue Description */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                Grievance Details
              </div>
              <div className="text-[15px] text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                {issue.details}
              </div>
            </div>

            {/* Photos (if attached) */}
            {issue.photos && issue.photos.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Attached Evidence ({issue.photos.length})</span>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {issue.photos.map((p, idx) => (
                    <a
                      key={idx}
                      href={p}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-28 h-28 rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity shadow-2xs"
                    >
                      <img src={p} alt="Issue evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Panels: Context-sensitive actions */}
          {isOwner && (issue.status === 'Raised' || issue.status.startsWith('Escalated')) && (
            <div className="bg-white rounded-2xl border border-blue-200/80 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[16px] font-serif font-bold text-slate-900">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Respond as {ownerRole?.name}</span>
              </div>
              <div>
                <label className="block text-[13px] text-slate-600 mb-1">
                  Official note to student (starts the reply clock)
                </label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Acknowledged. I am inspecting the Hostel 3 geysers with the maintenance team today."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] p-3 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Acknowledge Issue</span>
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="text-rose-700 hover:bg-rose-50 text-[13px] font-semibold px-3.5 py-2 rounded-xl border border-rose-200 transition-colors"
                >
                  Reject with reason
                </button>
              </div>

              {/* Collapsed Redirect */}
              <details className="mt-2 text-[13px] text-slate-600 border-t border-slate-100 pt-3">
                <summary className="cursor-pointer font-medium hover:text-slate-900">
                  Not your domain? Reassign / Redirect ticket
                </summary>
                <div className="mt-3 space-y-3">
                  <select
                    value={redirectRoleId}
                    onChange={(e) => setRedirectRoleId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-[13px] p-2.5 rounded-xl"
                  >
                    <option value="">Select target council role...</option>
                    {roles
                      .filter((r) => r.id !== issue.owner_role_id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleRedirect}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Confirm redirect
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* Owner Actions when In Progress */}
          {isOwner && (issue.status === 'Acknowledged' || issue.status === 'In Progress') && (
            <div className="bg-white rounded-2xl border border-blue-200/80 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[16px] font-serif font-bold text-slate-900">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>Council Action & Progress Updates</span>
              </div>

              <div>
                <label className="block text-[13px] text-slate-600 mb-1">Update details or resolution proof note</label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Geyser coil replaced in 2nd floor washroom. Hot water operational."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] p-3 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {issue.status === 'Acknowledged' && (
                  <button
                    type="button"
                    onClick={handleStartWork}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Move to In Progress
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePostUpdate}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Post Weekly Progress
                </button>

                <button
                  type="button"
                  onClick={handleMarkFixed}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Fixed</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Confirmation Banner when Completed */}
          {isRaiser && issue.status === 'Completed' && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-serif font-bold text-[17px]">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Council Marked this Issue Fixed</span>
              </div>
              <p className="text-[14px] text-emerald-800">
                Please verify if the issue is properly resolved. Confirming closes the grievance. If the problem persists, you can reopen it.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleConfirmFixed}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
                >
                  Yes, confirm resolved
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = prompt('Explain what remains unresolved:');
                    if (r) {
                      reopenIssue(issue.id, r);
                      setBannerMessage('Issue reopened and returned to in progress.');
                    }
                  }}
                  className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  No, reopen issue
                </button>
              </div>
            </div>
          )}

          {/* Timeline Milestones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-xs">
            <h2 className="text-[17px] font-serif font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Official Timeline & Updates</span>
            </h2>

            {issueUpdates.length === 0 ? (
              <div className="text-[14px] text-slate-500 py-2">No updates recorded yet.</div>
            ) : (
              <div className="space-y-4 border-l-2 border-slate-200 pl-4 ml-2">
                {issueUpdates.map((upd) => {
                  const actor = getUserById(upd.actor_id);
                  const actorRole = actor ? getUserRole(actor.id) : null;
                  const actorName = actorRole ? actorRole.name : actor?.name || 'Council';

                  return (
                    <div key={upd.id} className="relative space-y-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1.5 ring-4 ring-white" />
                      <div className="text-[12px] text-slate-500 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{actorName}</span>
                        <span>·</span>
                        <span>{formatDateTime(upd.created_at)}</span>
                      </div>
                      <p className="text-[14px] text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                        {upd.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discussion */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5 shadow-xs" id="comments">
            <h2 className="text-[17px] font-serif font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Discussion ({issueComments.length})</span>
            </h2>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="space-y-3">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a constructive update, additional context, or feedback..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] p-3 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post comment</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            {issueComments.length > 0 && (
              <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                {issueComments.map((c) => {
                  const author = getUserById(c.author_id);
                  const authorRole = author ? getUserRole(author.id) : null;
                  const authorLabel = authorRole
                    ? authorRole.name
                    : `a ${author?.course || 'PGP'} ${author?.batch || '42'} student`;

                  return (
                    <div key={c.id} className="py-3.5 space-y-1 text-[14px]">
                      <div className="flex items-center justify-between text-[12px] text-slate-500">
                        <span className="font-semibold text-slate-800">{authorLabel}</span>
                        <span>{formatDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">{c.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Narrow Sticky Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5 text-[14px] shadow-xs">
            {/* Responsible Council Member */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Person Responsible
              </div>
              <div className="font-bold text-slate-900 text-[15px] flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{ownerRole?.name || 'Unassigned'}</span>
              </div>
              <div className="text-[12px] text-slate-500 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{ownerRole?.inbox_email}</span>
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-slate-100 pt-4 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Current Status
              </div>
              <div className="font-semibold text-slate-900">
                {issue.status}
              </div>
            </div>

            {/* Votes */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Student Votes
                </div>
                <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                  {voteEligibility.scopeLabel}
                </span>
              </div>
              <button
                type="button"
                disabled={!voteEligibility.canVote && !isVoted}
                onClick={() => {
                  if (voteEligibility.canVote || isVoted) {
                    upvoteIssue(issue.id);
                  }
                }}
                className={`w-full py-2.5 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${
                  isVoted
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : !voteEligibility.canVote
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600'
                }`}
                title={!voteEligibility.canVote && !isVoted ? voteEligibility.reason : undefined}
              >
                <ChevronUp className="w-4 h-4" />
                <span>{issue.vote_count} {issue.vote_count === 1 ? 'Vote' : 'Votes'}</span>
                <span>·</span>
                <span>
                  {isVoted
                    ? 'Voted'
                    : !voteEligibility.canVote
                    ? 'Ineligible'
                    : 'Upvote'}
                </span>
              </button>
              {!voteEligibility.canVote && !isVoted && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/70 p-2 rounded-lg leading-relaxed">
                  {voteEligibility.reason}
                </p>
              )}
            </div>

            {/* Raiser Edit / Delete or Withdraw */}
            {canEditOrDelete && (
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditTitle(issue.title);
                    setEditDetails(issue.details);
                  }}
                  className="w-full text-left text-[13px] text-blue-600 font-semibold hover:underline flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit issue</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left text-[13px] text-rose-600 font-semibold hover:underline flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete issue</span>
                </button>
              </div>
            )}

            {canWithdraw && (
              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="w-full text-left text-[13px] text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Withdraw issue</span>
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Edit Modal for Raiser */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl"
          >
            <h2 className="text-[18px] font-serif font-bold text-slate-900">Edit issue</h2>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] p-2.5 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1">Details</label>
              <textarea
                rows={4}
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] p-2.5 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-[13px] text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
