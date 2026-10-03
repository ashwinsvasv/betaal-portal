'use client';

import React, { useState, useMemo } from 'react';
import { useSunwai } from '@/lib/store';
import { IssueCategory } from '@/types';
import {
  BarChart3,
  Building,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  ArrowUpDown,
  Filter,
  Shield,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';

export default function AreaDashboardPage() {
  const { issues, roles, users, getUserById } = useSunwai();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedHostel, setSelectedHostel] = useState<string>('All');

  const now = new Date().getTime();

  // Compute metrics for each secretariat and hostel
  const categories: IssueCategory[] = [
    'Infra & IT',
    'Hostel life',
    'Mess and food',
    'Academics',
    'Sports facilities and events',
    'Events',
    'Cultural',
    'Finance and reimbursements',
    'Other / not sure',
  ];

  const categoryMetrics = useMemo(() => {
    return categories.map((cat) => {
      const catIssues = issues.filter((i) => i.category === cat);
      const open = catIssues.filter(
        (i) => i.status !== 'Closed' && i.status !== 'Withdrawn' && i.status !== 'Rejected'
      ).length;
      const overdue = catIssues.filter(
        (i) =>
          (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now) ||
          i.status === 'Escalated L1' ||
          i.status === 'Escalated L2'
      ).length;
      const inProgress = catIssues.filter((i) => i.status === 'In Progress').length;
      const resolved = catIssues.filter(
        (i) => i.status === 'Completed' || i.status === 'Closed'
      ).length;

      const critical = catIssues.filter((i) => i.severity === 'Critical').length;
      const high = catIssues.filter((i) => i.severity === 'High').length;
      const normal = catIssues.filter((i) => i.severity === 'Normal').length;
      const reopened = catIssues.filter((i) => i.is_reopened).length;

      // Find role representing this category
      const role = roles.find((r) => r.category_domain === cat);
      const holder = role ? getUserById(role.holder_user_id) : null;

      // Calculate approximate average days to close
      const closedIssues = catIssues.filter((i) => i.status === 'Closed' || i.status === 'Completed');
      let avgDays = 0;
      if (closedIssues.length > 0) {
        const totalDurationDays = closedIssues.reduce((acc, iss) => {
          const start = new Date(iss.created_at).getTime();
          const end = new Date(iss.closed_at || iss.updated_at).getTime();
          return acc + Math.max(1, Math.round((end - start) / (86400 * 1000)));
        }, 0);
        avgDays = Math.round(totalDurationDays / closedIssues.length);
      } else {
        avgDays = 0;
      }

      const reopenRate = resolved > 0 ? Math.round((reopened / resolved) * 100) : 0;

      return {
        category: cat,
        roleName: role?.name || 'Assigned Council Secretary',
        holderName: holder?.name || 'Council Secretary',
        total: catIssues.length,
        open,
        overdue,
        inProgress,
        resolved,
        critical,
        high,
        normal,
        reopened,
        reopenRate,
        avgDays,
      };
    });
  }, [issues, roles, users, now]);

  // Overall totals
  const totalOpen = categoryMetrics.reduce((acc, m) => acc + m.open, 0);
  const totalOverdue = categoryMetrics.reduce((acc, m) => acc + m.overdue, 0);
  const totalResolved = categoryMetrics.reduce((acc, m) => acc + m.resolved, 0);
  const totalCritical = categoryMetrics.reduce((acc, m) => acc + m.critical, 0);
  const avgResolutionTime = Math.round(
    categoryMetrics.reduce((acc, m) => acc + m.avgDays, 0) / categoryMetrics.filter((m) => m.avgDays > 0).length || 4
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Council Accountability Analytics (C7)
              </span>
              <span className="text-xs text-slate-300">Target: Median days &lt; 14 · Reopen rate &lt; 10%</span>
            </div>
            <h1 className="text-2xl font-black">Secretariat & Area Performance Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Real-time monitoring of open issues, 48-hour response breaches, severity flags, and resolution quality.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
            >
              Back to Public Feed
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Open Tickets</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalOpen}</div>
          <span className="text-[11px] text-slate-400">Under active council handling</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Overdue (48h Breaches)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{totalOverdue}</div>
          <span className="text-[11px] text-rose-600 font-medium">Requires immediate escalation</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avg Resolution Speed</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">~{avgResolutionTime} Days</div>
          <span className="text-[11px] text-slate-400">Target: Under 14 days (Term target)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Critical Severity Items</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{totalCritical}</div>
          <span className="text-[11px] text-slate-400">Flagged High Urgency (C6)</span>
        </div>
      </div>

      {/* Secretariat Breakdown Table (C7) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>Secretariat Accountability Table</span>
            </h2>
            <p className="text-xs text-slate-500">
              Performance by domain: open issues, response breaches, severity mix, and student reopen rates.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-4">Secretariat / Category</th>
                <th className="py-3 px-4">Officer in Charge</th>
                <th className="py-3 px-4 text-center">Open</th>
                <th className="py-3 px-4 text-center">Overdue 48h</th>
                <th className="py-3 px-4 text-center">Resolved</th>
                <th className="py-3 px-4 text-center">Avg Days</th>
                <th className="py-3 px-4 text-center">Severity Mix (Crit/High)</th>
                <th className="py-3 px-4 text-center">Reopen Rate</th>
                <th className="py-3 px-4 text-right">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryMetrics.map((item) => (
                <tr key={item.category} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span>{item.category}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 block">{item.roleName}</span>
                    <span className="text-[11px] text-slate-400">{item.holderName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {item.open}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.overdue > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                        {item.overdue}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">
                    {item.resolved}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">
                    {item.avgDays > 0 ? `${item.avgDays}d` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 font-mono">
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[10px] font-bold" title="Critical severity">
                        {item.critical}C
                      </span>
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-bold" title="High severity">
                        {item.high}H
                      </span>
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]" title="Normal severity">
                        {item.normal}N
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.reopenRate > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                        {item.reopenRate}%
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">0%</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {item.overdue > 0 ? (
                      <span className="text-rose-600 font-bold inline-flex items-center gap-1 text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                      </span>
                    ) : item.open > 0 ? (
                      <span className="text-blue-600 font-semibold inline-flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> In Progress
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold inline-flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Clear
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
