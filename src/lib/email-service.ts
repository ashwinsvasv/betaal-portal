import { EmailOutboxItem, Issue, User, CouncilRole } from '@/types';

export interface EmailPayload {
  recipient: string;
  template: string;
  subject: string;
  body: string;
  issue_id?: string;
  simulateFailure?: boolean;
}

export function createEmailItem(payload: EmailPayload): EmailOutboxItem {
  const isFailed = Boolean(payload.simulateFailure);
  const now = new Date().toISOString();

  return {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    recipient: payload.recipient,
    template: payload.template,
    subject: payload.subject,
    body: payload.body,
    issue_id: payload.issue_id,
    // New items start as 'pending'; the store's dispatcher sends them via /api/email/send.
    status: isFailed ? 'failed' : 'pending',
    attempts: 1,
    error_message: isFailed ? 'SMTP Connection Timeout (Simulated Gateway Error)' : undefined,
    sent_at: undefined,
    created_at: now,
  };
}

/** Deliver one outbox item through the server mailer. Never throws. */
export async function dispatchEmail(
  item: EmailOutboxItem
): Promise<{ ok: boolean; mode?: 'live' | 'simulated'; error?: string }> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: item.recipient,
        subject: item.subject,
        body: item.body,
        template: item.template,
      }),
    });
    const data = await res.json();
    return res.ok && data.ok
      ? { ok: true, mode: data.mode }
      : { ok: false, error: data.error || `Mail server returned ${res.status}.` };
  } catch {
    return { ok: false, error: 'Could not reach the mail server. Retry from the dashboard.' };
  }
}

// Formatters for each notification required by the spec
export const EmailTemplates = {
  issueRaised: (issue: Issue, ownerRole: CouncilRole, raiser: User) => ({
    recipient: ownerRole.inbox_email,
    template: 'issue_raised',
    subject: `[Sunwai] New Issue Raised: ${issue.title}`,
    body: `Hello ${ownerRole.name},\n\nA new issue has been raised and formally assigned to your office.\n\nIssue Details:\n- Title: ${issue.title}\n- Category: ${issue.category}\n- Scope: ${issue.scope} (${issue.hostel})\n- Raised by: ${raiser.course} ${raiser.batch} Student (${raiser.roll_no})\n- Initial Vote Count: ${issue.vote_count}\n\nMandatory reply deadline:\nYou have 48 hours to acknowledge this issue.\nDeadline: ${new Date(issue.ack_deadline).toLocaleString('en-IN')}\n\nAccess portal to acknowledge:\nhttps://sunwai.iiml.ac.in/issue/${issue.id}`,
    issue_id: issue.id,
  }),

  issueRaisedCc: (issue: Issue, ccRole: CouncilRole) => ({
    recipient: ccRole.inbox_email,
    template: 'issue_raised_cc',
    subject: `[Sunwai CC] Infrastructure Issue in ${issue.hostel}: ${issue.title}`,
    body: `Hello ${ccRole.name},\n\nYou are copied on a newly raised infrastructure issue for ${issue.hostel}.\n\nTitle: ${issue.title}\nAssigned Primary Owner: Role ID ${issue.owner_role_id}\nDeadline: ${new Date(issue.ack_deadline).toLocaleString('en-IN')}`,
    issue_id: issue.id,
  }),

  ackReminder24h: (issue: Issue, ownerRole: CouncilRole) => ({
    recipient: ownerRole.inbox_email,
    template: 'ack_deadline_reminder_24h',
    subject: `[Sunwai Urgent Reminder] 24 Hours Left to Acknowledge: ${issue.title}`,
    body: `Hello ${ownerRole.name},\n\nThis is an automated 24-hour reminder that issue "${issue.title}" has not yet been acknowledged.\n\nTime Remaining: ~24 hours\nDeadline: ${new Date(issue.ack_deadline).toLocaleString('en-IN')}\n\nIf unacknowledged by the deadline, this issue will automatically escalate to Level 1 (Student Council President).`,
    issue_id: issue.id,
  }),

  escalationL1: (issue: Issue, ownerRole: CouncilRole, elapsedHours: number) => ({
    recipient: 'ashwinsvasv+president@gmail.com',
    template: 'escalation_l1',
    subject: `[Sunwai Escalation L1] Reply Deadline Missed by ${ownerRole.name}: ${issue.title}`,
    body: `To: Student Council President\nCc: ${ownerRole.inbox_email}\n\nIssue "${issue.title}" was not acknowledged within the mandatory 48-hour window by ${ownerRole.name}.\n\nTime Waited: ${elapsedHours} hours\nStatus: Escalated L1\nCategory: ${issue.category}\nHostel: ${issue.hostel}\nVotes: ${issue.vote_count}\n\nAs President, you are required to either take direct ownership or reassign this ticket with an expedited timeline:\nhttps://sunwai.iiml.ac.in/president`,
    issue_id: issue.id,
  }),

  escalationL2: (issue: Issue, elapsedTotalHours: number) => ({
    recipient: 'ashwinsvasv+studentaffairs@gmail.com',
    template: 'escalation_l2',
    subject: `[Sunwai Escalation L2] Unresolved Council Escalation: ${issue.title}`,
    body: `To: Dean / Office of Student Affairs, IIM Lucknow\nCc: ashwinsvasv+president@gmail.com\n\nIssue "${issue.title}" has breached both primary council response windows (over ${elapsedTotalHours} hours unaddressed).\n\nTimeline:\n- 48h primary owner acknowledgment deadline missed.\n- 48h President Level 1 escalation intervention missed.\n\nFull Ticket Dossier:\nhttps://sunwai.iiml.ac.in/issue/${issue.id}`,
    issue_id: issue.id,
  }),

  priorityThresholdCrossed: (issue: Issue, ownerRole: CouncilRole) => ({
    recipient: ownerRole.inbox_email,
    template: 'priority_threshold',
    subject: `[Sunwai Priority Threshold] 200+ Votes Crossed: ${issue.title}`,
    body: `Hello ${ownerRole.name},\nCc: ashwinsvasv+president@gmail.com\n\nIssue "${issue.title}" has officially crossed 200 votes (10% campus threshold).\n\nCouncil Charter Rule:\nThe owner must post an official public response or action plan within 7 days.\nResponse Deadline: ${new Date(issue.priority_response_deadline || new Date(Date.now() + 7 * 86400 * 1000).toISOString()).toLocaleString('en-IN')}`,
    issue_id: issue.id,
  }),

  priorityDeadlineBreached: (issue: Issue, ownerRole: CouncilRole) => ({
    recipient: 'ashwinsvasv+president@gmail.com',
    template: 'priority_deadline_breach',
    subject: `[Sunwai Escalation L1] Priority Issue Response Missed by ${ownerRole.name}: ${issue.title}`,
    body: `To: Student Council President\n\nPriority issue "${issue.title}" (Votes: ${issue.vote_count}) did not receive the required 7-day public response from ${ownerRole.name}.\n\nIt has been automatically elevated to Level 1 on your executive dashboard.`,
    issue_id: issue.id,
  }),

  weeklyUpdateOverdue: (issue: Issue, ownerRole: CouncilRole) => ({
    recipient: ownerRole.inbox_email,
    template: 'weekly_update_overdue',
    subject: `[Sunwai Action Required] Weekly Update Overdue: ${issue.title}`,
    body: `Hello ${ownerRole.name},\n\nIssue "${issue.title}" is currently In Progress, but 7 days have passed since the last recorded update.\n\nPlease post a status update within the next 3 days to avoid automatic escalation to the President.`,
    issue_id: issue.id,
  }),

  weeklyUpdateEscalation: (issue: Issue, ownerRole: CouncilRole) => ({
    recipient: 'ashwinsvasv+president@gmail.com',
    template: 'weekly_update_escalation',
    subject: `[Sunwai Escalation L1] Progress Stalled for 10 Days: ${issue.title}`,
    body: `To: Student Council President\n\nIssue "${issue.title}" owned by ${ownerRole.name} has not received an update for 10 days despite reminders. Escalated to President for intervention.`,
    issue_id: issue.id,
  }),

  dailyDigest: (ownerRole: CouncilRole, openIssues: Issue[], overdueIssues: Issue[], priorityIssues: Issue[]) => ({
    recipient: ownerRole.inbox_email,
    template: 'daily_digest',
    subject: `[Sunwai 8 AM Daily Digest] ${openIssues.length} Active Tickets for ${ownerRole.name}`,
    body: `Good morning ${ownerRole.name},\n\nHere is your 8:00 AM IST daily summary of Student Council issues:\n\n- Total Open Tickets: ${openIssues.length}\n- Overdue 48h Deadlines: ${overdueIssues.length}\n- High-Priority Tickets (>200 votes): ${priorityIssues.length}\n\nTop Action Items:\n${openIssues.slice(0, 5).map((i, idx) => `${idx + 1}. [${i.status}] ${i.title} (${i.vote_count} votes)`).join('\n')}\n\nAccess your owner inbox to process tickets:\nhttps://sunwai.iiml.ac.in/inbox`,
  }),
};
