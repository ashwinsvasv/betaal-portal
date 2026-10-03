'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  CouncilRole,
  Issue,
  Comment,
  StatusUpdate,
  EmailOutboxItem,
  IssueCategory,
  IssueScope,
  IssueVisibility,
  IssueStatus,
} from '@/types';
import {
  SEED_USERS,
  SEED_ROLES,
  SEED_ISSUES,
  SEED_COMMENTS,
  SEED_STATUS_UPDATES,
  SEED_OUTBOX,
} from '@/lib/seed-data';
import { determineSuggestedOwner } from '@/lib/routing';

interface SunwaiContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  roles: CouncilRole[];
  issues: Issue[];
  comments: Comment[];
  statusUpdates: StatusUpdate[];
  outbox: EmailOutboxItem[];
  userVotes: Set<string>; // set of issueIds voted by currentUser
  
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
  redirectIssue: (issueId: string, newRoleId: string, reason: string) => void;
  
  // Student verification actions
  confirmResolution: (issueId: string, note?: string) => void;
  reopenIssue: (issueId: string, reason: string) => void;
  
  // Comments
  addComment: (issueId: string, body: string) => void;
  
  // Scheduled Deadline Checker (Exit test & demo button)
  runDeadlineChecker: () => { escalatedCount: number; closedCount: number };
  
  // Helper queries
  getUserRole: (userId: string) => CouncilRole | undefined;
  getRoleById: (roleId: string) => CouncilRole | undefined;
  getUserById: (userId: string) => User | undefined;
  resetDemoData: () => void;
}

const SunwaiContext = createContext<SunwaiContextType | null>(null);

const STORAGE_KEY = 'sunwai_state_v1';

export function SunwaiProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User>(SEED_USERS[11]); // Default to Rahul Sharma (PGP student)
  const [users] = useState<User[]>(SEED_USERS);
  const [roles] = useState<CouncilRole[]>(SEED_ROLES);
  
  const [issues, setIssues] = useState<Issue[]>(SEED_ISSUES);
  const [comments, setComments] = useState<Comment[]>(SEED_COMMENTS);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>(SEED_STATUS_UPDATES);
  const [outbox, setOutbox] = useState<EmailOutboxItem[]>(SEED_OUTBOX);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set(['issue-hot-water']));

  // Hydrate from localStorage on client load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.issues) setIssues(parsed.issues);
        if (parsed.comments) setComments(parsed.comments);
        if (parsed.statusUpdates) setStatusUpdates(parsed.statusUpdates);
        if (parsed.outbox) setOutbox(parsed.outbox);
        if (parsed.currentUserId) {
          const user = SEED_USERS.find((u) => u.id === parsed.currentUserId);
          if (user) setCurrentUserState(user);
        }
        if (parsed.userVotes) setUserVotes(new Set(parsed.userVotes));
      }
    } catch (e) {
      console.error('Error loading stored state:', e);
    }
  }, []);

  // Save to localStorage whenever critical state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          issues,
          comments,
          statusUpdates,
          outbox,
          currentUserId: currentUser.id,
          userVotes: Array.from(userVotes),
        })
      );
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [issues, comments, statusUpdates, outbox, currentUser, userVotes]);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
  };

  const getUserRole = (userId: string) => {
    return roles.find((r) => r.holder_user_id === userId);
  };

  const getRoleById = (roleId: string) => {
    return roles.find((r) => r.id === roleId);
  };

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIssues(SEED_ISSUES);
    setComments(SEED_COMMENTS);
    setStatusUpdates(SEED_STATUS_UPDATES);
    setOutbox(SEED_OUTBOX);
    setCurrentUserState(SEED_USERS[11]); // Rahul Sharma
    setUserVotes(new Set(['issue-hot-water']));
  };

  // Helper to record email in outbox
  const sendEmail = (recipient: string, template: string, subject: string, body: string, issueId: string) => {
    const newItem: EmailOutboxItem = {
      id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient,
      template,
      subject,
      body,
      issue_id: issueId,
      status: 'sent',
      attempts: 1,
      sent_at: new Date().toISOString(),
    };
    setOutbox((prev) => [newItem, ...prev]);
  };

  // S2, S3: Raise Issue
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
    const now = new Date();
    const ackDeadline = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
    const issueId = `issue-${Date.now()}`;

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
      vote_count: 1, // Student auto-upvotes own issue
      redirect_count: 0,
      is_priority: false,
      photos: data.photos,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Update issues
    setIssues((prev) => [newIssue, ...prev]);

    // Record user vote
    setUserVotes((prev) => {
      const next = new Set(prev);
      next.add(issueId);
      return next;
    });

    // Record initial status update (append-only log)
    const initialUpdate: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: 'Raised',
      to_status: 'Raised',
      note: `Issue raised by ${currentUser.name} (${currentUser.course} ${currentUser.batch}) and assigned to ${getRoleById(data.ownerRoleId)?.name || 'Assigned Role'}. 48-hour acknowledgment clock started.`,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [initialUpdate, ...prev]);

    // Send notifications to role inbox and CC roles
    const ownerRole = getRoleById(data.ownerRoleId);
    if (ownerRole) {
      sendEmail(
        ownerRole.inbox_email,
        'issue_raised',
        `[Sunwai] New Issue Raised: ${data.title}`,
        `Hello,\n\nA new issue has been raised and assigned to your role (${ownerRole.name}).\n\nTitle: ${data.title}\nCategory: ${data.category}\nScope: ${data.scope}\nHostel: ${data.hostel}\n\nPlease acknowledge within 48 hours.\nDeadline: ${new Date(ackDeadline).toLocaleString('en-IN')}`,
        issueId
      );
    }

    if (data.ccRoleIds && data.ccRoleIds.length > 0) {
      data.ccRoleIds.forEach((ccId) => {
        const ccRole = getRoleById(ccId);
        if (ccRole) {
          sendEmail(
            ccRole.inbox_email,
            'issue_raised_cc',
            `[Sunwai CC] New Issue in ${data.hostel}: ${data.title}`,
            `You are copied on an issue raised in ${data.category} for ${data.hostel}.`,
            issueId
          );
        }
      });
    }

    return newIssue;
  };

  // S6: Upvote Issue (One per student, removable)
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
          // Priority threshold: crossing 200 votes (approx 10% of enrolled students)
          const isPriority = newVoteCount >= 200;

          if (isPriority && !iss.is_priority) {
            // Priority triggered email
            const ownerRole = getRoleById(iss.owner_role_id);
            if (ownerRole) {
              sendEmail(
                ownerRole.inbox_email,
                'priority_threshold',
                `[Sunwai Priority Alert] ${iss.title} crossed 200 votes!`,
                `This issue has crossed the 10% campus threshold (${newVoteCount} votes). As per Student Council charter, a public response is required within 7 days.`,
                iss.id
              );
            }
          }

          return {
            ...iss,
            vote_count: newVoteCount,
            is_priority: isPriority,
            updated_at: new Date().toISOString(),
          };
        }
        return iss;
      })
    );
  };

  // S5: Edit issue (only before vote or acknowledgment; or withdraw)
  const editIssue = (issueId: string, title: string, details: string): boolean => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return false;

    // Can only edit if raised by current user
    if (target.raised_by !== currentUser.id) return false;

    // After acknowledgment, cannot edit
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

  // S5: Delete issue (only before first vote or acknowledgment)
  const deleteIssue = (issueId: string): boolean => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return false;

    if (target.raised_by !== currentUser.id) return false;
    // Nobody can delete an issue once it has votes > 1 or is acknowledged
    if (target.status !== 'Raised' || target.vote_count > 1) {
      return false;
    }

    setIssues((prev) => prev.filter((i) => i.id !== issueId));
    return true;
  };

  // S5: Withdraw issue (after votes/acknowledgment)
  const withdrawIssue = (issueId: string): boolean => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return false;

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
    if (!target) return;

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

    // Email student
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
    if (!target) return;

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
        `The owner has moved "${target.title}" to In Progress.\n\nNote: ${note}\nNext update due in 7 days.`,
        issueId
      );
    }
  };

  // C3: Post Progress Update
  const postProgressUpdate = (issueId: string, note: string, photoUrl?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

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
    if (!target) return;

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
    if (!target) return;

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

  // C5: Redirect Issue
  const redirectIssue = (issueId: string, newRoleId: string, reason: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    const nextRedirectCount = target.redirect_count + 1;
    let finalRoleId = newRoleId;

    // Spec rule: after 2 redirects, next goes to President
    if (nextRedirectCount >= 3) {
      const presRole = roles.find((r) => r.name === 'President');
      if (presRole) finalRoleId = presRole.id;
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

    const update: StatusUpdate = {
      id: `upd-${Date.now()}`,
      issue_id: issueId,
      actor_id: currentUser.id,
      from_status: target.status,
      to_status: 'Raised',
      note: `Redirected from ${oldRole?.name || 'previous owner'} to ${newRole?.name || 'new owner'} (Redirect #${nextRedirectCount}). Reason: ${reason}. 48h clock restarted.`,
      created_at: now.toISOString(),
    };
    setStatusUpdates((prev) => [update, ...prev]);

    // Notify new role
    if (newRole) {
      sendEmail(
        newRole.inbox_email,
        'issue_redirected',
        `[Sunwai Redirect] Issue reassigned to you: ${target.title}`,
        `Issue "${target.title}" was redirected to your role by ${oldRole?.name}.\nReason: ${reason}\nNew 48h acknowledgment deadline: ${new Date(newAckDeadline).toLocaleString('en-IN')}`,
        issueId
      );
    }
  };

  // S9: Confirm Resolution (Student)
  const confirmResolution = (issueId: string, note?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

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
    if (!target) return;

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
      sendEmail(
        ownerRole.inbox_email,
        'issue_reopened',
        `[Sunwai Reopened] Issue reopened by student: ${target.title}`,
        `The student has reopened the issue stating:\n\n"${reason}"\n\nPlease re-inspect and update progress.`,
        issueId
      );
    }
  };

  // S8: Add Comment
  const addComment = (issueId: string, body: string) => {
    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      issue_id: issueId,
      author_id: currentUser.id,
      body,
      removed_by_admin: false,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
  };

  // Scheduled Deadline Checker (Exit test demonstration)
  const runDeadlineChecker = () => {
    const now = new Date().getTime();
    let escalated = 0;
    let autoClosed = 0;

    setIssues((prev) =>
      prev.map((iss) => {
        // 1. Check Acknowledgment Deadlines
        if (iss.status === 'Raised') {
          const deadline = new Date(iss.ack_deadline).getTime();
          if (now > deadline) {
            escalated++;
            // Escalate to L1 (President)
            const update: StatusUpdate = {
              id: `upd-${Date.now()}-${iss.id}`,
              issue_id: iss.id,
              actor_id: 'system',
              from_status: 'Raised',
              to_status: 'Escalated L1',
              note: `Deadline checker: 48-hour acknowledgment deadline missed. Auto-escalated to President (Escalated L1).`,
              created_at: new Date().toISOString(),
            };
            setStatusUpdates((u) => [update, ...u]);

            sendEmail(
              'president@iiml.ac.in',
              'escalation_l1',
              `[Sunwai Auto-Escalation L1] Missed Deadline: ${iss.title}`,
              `Issue "${iss.title}" was not acknowledged within 48 hours by ${getRoleById(iss.owner_role_id)?.name}. It has escalated to your dashboard.`,
              iss.id
            );

            return {
              ...iss,
              status: 'Escalated L1',
              updated_at: new Date().toISOString(),
            };
          }
        }

        // 2. Check 7-day auto-close for Completed issues
        if (iss.status === 'Completed') {
          const completedTime = new Date(iss.updated_at).getTime();
          const sevenDaysMs = 7 * 86400 * 1000;
          if (now - completedTime > sevenDaysMs) {
            autoClosed++;
            const update: StatusUpdate = {
              id: `upd-${Date.now()}-${iss.id}`,
              issue_id: iss.id,
              actor_id: 'system',
              from_status: 'Completed',
              to_status: 'Closed',
              note: `Deadline checker: 7 days elapsed with no student objection. Automatically closed.`,
              created_at: new Date().toISOString(),
            };
            setStatusUpdates((u) => [update, ...u]);

            return {
              ...iss,
              status: 'Closed',
              closed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        }

        return iss;
      })
    );

    return { escalatedCount: escalated, closedCount: autoClosed };
  };

  return (
    <SunwaiContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        roles,
        issues,
        comments,
        statusUpdates,
        outbox,
        userVotes,
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
        confirmResolution,
        reopenIssue,
        addComment,
        runDeadlineChecker,
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
