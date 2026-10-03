import { Issue, StatusUpdate, EmailOutboxItem, CouncilRole, CronRunReport } from '@/types';
import { createEmailItem, EmailTemplates } from './email-service';

export interface DeadlineCheckerContext {
  issues: Issue[];
  roles: CouncilRole[];
  simulatedTimeOffsetHours?: number; // Allows time-travel for testing!
}

export interface DeadlineCheckerResult {
  updatedIssues: Issue[];
  newStatusUpdates: StatusUpdate[];
  newEmails: EmailOutboxItem[];
  report: CronRunReport;
}

export function runComprehensiveDeadlineCheck(
  ctx: DeadlineCheckerContext
): DeadlineCheckerResult {
  const offsetMs = (ctx.simulatedTimeOffsetHours || 0) * 3600 * 1000;
  const now = new Date(Date.now() + offsetMs);
  const nowTime = now.getTime();
  const nowIso = now.toISOString();

  let escalatedL1Count = 0;
  let escalatedL2Count = 0;
  let remindersSent = 0;
  let priorityEscalatedCount = 0;
  let updateBreachesCount = 0;
  let autoClosedCount = 0;
  const logs: string[] = [];

  const newStatusUpdates: StatusUpdate[] = [];
  const newEmails: EmailOutboxItem[] = [];

  const updatedIssues = ctx.issues.map((issue) => {
    let modified = { ...issue };
    const ownerRole = ctx.roles.find((r) => r.id === issue.owner_role_id) || {
      id: issue.owner_role_id,
      name: 'Owner Role',
      inbox_email: 'council@iiml.ac.in',
      holder_user_id: '',
    };

    // 1. Acknowledgment Deadlines & 24h Reminders for 'Raised' issues
    if (modified.status === 'Raised') {
      const ackDeadlineTime = new Date(modified.ack_deadline).getTime();
      const diffMs = ackDeadlineTime - nowTime;

      // Check if 48h deadline has passed
      if (diffMs <= 0) {
        escalatedL1Count++;
        const elapsedHours = Math.round((nowTime - new Date(modified.created_at).getTime()) / (3600 * 1000));
        modified.status = 'Escalated L1';
        modified.escalated_at = nowIso;
        modified.updated_at = nowIso;

        const update: StatusUpdate = {
          id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          issue_id: modified.id,
          actor_id: 'system',
          from_status: 'Raised',
          to_status: 'Escalated L1',
          note: `System SLA Monitor: 48-hour acknowledgment deadline missed (${elapsedHours}h unaddressed). Auto-escalated to President.`,
          created_at: nowIso,
        };
        newStatusUpdates.push(update);

        // Dispatch Escalation L1 email
        const email = createEmailItem(EmailTemplates.escalationL1(modified, ownerRole, elapsedHours));
        newEmails.push(email);

        logs.push(`[Escalation L1] Issue "${modified.title}" missed 48h deadline. Escalated to President.`);
      }
      // Check if within 24 hours of deadline and not yet reminded
      else if (diffMs <= 24 * 3600 * 1000 && !modified.last_reminded_at) {
        remindersSent++;
        modified.last_reminded_at = nowIso;

        const email = createEmailItem(EmailTemplates.ackReminder24h(modified, ownerRole));
        newEmails.push(email);

        logs.push(`[Reminder 24h] 24-hour reminder sent to ${ownerRole.name} for "${modified.title}".`);
      }

      // Check Priority response deadline if issue crossed 200 votes
      if (modified.is_priority && modified.priority_response_deadline) {
        const priorityDeadlineTime = new Date(modified.priority_response_deadline).getTime();
        if (nowTime > priorityDeadlineTime && modified.status === 'Raised') {
          priorityEscalatedCount++;
          modified.status = 'Escalated L1';
          modified.escalated_at = nowIso;
          modified.updated_at = nowIso;

          const update: StatusUpdate = {
            id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            issue_id: modified.id,
            actor_id: 'system',
            from_status: 'Raised',
            to_status: 'Escalated L1',
            note: `System Monitor: 7-day mandatory Priority response window missed by ${ownerRole.name}. Escalated to President.`,
            created_at: nowIso,
          };
          newStatusUpdates.push(update);

          const email = createEmailItem(EmailTemplates.priorityDeadlineBreached(modified, ownerRole));
          newEmails.push(email);

          logs.push(`[Priority Breach] Priority issue "${modified.title}" not responded within 7 days. Escalated.`);
        }
      }
    }

    // 2. Escalated L1 issues: Check if President acted within 48h
    if (modified.status === 'Escalated L1' && modified.escalated_at) {
      const escalatedAtTime = new Date(modified.escalated_at).getTime();
      const waitedPresidentMs = nowTime - escalatedAtTime;

      if (waitedPresidentMs >= 48 * 3600 * 1000) {
        escalatedL2Count++;
        const totalWaitedHours = Math.round((nowTime - new Date(modified.created_at).getTime()) / (3600 * 1000));
        modified.status = 'Escalated L2';
        modified.updated_at = nowIso;

        const update: StatusUpdate = {
          id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          issue_id: modified.id,
          actor_id: 'system',
          from_status: 'Escalated L1',
          to_status: 'Escalated L2',
          note: `System SLA Monitor: 48-hour Presidential action window passed. Auto-escalated to Student Affairs (Escalated L2).`,
          created_at: nowIso,
        };
        newStatusUpdates.push(update);

        const email = createEmailItem(EmailTemplates.escalationL2(modified, totalWaitedHours));
        newEmails.push(email);

        logs.push(`[Escalation L2] Issue "${modified.title}" exceeded Level 1 timeline. Escalated to Student Affairs.`);
      }
    }

    // 3. In Progress issues: Weekly update SLA (7 days due, +3 days escalation)
    if (modified.status === 'In Progress' && modified.next_update_due) {
      const nextUpdateDueTime = new Date(modified.next_update_due).getTime();
      const pastDueMs = nowTime - nextUpdateDueTime;

      if (pastDueMs > 0) {
        const pastDays = pastDueMs / (86400 * 1000);

        if (pastDays <= 3) {
          // Send weekly update overdue reminder
          remindersSent++;
          const email = createEmailItem(EmailTemplates.weeklyUpdateOverdue(modified, ownerRole));
          newEmails.push(email);
          logs.push(`[Update Reminder] Weekly update overdue for "${modified.title}". Reminder sent to ${ownerRole.name}.`);
        } else {
          // Over 3 days late (+3 days grace period breached -> Escalated L1)
          updateBreachesCount++;
          modified.status = 'Escalated L1';
          modified.escalated_at = nowIso;
          modified.updated_at = nowIso;

          const update: StatusUpdate = {
            id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            issue_id: modified.id,
            actor_id: 'system',
            from_status: 'In Progress',
            to_status: 'Escalated L1',
            note: `System Monitor: In Progress ticket stalled for over 10 days without update. Escalated to President.`,
            created_at: nowIso,
          };
          newStatusUpdates.push(update);

          const email = createEmailItem(EmailTemplates.weeklyUpdateEscalation(modified, ownerRole));
          newEmails.push(email);

          logs.push(`[Progress Stalled] Issue "${modified.title}" had no update for 10 days. Escalated to President.`);
        }
      }
    }

    // 4. Completed issues: Auto-close after 7 days if student did not object
    if (modified.status === 'Completed') {
      const completedTime = new Date(modified.updated_at).getTime();
      const sevenDaysMs = 7 * 86400 * 1000;

      if (nowTime - completedTime >= sevenDaysMs) {
        autoClosedCount++;
        modified.status = 'Closed';
        modified.closed_at = nowIso;
        modified.updated_at = nowIso;

        const update: StatusUpdate = {
          id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          issue_id: modified.id,
          actor_id: 'system',
          from_status: 'Completed',
          to_status: 'Closed',
          note: `System Auto-Close: 7-day student review window elapsed with no objection. Ticket formally closed.`,
          created_at: nowIso,
        };
        newStatusUpdates.push(update);

        logs.push(`[Auto-Close] Completed issue "${modified.title}" auto-closed after 7 days.`);
      }
    }

    return modified;
  });

  const report: CronRunReport = {
    runAt: nowIso,
    escalatedL1Count,
    escalatedL2Count,
    remindersSent,
    priorityEscalatedCount,
    updateBreachesCount,
    autoClosedCount,
    logs: logs.length > 0 ? logs : ['All active issues are within their respective response SLA windows.'],
  };

  return {
    updatedIssues,
    newStatusUpdates,
    newEmails,
    report,
  };
}

// 8 AM Daily Digest Generator for each owner role
export function generateDailyDigests(
  issues: Issue[],
  roles: CouncilRole[]
): EmailOutboxItem[] {
  const digestEmails: EmailOutboxItem[] = [];
  const now = new Date();

  roles.forEach((role) => {
    const roleIssues = issues.filter(
      (i) => i.owner_role_id === role.id && i.status !== 'Closed' && i.status !== 'Withdrawn'
    );

    if (roleIssues.length > 0) {
      const overdueIssues = roleIssues.filter(
        (i) =>
          (i.status === 'Raised' && new Date(i.ack_deadline).getTime() < now.getTime()) ||
          i.status === 'Escalated L1'
      );
      const priorityIssues = roleIssues.filter((i) => i.is_priority);

      const emailPayload = EmailTemplates.dailyDigest(
        role,
        roleIssues,
        overdueIssues,
        priorityIssues
      );

      digestEmails.push(createEmailItem(emailPayload));
    }
  });

  return digestEmails;
}
