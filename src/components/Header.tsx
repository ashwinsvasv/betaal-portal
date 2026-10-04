'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import {
  Search,
  Plus,
  LogOut,
  Layers,
  FileText,
  Inbox,
  LayoutDashboard,
  Mail,
} from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, getUserRole, logout } = useSunwai();
  const [headerSearch, setHeaderSearch] = useState('');

  const userRole = currentUser ? getUserRole(currentUser.id) : undefined;
  const isCouncil = Boolean(userRole);
  const isPresidentOrAdmin =
    userRole?.name === 'President' || currentUser?.email === 'techadmin@iiml.ac.in';

  // Role or roll number display string
  const rollOrBatch = currentUser
    ? currentUser.roll_no || `${currentUser.course || 'PGP'}${currentUser.batch || '42'}`
    : '';
  const roleDisplay = userRole
    ? userRole.name
    : currentUser
    ? `${currentUser.course || 'PGP'} ${currentUser.batch || '42'}`
    : '';

  // Avatar initials
  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const navLinkClass = (active: boolean) =>
    `text-[13px] sm:text-[14px] font-medium transition-all px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
      active
        ? 'bg-slate-900 text-white shadow-2xs font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      {/* Top Main Bar */}
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Etrigan-Style Logo */}
        <Link href="/" className="flex flex-col items-start leading-none group shrink-0">
          <div className="flex items-baseline">
            <span className="text-[22px] sm:text-[24px] font-black tracking-tight text-slate-900 font-sans">
              Sunwai
            </span>
            <span className="text-[20px] sm:text-[22px] font-black text-rose-600 ml-1 tracking-tight">
              1.0
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 tracking-tight lowercase -mt-0.5 group-hover:text-slate-600 transition-colors">
            connecting hell!
          </span>
        </Link>

        {/* Center: Etrigan-Style Pill Search */}
        <div className="hidden sm:flex flex-1 max-w-[380px] mx-2">
          <form onSubmit={handleSearchSubmit} className="w-full relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search issues, keywords..."
              className="w-full bg-slate-100/80 text-slate-900 placeholder-slate-400 text-[13px] pl-9.5 pr-4 py-2 rounded-full border border-slate-200/70 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Right: Authenticated Profile OR Unauthenticated Sign In Button */}
        {currentUser ? (
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/raise"
              className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Raise issue</span>
            </Link>

            {/* User Profile Card */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs ring-1 ring-black/5 shrink-0"
                title={`${currentUser.name} (${roleDisplay})`}
              >
                {initials}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-[13px] font-bold text-slate-900 max-w-[130px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                  {rollOrBatch}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-4 py-2 rounded-full transition-all shadow-xs"
            >
              Sign in with IIML Google
            </Link>
          </div>
        )}
      </div>

      {/* Subnav Navigation Links Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70">
        <div className="max-w-[1050px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className={navLinkClass(pathname === '/')}>
              <Layers className="w-3.5 h-3.5" />
              <span>All issues</span>
            </Link>

            {currentUser && (
              <Link href="/my-issues" className={navLinkClass(pathname === '/my-issues')}>
                <FileText className="w-3.5 h-3.5" />
                <span>My issues</span>
              </Link>
            )}

            {isCouncil && (
              <Link href="/inbox" className={navLinkClass(pathname === '/inbox')}>
                <Inbox className="w-3.5 h-3.5" />
                <span>My inbox</span>
              </Link>
            )}

            {isPresidentOrAdmin && (
              <Link
                href="/dashboard"
                className={navLinkClass(pathname === '/dashboard' || pathname === '/president')}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}

            {(isCouncil || isPresidentOrAdmin) && (
              <Link href="/outbox" className={navLinkClass(pathname === '/outbox')}>
                <Mail className="w-3.5 h-3.5" />
                <span>Email log</span>
              </Link>
            )}
          </nav>

          {currentUser ? (
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Signed in as <span className="text-slate-700 font-semibold">{roleDisplay}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
              <Link href="/signin" className="hover:text-blue-600 underline">
                Sign in to raise issues or track tickets
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
