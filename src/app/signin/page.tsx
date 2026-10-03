'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useSunwai } from '@/lib/store';

export default function SignInPage() {
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const { status } = useSession();
  const { users, currentUser, setCurrentUser, updateUser } = useSunwai();

  const [googleReady, setGoogleReady] = useState<boolean | null>(null);
  const [hostel, setHostel] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [profileError, setProfileError] = useState('');

  // Is Google configured on the server? Also pick up ?error= from a failed sign-in.
  useEffect(() => {
    setErrorCode(new URLSearchParams(window.location.search).get('error'));
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((p) => setGoogleReady(Boolean(p && p.google)))
      .catch(() => setGoogleReady(false));
  }, []);

  // Curate key demo accounts representing different user roles
  const demoProfiles = [
    {
      userId: 'user-stu-1', // Rahul Sharma
      label: 'Student',
      desc: 'Rahul Sharma · PGP 41 (Hostel 3)',
    },
    {
      userId: 'user-stu-3', // Ananya Sen
      label: 'Student',
      desc: 'Ananya Sen · PGP 42 (Hostel 4)',
    },
    {
      userId: 'user-infra', // Kabir Mehta
      label: 'Infra & IT Secretary',
      desc: 'Kabir Mehta · Secretariat Lead',
    },
    {
      userId: 'user-h3-rep', // Vikramaditya Rao
      label: 'Hostel 3 Rep',
      desc: 'Vikramaditya Rao · Hostel Representative',
    },
    {
      userId: 'user-mess', // Rohan Kulkarni
      label: 'Mess Secretary',
      desc: 'Rohan Kulkarni · Food & Dining Lead',
    },
    {
      userId: 'user-pres', // Ashwin Narayan
      label: 'President',
      desc: 'Ashwin Narayan · Student Council President',
    },
  ];

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

  if (needsProfile) {
    return (
      <div className="py-8 sm:py-16">
        <form
          onSubmit={handleProfileSave}
          className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-10 max-w-[480px] mx-auto space-y-5"
        >
          <div>
            <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">Pick your hostel</h1>
            <p className="text-[15px] text-[#5b6478] mt-1">
              One time only. Your hostel decides which representative gets your issues.
            </p>
          </div>
          {profileError && (
            <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[14px] p-3 rounded-[8px]">
              {profileError}
            </div>
          )}
          <div>
            <label className="block text-[14px] font-medium mb-1.5">Hostel</label>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-[8px]"
            >
              <option value="">Choose a hostel</option>
              {['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5'].map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[14px] font-medium mb-1.5">Programme</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-[8px]"
              >
                <option value="">Choose</option>
                {['PGP', 'ABM', 'IPM', 'IPMX'].map((c) => (
                  <option key={c} value={c}>{c}</option>
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
                className="w-full bg-white border border-[#dde2ea] text-[15px] px-3.5 py-2.5 rounded-[8px]"
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
    <div className="py-8 sm:py-16">
      <div className="bg-white rounded-[12px] border border-[#dde2ea] p-6 sm:p-10 max-w-[850px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left: Headline & Statement */}
        <div className="space-y-4">
          <div className="text-[13px] font-medium text-[#2f45c5] uppercase tracking-wide">
            Sunwai · IIM Lucknow
          </div>
          <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">
            Raise it once. Someone owns it. They have 48 hours.
          </h1>
          <p className="text-[15px] text-[#5b6478] leading-relaxed">
            Every complaint at IIM Lucknow is given an official council owner, a clear deadline, and a public status so nothing falls through the cracks.
          </p>
        </div>

        {/* Right: Sign in button & Demo account list */}
        <div className="space-y-6 md:border-l md:border-[#dde2ea] md:pl-10">
          <div>
            {errorText && (
              <div className="bg-[#fdecea] border border-[#b42318] text-[#b42318] text-[13px] p-3 rounded-[8px] mb-3">
                {errorText}
              </div>
            )}
            {googleReady === false ? (
              <p className="text-[13px] text-[#9a5506] bg-[#fff3dc] p-3 rounded-[8px]">
                Google sign-in is not set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, or use a demo account below.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-[#2f45c5] hover:bg-[#2537a0] text-white font-medium text-[15px] py-2.5 px-4 rounded-[8px] transition-colors text-center"
              >
                Sign in with IIML Google
              </button>
            )}
            <p className="text-[12px] text-[#5b6478] text-center mt-2">
              Requires an active @iiml.ac.in student account.
            </p>
          </div>

          <div className="border-t border-[#dde2ea] pt-5">
            <div className="text-[12px] font-medium text-[#5b6478] uppercase tracking-wider mb-3">
              Or explore with a demo account
            </div>
            <div className="space-y-2">
              {demoProfiles.map((p) => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => handleSelectUser(p.userId)}
                  className="w-full text-left p-2.5 rounded-[8px] border border-[#dde2ea] hover:border-[#2f45c5] hover:bg-[#eaedfb]/40 transition-colors flex items-center justify-between text-[13px]"
                >
                  <div>
                    <div className="font-medium text-[#16213e]">{p.desc}</div>
                    <div className="text-[11px] text-[#5b6478]">{p.label}</div>
                  </div>
                  <span className="text-[12px] text-[#2f45c5] font-medium">Use →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
