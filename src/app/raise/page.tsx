'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import { IssueCategory, IssueScope, IssueVisibility } from '@/types';
import { determineSuggestedOwner } from '@/lib/routing';
import { findSimilarIssues } from '@/lib/duplicate-detector';
import { ALL_CATEGORIES, getCategoryMeta } from '@/lib/category-config';
import Link from 'next/link';
import {
  ChevronUp,
  AlertCircle,
  Building2,
  Globe,
  Lock,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  X,
  ShieldCheck,
  Sparkles,
  Search,
} from 'lucide-react';

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
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-[540px] mx-auto text-center space-y-4 my-8 shadow-xs">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-[22px] font-serif font-bold text-slate-900">Please sign in</h1>
        <p className="text-[14px] text-slate-600">
          Sign in with your IIM Lucknow account to raise an issue, attach photos, and receive official updates from your representative.
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
    if (!details.trim() || details.length < 10) {
      setError('Add some details explaining the problem (at least 10 characters).');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = (forcePresident: boolean) => {
    setError('');
    try {
      const finalOwnerRoleId = forcePresident
        ? roles.find((r) => r.name === 'President')?.id || routing.ownerRoleId
        : routing.ownerRoleId;

      const created = raiseIssue({
        title: title.trim(),
        details: details.trim(),
        category,
        scope,
        hostel: currentUser.hostel,
        section: currentUser.section || 'Section A',
        visibility,
        ownerRoleId: finalOwnerRoleId,
        ccRoleIds: routing.ccRoleIds,
        photos,
      });

      router.push(`/issue/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not raise issue. Please try again.';
      setError(msg);
      setStep(1);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto space-y-6">
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
              step === 1 ? 'bg-blue-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {step === 1 ? '1' : '✓'}
          </div>
          <span className={`text-[14px] font-bold ${step === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
            1. Issue Details
          </span>

          <span className="text-slate-300">───</span>

          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
              step === 2 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
            }`}
          >
            2
          </div>
          <span className={`text-[14px] font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-400'}`}>
            2. Routing & Reply Deadline
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 text-[14px] p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="text-rose-700 font-bold text-xs ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Step 1 Form */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h1 className="text-[24px] sm:text-[26px] font-serif font-bold text-slate-900 leading-tight">
              Raise a Campus Grievance
            </h1>
            <p className="text-[14px] text-slate-600 mt-1">
              Every issue is assigned directly to the responsible representative with an enforceable 48-hour response clock.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[14px] font-semibold text-slate-900 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wi-Fi router on 2nd floor Hostel 3 keeps dropping"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-[15px] px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Duplicate Detection Callout */}
          {similarIssues.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-950 font-bold text-[14px]">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Similar open issues already reported</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissDuplicates(true)}
                  className="text-[12px] text-blue-600 hover:text-blue-800 underline"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[13px] text-blue-900/80">
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
                      className="bg-white rounded-xl p-3 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-700">#{issueNum}</span>
                          <span>·</span>
                          <span>{match.issue.category}</span>
                          <span>·</span>
                          <span>{match.issue.scope === 'whole campus' ? 'Whole campus' : match.issue.hostel}</span>
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {matchPercent}% match
                          </span>
                        </div>
                        <div className="font-semibold text-[14px] text-slate-900 line-clamp-1">
                          {match.issue.title}
                        </div>
                        <div className="text-[12px] text-slate-500 line-clamp-1 mt-0.5">
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
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>{isVoted ? 'Voted' : 'Upvote instead'}</span>
                          <span className="text-[11px] opacity-80 font-normal">
                            ({match.issue.vote_count})
                          </span>
                        </button>

                        <Link
                          href={`/issue/${match.issue.id}`}
                          target="_blank"
                          className="text-[12px] text-slate-600 hover:text-blue-600 font-medium underline px-1 py-1"
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
              <label className="block text-[14px] font-semibold text-slate-900 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-slate-900 mb-1.5">
                Location Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as IssueScope)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[14px] px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
              >
                <option value="my room">My room ({currentUser.hostel || 'Hostel'})</option>
                <option value="my hostel">My hostel ({currentUser.hostel || 'Hostel'})</option>
                <option value="my section">My section ({currentUser.section || 'Section A'})</option>
                <option value="whole campus">Whole campus</option>
              </select>
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-[14px] font-semibold text-slate-900 mb-1.5">
              Grievance Details
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the exact location, when it started, and how it affects students..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] px-3.5 py-2.5 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-[14px] font-semibold text-slate-900 mb-1.5">
              Photos (optional, up to 3)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {photos.map((p, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
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
                <label className="w-20 h-20 rounded-xl border border-dashed border-slate-300 hover:border-blue-600 flex flex-col items-center justify-center cursor-pointer text-[12px] text-slate-500 bg-slate-50 hover:bg-blue-50/30 transition-colors">
                  <Plus className="w-4 h-4 mb-0.5 text-slate-400" />
                  <span>Photo</span>
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
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-[14px] font-semibold text-slate-900 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                  visibility === 'public'
                    ? 'border-blue-600 bg-blue-50/70 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Public</span>
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5">
                    Visible on campus feed. Can receive student upvotes.
                  </div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-start gap-3 transition-all ${
                  visibility === 'private'
                    ? 'border-blue-600 bg-blue-50/70 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Private</span>
                  </div>
                  <div className="text-[12px] text-slate-500 mt-0.5">
                    Confidential. Visible only to you, assigned owner, and President.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <Link href="/" className="text-[14px] text-slate-500 hover:text-slate-900 font-medium">
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Next: Check who this goes to</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Routing Confirmation */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-[22px] font-serif text-slate-900 font-bold">
              Check who this goes to
            </h2>
            <p className="text-[14px] text-slate-600">
              Based on the category and scope, Betaal assigns this ticket to an official council owner with a strict 48-hour reply deadline.
            </p>
          </div>

          {/* Assigned Owner Box */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned owner:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{routing.ownerRoleName}</span>
              </span>
            </div>

            {routing.ccRoleNames.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Copied:</span>
                <span className="text-slate-900 font-medium">
                  {routing.ccRoleNames.join(', ')}
                </span>
              </div>
            )}

            <div className="text-[13px] text-slate-600 border-t border-slate-200 pt-2">
              {routing.reason}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleFinalSubmit(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-semibold py-3 px-4 rounded-xl transition-all text-center shadow-xs"
            >
              Send to {routing.ownerRoleName}
            </button>

            <button
              type="button"
              onClick={() => handleFinalSubmit(true)}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[14px] font-semibold py-2.5 px-4 rounded-xl transition-colors text-center"
            >
              Not sure, send to the President
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to edit issue</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
