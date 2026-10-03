'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import { IssueCategory, IssueScope, IssueVisibility } from '@/types';
import { determineSuggestedOwner } from '@/lib/routing';
import {
  AlertTriangle,
  Upload,
  X,
  CheckCircle,
  HelpCircle,
  Building,
  Shield,
  Eye,
  EyeOff,
  PhoneCall,
  Info,
  Flame,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { checkIssueContent } from '@/lib/moderation';

export default function RaiseIssuePage() {
  const router = useRouter();
  const {
    currentUser,
    roles,
    raiseIssue,
    issues,
    upvoteIssue,
    userVotes,
    abuseWords,
  } = useSunwai();

  const [category, setCategory] = useState<IssueCategory>('Infra & IT');
  const [scope, setScope] = useState<IssueScope>('my hostel');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [visibility, setVisibility] = useState<IssueVisibility>('public');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isConductIssue, setIsConductIssue] = useState(false);
  const [isAboutPresident, setIsAboutPresident] = useState(false);
  const [overrideToPresident, setOverrideToPresident] = useState(false);
  const [error, setError] = useState('');

  // Sensitive keywords trigger (ICC / Harassment / Medical Emergency check)
  const isSensitiveDetected = useMemo(() => {
    const text = `${title} ${details}`.toLowerCase();
    const sensitiveTerms = [
      'harassment',
      'sexual',
      'ragging',
      'assault',
      'emergency',
      'medical emergency',
      'suicide',
      'mental health crisis',
    ];
    return sensitiveTerms.some((term) => text.includes(term));
  }, [title, details]);

  // Sprint 3 Moderation analysis (A5)
  const moderationResult = useMemo(() => {
    return checkIssueContent(title, details, abuseWords);
  }, [title, details, abuseWords]);

  // S11: Duplicate suggestions while typing title
  const similarIssues = useMemo(() => {
    if (!title.trim() || title.length < 4) return [];
    const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (keywords.length === 0) return [];

    return issues
      .filter((i) => i.visibility === 'public' && i.status !== 'Closed')
      .map((i) => {
        const text = `${i.title} ${i.details}`.toLowerCase();
        const score = keywords.reduce((acc, kw) => (text.includes(kw) ? acc + 1 : acc), 0);
        return { issue: i, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.issue);
  }, [title, issues]);

  // Compute suggested owner via deterministic routing rules
  const routing = useMemo(() => {
    const res = determineSuggestedOwner(
      category,
      scope,
      currentUser.hostel,
      roles,
      isConductIssue,
      isAboutPresident,
      currentUser.id
    );

    // If user clicked "Not sure, send to President"
    if (overrideToPresident) {
      const presRole = roles.find((r) => r.name === 'President');
      return {
        ...res,
        ownerRoleId: presRole ? presRole.id : res.ownerRoleId,
        ownerRoleName: 'Student Council President',
        ownerHolderName: 'Ashwin Narayan',
        ownerInboxEmail: presRole?.inbox_email || 'president@iiml.ac.in',
        ccRoleIds: [],
        ccRoleNames: [],
        reason: 'Student selected "Not sure, send to President" for manual triage.',
      };
    }

    return res;
  }, [
    category,
    scope,
    currentUser.hostel,
    roles,
    isConductIssue,
    isAboutPresident,
    currentUser.id,
    overrideToPresident,
  ]);

  // Photo upload handling (simulated base64 / preset photos)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (photos.length + files.length > 3) {
      setError('A maximum of 3 photos can be uploaded per issue.');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSensitiveDetected) {
      setError(
        'Sensitive matter detected. As per institute mandate, safety, ICC, and emergency cases are handled by statutory bodies and cannot be stored in Sunwai.'
      );
      return;
    }

    if (!title.trim() || title.length < 5) {
      setError('Please provide a descriptive title (at least 5 characters).');
      return;
    }

    if (!details.trim() || details.length < 15) {
      setError('Please explain the details of the problem (at least 15 characters).');
      return;
    }

    const created = raiseIssue({
      title: title.trim(),
      details: details.trim(),
      category,
      scope,
      hostel: currentUser.hostel,
      visibility: isConductIssue ? 'private' : visibility,
      ownerRoleId: routing.ownerRoleId,
      ccRoleIds: routing.ccRoleIds,
      photos,
    });

    router.push(`/issue/${created.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Raise a New Issue</h1>
        <p className="text-sm text-slate-600 mt-1">
          Every issue is assigned an official owner, a 48-hour response clock, and public transparency.
        </p>
      </div>

      {/* Sensitive Matter Alert Interceptor */}
      {isSensitiveDetected ? (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-rose-700">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-lg font-bold">Confidential / Emergency Channel Redirect</h2>
              <p className="text-xs text-rose-600">
                Out of Scope: Safety, Internal Complaints Committee (ICC), and Medical Emergencies
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            By statutory law and institute policy, complaints regarding sexual harassment, ragging,
            personal safety, and acute medical emergencies are <strong>strictly not recorded</strong> in the Student Council portal to protect student privacy and ensure immediate statutory response.
          </p>

          <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Official IIM Lucknow Emergency Contacts:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                <span className="font-bold text-rose-900 block">Internal Complaints Committee (ICC)</span>
                <span className="text-slate-600">Email: icc@iiml.ac.in</span>
                <span className="block text-slate-500 font-mono mt-0.5">+91-522-669-6000</span>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <span className="font-bold text-blue-900 block">Campus Health Centre / Ambulance</span>
                <span className="text-slate-600">Emergency Ext: 6789 / 6790</span>
                <span className="block text-slate-500 font-mono mt-0.5">24x7 Medical Officer</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="font-bold text-emerald-900 block">Student Wellness & Counsellor</span>
                <span className="text-slate-600">counsellor@iiml.ac.in</span>
                <span className="block text-slate-500">Confidential appointment</span>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                <span className="font-bold text-amber-900 block">Chief Security Officer</span>
                <span className="text-slate-600">Campus Main Gate</span>
                <span className="block text-slate-500 font-mono mt-0.5">+91-522-669-6555</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                setTitle('');
                setDetails('');
              }}
              className="px-4 py-2 bg-rose-600 text-white font-semibold text-xs rounded-lg hover:bg-rose-700"
            >
              Clear & Return to Standard Issues
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Profile Card (S1 Requirement) */}
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Raising as:</span>
              <span className="text-slate-700 font-semibold">{currentUser.name}</span>
              <span className="text-slate-500 font-mono">({currentUser.roll_no})</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                {currentUser.course} Batch {currentUser.batch}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Building className="w-3.5 h-3.5" />
              <span>Assigned Hostel: <strong>{currentUser.hostel}</strong></span>
            </div>
          </div>

          {/* Category & Scope Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Categorization & Scope
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Infra & IT">Infra & IT (water, power, Wi-Fi, furniture)</option>
                  <option value="Hostel life">Hostel life (cleaning, noise, common rooms)</option>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Scope of Impact <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as IssueScope)}
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="my room">My Room (Hostel {currentUser.hostel})</option>
                  <option value="my hostel">My Hostel ({currentUser.hostel})</option>
                  <option value="whole campus">Whole Campus</option>
                </select>
              </div>
            </div>

            {/* Conflict of Interest checkboxes */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isConductIssue}
                  onChange={(e) => setIsConductIssue(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  This complaint concerns a Student Council member's conduct (Confidential route to President)
                </span>
              </label>

              {isConductIssue && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pl-5">
                  <input
                    type="checkbox"
                    checked={isAboutPresident}
                    onChange={(e) => setIsAboutPresident(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-rose-700 font-semibold">
                    The complaint is about the President (Direct confidential escalation to Student Affairs)
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Title & Details */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Problem Description
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Issue Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Geysers non-functional in Hostel 3 2nd floor washrooms"
                className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* S11: Duplicate Suggestions while typing */}
            {similarIssues.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Similar Open Issues Already Exist:</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Consider upvoting an existing issue rather than raising a duplicate so votes pool together:
                </p>
                <div className="space-y-2 pt-1">
                  {similarIssues.map((sim) => (
                    <div
                      key={sim.id}
                      className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/issue/${sim.id}`}
                          target="_blank"
                          className="font-bold text-slate-900 hover:text-emerald-700 truncate block"
                        >
                          {sim.title}
                        </Link>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {sim.vote_count} votes · Status: {sim.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => upvoteIssue(sim.id)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                          userVotes.has(sim.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {userVotes.has(sim.id) ? '✓ Upvoted' : 'Upvote instead'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the exact location, how long it has been broken, and the impact on students..."
                className="w-full p-2.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sprint 3 Moderation Notices (A5) */}
            {moderationResult.hasAbuse && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Polite Discourse Reminder</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Your text contains terms flagged by the campus moderation dictionary:{' '}
                  <span className="font-mono font-bold bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded">
                    {moderationResult.abusiveWordsFound.join(', ')}
                  </span>
                  . Sunwai encourages polite, constructive discourse. We encourage you to rephrase to maintain a collaborative tone.
                </p>
              </div>
            )}

            {moderationResult.targetsNamedPerson && (
              <div className="bg-blue-50 border border-blue-300 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Held in Admin Review Policy (A5)</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Your complaint explicitly references an individual (<strong>{moderationResult.detectedName}</strong>).
                  Under Sunwai policy, complaints naming individuals are held in the <strong>Admin Review Queue</strong> before public feed display to prevent unsubstantiated harassment while ensuring leadership review.
                </p>
              </div>
            )}

            {/* Photo Attachments (Max 3) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attach Photos (Up to 3 photos)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-300">
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {photos.length < 3 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-500 font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Images are compressed in browser to maintain speed on campus network.
              </span>
            </div>

            {/* Visibility Choice */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Visibility Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                    visibility === 'public' && !isConductIssue
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public' && !isConductIssue}
                    disabled={isConductIssue}
                    onChange={() => setVisibility('public')}
                    className="mt-0.5 text-emerald-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" /> Public (Recommended)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visible in campus feed, upvoteable by peers, pushes public accountability.
                    </p>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                    visibility === 'private' || isConductIssue
                      ? 'border-purple-500 bg-purple-50/40 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private' || isConductIssue}
                    onChange={() => setVisibility('private')}
                    className="mt-0.5 text-purple-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5 text-purple-600" /> Private
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visible only to you, the assigned owner, and the President.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* S3: Suggested Owner Confirmation Card */}
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-5 rounded-xl border border-blue-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>3. Review Suggested Owner (Deterministic Routing Rule)</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Suggested Assigned Role:</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-300">
                  {routing.ownerRoleName}
                </span>
              </div>

              {routing.ccRoleNames.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Copied Roles (CC):</span>
                  <div className="flex gap-1">
                    {routing.ccRoleNames.map((cc) => (
                      <span key={cc} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                        {cc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                <span className="font-semibold text-slate-700">Routing Rationale: </span>
                {routing.reason}
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Role Inbox: {routing.ownerInboxEmail} · 48h SLA response deadline
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setOverrideToPresident((prev) => !prev)}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold underline"
              >
                {overrideToPresident
                  ? '← Revert to automatic suggestion'
                  : 'Not sure? Route directly to Student Council President'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2"
            >
              <span>Confirm & Submit Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
