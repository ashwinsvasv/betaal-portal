'use client';

import React from 'react';
import { Issue, CouncilRole } from '@/types';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  XCircle,
  RotateCcw,
  Check,
} from 'lucide-react';

interface Props {
  issue: Issue;
  ownerRole?: CouncilRole;
  now?: number;
}

export function AccountabilityPill({ issue, ownerRole, now = Date.now() }: Props) {
  const roleName = ownerRole?.name || 'Owner';

  let label = '';
  let color: 'grey' | 'amber' | 'red' | 'blue' | 'green' = 'grey';
  let Icon = Clock;

  const status = issue.status;

  if (status === 'Raised') {
    const ackTime = new Date(issue.ack_deadline).getTime();
    const remainingMs = ackTime - now;
    const remainingHours = Math.round(remainingMs / (1000 * 3600));

    if (remainingHours > 0) {
      label = `${roleName} has ${remainingHours}h left to respond`;
      if (remainingHours <= 12) {
        color = 'amber';
        Icon = AlertTriangle;
      } else {
        color = 'grey';
        Icon = Clock;
      }
    } else {
      const lateHours = Math.max(1, Math.abs(remainingHours));
      label = `${roleName} is ${lateHours}h late to respond`;
      color = 'red';
      Icon = AlertTriangle;
    }
  } else if (status === 'Escalated L1' || status === 'Escalated L2') {
    label = `Escalated to the President, ${roleName} missed deadline`;
    color = 'red';
    Icon = ShieldAlert;
  } else if (status === 'Acknowledged') {
    label = `${roleName} acknowledged`;
    color = 'blue';
    Icon = Check;
  } else if (status === 'In Progress') {
    Icon = Wrench;
    if (issue.next_update_due) {
      const updateDueTime = new Date(issue.next_update_due).getTime();
      const remainingMs = updateDueTime - now;
      const remainingDays = Math.round(remainingMs / (1000 * 86400));

      if (remainingDays >= 0) {
        const dayStr = remainingDays === 0 ? 'today' : `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
        label = `${roleName} working on it · update in ${dayStr}`;
        color = 'blue';
      } else {
        const lateDays = Math.max(1, Math.abs(remainingDays));
        label = `${roleName} working · update is ${lateDays}d late`;
        color = 'red';
        Icon = AlertTriangle;
      }
    } else {
      label = `${roleName} working on it`;
      color = 'blue';
    }
  } else if (status === 'Completed') {
    // Marked fixed, student has up to 7 days to confirm or reopen
    const updatedTime = new Date(issue.updated_at).getTime();
    const elapsedDays = Math.floor((now - updatedTime) / (1000 * 86400));
    const daysLeft = Math.max(1, 7 - elapsedDays);
    label = `Marked fixed · ${daysLeft}${daysLeft === 1 ? 'd' : 'd'} left to confirm`;
    color = 'green';
    Icon = CheckCircle2;
  } else if (status === 'Closed') {
    // Resolved in X days
    const createdTime = new Date(issue.created_at).getTime();
    const updatedTime = new Date(issue.updated_at).getTime();
    const days = Math.max(1, Math.round((updatedTime - createdTime) / (1000 * 86400)));
    label = `Resolved in ${days} ${days === 1 ? 'day' : 'days'}`;
    color = 'green';
    Icon = CheckCircle2;
  } else if (status === 'Rejected') {
    label = 'Rejected';
    color = 'grey';
    Icon = XCircle;
  } else if (status === 'Withdrawn') {
    label = 'Withdrawn';
    color = 'grey';
    Icon = RotateCcw;
  } else {
    label = status;
    color = 'grey';
    Icon = Clock;
  }

  const colorMap = {
    grey: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200/80',
      iconClass: 'text-slate-500',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      iconClass: 'text-amber-600',
    },
    red: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      iconClass: 'text-rose-600',
    },
    blue: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      iconClass: 'text-indigo-600',
    },
    green: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      iconClass: 'text-emerald-600',
    },
  };

  const scheme = colorMap[color];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium border ${scheme.bg} whitespace-nowrap shadow-2xs`}
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${scheme.iconClass}`} />
      <span>{label}</span>
    </span>
  );
}
