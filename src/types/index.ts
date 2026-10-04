export type RoleType = 
  | 'student' 
  | 'hostel_rep' 
  | 'cabinet_member' 
  | 'president' 
  | 'student_affairs' 
  | 'admin';

export type IssueCategory = 
  | 'Infra & IT' 
  | 'Hostel life' 
  | 'Mess and food' 
  | 'Academics' 
  | 'Sports facilities and events' 
  | 'Events' 
  | 'Cultural' 
  | 'Finance and reimbursements' 
  | 'Other / not sure';

export type IssueScope = 'my room' | 'my hostel' | 'whole campus';

export type IssueVisibility = 'public' | 'private';

export type IssueStatus = 
  | 'Raised' 
  | 'Acknowledged' 
  | 'In Progress' 
  | 'Completed' 
  | 'Rejected' 
  | 'Escalated L1' 
  | 'Escalated L2' 
  | 'Closed' 
  | 'Withdrawn';

export type IssueSeverity = 'Normal' | 'High' | 'Critical';

export interface User {
  id: string;
  roll_no: string;
  name: string;
  email: string;
  course: string;
  batch: string;
  hostel: string;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface CouncilRole {
  id: string;
  name: string; // e.g., "President", "Mess Secretary", "Infra & IT Secretary", "Hostel Rep H3"
  category_domain?: IssueCategory;
  inbox_email: string;
  holder_user_id: string;
}

export interface CoursePrefix {
  prefix: string;
  course_name: string;
}

export interface RoutingRule {
  id: string;
  category: IssueCategory;
  scope: IssueScope;
  owner_role_id: string;
  cc_role_ids: string[];
}

export interface IssuePhoto {
  id: string;
  issue_id: string;
  update_id?: string;
  storage_path: string;
  caption?: string;
}

export interface Issue {
  id: string;
  raised_by: string; // user id
  title: string;
  details: string;
  category: IssueCategory;
  scope: IssueScope;
  hostel: string;
  visibility: IssueVisibility;
  status: IssueStatus;
  severity: IssueSeverity;
  owner_role_id: string;
  cc_role_ids?: string[];
  ack_deadline: string; // ISO date string (48h from creation or redirect)
  next_update_due?: string; // ISO date string (7 days from in_progress or last update)
  priority_response_deadline?: string; // ISO date string (7 days from crossing 10% votes)
  escalated_at?: string; // ISO date string when moved to Escalated L1
  last_reminded_at?: string; // ISO date string when 24h reminder sent
  vote_count: number;
  redirect_count: number;
  is_priority: boolean;
  is_reopened?: boolean;
  reopen_count?: number;
  rejection_reason?: string;
  held_for_review?: boolean; // Sprint 3 abuse / naming check
  held_reason?: string;
  photos: string[];
  created_at: string;
  updated_at: string;
  withdrawn_at?: string;
  closed_at?: string;
}

export interface Vote {
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  removed_by_admin: boolean;
  removal_reason?: string;
  created_at: string;
}

export interface StatusUpdate {
  id: string;
  issue_id: string;
  actor_id: string;
  from_status: IssueStatus;
  to_status: IssueStatus;
  note: string;
  photo_url?: string;
  created_at: string;
}

export interface EmailOutboxItem {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  body: string;
  issue_id?: string;
  status: 'sent' | 'pending' | 'failed';
  delivery_mode?: 'live' | 'simulated';
  attempts: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  target: string;
  details: string;
  created_at: string;
}

export interface AreaMetrics {
  category: IssueCategory;
  roleName: string;
  holderName: string;
  totalIssues: number;
  openCount: number;
  overdueCount: number;
  inProgressCount: number;
  completedCount: number;
  avgDaysToClose: number;
  criticalCount: number;
  highCount: number;
  reopenCount: number;
}

export interface CronRunReport {
  runAt: string;
  escalatedL1Count: number;
  escalatedL2Count: number;
  remindersSent: number;
  priorityEscalatedCount: number;
  updateBreachesCount: number;
  autoClosedCount: number;
  logs: string[];
}

export interface StudentUploadRow {
  roll_no: string;
  name: string;
  email: string;
  hostel: string;
  course: string;
  batch: string;
  isValid?: boolean;
  error?: string;
}
