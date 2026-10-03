'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';

export default function SignInPage() {
  const router = useRouter();
  const { users, roles, setCurrentUser } = useSunwai();

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

  const handleGoogleSignIn = () => {
    // Sign in with Rahul Sharma by default
    const rahul = users.find((u) => u.id === 'user-stu-1');
    if (rahul) {
      setCurrentUser(rahul);
      router.push('/');
    }
  };

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
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full bg-[#2f45c5] hover:bg-[#2537a0] text-white font-medium text-[15px] py-2.5 px-4 rounded-[8px] transition-colors text-center"
            >
              Sign in with IIML Google
            </button>
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
