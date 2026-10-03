'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSunwai } from '@/lib/store';
import {
  Flame,
  PlusCircle,
  Inbox,
  LayoutDashboard,
  Bookmark,
  Mail,
  Zap,
  Users,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PersonaSwitcherModal } from './PersonaSwitcherModal';
import { EmailOutboxModal } from './EmailOutboxModal';

export function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    getUserRole,
    issues,
    outbox,
    runDeadlineChecker,
    resetDemoData,
  } = useSunwai();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [checkerNotification, setCheckerNotification] = useState<string | null>(null);

  const userRole = getUserRole(currentUser.id);
  const isPresident = userRole?.name === 'President';

  // Count assigned issues for owner inbox
  const assignedIssuesCount = issues.filter(
    (i) => i.owner_role_id === userRole?.id && i.status !== 'Closed' && i.status !== 'Withdrawn'
  ).length;

  // Escalated or Priority issues count for President
  const presidentAlertsCount = issues.filter(
    (i) => (i.status === 'Escalated L1' || i.status === 'Escalated L2' || i.is_priority) && i.status !== 'Closed'
  ).length;

  const handleDeadlineCheck = () => {
    const result = runDeadlineChecker();
    if (result.escalatedCount > 0 || result.closedCount > 0) {
      setCheckerNotification(
        `Deadline check completed: ${result.escalatedCount} issue(s) auto-escalated to L1, ${result.closedCount} issue(s) auto-closed.`
      );
    } else {
      setCheckerNotification(
        'Deadline check completed: All active issues are within their respective response deadlines.'
      );
    }
    setTimeout(() => setCheckerNotification(null), 6000);
  };

  return (
    <>
      {/* Top Banner for Demo Alerts / Deadline notification */}
      {checkerNotification && (
        <div className="bg-amber-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <Zap className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="font-medium">{checkerNotification}</span>
          </div>
          <button
            onClick={() => setCheckerNotification(null)}
            className="text-amber-200 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        {/* Upper Brand & Utility Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
                  स
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xl tracking-tight text-slate-900">
                      SUNWAI
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                      सुनवाई
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Student Council Issue Portal · IIM Lucknow
                  </div>
                </div>
              </Link>
            </div>

            {/* Quick Demo Controls & Persona Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Deadline checker test button */}
              <button
                onClick={handleDeadlineCheck}
                title="Simulates hourly cron job checking for missed 48h deadlines"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Run Deadline Check</span>
              </button>

              {/* Simulated Outbox */}
              <button
                onClick={() => setIsOutboxOpen(true)}
                title="View simulated email dispatch log"
                className="relative flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Email Outbox</span>
                {outbox.length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {outbox.length}
                  </span>
                )}
              </button>

              {/* Current Persona Pill */}
              <button
                onClick={() => setIsPersonaOpen(true)}
                className="flex items-center gap-2 text-left p-1.5 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden lg:block leading-tight">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                      {userRole ? userRole.name : 'Student'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.roll_no}
                  </div>
                </div>
                <Users className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Lower Navigation Tabs */}
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 py-2 overflow-x-auto">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pathname === '/'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Flame className="w-4 h-4 text-emerald-600" />
                <span>Public Issues</span>
              </Link>

              <Link
                href="/raise"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pathname === '/raise'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Raise Issue</span>
              </Link>

              <Link
                href="/my-issues"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pathname === '/my-issues'
                    ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bookmark className="w-4 h-4 text-slate-500" />
                <span>My Issues</span>
              </Link>

              {/* Owner Inbox tab - highlighted when user holds a council/rep role */}
              <Link
                href="/inbox"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pathname === '/inbox'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Inbox className="w-4 h-4 text-blue-600" />
                <span>Owner Inbox</span>
                {assignedIssuesCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {assignedIssuesCount}
                  </span>
                )}
              </Link>

              {/* President Dashboard */}
              <Link
                href="/president"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pathname === '/president'
                    ? 'bg-white text-purple-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-600" />
                <span>President Dashboard</span>
                {presidentAlertsCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {presidentAlertsCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Modals */}
      <PersonaSwitcherModal
        isOpen={isPersonaOpen}
        onClose={() => setIsPersonaOpen(false)}
      />
      <EmailOutboxModal
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
      />
    </>
  );
}
