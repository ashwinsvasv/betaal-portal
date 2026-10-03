'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import { IssueCategory, IssueScope, IssueVisibility } from '@/types';
import { determineSuggestedOwner } from '@/lib/routing';
import Link from 'next/link';

export default function RaiseIssuePage() {
  const router = useRouter();
  const { currentUser, roles, raiseIssue } = useSunwai();

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

  // Routing suggestion for Step 2
  const routing = useMemo(() => {
    return determineSuggestedOwner(
      category,
      scope,
      currentUser.hostel,
      roles,
      false,
      false,
      currentUser.id
    );
  }, [category, scope, currentUser.hostel, roles, currentUser.id]);

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
    <div className="max-w-[700px] mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">
          Raise an issue
        </h1>
        <p className="text-[15px] text-[#5b6478] mt-1">
          {step === 1
            ? 'Step 1 of 2: Describe the problem on campus.'
            : 'Step 2 of 2: Check who this goes to.'}
        </p>
      </div>

      {error && (
        <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3 rounded-[8px]">
          {error}
        </div>
      )}

      {/* Step 1: The Form */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-8 space-y-5">
          {/* Issue Title */}
          <div>
            <label className="block text-[14px] font-medium text-[#16213e] mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wi-Fi router on 2nd floor Hostel 3 keeps dropping"
              className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[15px] px-3.5 py-2.5 rounded-[8px] transition-colors"
            />
          </div>

          {/* Category & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-medium text-[#16213e] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] px-3 py-2 rounded-[8px] transition-colors"
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
              <label className="block text-[14px] font-medium text-[#16213e] mb-1.5">
                Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as IssueScope)}
                className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[14px] px-3 py-2 rounded-[8px] transition-colors"
              >
                <option value="my room">My room ({currentUser.hostel})</option>
                <option value="my hostel">My hostel ({currentUser.hostel})</option>
                <option value="whole campus">Whole campus</option>
              </select>
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-[14px] font-medium text-[#16213e] mb-1.5">
              Details
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the exact location, when it started, and how it affects students..."
              className="w-full bg-white border border-[#dde2ea] text-[#16213e] text-[15px] px-3.5 py-2.5 rounded-[8px] transition-colors"
            />
          </div>

          {/* Photos (optional) */}
          <div>
            <label className="block text-[14px] font-medium text-[#16213e] mb-1.5">
              Photos (optional, up to 3)
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {photos.map((p, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-[8px] overflow-hidden border border-[#dde2ea]">
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
                <label className="w-20 h-20 rounded-[8px] border border-dashed border-[#dde2ea] hover:border-[#2f45c5] flex flex-col items-center justify-center cursor-pointer text-[12px] text-[#5b6478] bg-[#f4f6f9] transition-colors">
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
          <div className="border-t border-[#dde2ea] pt-4">
            <label className="block text-[14px] font-medium text-[#16213e] mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
              <label
                className={`p-3 rounded-[8px] border cursor-pointer flex items-start gap-2.5 ${
                  visibility === 'public'
                    ? 'border-[#2f45c5] bg-[#eaedfb]/30'
                    : 'border-[#dde2ea]'
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
                  <div className="font-medium text-[#16213e]">Public</div>
                  <div className="text-[12px] text-[#5b6478] mt-0.5">
                    Visible to all campus students. Can receive upvotes.
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-[8px] border cursor-pointer flex items-start gap-2.5 ${
                  visibility === 'private'
                    ? 'border-[#2f45c5] bg-[#eaedfb]/30'
                    : 'border-[#dde2ea]'
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
                  <div className="font-medium text-[#16213e]">Private</div>
                  <div className="text-[12px] text-[#5b6478] mt-0.5">
                    Visible only to you, the assigned owner, and the President.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-2 flex items-center justify-between">
            <Link href="/" className="text-[14px] text-[#5b6478] hover:text-[#16213e]">
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-5 py-2.5 rounded-[8px] transition-colors"
            >
              Next: Check who this goes to
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Check who this goes to */}
      {step === 2 && (
        <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-[20px] font-serif text-[#16213e]">
              Check who this goes to
            </h2>
            <p className="text-[14px] text-[#5b6478]">
              Based on the category and scope, Sunwai assigns this ticket to an official council owner with a 48-hour response clock.
            </p>
          </div>

          {/* Assigned Owner Box */}
          <div className="bg-[#f4f6f9] rounded-[8px] p-5 border border-[#dde2ea] space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-[#5b6478]">Assigned owner:</span>
              <span className="font-semibold text-[#16213e]">
                {routing.ownerRoleName}
              </span>
            </div>

            {routing.ccRoleNames.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[#5b6478]">Copied:</span>
                <span className="text-[#16213e]">
                  {routing.ccRoleNames.join(', ')}
                </span>
              </div>
            )}

            <div className="text-[13px] text-[#5b6478] border-t border-[#dde2ea] pt-2">
              {routing.reason}
            </div>
          </div>

          {/* Action Buttons: Section 2 requirement:
              "two buttons: 'Send to <owner>' and 'Not sure, send to the President'" */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => handleFinalSubmit(false)}
              className="w-full bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[15px] font-medium py-3 px-4 rounded-[8px] transition-colors text-center"
            >
              Send to {routing.ownerRoleName}
            </button>

            <button
              type="button"
              onClick={() => handleFinalSubmit(true)}
              className="w-full bg-white hover:bg-[#f4f6f9] border border-[#dde2ea] text-[#16213e] text-[14px] font-medium py-2.5 px-4 rounded-[8px] transition-colors text-center"
            >
              Not sure, send to the President
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-[#5b6478] hover:text-[#16213e] underline"
            >
              ← Back to edit issue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
