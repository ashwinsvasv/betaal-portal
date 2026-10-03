'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { AccountabilityPill } from '@/components/AccountabilityPill';

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
      <div className="bg-white rounded-[12px] border border-[#dde2ea] p-12 text-center space-y-3">
        <h1 className="text-[20px] font-serif text-[#16213e]">Issue not found</h1>
        <p className="text-[14px] text-[#5b6478]">This issue may have been removed or does not exist.</p>
        <Link href="/" className="inline-block text-[14px] text-[#2f45c5] font-medium underline mt-2">
          Return to all issues
        </Link>
      </div>
    );
  }

  // Permission checks
  const canView = canUserViewIssue(currentUser, issue);
  if (!canView) {
    return (
      <div className="bg-white rounded-[12px] border border-[#dde2ea] p-10 max-w-[600px] mx-auto text-center space-y-3 my-8">
        <h1 className="text-[20px] font-serif text-[#16213e]">Access restricted</h1>
        <p className="text-[14px] text-[#5b6478]">
          This issue is marked private. Private issues are confidential and visible only to the student who raised it, the assigned council owner, and the President.
        </p>
        <Link href="/" className="inline-block text-[14px] text-[#2f45c5] font-medium underline mt-2">
          Return to all issues
        </Link>
      </div>
    );
  }

  const raiser = getUserById(issue.raised_by);
  const ownerRole = getRoleById(issue.owner_role_id);
  const currentUserRole = getUserRole(currentUser.id);

  const isPresident = currentUserRole?.name === 'President';
  const isOwner = currentUserRole?.id === issue.owner_role_id || isPresident;
  const isRaiser = issue.raised_by === currentUser.id;
  const isVoted = userVotes.has(issue.id);

  const issueUpdates = statusUpdates.filter((u) => u.issue_id === issue.id);
  const issueComments = comments.filter((c) => c.issue_id === issue.id);

  // Public Identity Rule (Section 6)
  const canSeeFullIdentity = isOwner || isPresident || isRaiser;
  const authorDisplay = canSeeFullIdentity
    ? `${raiser?.name || 'Student'} (${raiser?.hostel || ''})`
    : `a ${raiser?.course || 'PGP'} ${raiser?.batch || '42'} student`;

  const issueNum = issue.id.replace('issue-', '').slice(-4);
  const scopeLabel = issue.scope === 'whole campus' ? 'Whole campus' : issue.hostel;

  // Raiser edit/delete permissions (Section 4)
  // Raiser, before any vote/acknowledgment: Edit / Delete in the sidebar. After that: Withdraw only.
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

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link href="/" className="text-[13px] text-[#5b6478] hover:text-[#16213e] inline-flex items-center gap-1">
          ← Back to all issues
        </Link>
      </div>

      {/* Red Error Banner */}
      {errorMessage && (
        <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3.5 rounded-[8px] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-[#b42318] font-bold text-[12px] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Green Success Banner (Section 4) */}
      {bannerMessage && (
        <div className="bg-[#e6f4ec] border border-[#17734a] text-[#17734a] text-[14px] p-3.5 rounded-[8px] flex items-center justify-between">
          <span>{bannerMessage}</span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-[#17734a] font-bold text-[12px] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Layout (Section 2 & 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-start">
        {/* Left: Main Content */}
        <div className="space-y-8">
          {/* Header Block: Meta, Title & Accountability Pill */}
          <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-[12px] text-[#5b6478]">
              <span className="font-mono">#{issueNum}</span>
              <span>·</span>
              <span>{issue.category}</span>
              <span>·</span>
              <span>{scopeLabel}</span>
              {issue.visibility === 'private' && (
                <span className="bg-[#eaedfb] text-[#2f45c5] px-2 py-0.5 rounded text-[11px] font-medium ml-1">
                  Private
                </span>
              )}
              {issue.is_priority && (
                <span className="bg-[#fdecea] text-[#b42318] px-2 py-0.5 rounded text-[11px] font-medium ml-1">
                  Priority
                </span>
              )}
            </div>

            <h1 className="text-[26px] sm:text-[30px] font-serif text-[#16213e] leading-snug">
              {issue.title}
            </h1>

            {/* Single Accountability Pill */}
            <div>
              <AccountabilityPill issue={issue} ownerRole={ownerRole} />
            </div>

            {/* Details */}
            <div className="text-[15px] text-[#16213e] leading-relaxed whitespace-pre-line border-t border-[#dde2ea] pt-4">
              {issue.details}
            </div>

            {/* Photos (if attached) */}
            {issue.photos && issue.photos.length > 0 && (
              <div className="border-t border-[#dde2ea] pt-4">
                <div className="text-[13px] font-medium text-[#5b6478] mb-2">Attached photos</div>
                <div className="flex gap-3 flex-wrap">
                  {issue.photos.map((p, idx) => (
                    <a
                      key={idx}
                      href={p}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-24 h-24 rounded-[8px] overflow-hidden border border-[#dde2ea] hover:opacity-90 transition-opacity"
                    >
                      <img src={p} alt="Issue photo" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Panel: Section 4 - Show ONLY what viewer can do right now */}
          {errorMessage && (
            <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3 rounded-[8px]">
              {errorMessage}
            </div>
          )}

          {/* 1. Owner Actions when Raised or Escalated */}
          {isOwner && (issue.status === 'Raised' || issue.status.startsWith('Escalated')) && (
            <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 space-y-4">
              <h2 className="text-[18px] font-serif text-[#16213e]">Respond as {ownerRole?.name}</h2>
              <div>
                <label className="block text-[13px] text-[#5b6478] mb-1">
                  Note to student
                </label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Acknowledged. I am inspecting the Hostel 3 geysers with the maintenance team today."
                  className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-3 rounded-[8px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Acknowledge
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="text-[#b42318] hover:bg-[#fdecea] text-[13px] font-medium px-3 py-2 rounded-[8px] transition-colors"
                >
                  Reject with reason
                </button>
              </div>

              {/* Collapsed Redirect */}
              <details className="mt-3 text-[13px] text-[#5b6478] border-t border-[#dde2ea] pt-3">
                <summary className="cursor-pointer font-medium hover:text-[#16213e]">
                  Not yours? Redirect it
                </summary>
                <div className="mt-3 space-y-3">
                  <select
                    value={redirectRoleId}
                    onChange={(e) => setRedirectRoleId(e.target.value)}
                    className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[13px] p-2 rounded-[8px]"
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
                    className="bg-white border border-[#dde2ea] hover:bg-[#f4f6f9] text-[#16213e] text-[13px] font-medium px-3 py-1.5 rounded-[8px]"
                  >
                    Confirm redirect
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* 2. Owner Actions when Acknowledged */}
          {isOwner && issue.status === 'Acknowledged' && (
            <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 space-y-4">
              <h2 className="text-[18px] font-serif text-[#16213e]">Update status as {ownerRole?.name}</h2>
              <div>
                <label className="block text-[13px] text-[#5b6478] mb-1">
                  Note
                </label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe current status or resolution details..."
                  className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-3 rounded-[8px]"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleStartWork}
                  className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Start work
                </button>

                <button
                  type="button"
                  onClick={handleMarkFixed}
                  className="bg-[#17734a] hover:bg-[#125838] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Mark fixed
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="text-[#b42318] hover:bg-[#fdecea] text-[13px] font-medium px-3 py-2 rounded-[8px] transition-colors"
                >
                  Reject with reason
                </button>
              </div>

              <details className="mt-3 text-[13px] text-[#5b6478] border-t border-[#dde2ea] pt-3">
                <summary className="cursor-pointer font-medium hover:text-[#16213e]">
                  Not yours? Redirect it
                </summary>
                <div className="mt-3 space-y-3">
                  <select
                    value={redirectRoleId}
                    onChange={(e) => setRedirectRoleId(e.target.value)}
                    className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[13px] p-2 rounded-[8px]"
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
                    className="bg-white border border-[#dde2ea] hover:bg-[#f4f6f9] text-[#16213e] text-[13px] font-medium px-3 py-1.5 rounded-[8px]"
                  >
                    Confirm redirect
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* 3. Owner Actions when In Progress */}
          {isOwner && issue.status === 'In Progress' && (
            <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 space-y-4">
              <h2 className="text-[18px] font-serif text-[#16213e]">Progress as {ownerRole?.name}</h2>
              <div>
                <label className="block text-[13px] text-[#5b6478] mb-1">
                  Weekly progress update or fix notes
                </label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Describe progress made this week, vendor updates, or resolution proof..."
                  className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-3 rounded-[8px]"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handlePostUpdate}
                  className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Post weekly update
                </button>

                <button
                  type="button"
                  onClick={handleMarkFixed}
                  className="bg-[#17734a] hover:bg-[#125838] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Mark fixed
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="text-[#b42318] hover:bg-[#fdecea] text-[13px] font-medium px-3 py-2 rounded-[8px] transition-colors"
                >
                  Reject with reason
                </button>
              </div>

              <details className="mt-3 text-[13px] text-[#5b6478] border-t border-[#dde2ea] pt-3">
                <summary className="cursor-pointer font-medium hover:text-[#16213e]">
                  Not yours? Redirect it
                </summary>
                <div className="mt-3 space-y-3">
                  <select
                    value={redirectRoleId}
                    onChange={(e) => setRedirectRoleId(e.target.value)}
                    className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[13px] p-2 rounded-[8px]"
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
                    className="bg-white border border-[#dde2ea] hover:bg-[#f4f6f9] text-[#16213e] text-[13px] font-medium px-3 py-1.5 rounded-[8px]"
                  >
                    Confirm redirect
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* 4. Student Who Raised It, Status Fixed (Section 4) */}
          {isRaiser && issue.status === 'Completed' && (
            <div className="bg-[#e6f4ec] rounded-[12px] border border-[#17734a] p-6 space-y-4">
              <h2 className="text-[18px] font-serif text-[#16213e]">Is it actually fixed?</h2>
              <p className="text-[14px] text-[#17734a]">
                The council member marked this fixed. Please verify whether the issue is resolved on the ground.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleConfirmFixed}
                  className="bg-[#17734a] hover:bg-[#125838] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Yes, it's fixed
                </button>

                <button
                  type="button"
                  onClick={() => setReopenReasonText('Issue is still recurring.')}
                  className="bg-white border border-[#dde2ea] text-[#b42318] text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  No, reopen it
                </button>
              </div>

              {reopenReasonText && (
                <div className="space-y-2 pt-2 border-t border-[#17734a]/20">
                  <label className="block text-[13px] text-[#16213e] font-medium">
                    Why was the fix incomplete?
                  </label>
                  <textarea
                    rows={2}
                    value={reopenReasonText}
                    onChange={(e) => setReopenReasonText(e.target.value)}
                    className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-2.5 rounded-[8px]"
                  />
                  <button
                    type="button"
                    onClick={handleReopen}
                    className="bg-[#b42318] hover:bg-[#8f1b13] text-white text-[13px] font-medium px-3.5 py-1.5 rounded-[8px]"
                  >
                    Confirm reopening
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 space-y-4">
            <h2 className="text-[18px] font-serif text-[#16213e]">Timeline</h2>

            {issueUpdates.length === 0 ? (
              <div className="text-[14px] text-[#5b6478]">No updates recorded yet.</div>
            ) : (
              <div className="space-y-4 border-l border-[#dde2ea] pl-4 ml-1">
                {issueUpdates.map((upd) => {
                  const actor = getUserById(upd.actor_id);
                  const actorRole = actor ? getUserRole(actor.id) : null;
                  const actorName = actorRole ? actorRole.name : actor?.name || 'Council';

                  return (
                    <div key={upd.id} className="relative space-y-1">
                      <div className="w-2 h-2 rounded-full bg-[#5b6478] absolute -left-[21px] top-1.5" />
                      <div className="text-[13px] text-[#5b6478]">
                        <span className="font-medium text-[#16213e]">{actorName}</span>
                        <span> · </span>
                        <span>{new Date(upd.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-[14px] text-[#16213e]">{upd.note}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Discussion */}
          <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 space-y-5">
            <h2 className="text-[18px] font-serif text-[#16213e]">
              Discussion ({issueComments.length})
            </h2>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="space-y-3">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a constructive comment or update..."
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-3 rounded-[8px]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-[#2f45c5] hover:bg-[#2537a0] disabled:opacity-40 text-white text-[13px] font-medium px-4 py-2 rounded-[8px] transition-colors"
                >
                  Post comment
                </button>
              </div>
            </form>

            {/* Comments List */}
            {issueComments.length > 0 && (
              <div className="divide-y divide-[#dde2ea] border-t border-[#dde2ea] pt-2">
                {issueComments.map((c) => {
                  const author = getUserById(c.author_id);
                  const authorRole = author ? getUserRole(author.id) : null;
                  const authorLabel = authorRole
                    ? authorRole.name
                    : `a ${author?.course || 'PGP'} ${author?.batch || '42'} student`;

                  return (
                    <div key={c.id} className="py-3.5 space-y-1 text-[14px]">
                      <div className="flex items-center justify-between text-[12px] text-[#5b6478]">
                        <span className="font-medium text-[#16213e]">{authorLabel}</span>
                        <span>{new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-[#16213e] whitespace-pre-line leading-relaxed">{c.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Narrow Sidebar (Responsible, Status, Votes only) */}
        <aside className="space-y-6">
          <div className="bg-white rounded-[12px] border border-[#dde2ea] p-5 space-y-5 text-[14px]">
            {/* Responsible */}
            <div>
              <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
                Responsible
              </div>
              <div className="font-semibold text-[#16213e]">
                {ownerRole?.name || 'Unassigned'}
              </div>
              <div className="text-[12px] text-[#5b6478] mt-0.5">
                {ownerRole?.inbox_email}
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-[#dde2ea] pt-4">
              <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
                Status
              </div>
              <div className="font-medium text-[#16213e]">
                {issue.status}
              </div>
            </div>

            {/* Votes */}
            <div className="border-t border-[#dde2ea] pt-4">
              <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-2">
                Votes
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => upvoteIssue(issue.id)}
                  className={`px-3 py-1.5 rounded-[8px] border text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                    isVoted
                      ? 'bg-[#eaedfb] border-[#2f45c5] text-[#2f45c5]'
                      : 'bg-white border-[#dde2ea] text-[#16213e] hover:border-[#2f45c5]'
                  }`}
                >
                  <span>▲</span>
                  <span>{issue.vote_count}</span>
                  <span>{isVoted ? 'Voted' : 'Vote'}</span>
                </button>
              </div>
            </div>

            {/* Raiser Edit / Delete or Withdraw */}
            {canEditOrDelete && (
              <div className="border-t border-[#dde2ea] pt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setEditTitle(issue.title);
                    setEditDetails(issue.details);
                  }}
                  className="w-full text-left text-[13px] text-[#2f45c5] font-medium hover:underline"
                >
                  Edit issue
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full text-left text-[13px] text-[#b42318] font-medium hover:underline"
                >
                  Delete issue
                </button>
              </div>
            )}

            {canWithdraw && (
              <div className="border-t border-[#dde2ea] pt-4">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="w-full text-left text-[13px] text-[#5b6478] hover:text-[#b42318] font-medium"
                >
                  Withdraw issue
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
            className="bg-white rounded-[12px] border border-[#dde2ea] p-6 max-w-md w-full space-y-4"
          >
            <h2 className="text-[18px] font-serif text-[#16213e]">Edit issue</h2>
            <div>
              <label className="block text-[13px] text-[#5b6478] mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-2.5 rounded-[8px]"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#5b6478] mb-1">Details</label>
              <textarea
                rows={4}
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] p-2.5 rounded-[8px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-[13px] text-[#5b6478] hover:text-[#16213e]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#2f45c5] text-white text-[13px] font-medium px-4 py-1.5 rounded-[8px]"
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
