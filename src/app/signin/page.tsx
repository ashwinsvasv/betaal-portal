'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useSunwai } from '@/lib/store';
import { ALL_HOSTELS, ALL_SECTIONS } from '@/lib/constants';
import { useTheme } from '@/components/ThemeProvider';

type DemoCategory = 'council' | 'hostel_reps';

export default function SignInPage() {
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const { status } = useSession();
  const { users, currentUser, setCurrentUser, updateUser } = useSunwai();
  const { theme } = useTheme();

  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo.png';

  const [googleReady, setGoogleReady] = useState<boolean | null>(null);
  const [hostel, setHostel] = useState('');
  const [section, setSection] = useState('Section A');
  const [profileError, setProfileError] = useState('');

  // Demo Login Directory Tab & Search
  const [activeTab, setActiveTab] = useState<DemoCategory>('council');
  const [demoSearch, setDemoSearch] = useState('');

  // Is Google configured on the server? Also pick up ?error= from a failed sign-in.
  useEffect(() => {
    setErrorCode(new URLSearchParams(window.location.search).get('error'));
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((p) => setGoogleReady(Boolean(p && p.google)))
      .catch(() => setGoogleReady(false));
  }, []);

  const handleSelectUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      router.push('/');
    }
  };

  const needsProfile = status === 'authenticated' && currentUser && (!currentUser.hostel || !currentUser.section);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostel) return setProfileError('Pick your hostel.');
    if (!section) return setProfileError('Pick your section.');
    if (!currentUser) return;

    const updated = {
      ...currentUser,
      hostel,
      section,
      course: currentUser.course || 'PGP',
      batch: currentUser.batch || '42',
    };
    updateUser(currentUser.id, { hostel, section, course: updated.course, batch: updated.batch });
    setCurrentUser(updated);
    router.push('/');
  };

  const errorText =
    errorCode === 'AccessDenied'
      ? 'That Google account is not allowed. Sign in with your @iiml.ac.in account.'
      : errorCode
      ? 'Google sign-in did not complete. Try again.'
      : '';

  // Filtered Personas for the Active Tab (No Personal Names, strictly Roles)
  const demoPersonas = useMemo(() => {
    const q = demoSearch.trim().toLowerCase();

    // 1. Executive Council: President, Mess Sec, Infra & IT Sec
    const councilUsers = [
      { userId: 'user-pres', role: 'President', domain: 'Executive Lead' },
      { userId: 'user-mess', role: 'Mess Secretary', domain: 'Mess & Dining' },
      { userId: 'user-infra', role: 'Infra & IT Secretary', domain: 'Infra & IT' },
    ]
      .map((item) => {
        const u = users.find((user) => user.id === item.userId);
        return u ? { user: u, label: item.role, meta: item.domain } : null;
      })
      .filter((p): p is { user: typeof users[0]; label: string; meta: string } => Boolean(p));

    // 2. 17 Hostel Representatives
    const hostelRepUsers = Array.from({ length: 17 }, (_, i) => {
      const hNum = i + 1;
      const u = users.find((user) => user.id === `user-h${hNum}rep`);
      return u
        ? {
            user: u,
            label: `Hostel ${hNum} Representative`,
            meta: `Hostel ${hNum} Representative`,
          }
        : null;
    }).filter((p): p is { user: typeof users[0]; label: string; meta: string } => Boolean(p));

    let currentList = activeTab === 'hostel_reps' ? hostelRepUsers : councilUsers;

    if (!q) return currentList;

    return currentList.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.meta.toLowerCase().includes(q)
    );
  }, [users, activeTab, demoSearch]);

  if (needsProfile && currentUser) {
    return (
      <div className="py-8 sm:py-16">
        <form
          onSubmit={handleProfileSave}
          className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-10 max-w-[480px] mx-auto space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
        >
          <div>
            <h1 className="text-[26px] sm:text-[28px] font-serif font-bold text-[#0f172a] leading-tight">
              Pick your hostel
            </h1>
            <p className="text-[14px] text-[#64748b] mt-1">
              One time setup. Your hostel determines which representative receives your hostel-specific tickets.
            </p>
          </div>

          {/* Auto-Extracted Student Info from Email */}
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-gray-200 text-[13px] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Student Name:</span>
              <span className="font-bold text-gray-900">{currentUser.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">IIML Email:</span>
              <span className="font-mono text-gray-700">{currentUser.email}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200/70 pt-2">
              <span className="text-gray-500">Auto-Detected Programme:</span>
              <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-xs">
                {currentUser.course || 'PGP'} (Batch {currentUser.batch || '42'}) · {currentUser.roll_no || 'Enrolled'}
              </span>
            </div>
          </div>

          {profileError && (
            <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3 rounded-xl">
              {profileError}
            </div>
          )}

          {/* Required Inputs: Hostel & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                Hostel (1 to 17)
              </label>
              <select
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#2563eb]"
              >
                <option value="">Choose your hostel</option>
                {ALL_HOSTELS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#0f172a] mb-1.5">
                Academic Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#2563eb]"
              >
                {ALL_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[15px] py-2.5 rounded-xl transition-colors shadow-xs"
          >
            Save and continue →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-10 max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 lg:gap-12 items-start shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        {/* Left: Headline, Logo & Purpose Brief */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center">
            <img
              src={logoSrc}
              alt="Betaal 1.0"
              className="h-14 sm:h-16 w-auto max-w-[220px] object-contain drop-shadow-xs"
            />
          </div>

          <h1 className="text-[26px] sm:text-[28px] font-bold text-slate-900 leading-tight">
            Betaal keeps the Student Council accountable.
          </h1>

          <div className="space-y-2.5 text-[14px] text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Raise an issue, and it goes to the person whose job it is to fix it.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>They have 48 hours to reply, or it goes up the chain.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">•</span>
              <span>Vote for what matters, and watch every step in the open until it&apos;s done.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2 text-[12px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Full council coverage: 8 portfolios, 17 Hostels, 9 Sections.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Instant demo access to test any stakeholder view.</span>
            </div>
          </div>
        </div>

        {/* Right: Sign in button & Demo account directory */}
        <div className="space-y-6 lg:border-l lg:border-gray-200 lg:pl-8">
          {/* Primary Google SSO Action */}
          <div>
            {errorText && (
              <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[13px] p-3 rounded-xl mb-3">
                {errorText}
              </div>
            )}
            {googleReady === false ? (
              <p className="text-[13px] text-[#9a5506] bg-[#fff3dc] p-3 rounded-xl">
                Google sign-in is not configured. Contact the portal administrators.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[15px] py-2.5 px-4 rounded-xl transition-colors text-center shadow-xs"
              >
                Sign in with IIML Google
              </button>
            )}
            <p className="text-[12px] text-[#64748b] text-center mt-2">
              Requires an active @iiml.ac.in account.
            </p>
          </div>

          {/* Demo Login Window / Categorized Persona Switcher */}
          <div className="border-t border-gray-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                Demo role directory
              </div>
              <span className="text-[11px] text-gray-400">One-click instant login</span>
            </div>

            {/* Segmented Tab Controls: Council vs Hostel Reps */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#f4f6f9] rounded-xl text-[12px] font-medium border border-gray-200/60">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('council');
                  setDemoSearch('');
                }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  activeTab === 'council'
                    ? 'bg-white text-[#0f172a] font-semibold shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Council Roles (3)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('hostel_reps');
                  setDemoSearch('');
                }}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  activeTab === 'hostel_reps'
                    ? 'bg-white text-[#0f172a] font-semibold shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                Hostel Reps (17)
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                value={demoSearch}
                onChange={(e) => setDemoSearch(e.target.value)}
                placeholder="Filter by role, domain, or hostel..."
                className="w-full bg-white border border-[#dde2ea] text-[13px] px-3 py-1.5 rounded-xl placeholder:text-[#64748b]/70 focus:outline-none focus:border-[#2563eb]"
              />
              {demoSearch && (
                <button
                  type="button"
                  onClick={() => setDemoSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Persona List Window - Roles Only, No Personal Names */}
            <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 border border-gray-100 rounded-xl p-1.5 bg-[#fafbfc]">
              {demoPersonas.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-gray-500">
                  No roles match &quot;{demoSearch}&quot; in this category.
                </div>
              ) : (
                demoPersonas.map((p) => (
                  <button
                    key={p.user.id}
                    type="button"
                    onClick={() => handleSelectUser(p.user.id)}
                    className="w-full text-left p-2.5 bg-white rounded-lg border border-gray-200/80 hover:border-[#2563eb] hover:bg-[#eff6ff] transition-all flex items-center justify-between text-[13px] group shadow-2xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-gray-900 truncate">
                        {p.label}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">{p.meta}</div>
                    </div>
                    <span className="text-[12px] text-[#2563eb] font-semibold whitespace-nowrap opacity-90 group-hover:translate-x-0.5 transition-transform">
                      Try role →
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
