'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSunwai } from '@/lib/store';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, getUserRole } = useSunwai();
  const [headerSearch, setHeaderSearch] = useState('');

  const userRole = getUserRole(currentUser.id);
  const isCouncil = Boolean(userRole);
  const isPresidentOrAdmin =
    userRole?.name === 'President' || currentUser.email === 'techadmin@iiml.ac.in';

  // Role or roll number display string
  const rollOrBatch = currentUser.roll_no || `${currentUser.course}${currentUser.batch || '42'}`;
  const roleDisplay = userRole ? userRole.name : `${currentUser.course} ${currentUser.batch || '42'}`;

  // Avatar initials
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const navLinkClass = (active: boolean) =>
    `text-[13px] sm:text-[14px] font-medium transition-colors px-3 py-1.5 rounded-full ${
      active
        ? 'bg-[#1e293b] text-white shadow-xs'
        : 'text-[#475569] hover:text-[#0f172a] hover:bg-gray-100/80'
    }`;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      router.push(`/?search=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      router.push('/');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Top Main Bar */}
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Etrigan-Style Logo */}
        <Link href="/" className="flex flex-col items-start leading-none group shrink-0">
          <div className="flex items-baseline">
            <span className="text-[22px] sm:text-[24px] font-black tracking-tight text-[#0f172a] font-sans">
              Sunwai
            </span>
            <span className="text-[20px] sm:text-[22px] font-black text-[#dc2626] ml-1 tracking-tight">
              1.0
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 tracking-tight lowercase -mt-0.5 group-hover:text-gray-600 transition-colors">
            connecting hell!
          </span>
        </Link>

        {/* Center: Etrigan-Style Pill Search */}
        <div className="hidden sm:flex flex-1 max-w-[380px] mx-2">
          <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="PGPID, Name or Issue..."
              className="w-full bg-[#f3f4f6] text-[#0f172a] placeholder-gray-400 text-[13px] pl-4 pr-16 py-2 rounded-full border border-gray-200/70 focus:bg-white focus:border-[#2563eb] transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1.5 text-gray-400 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </form>
        </div>

        {/* Right: Raise Button, Profile Card & Sign Out */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link
            href="/raise"
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Raise issue</span>
          </Link>

          {/* User Profile Card (Etrigan style) */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-gray-200">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#334155] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs ring-1 ring-black/5 shrink-0"
              title={`${currentUser.name} (${roleDisplay})`}
            >
              {initials}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-[13px] font-bold text-gray-900 max-w-[130px] truncate">
                {currentUser.name}
              </span>
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-tight">
                {rollOrBatch}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/signin' })}
            title="Sign out"
            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subnav Navigation Links Bar */}
      <div className="border-t border-gray-100 bg-[#f8fafc]/70">
        <div className="max-w-[1050px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className={navLinkClass(pathname === '/')}>
              All issues
            </Link>

            <Link href="/my-issues" className={navLinkClass(pathname === '/my-issues')}>
              My issues
            </Link>

            {isCouncil && (
              <Link href="/inbox" className={navLinkClass(pathname === '/inbox')}>
                My inbox
              </Link>
            )}

            {isPresidentOrAdmin && (
              <Link
                href="/dashboard"
                className={navLinkClass(pathname === '/dashboard' || pathname === '/president')}
              >
                Dashboard
              </Link>
            )}

            <Link href="/outbox" className={navLinkClass(pathname === '/outbox')}>
              Email log
            </Link>
          </nav>

          <div className="text-[11px] text-gray-400 font-medium hidden sm:block">
            Signed in as <span className="text-gray-700 font-semibold">{roleDisplay}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
