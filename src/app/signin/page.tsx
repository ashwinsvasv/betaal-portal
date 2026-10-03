'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useSunwai } from '@/lib/store';
import { ALL_HOSTELS, ALL_COURSES } from '@/lib/constants';

type DemoCategory = 'council' | 'hostel_reps' | 'class_reps' | 'students';

export default function SignInPage() {
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const { status } = useSession();
  const { users, roles, currentUser, setCurrentUser, updateUser } = useSunwai();

  const [googleReady, setGoogleReady] = useState<boolean | null>(null);
  const [hostel, setHostel] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
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

  useEffect(() => {
    if (currentUser.course && !course) setCourse(currentUser.course);
    if (currentUser.batch && !batch) setBatch(currentUser.batch);
  }, [currentUser, course, batch]);

  const handleSelectUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      router.push('/');
    }
  };

  const needsProfile = status === 'authenticated' && currentUser.hostel === '';

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostel) return setProfileError('Pick your hostel.');
    if (!course) return setProfileError('Pick your programme.');
    if (!/^\d{2}$/.test(batch)) return setProfileError('Enter your batch as two digits, for example 42.');
    const updated = { ...currentUser, hostel, course, batch };
    updateUser(currentUser.id, { hostel, course, batch });
    setCurrentUser(updated);
    router.push('/');
  };

  const errorText =
    errorCode === 'AccessDenied'
      ? 'That Google account is not allowed. Sign in with your @iiml.ac.in account.'
      : errorCode
      ? 'Google sign-in did not complete. Try again.'
      : '';

  // Filtered Personas for the Active Tab
  const demoPersonas = useMemo(() => {
    const q = demoSearch.trim().toLowerCase();

    // 1. Executive Council
    const councilUsers = [
      { userId: 'user-pres', role: 'President', domain: 'Executive Lead' },
      { userId: 'user-infra', role: 'Infra & IT Secretary', domain: 'Infra & IT' },
      { userId: 'user-mess', role: 'Mess Secretary', domain: 'Mess & Dining' },
      { userId: 'user-acad', role: 'Academic Secretary', domain: 'Academics' },
      { userId: 'user-sports', role: 'Sports Secretary', domain: 'Sports' },
      { userId: 'user-events', role: 'Events Secretary', domain: 'Events' },
      { userId: 'user-cultural', role: 'Cultural Secretary', domain: 'Cultural' },
      { userId: 'user-treasurer', role: 'Treasurer', domain: 'Finance' },
      { userId: 'user-admin', role: 'Student Affairs / Admin', domain: 'Administration' },
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
            meta: `Hostel ${hNum} · ${u.course} ${u.batch}`,
          }
        : null;
    }).filter((p): p is { user: typeof users[0]; label: string; meta: string } => Boolean(p));

    // 3. 9 Class Representatives (Sections A to I)
    const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const classRepUsers = sections
      .map((sec) => {
        const u = users.find((user) => user.id === `user-cr-${sec.toLowerCase()}`);
        return u
          ? {
              user: u,
              label: `Class Rep (Section ${sec})`,
              meta: `Section ${sec} · ${u.hostel}`,
            }
          : null;
      })
      .filter((p): p is { user: typeof users[0]; label: string; meta: string } => Boolean(p));

    // 4. General Students
    const studentUsers = users
      .filter((u) => u.id.startsWith('user-stu-'))
      .map((u) => ({
        user: u,
        label: `${u.course} ${u.batch} Student`,
        meta: `${u.hostel} · ${u.roll_no}`,
      }));

    let currentList = councilUsers;
    if (activeTab === 'hostel_reps') currentList = hostelRepUsers;
    if (activeTab === 'class_reps') currentList = classRepUsers;
    if (activeTab === 'students') currentList = studentUsers;

    if (!q) return currentList;

    return currentList.filter(
      (p) =>
        p.user.name.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.meta.toLowerCase().includes(q) ||
        p.user.roll_no.toLowerCase().includes(q)
    );
  }, [users, activeTab, demoSearch]);

  if (needsProfile) {
    return (
      <div className="py-8 sm:py-16">
        <form
          onSubmit={handleProfileSave}
          className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-10 max-w-[480px] mx-auto space-y-5 shadow-sm"
        >
          <div>
            <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">Pick your hostel</h1>
            <p className="text-[15px] text-[#5b6478] mt-1">
              One time only. Your hostel decides which representative receives your tickets.
            </p>
          </div>
          {profileError && (
            <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3 rounded-[8px]">
              {profileError}
            </div>
          )}
          <div>
            <label className="block text-[14px] font-medium mb-1.5">Hostel (1 to 17)</label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-[8px] focus:outline-none focus:border-[#2f45c5]"
            >
              <option value="">Choose your hostel</option>
              {ALL_HOSTELS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-medium mb-1.5">Programme</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-[8px] focus:outline-none focus:border-[#2f45c5]"
              >
                <option value="">Choose</option>
                {ALL_COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-1.5">Batch</label>
              <input
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="42"
                maxLength={2}
                className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-[8px] focus:outline-none focus:border-[#2f45c5]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#2f45c5] hover:bg-[#2537a0] text-white font-medium text-[15px] py-2.5 rounded-[8px] transition-colors"
          >
            Save and continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-10 max-w-[960px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 lg:gap-12 items-start">
        {/* Left: Headline & Statement */}
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="text-[13px] font-medium text-[#2f45c5] uppercase tracking-wide">
            Sunwai · IIM Lucknow
          </div>
          <h1 className="text-[32px] font-serif text-[#16213e] leading-tight">
            Raise it once. Someone owns it. They have 48 hours.
          </h1>
          <p className="text-[15px] text-[#5b6478] leading-relaxed">
            Every complaint at IIM Lucknow is given an official council owner, a clear deadline, and a public status so nothing falls through the cracks.
          </p>

          <div className="pt-4 border-t border-[#dde2ea] space-y-2 text-[13px] text-[#5b6478]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#17734a]" />
              <span>Full council coverage: 8 portfolios, 17 Hostels, 9 Sections.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2f45c5]" />
              <span>Instant demo access to test any stakeholder view.</span>
            </div>
          </div>
        </div>

        {/* Right: Sign in button & Demo account directory */}
        <div className="space-y-6 lg:border-l lg:border-[#dde2ea] lg:pl-8">
          {/* Primary Google SSO Action */}
          <div>
            {errorText && (
              <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[13px] p-3 rounded-[8px] mb-3">
                {errorText}
              </div>
            )}
            {googleReady === false ? (
              <p className="text-[13px] text-[#9a5506] bg-[#fff3dc] p-3 rounded-[8px]">
                Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, or explore with the demo accounts below.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-[#2f45c5] hover:bg-[#2537a0] text-white font-medium text-[15px] py-2.5 px-4 rounded-[8px] transition-colors text-center shadow-sm"
              >
                Sign in with IIML Google
              </button>
            )}
            <p className="text-[12px] text-[#5b6478] text-center mt-2">
              Requires an active @iiml.ac.in account.
            </p>
          </div>

          {/* Demo Login Window / Categorized Persona Switcher */}
          <div className="border-t border-[#dde2ea] pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-medium text-[#5b6478] uppercase tracking-wider">
                Demo login directory
              </div>
              <span className="text-[11px] text-[#5b6478]">One-click instant login</span>
            </div>

            {/* Segmented Tab Controls */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#f4f6f9] rounded-[8px] text-[12px] font-medium">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('council');
                  setDemoSearch('');
                }}
                className={`py-1.5 px-2 rounded-[6px] transition-colors text-center ${
                  activeTab === 'council'
                    ? 'bg-white text-[#16213e] shadow-xs'
                    : 'text-[#5b6478] hover:text-[#16213e]'
                }`}
              >
                Council (9)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('hostel_reps');
                  setDemoSearch('');
                }}
                className={`py-1.5 px-2 rounded-[6px] transition-colors text-center ${
                  activeTab === 'hostel_reps'
                    ? 'bg-white text-[#16213e] shadow-xs'
                    : 'text-[#5b6478] hover:text-[#16213e]'
                }`}
              >
                Hostel Reps (17)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('class_reps');
                  setDemoSearch('');
                }}
                className={`py-1.5 px-2 rounded-[6px] transition-colors text-center ${
                  activeTab === 'class_reps'
                    ? 'bg-white text-[#16213e] shadow-xs'
                    : 'text-[#5b6478] hover:text-[#16213e]'
                }`}
              >
                Class Reps (9)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('students');
                  setDemoSearch('');
                }}
                className={`py-1.5 px-2 rounded-[6px] transition-colors text-center ${
                  activeTab === 'students'
                    ? 'bg-white text-[#16213e] shadow-xs'
                    : 'text-[#5b6478] hover:text-[#16213e]'
                }`}
              >
                Students (20)
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                value={demoSearch}
                onChange={(e) => setDemoSearch(e.target.value)}
                placeholder="Filter by name, hostel, or role..."
                className="w-full bg-white border border-[#dde2ea] text-[13px] px-3 py-1.5 rounded-[6px] placeholder:text-[#5b6478]/70 focus:outline-none focus:border-[#2f45c5]"
              />
              {demoSearch && (
                <button
                  type="button"
                  onClick={() => setDemoSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#5b6478] hover:text-[#16213e]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Persona List Window */}
            <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 border border-[#dde2ea]/60 rounded-[8px] p-1.5 bg-[#fafbfc]">
              {demoPersonas.length === 0 ? (
                <div className="p-4 text-center text-[12px] text-[#5b6478]">
                  No accounts match &quot;{demoSearch}&quot; in this category.
                </div>
              ) : (
                demoPersonas.map((p) => (
                  <button
                    key={p.user.id}
                    type="button"
                    onClick={() => handleSelectUser(p.user.id)}
                    className="w-full text-left p-2.5 bg-white rounded-[6px] border border-[#dde2ea] hover:border-[#2f45c5] hover:bg-[#eaedfb]/30 transition-all flex items-center justify-between text-[13px] group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-[#16213e] truncate flex items-center gap-1.5">
                        <span>{p.user.name}</span>
                        <span className="text-[11px] font-normal text-[#5b6478]">({p.label})</span>
                      </div>
                      <div className="text-[11px] text-[#5b6478] truncate">{p.meta}</div>
                    </div>
                    <span className="text-[12px] text-[#2f45c5] font-medium whitespace-nowrap opacity-90 group-hover:translate-x-0.5 transition-transform">
                      Sign in →
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

