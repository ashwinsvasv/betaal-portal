'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSunwai } from '@/lib/store';
import { IssueRow } from '@/components/IssueRow';
import { generate2000TestStudents } from '@/lib/student-upload';

export default function DashboardPage() {
  const {
    currentUser,
    getUserRole,
    issues,
    roles,
    users,
    outbox,
    runDeadlineChecker,
    bulkImportStudents,
    run500UserLoadTest,
  } = useSunwai();

  const userRole = getUserRole(currentUser.id);
  const isPresident = userRole?.name === 'President';
  const isAdmin = currentUser.email === 'techadmin@iiml.ac.in';

  const [cronNotice, setCronNotice] = useState<string | null>(null);

  // If viewer is not President or Admin
  if (!isPresident && !isAdmin) {
    return (
      <div className="bg-white rounded-[12px] border border-[#dde2ea] p-10 max-w-[600px] mx-auto text-center space-y-4 my-8">
        <h1 className="text-[20px] font-serif text-[#16213e]">Access restricted</h1>
        <p className="text-[14px] text-[#5b6478]">
          The central dashboard is reserved for the Student Council President and Administrators.
        </p>
        <Link
          href="/signin"
          className="inline-block bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors"
        >
          Sign in as President
        </Link>
      </div>
    );
  }

  const now = Date.now();

  // 1. Five Numbers in One Row (Section 2)
  const openCount = issues.filter(
    (i) => i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
  ).length;

  const escalatedCount = issues.filter((i) => i.status.startsWith('Escalated')).length;

  const lateCount = issues.filter((i) => {
    if (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now) return true;
    if (i.status === 'In Progress' && i.next_update_due && new Date(i.next_update_due).getTime() < now) {
      return true;
    }
    return false;
  }).length;

  const priorityCount = issues.filter(
    (i) => i.is_priority && i.status !== 'Closed' && i.status !== 'Withdrawn'
  ).length;

  const closedIssues = issues.filter((i) => i.status === 'Closed');
  const avgDaysToResolve = useMemo(() => {
    if (closedIssues.length === 0) return '3.5 days';
    const totalDays = closedIssues.reduce((acc, curr) => {
      const created = new Date(curr.created_at).getTime();
      const updated = new Date(curr.updated_at).getTime();
      const days = (updated - created) / (1000 * 86400);
      return acc + Math.max(0.5, days);
    }, 0);
    return `${(totalDays / closedIssues.length).toFixed(1)} days`;
  }, [closedIssues]);

  // "Needs your attention" list (Escalated, Priority, or Overdue)
  const attentionIssues = useMemo(() => {
    return issues.filter((i) => {
      if (i.status === 'Closed' || i.status === 'Withdrawn') return false;
      if (i.status.startsWith('Escalated')) return true;
      if (i.is_priority) return true;
      if (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now) return true;
      if (i.status === 'In Progress' && i.next_update_due && new Date(i.next_update_due).getTime() < now) return true;
      return false;
    });
  }, [issues, now]);

  // "By owner" summary table
  const byOwnerData = useMemo(() => {
    return roles.map((role) => {
      const holder = users.find((u) => u.id === role.holder_user_id);
      const roleIssues = issues.filter((i) => i.owner_role_id === role.id);
      const open = roleIssues.filter(
        (i) => i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
      ).length;
      const overdue = roleIssues.filter((i) => {
        if (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now) return true;
        if (i.status.startsWith('Escalated')) return true;
        if (i.status === 'In Progress' && i.next_update_due && new Date(i.next_update_due).getTime() < now) return true;
        return false;
      }).length;
      const closed = roleIssues.filter((i) => i.status === 'Closed');
      const avgDays =
        closed.length > 0
          ? (
              closed.reduce((acc, c) => acc + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 86400), 0) /
              closed.length
            ).toFixed(1) + 'd'
          : '—';

      return {
        roleId: role.id,
        roleName: role.name,
        holderName: holder?.name || 'Vacant',
        inbox: role.inbox_email,
        open,
        overdue,
        avgDays,
      };
    });
  }, [roles, users, issues, now]);

  // Run deadline check handler
  const handleRunDeadlineCheck = () => {
    const report = runDeadlineChecker();
    setCronNotice(
      `Deadline check executed: ${report.escalatedL1Count} escalated to L1, ${report.escalatedL2Count} escalated to L2, ${report.remindersSent} reminders dispatched.`
    );
  };

  return (
    <div className="space-y-8">
      {/* Title & Deadline Check Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-serif text-[#16213e] leading-tight">
            Dashboard
          </h1>
          <p className="text-[15px] text-[#5b6478] mt-1">
            Student Council oversight, escalation queue, and secretariat SLAs.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleRunDeadlineCheck}
            className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[14px] font-medium px-4 py-2 rounded-[8px] transition-colors whitespace-nowrap"
          >
            Run deadline check now
          </button>
        </div>
      </div>

      {cronNotice && (
        <div className="bg-[#e6f4ec] border border-[#17734a] text-[#17734a] text-[14px] p-3.5 rounded-[8px] flex items-center justify-between">
          <span>{cronNotice}</span>
          <button
            type="button"
            onClick={() => setCronNotice(null)}
            className="text-[#17734a] font-bold text-[12px] ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5 Numbers in One Row (Section 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-[12px] border border-[#dde2ea] p-4 text-center">
          <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
            Open
          </div>
          <div className="text-[28px] font-serif font-bold text-[#16213e] leading-none">
            {openCount}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#dde2ea] p-4 text-center">
          <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
            Escalated
          </div>
          <div className="text-[28px] font-serif font-bold text-[#b42318] leading-none">
            {escalatedCount}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#dde2ea] p-4 text-center">
          <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
            Late
          </div>
          <div className="text-[28px] font-serif font-bold text-[#9a5506] leading-none">
            {lateCount}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#dde2ea] p-4 text-center">
          <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
            Priority
          </div>
          <div className="text-[28px] font-serif font-bold text-[#b42318] leading-none">
            {priorityCount}
          </div>
        </div>

        <div className="bg-white rounded-[12px] border border-[#dde2ea] p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-[12px] text-[#5b6478] font-medium uppercase tracking-wider mb-1">
            Avg to resolve
          </div>
          <div className="text-[24px] font-serif font-bold text-[#17734a] leading-none">
            {avgDaysToResolve}
          </div>
        </div>
      </div>

      {/* Needs Your Attention List (Section 2) */}
      <div className="space-y-3">
        <h2 className="text-[20px] font-serif text-[#16213e]">
          Needs your attention ({attentionIssues.length})
        </h2>
        <div className="bg-white rounded-[12px] border border-[#dde2ea] divide-y divide-[#dde2ea]">
          {attentionIssues.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-[#5b6478]">
              No escalated or overdue issues right now. Everything is on schedule.
            </div>
          ) : (
            attentionIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} showVote={true} />
            ))
          )}
        </div>
      </div>

      {/* By Owner Table (Section 2) */}
      <div className="space-y-3">
        <h2 className="text-[20px] font-serif text-[#16213e]">
          By owner
        </h2>
        <div className="bg-white rounded-[12px] border border-[#dde2ea] overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-[#f4f6f9] border-b border-[#dde2ea] text-[12px] text-[#5b6478] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 font-medium">Council role</th>
                <th className="py-3 px-4 font-medium">Holder</th>
                <th className="py-3 px-4 font-medium">Open</th>
                <th className="py-3 px-4 font-medium">Overdue</th>
                <th className="py-3 px-4 font-medium">Avg resolve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde2ea]">
              {byOwnerData.map((row) => (
                <tr key={row.roleId} className="hover:bg-[#fafbfc]">
                  <td className="py-3 px-4 font-medium text-[#16213e]">{row.roleName}</td>
                  <td className="py-3 px-4 text-[#5b6478]">{row.holderName}</td>
                  <td className="py-3 px-4 text-[#16213e] font-mono">{row.open}</td>
                  <td className="py-3 px-4 font-mono font-medium">
                    {row.overdue > 0 ? (
                      <span className="text-[#b42318]">{row.overdue}</span>
                    ) : (
                      <span className="text-[#5b6478]">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#5b6478] font-mono">{row.avgDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Log (Section 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-serif text-[#16213e]">
            Email log
          </h2>
          <span className="text-[12px] text-[#5b6478]">
            {outbox.length} notifications logged
          </span>
        </div>

        <div className="bg-white rounded-[12px] border border-[#dde2ea] overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f4f6f9] border-b border-[#dde2ea] text-[12px] text-[#5b6478] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 font-medium">Template</th>
                <th className="py-2.5 px-4 font-medium">Recipient</th>
                <th className="py-2.5 px-4 font-medium">Subject</th>
                <th className="py-2.5 px-4 font-medium">Sent at</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dde2ea]">
              {outbox.slice(0, 15).map((item) => (
                <tr key={item.id} className="hover:bg-[#fafbfc]">
                  <td className="py-2.5 px-4 font-mono text-[12px] text-[#5b6478]">
                    {item.template}
                  </td>
                  <td className="py-2.5 px-4 text-[#16213e]">{item.recipient}</td>
                  <td className="py-2.5 px-4 text-[#5b6478] truncate max-w-xs">{item.subject}</td>
                  <td className="py-2.5 px-4 text-[#5b6478] text-[12px]">
                    {new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        item.status === 'sent'
                          ? 'bg-[#e6f4ec] text-[#17734a]'
                          : item.status === 'failed'
                          ? 'bg-[#fdecea] text-[#b42318]'
                          : 'bg-[#fff3dc] text-[#9a5506]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Hardening & Operations (Collapsed) */}
      {(isAdmin || isPresident) && (
        <details className="text-[13px] text-[#5b6478] pt-2">
          <summary className="cursor-pointer font-medium hover:text-[#16213e]">
            System operations & launch controls (Sprint 4)
          </summary>
          <div className="mt-3 p-5 bg-white rounded-[12px] border border-[#dde2ea] space-y-4">
            <div>
              <h3 className="text-[14px] font-medium text-[#16213e] mb-1">
                500-User Concurrent Load Test (Sprint 4 Exit Test)
              </h3>
              <p className="text-[#5b6478] text-[13px] mb-3">
                Simulates 500 concurrent students voting on an issue, tests duplicate rejection for 50 repeated votes, verifies &gt;50 votes/sec throughput, and checks 10% (200 votes) priority status trigger.
              </p>
              <button
                type="button"
                onClick={() => {
                  const res = run500UserLoadTest();
                  setCronNotice(
                    `Load test ${res.passed ? 'PASSED' : 'FAILED'}: Processed ${res.successfulVotes} unique votes in ${res.durationMs}ms (${res.throughputVotesPerSec} votes/sec). Blocked ${res.duplicateAttemptsBlocked} duplicate votes. Priority flag: ${res.priorityTriggered ? 'Triggered (>=200 votes)' : 'No'}.`
                  );
                }}
                className="bg-[#2f45c5] hover:bg-[#2537a0] text-white text-[13px] font-medium px-4 py-2 rounded-[8px] transition-colors"
              >
                Run 500-user load test
              </button>
            </div>

            <div className="border-t border-[#dde2ea] pt-3">
              <h3 className="text-[14px] font-medium text-[#16213e] mb-1">
                Hostel 3 Pilot Status
              </h3>
              <p className="text-[#5b6478] text-[13px]">
                Hostel 3 Pilot running: {issues.filter((i) => i.hostel === 'Hostel 3').length} issues logged,{' '}
                {issues.filter((i) => i.hostel === 'Hostel 3' && i.status === 'Closed').length} closed,{' '}
                {issues.filter((i) => i.hostel === 'Hostel 3' && i.status.startsWith('Escalated')).length} escalated. Primary owner: Hostel 3 Representative.
              </p>
            </div>

            {isAdmin && (
              <div className="border-t border-[#dde2ea] pt-3">
                <h3 className="text-[14px] font-medium text-[#16213e] mb-1">
                  Bulk Student Directory Enrollment (2,000 Students)
                </h3>
                <p className="text-[#5b6478] text-[13px] mb-2.5">
                  Generate and enroll 2,000 student records into the directory with roll prefix parsing.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const rows = generate2000TestStudents(users);
                    const validRows = rows.filter((r) => r.isValid);
                    const res = bulkImportStudents(validRows);
                    setCronNotice(`Successfully enrolled ${res.importedCount} student records into directory.`);
                  }}
                  className="bg-white border border-[#dde2ea] hover:bg-[#f4f6f9] text-[#16213e] text-[13px] font-medium px-3.5 py-1.5 rounded-[8px] transition-colors"
                >
                  Generate & enroll 2,000 students
                </button>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
