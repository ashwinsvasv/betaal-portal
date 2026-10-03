'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSunwai } from '@/lib/store';

export function Header() {
  const pathname = usePathname();
  const { currentUser, getUserRole } = useSunwai();

  const userRole = getUserRole(currentUser.id);
  const isCouncil = Boolean(userRole);
  const isPresidentOrAdmin = userRole?.name === 'President' || currentUser.email === 'techadmin@iiml.ac.in';

  // Role display string
  const roleDisplay = userRole
    ? userRole.name
    : `${currentUser.course} ${currentUser.batch}`;

  const navLinkClass = (active: boolean) =>
    `text-[14px] transition-colors ${
      active
        ? 'text-[#16213e] font-semibold'
        : 'text-[#5b6478] hover:text-[#16213e] font-normal'
    }`;

  return (
    <header className="bg-white border-b border-[#dde2ea] sticky top-0 z-30">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Wordmark and Nav Links */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="text-[22px] font-serif font-bold text-[#16213e] tracking-tight">
            Sunwai
          </Link>

          <nav className="flex items-center gap-5 sm:gap-6">
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
          </nav>
        </div>

        {/* Right: Raise an issue, User info & Sign out */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/raise"
            className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[13px] sm:text-[14px] font-medium px-3.5 py-1.5 rounded-[8px] transition-colors whitespace-nowrap"
          >
            Raise an issue
          </Link>

          <div className="hidden md:flex items-center gap-2 text-[13px] text-[#5b6478] border-l border-[#dde2ea] pl-3">
            <span className="text-[#16213e] font-medium">{currentUser.name}</span>
            <span>·</span>
            <span className="text-[#5b6478]">{roleDisplay}</span>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="text-[13px] text-[#5b6478] hover:text-[#16213e] transition-colors border-l border-[#dde2ea] pl-3"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
