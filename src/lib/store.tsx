'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import {
  User,
  CouncilRole,
  Issue,
  Comment,
  StatusUpdate,
  EmailOutboxItem,
  AuditLogItem,
  IssueCategory,
  IssueScope,
  IssueVisibility,
  IssueStatus,
  IssueSeverity,
  CronRunReport,
  StudentUploadRow,
} from '@/types';
import {
  SEED_USERS,
  SEED_ROLES,
  SEED_ISSUES,
  SEED_COMMENTS,
  SEED_STATUS_UPDATES,
  SEED_OUTBOX,
  SEED_AUDIT_LOG,
} from '@/lib/seed-data';
import { determineSuggestedOwner } from '@/lib/routing';
import { runComprehensiveDeadlineCheck, generateDailyDigests } from '@/lib/deadline-checker';
import { createEmailItem, dispatchEmail, EmailTemplates } from '@/lib/email-service';
import { DEFAULT_ABUSE_WORDS, checkIssueContent } from '@/lib/moderation';
import { LoadTestResult, execute500UserLoadTest } from '@/lib/load-test';

interface SunwaiContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
  users: User[];
  roles: CouncilRole[];
  issues: Issue[];
  comments: Comment[];
  statusUpdates: StatusUpdate[];
  outbox: EmailOutboxItem[];
  auditLog: AuditLogItem[];
  abuseWords: string[];
  userVotes: Set<string>;
  lastCronReport: CronRunReport | null;
  simulatedClockOffsetHours: number;
  setSimulatedClockOffsetHours: (hours: number) => void;

  // Actions
  raiseIssue: (data: {
    title: string;
    details: string;
    category: IssueCategory;
    scope: IssueScope;
    hostel: string;
    visibility: IssueVisibility;
    ownerRoleId: string;
    ccRoleIds: string[];
    photos: string[];
  }) => Issue;

  upvoteIssue: (issueId: string) => void;
  editIssue: (issueId: string, title: string, details: string) => boolean;
  deleteIssue: (issueId: string) => boolean;
  withdrawIssue: (issueId: string) => boolean;

  // Owner actions
  acknowledgeIssue: (issueId: string, note: string) => void;
  startWork: (issueId: string, note: string) => void;
  postProgressUpdate: (issueId: string, note: string, photoUrl?: string) => void;
  completeIssue: (issueId: string, note: string, photoUrl?: string) => void;
  rejectIssue: (issueId: string, reason: string, note: string) => void;
  redirectIssue: (issueId: string, newRoleId: string, reason: string) => { success: boolean; message: string };
  setIssueSeverity: (issueId: string, severity: IssueSeverity) => void;

  // Student verification actions
  confirmResolution: (issueId: string, note?: string) => void;
  reopenIssue: (issueId: string, reason: string) => void;

  // Comments & Moderation
  addComment: (issueId: string, body: string) => void;
  removeComment: (commentId: string, reason: string) => void;

  // Sprint 2 Deadline Engine & Cron
  runDeadlineChecker: (offsetHours?: number) => CronRunReport;
  triggerDailyDigest: () => number;
  retryFailedEmails: () => number;

  // Sprint 3 Admin & Safety Tools
  bulkImportStudents: (newStudents: StudentUploadRow[]) => { importedCount: number };
  createUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (userId: string, data: Partial<User>) => void;
  toggleUserActive: (userId: string, reason?: string) => void;
  assignRoleHolder: (roleId: string, newHolderUserId: string, newInboxEmail?: string) => void;
  reviewHeldIssue: (issueId: string, action: 'approve' | 'reject', adminNote?: string) => void;
  updateAbuseWords: (words: string[]) => void;

  // Privacy Rule & Authorization Checkers (Exit Test 2)
  canUserViewIssue: (user: User | null, issue: Issue) => boolean;
  testPrivacyIsolationSuite: () => {
    passed: boolean;
    results: {
      role: string;
      canViewOwn: boolean;
      canViewAssigned: boolean;
      canViewOtherPrivate: boolean;
      expected: string;
      status: 'PASS' | 'FAIL';
    }[];
  };

  // Sprint 4 Load Test
  run500UserLoadTest: (targetIssueId?: string) => LoadTestResult;

  // Helper queries
  getUserRole: (userId: string) => CouncilRole | undefined;
  getRoleById: (roleId: string) => CouncilRole | undefined;
  getUserById: (userId: string) => User | undefined;
  resetDemoData: () => void;
}

const SunwaiContext = createContext<SunwaiContextType | null>(null);

const STORAGE_KEY = 'sunwai_state_v5';

export function SunwaiProvider({ children }: { children: React.ReactNode }) {
  const dispatchedEmailIds = useRef(new Set<string>());
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [roles, setRoles] = useState<CouncilRole[]>(SEED_ROLES);

  const [issues, setIssues] = useState<Issue[]>(SEED_ISSUES);
  const [comments, setComments] = useState<Comment[]>(SEED_COMMENTS);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>(SEED_STATUS_UPDATES);
  const [outbox, setOutbox] = useState<EmailOutboxItem[]>(SEED_OUTBOX);
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>(SEED_AUDIT_LOG);
  const [abuseWords, setAbuseWords] = useState<string[]>(DEFAULT_ABUSE_WORDS);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set(['issue-hot-water']));
  const [lastCronReport, setLastCronReport] = useState<CronRunReport | null>(null);
  const [simulatedClockOffsetHours, setSimulatedClockOffsetHours] = useState<number>(0);

  // Hydrate initial state and fetch live data from Supabase backend
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.roles) setRoles(parsed.roles);
        if (parsed.issues) setIssues(parsed.issues);
        if (parsed.comments) setComments(parsed.comments);
        if (parsed.statusUpdates) setStatusUpdates(parsed.statusUpdates);
        if (parsed.outbox) setOutbox(parsed.outbox);
        if (parsed.auditLog) setAuditLog(parsed.auditLog);
        if (parsed.abuseWords) setAbuseWords(parsed.abuseWords);
        if (parsed.currentUserId) {
          const user = (parsed.users || SEED_USERS).find((u: User) => u.id === parsed.currentUserId);
          if (user) setCurrentUserState(user);
        }
        if (parsed.userVotes) setUserVotes(new Set(parsed.userVotes));
        if (parsed.lastCronReport) setLastCronReport(parsed.lastCronReport);
        if (typeof parsed.simulatedClockOffsetHours === 'number') {
          setSimulatedClockOffsetHours(parsed.simulatedClockOffsetHours);
        }
      }

      // Fetch live data from Supabase if connected
      fetch('/api/issues')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.source === 'supabase') {
            if (data.issues && data.issues.length > 0) setIssues(data.issues);
            if (data.users && data.users.length > 0) setUsers(data.users);
            if (data.roles && data.roles.length > 0) setRoles(data.roles);
            if (data.userVotes && data.userVotes.length > 0) {
              setUserVotes(new Set(data.userVotes));
            }
          }
        })
        .catch((err) => console.warn('Supabase fetch sync skipped:', err));
    } catch (e) {
      console.error('Error loading stored state:', e);
    }
  }, []);

  // Save to localStorage whenever state updates
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users,
          roles,
          issues,
          comments,
          statusUpdates,
          outbox,
          auditLog,
          abuseWords,
          currentUserId: currentUser ? currentUser.id : null,
          userVotes: Array.from(userVotes),
          lastCronReport,
          simulatedClockOffsetHours,
        })
      );
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [
    users,
    roles,
    issues,
    comments,
    statusUpdates,
    outbox,
    auditLog,
    abuseWords,
    currentUser,
    userVotes,
    lastCronReport,
    simulatedClockOffsetHours,
  ]);

  // Send any pending outbox items through the server mailer (live SMTP or simulated).
  useEffect(() => {
    outbox
      .filter((item) => item.status === 'pending' && !dispatchedEmailIds.current.has(item.id))
      .forEach((item) => {
        dispatchedEmailIds.current.add(item.id);
        dispatchEmail(item).then((res) => {
          setOutbox((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? res.ok
                  ? { ...i, status: 'sent', delivery_mode: res.mode, sent_at: new Date().toISOString(), error_message: undefined }
                  : { ...i, status: 'failed', error_message: res.error }
                : i
            )
          );
        });
      });
  }, [outbox]);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
  };

  const logout = () => {
    setCurrentUserState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    // End the server-side (Google/NextAuth) session cookie too, otherwise the user is silently logged back in.
    signOut({ callbackUrl: '/signin' }).catch(() => {
      if (typeof window !== 'undefined') window.location.href = '/signin';
    });
  };

  const getUserRole = (userId?: string) => {
    if (!userId) return undefined;
    return roles.find((r) => r.holder_user_id === userId);
  };

  const getRoleById = (roleId?: string) => {
    if (!roleId) return undefined;
    return roles.find((r) => r.id === roleId);
  };

  const getUserById = (userId?: string) => {
    if (!userId) return undefined;
    return users.find((u) => u.id === userId);
  };

  const logAuditAction = (action: string, target: string, details: string) => {
    if (!currentUser) return;
    const actorRole = getUserRole(currentUser.id);
    const newEntry: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor_id: currentUser.id,
      actor_name: `${currentUser.name} (${actorRole?.name || 'Student'})`,
      action,
      target,
      details,
      created_at: new Date().toISOString(),
    };
    setAuditLog((prev) => [newEntry, ...prev]);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUsers(SEED_USERS);
    setRoles(SEED_ROLES);
    setIssues(SEED_ISSUES);
    setComments(SEED_COMMENTS);
    setStatusUpdates(SEED_STATUS_UPDATES);
    setOutbox(SEED_OUTBOX);
    setAuditLog(SEED_AUDIT_LOG);
    setAbuseWords(DEFAULT_ABUSE_WORDS);
    setCurrentUserState(null);
    setUserVotes(new Set(['issue-hot-water']));
    setLastCronReport(null);
    setSimulatedClockOffsetHours(0);
  };

  // Helper to record email in outbox
  const sendEmail = (recipient: string, template: string, subject: string, body: string, issueId?: string) => {
    const newItem = createEmailItem({
      recipient,
      template,
      subject,
      body,
      issue_id: issueId,
    });
    setOutbox((prev) => [newItem, ...prev]);
  };

  // S2, S3: Raise Issue with Sprint 3 Moderation Check (A5)
  const raiseIssue = (data: {
    title: string;
    details: string;
    category: IssueCategory;
    scope: IssueScope;
    hostel: string;
    visibility: IssueVisibility;
    ownerRoleId: string;
    ccRoleIds: string[];
    photos: string[];
  }): Issue => {
    if (!currentUser) {
      throw new Error('Please sign in to raise an issue.');
    }
    const now = new Date();

    // Sprint 4 Rate limiting check: max 5 new issues per student per hour
    const oneHourAgo = now.getTime() - 3600 * 1000;
    const recentIssueCount = issues.filter(
      (iss) => iss.raised_by === currentUser.id && new Date(iss.created_at).getTime() > oneHourAgo
    ).length;

    if (recentIssueCount >= 5) {
      throw new Error('Rate limit reached: Maximum 5 new issues per hour per student. Please wait before raising another issue.');
    }

    const ackDeadline = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
    const issueId = `issue-${Date.now()}`;

    // Sprint 3 Moderation check: Does text target a named person?
    const modResult = checkIssueContent(data.title, data.details, abuseWords);

    const newIssue: Issue = {
      id: issueId,
      raised_by: currentUser.id,
      title: data.title,
      details: data.details,
      category: data.category,
      scope: data.scope,
      hostel: data.hostel,
      visibility: data.visibility,
      status: 'Raised',
      severity: 'Normal',
      owner_role_id: data.ownerRoleId,
      cc_role_ids: data.ccRoleIds,
      ack_deadline: ackDeadline,
      vote_count: 1,
      redirect_count: 0,
      is_priority: false,
      held_for_review: modResult.heldForReview,
      held_reason: modResult.reason,
      photos: data.photos,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    setIssues((prev) => [newIssue, ...prev]);

    setUserVotes((prev) => {
      const next = new Set(prev);
      next.add(issueId);
      return next;
    });

    const initialUpdate: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: 'Raised',
      to_status: 'Raised',
      note: modResult.heldForReview
        ? `Issue submitted but held for admin review: ${modResult.reason}`
        : `Issue raised by ${currentUser.name} (${currentUser.course} ${currentUser.batch}) and assigned to ${getRoleById(data.ownerRoleId)?.name || 'Assigned Role'}. 48-hour response clock started.`,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [initialUpdate, ...prev]);

    if (!modResult.heldForReview) {
      const ownerRole = getRoleById(data.ownerRoleId);
      if (ownerRole) {
        const email = createEmailItem(EmailTemplates.issueRaised(newIssue, ownerRole, currentUser));
        setOutbox((prev) => [email, ...prev]);
      }

      if (data.ccRoleIds && data.ccRoleIds.length > 0) {
        data.ccRoleIds.forEach((ccId) => {
          const ccRole = getRoleById(ccId);
          if (ccRole) {
            const email = createEmailItem(EmailTemplates.issueRaisedCc(newIssue, ccRole));
            setOutbox((prev) => [email, ...prev]);
          }
        });
      }
    } else {
      // Audit log the held issue
      logAuditAction(
        'ISSUE_HELD_FOR_REVIEW',
        `issues/${issueId}`,
        `Complaint held for review due to targeting individual: "${modResult.detectedName}".`
      );
    }

    return newIssue;
  };

  // S6: Upvote Issue with 7-day priority deadline
  const upvoteIssue = (issueId: string) => {
    const hasVoted = userVotes.has(issueId);

    setUserVotes((prev) => {
      const next = new Set(prev);
      if (hasVoted) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          const delta = hasVoted ? -1 : 1;
          const newVoteCount = Math.max(0, iss.vote_count + delta);
          const isPriority = newVoteCount >= 200;
          let priorityDeadline = iss.priority_response_deadline;

          if (isPriority && !iss.is_priority) {
            priorityDeadline = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
            const ownerRole = getRoleById(iss.owner_role_id);
            if (ownerRole) {
              const email = createEmailItem(EmailTemplates.priorityThresholdCrossed({ ...iss, priority_response_deadline: priorityDeadline }, ownerRole));
              setOutbox((o) => [email, ...o]);
            }
          }

          return {
            ...iss,
            vote_count: newVoteCount,
            is_priority: isPriority,
            priority_response_deadline: priorityDeadline,
            updated_at: new Date().toISOString(),
          };
        }
        return iss;
      })
    );
  };

  // C6: Set Severity flag
  const setIssueSeverity = (issueId: string, severity: IssueSeverity) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const prevSeverity = target.severity;
    if (prevSeverity === severity) return;

    const now = new Date().toISOString();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            severity,
            updated_at: now,
          };
        }
        return iss;
      })
    );

    const userRole = getUserRole(currentUser.id);
    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: target.status,
      note: `Severity updated from ${prevSeverity} to ${severity} by ${userRole?.name || currentUser.name}.`,
      created_at: now,
    };
    setStatusUpdates((prev) => [update, ...prev]);

    logAuditAction('SEVERITY_CHANGED', `issues/${issueId}`, `Changed from ${prevSeverity} to ${severity}`);
  };

  // S5: Edit issue
  const editIssue = (issueId: string, title: string, details: string): boolean => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return false;
    if (target.raised_by !== currentUser.id) return false;
    if (target.status !== 'Raised') return false;

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            title,
            details,
            updated_at: new Date().toISOString(),
          };
        }
        return iss;
      })
    );

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: target.status,
      note: `Student edited issue details.`,
      created_at: new Date().toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    return true;
  };

  // S5: Delete issue
  const deleteIssue = (issueId: string): boolean => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return false;
    if (target.raised_by !== currentUser.id) return false;
    if (target.status !== 'Raised' || target.vote_count > 1) {
      return false;
    }

    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    logAuditAction('ISSUE_DELETED_BY_STUDENT', `issues/${issueId}`, `Deleted prior to votes/acknowledgment.`);
    return true;
  };

  // S5: Withdraw issue
  const withdrawIssue = (issueId: string): boolean => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return false;
    if (target.raised_by !== currentUser.id) return false;

    const now = new Date().toISOString();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'Withdrawn',
            withdrawn_at: now,
            updated_at: now,
          };
        }
        return iss;
      })
    );

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'Withdrawn',
      note: `Issue withdrawn by the student. It remains in the public archive.`,
      created_at: now,
    };
    setStatusUpdates((prev) => [update, ...prev]);

    return true;
  };

  // C2: Acknowledge issue
  const acknowledgeIssue = (issueId: string, note: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date().toISOString();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'Acknowledged',
            updated_at: now,
          };
        }
        return iss;
      })
    );

    const userRole = getUserRole(currentUser.id);
    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'Acknowledged',
      note: `Acknowledged by ${currentUser.name} (${userRole?.name || 'Owner'}): ${note}`,
      created_at: now,
    };
    setStatusUpdates((prev) => [update, ...prev]);

    const student = getUserById(target.raised_by);
    if (student) {
      sendEmail(
        student.email,
        'issue_acknowledged',
        `[Sunwai] Your issue has been acknowledged: ${target.title}`,
        `Your issue "${target.title}" was acknowledged by ${currentUser.name} (${userRole?.name || 'Owner'}).\n\nNote: ${note}`,
        issueId
      );
    }
  };

  // C3: Start Work / Move to In Progress
  const startWork = (issueId: string, note: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date();
    const nextUpdateDue = new Date(now.getTime() + 7 * 86400 * 1000).toISOString();

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'In Progress',
            next_update_due: nextUpdateDue,
            updated_at: now.toISOString(),
          };
        }
        return iss;
      })
    );

    const userRole = getUserRole(currentUser.id);
    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'In Progress',
      note: `Work commenced: ${note}`,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    const student = getUserById(target.raised_by);
    if (student) {
      sendEmail(
        student.email,
        'status_in_progress',
        `[Sunwai] Work started on your issue: ${target.title}`,
        `The owner has moved "${target.title}" to In Progress.\n\nNote: ${note}\nNext weekly update due in 7 days.`,
        issueId
      );
    }
  };

  // C3: Post Progress Update
  const postProgressUpdate = (issueId: string, note: string, photoUrl?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date();
    const nextUpdateDue = new Date(now.getTime() + 7 * 86400 * 1000).toISOString();

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            next_update_due: nextUpdateDue,
            updated_at: now.toISOString(),
          };
        }
        return iss;
      })
    );

    const userRole = getUserRole(currentUser.id);
    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: target.status,
      note: `Progress update by ${userRole?.name || 'Owner'}: ${note}`,
      photo_url: photoUrl,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    const student = getUserById(target.raised_by);
    if (student) {
      sendEmail(
        student.email,
        'progress_update',
        `[Sunwai] Progress update on: ${target.title}`,
        `An update was posted for "${target.title}":\n\n${note}`,
        issueId
      );
    }
  };

  // C4: Close as Completed
  const completeIssue = (issueId: string, note: string, photoUrl?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'Completed',
            updated_at: now.toISOString(),
          };
        }
        return iss;
      })
    );

    const userRole = getUserRole(currentUser.id);
    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'Completed',
      note: `Marked Completed with resolution proof: ${note}`,
      photo_url: photoUrl,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    const student = getUserById(target.raised_by);
    if (student) {
      sendEmail(
        student.email,
        'issue_completed',
        `[Sunwai] Issue Completed: ${target.title}`,
        `Your issue has been marked Completed by ${userRole?.name || 'the owner'}.\n\nResolution details: ${note}\n\nYou have 7 days to confirm this resolution or reopen the issue if it is not fixed.`,
        issueId
      );
    }
  };

  // C4: Close as Rejected
  const rejectIssue = (issueId: string, reason: string, note: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'Rejected',
            rejection_reason: `${reason}: ${note}`,
            updated_at: now.toISOString(),
          };
        }
        return iss;
      })
    );

    const userRole = getUserRole(currentUser.id);
    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'Rejected',
      note: `Rejected by ${userRole?.name || 'Owner'}. Reason: [${reason}] ${note}`,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    const student = getUserById(target.raised_by);
    if (student) {
      sendEmail(
        student.email,
        'issue_rejected',
        `[Sunwai] Issue Rejected: ${target.title}`,
        `Your issue was rejected by ${userRole?.name || 'the owner'}.\nReason: ${reason}\nDetails: ${note}`,
        issueId
      );
    }
  };

  // C5: Redirect Issue with 2-redirect limit
  const redirectIssue = (
    issueId: string,
    newRoleId: string,
    reason: string
  ): { success: boolean; message: string } => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return { success: false, message: 'Issue not found' };

    const nextRedirectCount = target.redirect_count + 1;
    let finalRoleId = newRoleId;
    let autoPresidentNotice = false;

    if (nextRedirectCount >= 3) {
      const presRole = roles.find((r) => r.name === 'President');
      if (presRole) {
        finalRoleId = presRole.id;
        autoPresidentNotice = true;
      }
    }

    const now = new Date();
    const newAckDeadline = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
    const newRole = getRoleById(finalRoleId);
    const oldRole = getRoleById(target.owner_role_id);

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            owner_role_id: finalRoleId,
            redirect_count: nextRedirectCount,
            ack_deadline: newAckDeadline,
            status: 'Raised',
            updated_at: now.toISOString(),
          };
        }
        return iss;
      })
    );

    const updateNote = autoPresidentNotice
      ? `Maximum redirect limit (2) reached. Issue automatically escalated to President for final assignment (Redirect #${nextRedirectCount}). Reason: ${reason}. 48h clock restarted.`
      : `Redirected from ${oldRole?.name || 'previous owner'} to ${newRole?.name || 'new owner'} (Redirect #${nextRedirectCount}/2). Reason: ${reason}. 48h clock restarted.`;

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser ? currentUser.id : 'system',
      from_status: target.status,
      to_status: 'Raised',
      note: updateNote,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    if (newRole) {
      sendEmail(
        newRole.inbox_email,
        'issue_redirected',
        `[Sunwai Redirect #${nextRedirectCount}] Issue reassigned to you: ${target.title}`,
        `Issue "${target.title}" was redirected to your role by ${oldRole?.name}.\nReason: ${reason}\nNew 48h acknowledgment deadline: ${new Date(newAckDeadline).toLocaleString('en-IN')}`,
        issueId
      );
    }

    logAuditAction('ISSUE_REDIRECTED', `issues/${issueId}`, `From ${oldRole?.name} to ${newRole?.name}. Reason: ${reason}`);

    return {
      success: true,
      message: autoPresidentNotice
        ? 'Maximum redirect limit (2) reached. Ticket automatically escalated to President.'
        : `Issue successfully redirected to ${newRole?.name}. 48h clock restarted.`,
    };
  };

  // S9: Confirm Resolution (Student)
  const confirmResolution = (issueId: string, note?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date().toISOString();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'Closed',
            closed_at: now,
            updated_at: now,
          };
        }
        return iss;
      })
    );

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'Closed',
      note: `Student confirmed resolution. ${note || 'Issue marked as successfully resolved.'}`,
      created_at: now,
    };
    setStatusUpdates((prev) => [update, ...prev]);
  };

  // S9: Reopen Issue (Student)
  const reopenIssue = (issueId: string, reason: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || !currentUser) return;

    const now = new Date();
    const nextUpdateDue = new Date(now.getTime() + 7 * 86400 * 1000).toISOString();

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            status: 'In Progress',
            is_reopened: true,
            reopen_count: (iss.reopen_count || 0) + 1,
            next_update_due: nextUpdateDue,
            updated_at: now.toISOString(),
          };
        }
        return iss;
      })
    );

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'In Progress',
      note: `Student reopened the issue: "${reason}". Returned to In Progress.`,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    const ownerRole = getRoleById(target.owner_role_id);
    if (ownerRole) {
      const email = createEmailItem({
        recipient: ownerRole.inbox_email,
        template: 'issue_reopened',
        subject: `[Sunwai Reopened] Issue reopened by student: ${target.title}`,
        body: `The student has reopened issue "${target.title}" stating:\n\n"${reason}"\n\nPlease re-inspect and update progress.`,
        issue_id: issueId,
      });
      setOutbox((prev) => [email, ...prev]);
    }
  };

  // S8: Add Comment
  const addComment = (issueId: string, body: string) => {
    if (!currentUser) {
      throw new Error('Please sign in to comment.');
    }
    const now = new Date();

    // Sprint 4 Rate limiting check: max 30 comments per student per hour
    const oneHourAgo = now.getTime() - 3600 * 1000;
    const recentCommentCount = comments.filter(
      (c) => c.author_id === currentUser.id && new Date(c.created_at).getTime() > oneHourAgo
    ).length;

    if (recentCommentCount >= 30) {
      throw new Error('Rate limit reached: Maximum 30 comments per hour per student. Please wait before posting another comment.');
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      issue_id: issueId,
      author_id: currentUser.id,
      body,
      removed_by_admin: false,
      created_at: now.toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
  };

  // A4: Remove Comment (Admin)
  const removeComment = (commentId: string, reason: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            removed_by_admin: true,
            removal_reason: reason,
          };
        }
        return c;
      })
    );

    logAuditAction('COMMENT_REMOVED', `comments/${commentId}`, `Comment marked removed. Reason: ${reason}`);
  };

  // A5: Review Held Issue (Admin)
  const reviewHeldIssue = (issueId: string, action: 'approve' | 'reject', adminNote?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    const now = new Date().toISOString();
    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id === issueId) {
          return {
            ...iss,
            held_for_review: false,
            status: action === 'approve' ? 'Raised' : 'Rejected',
            rejection_reason: action === 'reject' ? `Admin moderation: ${adminNote || 'Policy violation'}` : undefined,
            updated_at: now,
          };
        }
        return iss;
      })
    );

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser ? currentUser.id : 'admin',
      from_status: target.status,
      to_status: action === 'approve' ? 'Raised' : 'Rejected',
      note: action === 'approve'
        ? `Approved by Admin after review: ${adminNote || 'Cleared for public feed'}`
        : `Rejected by Admin during review: ${adminNote || 'Violated campus guidelines'}`,
      created_at: now,
    };
    setStatusUpdates((prev) => [update, ...prev]);

    logAuditAction(
      action === 'approve' ? 'HELD_ISSUE_APPROVED' : 'HELD_ISSUE_REJECTED',
      `issues/${issueId}`,
      `Admin decision: ${action}. Note: ${adminNote || 'None'}`
    );
  };

  // A1: Bulk Student Import
  const bulkImportStudents = (newStudents: StudentUploadRow[]): { importedCount: number } => {
    const validRows = newStudents.filter((s) => s.isValid);

    const newUsers: User[] = validRows.map((r, idx) => ({
      id: `user-bulk-${Date.now()}-${idx}`,
      roll_no: r.roll_no,
      name: r.name,
      email: r.email,
      course: r.course,
      batch: r.batch,
      hostel: r.hostel,
      is_active: true,
      created_at: new Date().toISOString(),
    }));

    setUsers((prev) => [...prev, ...newUsers]);

    logAuditAction(
      'USER_BULK_IMPORT',
      'users',
      `Enrolled ${newUsers.length} student accounts from batch upload file.`
    );

    return { importedCount: newUsers.length };
  };

  // A2: Create Individual User
  const createUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    logAuditAction('USER_CREATED', `users/${newUser.id}`, `Created ${newUser.name} (${newUser.roll_no})`);
    return newUser;
  };

  // A2: Update Individual User
  const updateUser = (userId: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, ...data };
        }
        return u;
      })
    );
    logAuditAction('USER_UPDATED', `users/${userId}`, `Updated profile details for user ID ${userId}`);
  };

  // A2: Deactivate / Activate User
  const toggleUserActive = (userId: string, reason?: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const nextState = !target.is_active;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, is_active: nextState };
        }
        return u;
      })
    );

    logAuditAction(
      nextState ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      `users/${userId}`,
      `${target.name} (${target.roll_no}) marked ${nextState ? 'Active' : 'Deactivated'}. Reason: ${reason || 'Administrative action'}`
    );
  };

  // A3: Assign Role Holder
  const assignRoleHolder = (roleId: string, newHolderUserId: string, newInboxEmail?: string) => {
    const role = roles.find((r) => r.id === roleId);
    const newHolder = users.find((u) => u.id === newHolderUserId);
    if (!role || !newHolder) return;

    setRoles((prev) =>
      prev.map((r) => {
        if (r.id === roleId) {
          return {
            ...r,
            holder_user_id: newHolderUserId,
            inbox_email: newInboxEmail || r.inbox_email,
          };
        }
        return r;
      })
    );

    logAuditAction(
      'ROLE_REASSIGNED',
      `roles/${roleId}`,
      `${role.name} reassigned to ${newHolder.name} (${newHolder.roll_no}). Inbox: ${newInboxEmail || role.inbox_email}`
    );
  };

  // A6: Update Abuse Word List
  const updateAbuseWords = (words: string[]) => {
    setAbuseWords(words);
    logAuditAction('ABUSE_WORDS_UPDATED', 'system/moderation', `Updated moderation word list (${words.length} terms).`);
  };

  // Sprint 2 Deadline Checker
  const runDeadlineChecker = (offsetHours: number = simulatedClockOffsetHours): CronRunReport => {
    const result = runComprehensiveDeadlineCheck({
      issues,
      roles,
      simulatedTimeOffsetHours: offsetHours,
    });

    setIssues(result.updatedIssues);
    if (result.newStatusUpdates.length > 0) {
      setStatusUpdates((prev) => [...result.newStatusUpdates, ...prev]);
    }
    if (result.newEmails.length > 0) {
      setOutbox((prev) => [...result.newEmails, ...prev]);
    }

    setLastCronReport(result.report);
    return result.report;
  };

  const triggerDailyDigest = (): number => {
    const digests = generateDailyDigests(issues, roles);
    if (digests.length > 0) {
      setOutbox((prev) => [...digests, ...prev]);
    }
    return digests.length;
  };

  const retryFailedEmails = (): number => {
    const failed = outbox.filter((item) => item.status === 'failed');
    if (failed.length === 0) return 0;
    const ids = new Set(failed.map((f) => f.id));
    ids.forEach((id) => dispatchedEmailIds.current.delete(id));
    setOutbox((prev) =>
      prev.map((item) =>
        ids.has(item.id)
          ? { ...item, status: 'pending', attempts: item.attempts + 1, error_message: undefined }
          : item
      )
    );
    return failed.length;
  };

  // Sprint 3 Row-Level Security / Privacy Rule Checker
  // Spec rule:
  // Public: visible to everyone.
  // Private:
  // - Raiser: visible
  // - Assigned role holder: visible
  // - President: visible
  // - Admin: NOT VISIBLE!
  // - General students: NOT VISIBLE
  const canUserViewIssue = (user: User | null, issue: Issue): boolean => {
    if (issue.visibility === 'public') return true;
    if (!user) return false;

    // Admin is explicitly blocked from reading private issues
    const role = getUserRole(user.id);
    if (user.email === 'techadmin@iiml.ac.in' || role?.name.toLowerCase().includes('admin')) {
      return false;
    }

    // Raiser can see own
    if (issue.raised_by === user.id) return true;

    // President can see all private issues
    if (role?.name === 'President') return true;

    // Assigned owner role holder can see assigned private issues
    if (role && issue.owner_role_id === role.id) return true;

    return false;
  };

  // Exit Test 2: Automated Privacy Isolation Verification Suite
  const testPrivacyIsolationSuite = () => {
    const testPrivateIssue: Issue = {
      id: 'issue-test-private',
      raised_by: 'user-stu-1', // Rahul Sharma
      title: 'Private Test Issue: Personal Hostel Allowance',
      details: 'Confidential reimbursement matter',
      category: 'Finance and reimbursements',
      scope: 'my room',
      hostel: 'Hostel 3',
      visibility: 'private',
      status: 'Raised',
      severity: 'Normal',
      owner_role_id: 'role-treasurer', // Siddharth Jain
      ack_deadline: new Date().toISOString(),
      vote_count: 1,
      redirect_count: 0,
      is_priority: false,
      photos: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const studentUser = users.find((u) => u.id === 'user-stu-1')!;
    const otherStudent = users.find((u) => u.id === 'user-stu-2')!;
    const ownerUser = users.find((u) => u.id === 'user-treasurer')!;
    const presidentUser = users.find((u) => u.id === 'user-pres')!;
    const adminUser = users.find((u) => u.id === 'user-admin')!;

    const results = [
      {
        role: 'Raiser (Rahul Sharma - Student)',
        canViewOwn: canUserViewIssue(studentUser, testPrivateIssue),
        canViewAssigned: true,
        canViewOtherPrivate: false,
        expected: 'Can view own private ticket',
        status: canUserViewIssue(studentUser, testPrivateIssue) ? ('PASS' as const) : ('FAIL' as const),
      },
      {
        role: 'Other Student (Priya Nair - Student)',
        canViewOwn: false,
        canViewAssigned: false,
        canViewOtherPrivate: canUserViewIssue(otherStudent, testPrivateIssue),
        expected: 'BLOCKED from viewing other student private ticket',
        status: !canUserViewIssue(otherStudent, testPrivateIssue) ? ('PASS' as const) : ('FAIL' as const),
      },
      {
        role: 'Assigned Owner (Treasurer - Siddharth)',
        canViewOwn: false,
        canViewAssigned: canUserViewIssue(ownerUser, testPrivateIssue),
        canViewOtherPrivate: false,
        expected: 'Can view assigned private ticket',
        status: canUserViewIssue(ownerUser, testPrivateIssue) ? ('PASS' as const) : ('FAIL' as const),
      },
      {
        role: 'President (Ashwin Narayan)',
        canViewOwn: true,
        canViewAssigned: true,
        canViewOtherPrivate: canUserViewIssue(presidentUser, testPrivateIssue),
        expected: 'Can view ALL private issues campus-wide',
        status: canUserViewIssue(presidentUser, testPrivateIssue) ? ('PASS' as const) : ('FAIL' as const),
      },
      {
        role: 'Tech Admin (Admin Role)',
        canViewOwn: false,
        canViewAssigned: false,
        canViewOtherPrivate: canUserViewIssue(adminUser, testPrivateIssue),
        expected: 'STRICTLY BLOCKED from viewing private issues (Spec Rule)',
        status: !canUserViewIssue(adminUser, testPrivateIssue) ? ('PASS' as const) : ('FAIL' as const),
      },
    ];

    const passed = results.every((r) => r.status === 'PASS');
    return { passed, results };
  };

  // Sprint 4: 500-User Simulated Load Test
  const run500UserLoadTest = (targetIssueId?: string): LoadTestResult => {
    const { updatedIssues, result } = execute500UserLoadTest(issues, targetIssueId);
    setIssues(updatedIssues);
    logAuditAction(
      'LOAD_TEST_500_USERS',
      `issues/${result.targetIssueId}`,
      `Simulated 500 concurrent voters in ${result.durationMs}ms (${result.throughputVotesPerSec} votes/sec). Blocked ${result.duplicateAttemptsBlocked} duplicates. Final votes: ${result.finalVoteCount}. Priority: ${result.priorityTriggered}`
    );
    return result;
  };

  return (
    <SunwaiContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        logout,
        users,
        roles,
        issues,
        comments,
        statusUpdates,
        outbox,
        auditLog,
        abuseWords,
        userVotes,
        lastCronReport,
        simulatedClockOffsetHours,
        setSimulatedClockOffsetHours,
        raiseIssue,
        upvoteIssue,
        editIssue,
        deleteIssue,
        withdrawIssue,
        acknowledgeIssue,
        startWork,
        postProgressUpdate,
        completeIssue,
        rejectIssue,
        redirectIssue,
        setIssueSeverity,
        confirmResolution,
        reopenIssue,
        addComment,
        removeComment,
        runDeadlineChecker,
        triggerDailyDigest,
        retryFailedEmails,
        bulkImportStudents,
        createUser,
        updateUser,
        toggleUserActive,
        assignRoleHolder,
        reviewHeldIssue,
        updateAbuseWords,
        canUserViewIssue,
        testPrivacyIsolationSuite,
        run500UserLoadTest,
        getUserRole,
        getRoleById,
        getUserById,
        resetDemoData,
      }}
    >
      {children}
    </SunwaiContext.Provider>
  );
}

export function useSunwai() {
  const context = useContext(SunwaiContext);
  if (!context) {
    throw new Error('useSunwai must be used within a SunwaiProvider');
  }
  return context;
}
