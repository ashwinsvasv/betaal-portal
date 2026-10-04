'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import { IssueCategory, IssueScope, IssueVisibility } from '@/types';
import { determineSuggestedOwner } from '@/lib/routing';
import { findSimilarIssues } from '@/lib/duplicate-detector';
import Link from 'next/link';

export default function RaiseIssuePage() {
  const router = useRouter();
  const { currentUser, roles, issues, userVotes, upvoteIssue, raiseIssue } = useSunwai();

  // Step 1 or Step 2
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Infra & IT');
  const [scope, setScope] = useState<IssueScope>('my hostel');
  const [details, setDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<IssueVisibility>('public');
  const [error, setError] = useState('');
  const [dismissDuplicates, setDismissDuplicates] = useState(false);

  // Real-time Duplicate Detection
  const similarIssues = useMemo(() => {
    if (dismissDuplicates || !currentUser) return [];
    return findSimilarIssues({
      title,
      details,
      category,
      scope,
      hostel: currentUser?.hostel || '',
      issues,
      minScore: 0.22,
    });
  }, [title, details, category, scope, currentUser, issues, dismissDuplicates]);

  // Routing suggestion for Step 2
  const routing = useMemo(() => {
    return determineSuggestedOwner(
      category,
      scope,
      currentUser?.hostel || '',
      roles,
      false,
      false,
      currentUser?.id
    );
  }, [category, scope, currentUser, roles]);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <h1 className="text-[22px] font-serif font-bold text-[#0f172a]">Please sign in</h1>
        <p className="text-[14px] text-[#64748b]">
          Sign in with your IIM Lucknow account to raise an issue, attach photos, and receive official SLA updates from your representative.
        </p>
        <Link
          href="/signin"
          className="inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold px-5 py-2.5 rounded-full transition-colors shadow-xs"
        >
          Sign in with IIML Google
        </Link>
      </div>
    );
  }

  // Handle image upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 3) {
      setError('You can attach up to 3 photos.');
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || title.length < 5) {
      setError('Add a descriptive title (at least 5 characters).');
      return;
    }
    if (!details.trim() || details.length < 15) {
      setError('Explain what needs fixing (at least 15 characters).');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = (toPresident: boolean) => {
    let targetRoleId = routing.ownerRoleId;
    let targetCc = routing.ccRoleIds;

    if (toPresident) {
      const presRole = roles.find((r) => r.name === 'President');
      if (presRole) {
        targetRoleId = presRole.id;
        targetCc = [];
      }
    }

    try {
      const created = raiseIssue({
        title: title.trim(),
        details: details.trim(),
        category,
        scope,
        hostel: currentUser.hostel,
        visibility,
        ownerRoleId: targetRoleId,
        ccRoleIds: targetCc,
        photos,
      });

      router.push(`/issue/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to raise issue. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[30px] font-serif text-[#0f172a] font-bold leading-tight">
          Raise an issue
        </h1>
        <p className="text-[15px] text-[#64748b] mt-1">
          {step === 1
            ? 'Step 1 of 2: Describe the problem on campus.'
            : 'Step 2 of 2: Check who this goes to.'}
        </p>
      </div>

      {error && (
        <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Step 1: The Form */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {/* Issue Title */}
          <div>
            <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDismissDuplicates(false);
              }}
              placeholder="e.g. Wi-Fi router on 2nd floor Hostel 3 keeps dropping"
              className="w-full bg-white border border-[#dde2ea] text-[#16213e] placeholder-gray-400 text-[15px] px-3.5 py-2.5 rounded-xl focus:border-[#2563eb] transition-colors shadow-xs"
            />
          </div>

          {/* Real-Time Duplicate Detection Panel */}
          {similarIssues.length > 0 && (
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-bold text-[#1d4ed8]">
                  <span className="text-base">💡</span>
                  <span>Similar open issues already reported on campus ({similarIssues.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissDuplicates(true)}
                  className="text-[11px] text-gray-400 hover:text-gray-700 underline"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[12px] text-[#1e40af]">
                Upvoting an existing issue combines student demand to reach the <strong>10% Priority threshold</strong> faster.
              </p>

              <div className="space-y-2">
                {similarIssues.map((match) => {
                  const isVoted = userVotes.has(match.issue.id);
                  const issueNum = match.issue.id.replace('issue-', '').slice(-4);
                  const matchPercent = Math.round(match.similarityScore * 100);

                  return (
                    <div
                      key={match.issue.id}
                      className="bg-white rounded-lg p-3 border border-[#dbeafe] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-[#93c5fd] transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-0.5 flex-wrap">
                          <span className="font-mono font-bold text-gray-700">#{issueNum}</span>
                          <span>·</span>
                          <span>{match.issue.category}</span>
                          <span>·</span>
                          <span>
                            {match.issue.scope === 'whole campus' ? 'Whole campus' : match.issue.hostel}
                          </span>
                          <span className="bg-[#dbeafe] text-[#1e40af] px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {matchPercent}% match
                          </span>
                        </div>
                        <div className="font-semibold text-[14px] text-[#0f172a] line-clamp-1">
                          {match.issue.title}
                        </div>
                        <div className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {match.issue.details}
                        </div>
                      </div>

                      {/* Action: Upvote / View */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => upvoteIssue(match.issue.id)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-all ${
                            isVoted
                              ? 'bg-[#dbeafe] text-[#1d4ed8] border border-[#93c5fd]'
                              : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs'
                          }`}
                        >
                          <span>▲</span>
                          <span>{isVoted ? 'Voted' : 'Upvote instead'}</span>
                          <span className="text-[11px] opacity-80 font-normal">
                            ({match.issue.vote_count})
                          </span>
                        </button>

                        <Link
                          href={`/issue/${match.issue.id}`}
                          target="_blank"
                          className="text-[12px] text-gray-600 hover:text-[#2563eb] font-medium underline px-1 py-1"
                        >
                          View ↗
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] px-3.5 py-2.5 rounded-xl focus:border-[#2563eb] transition-colors shadow-xs"
              >
                <option value="Infra & IT">Infra & IT</option>
                <option value="Hostel life">Hostel life</option>
                <option value="Mess and food">Mess and food</option>
                <option value="Academics">Academics</option>
                <option value="Sports facilities and events">Sports facilities and events</option>
                <option value="Events">Events</option>
                <option value="Cultural">Cultural</option>
                <option value="Finance and reimbursements">Finance and reimbursements</option>
                <option value="Other / not sure">Other / not sure</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as IssueScope)}
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] px-3.5 py-2.5 rounded-xl focus:border-[#2563eb] transition-colors shadow-xs"
              >
                <option value="my room">My room ({currentUser.hostel})</option>
                <option value="my hostel">My hostel ({currentUser.hostel})</option>
                <option value="whole campus">Whole campus</option>
              </select>
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
              Details
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the exact location, when it started, and how it affects students..."
              className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[15px] px-3.5 py-2.5 rounded-xl focus:border-[#2563eb] transition-colors shadow-xs"
            />
          </div>

          {/* Photos (optional) */}
          <div>
            <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
              Photos (optional, up to 3)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {photos.map((p, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#dde2ea] shadow-xs">
                  <img src={p} alt="Upload" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="w-20 h-20 rounded-xl border border-dashed border-[#dde2ea] hover:border-[#2563eb] flex flex-col items-center justify-center cursor-pointer text-[12px] text-[#64748b] bg-[#f8fafc] transition-colors">
                  <span>+ Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-[14px] font-semibold text-[#0f172a] mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                  visibility === 'public'
                    ? 'border-[#2563eb] bg-[#eff6ff]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-[#0f172a]">Public</div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Visible to all campus students. Can receive upvotes.
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                  visibility === 'private'
                    ? 'border-[#2563eb] bg-[#eff6ff]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-semibold text-[#0f172a]">Private</div>
                  <div className="text-[12px] text-[#64748b] mt-0.5">
                    Visible only to you, the assigned owner, and the President.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100">
            <Link href="/" className="text-[14px] text-[#64748b] hover:text-[#0f172a]">
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Next: Check who this goes to →
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Check who this goes to */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="space-y-1">
            <h2 className="text-[22px] font-serif text-[#0f172a] font-bold">
              Check who this goes to
            </h2>
            <p className="text-[14px] text-[#64748b]">
              Based on the category and scope, Sunwai assigns this ticket to an official council owner with a strict 48-hour response SLA.
            </p>
          </div>

          {/* Assigned Owner Box */}
          <div className="bg-[#f8fafc] rounded-xl p-5 border border-gray-200 space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-[#64748b]">Assigned owner:</span>
              <span className="font-bold text-[#0f172a]">
                {routing.ownerRoleName}
              </span>
            </div>

            {routing.ccRoleNames.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Copied:</span>
                <span className="text-[#0f172a] font-medium">
                  {routing.ccRoleNames.join(', ')}
                </span>
              </div>
            )}

            <div className="text-[13px] text-[#64748b] border-t border-gray-200 pt-2">
              {routing.reason}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleFinalSubmit(false)}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-semibold py-3 px-4 rounded-xl transition-all text-center shadow-xs"
            >
              Send to {routing.ownerRoleName}
            </button>

            <button
              type="button"
              onClick={() => handleFinalSubmit(true)}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-[#0f172a] text-[14px] font-semibold py-2.5 px-4 rounded-xl transition-colors text-center"
            >
              Not sure, send to the President
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-[#64748b] hover:text-[#0f172a] underline"
            >
              ← Back to edit issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
