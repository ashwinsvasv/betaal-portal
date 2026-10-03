'use client';

import React from 'react';
import { Issue, CouncilRole } from '@/types';

interface Props {
  issue: Issue;
  ownerRole?: CouncilRole;
  now?: number;
}

export function AccountabilityPill({ issue, ownerRole, now = Date.now() }: Props) {
  const roleName = ownerRole?.name || 'Owner';

  let label = '';
  let color: 'grey' | 'amber' | 'red' | 'blue' | 'green' = 'grey';

  const status = issue.status;

  if (status === 'Raised') {
    const ackTime = new Date(issue.ack_deadline).getTime();
    const remainingMs = ackTime - now;
    const remainingHours = Math.round(remainingMs / (1000 * 3600));

    if (remainingHours > 0) {
      label = `${roleName} has ${remainingHours}h left to respond`;
      if (remainingHours <= 12) {
        color = 'amber';
      } else {
        color = 'grey';
      }
    } else {
      const lateHours = Math.max(1, Math.abs(remainingHours));
      label = `${roleName} is ${lateHours}h late to respond`;
      color = 'red';
    }
  } else if (status === 'Escalated L1' || status === 'Escalated L2') {
    label = `Escalated to the President, ${roleName} missed the deadline`;
    color = 'red';
  } else if (status === 'Acknowledged') {
    label = `${roleName} acknowledged it`;
    color = 'blue';
  } else if (status === 'In Progress') {
    if (issue.next_update_due) {
      const updateDueTime = new Date(issue.next_update_due).getTime();
      const remainingMs = updateDueTime - now;
      const remainingDays = Math.round(remainingMs / (1000 * 86400));

      if (remainingDays >= 0) {
        const dayStr = remainingDays === 0 ? 'today' : `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
        label = `${roleName} is working on it, next update in ${dayStr}`;
        color = 'blue';
      } else {
        const lateDays = Math.max(1, Math.abs(remainingDays));
        label = `${roleName} is working on it, weekly update is ${lateDays}d late`;
        color = 'red';
      }
    } else {
      label = `${roleName} is working on it, next update in 4 days`;
      color = 'blue';
    }
  } else if (status === 'Completed') {
    // Marked fixed, student has up to 7 days to confirm or reopen
    const updatedTime = new Date(issue.updated_at).getTime();
    const elapsedDays = Math.floor((now - updatedTime) / (1000 * 86400));
    const daysLeft = Math.max(1, 7 - elapsedDays);
    label = `Marked fixed, the student has ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} to confirm or reopen`;
    color = 'green';
  } else if (status === 'Closed') {
    // Resolved in X days
    const createdTime = new Date(issue.created_at).getTime();
    const updatedTime = new Date(issue.updated_at).getTime();
    const days = Math.max(1, Math.round((updatedTime - createdTime) / (1000 * 86400)));
    label = `Resolved in ${days} ${days === 1 ? 'day' : 'days'}`;
    color = 'green';
  } else if (status === 'Rejected') {
    label = 'Rejected';
    color = 'grey';
  } else if (status === 'Withdrawn') {
    label = 'Withdrawn';
    color = 'grey';
  } else {
    label = status;
    color = 'grey';
  }

  // Exact colour rules:
  // grey: #5b6478 on #eef1f6
  // amber: #9a5506 on #fff3dc
  // red: #b42318 on #fdecea
  // blue: #2f45c5 on #eaedfb
  // green: #17734a on #e6f4ec
  const colorMap = {
    grey: {
      bg: 'bg-[#eef1f6] text-[#5b6478]',
      dot: 'bg-[#5b6478]',
    },
    amber: {
      bg: 'bg-[#fff3dc] text-[#9a5506]',
      dot: 'bg-[#9a5506]',
    },
    red: {
      bg: 'bg-[#fdecea] text-[#b42318]',
      dot: 'bg-[#b42318]',
    },
    blue: {
      bg: 'bg-[#eaedfb] text-[#2f45c5]',
      dot: 'bg-[#2f45c5]',
    },
    green: {
      bg: 'bg-[#e6f4ec] text-[#17734a]',
      dot: 'bg-[#17734a]',
    },
  };

  const scheme = colorMap[color];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium ${scheme.bg} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${scheme.dot}`} />
      <span>{label}</span>
    </span>
  );
}
