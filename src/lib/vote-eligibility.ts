import { Issue, User } from '@/types';

export interface VoteEligibility {
  canVote: boolean;
  reason?: string;
  scopeLabel: string;
}

/**
 * Checks whether a given user is allowed to vote on an issue based on:
 * 1. Scope: "my hostel" or "my room" -> Only students residing in that specific hostel can vote.
 * 2. Scope: "my section" or Category: "Academics" -> Only students in the same section / course-batch can vote.
 * 3. Scope: "whole campus" -> Any verified IIML student can vote.
 */
export function checkVoteEligibility(
  user: User | null | undefined,
  issue: Issue,
  raiserUser?: User | null
): VoteEligibility {
  if (!user) {
    return {
      canVote: false,
      reason: 'Sign in to vote on this issue',
      scopeLabel: 'Sign in required',
    };
  }

  // Case 1: Hostel scoped issues ("my hostel" or "my room")
  if (issue.scope === 'my hostel' || issue.scope === 'my room') {
    const issueHostel = (issue.hostel || '').trim().toLowerCase();
    const userHostel = (user.hostel || '').trim().toLowerCase();

    if (issueHostel && userHostel && issueHostel !== userHostel) {
      return {
        canVote: false,
        reason: `Voting restricted to residents of ${issue.hostel}. You are in ${user.hostel || 'another hostel'}.`,
        scopeLabel: `${issue.hostel} only`,
      };
    }

    return {
      canVote: true,
      scopeLabel: `${issue.hostel || 'Hostel'} residents`,
    };
  }

  // Case 2: Section scoped issues ("my section" or Academics issues with section tag)
  if (issue.scope === 'my section' || (issue.category === 'Academics' && issue.section)) {
    const issueSection = (issue.section || raiserUser?.section || '').trim().toLowerCase();
    const userSection = (user.section || '').trim().toLowerCase();

    // Also verify course & batch compatibility if applicable
    if (raiserUser) {
      const isSameCourseBatch =
        user.course?.toLowerCase() === raiserUser.course?.toLowerCase() &&
        user.batch?.toLowerCase() === raiserUser.batch?.toLowerCase();

      if (!isSameCourseBatch) {
        return {
          canVote: false,
          reason: `Voting restricted to ${raiserUser.course} ${raiserUser.batch} students.`,
          scopeLabel: `${raiserUser.course} ${raiserUser.batch} only`,
        };
      }
    }

    if (issueSection && userSection && issueSection !== userSection) {
      const displaySection = issue.section || raiserUser?.section || 'the specified section';
      return {
        canVote: false,
        reason: `Voting restricted to ${displaySection}. You are registered in ${user.section || 'another section'}.`,
        scopeLabel: `${displaySection} only`,
      };
    }

    return {
      canVote: true,
      scopeLabel: `${issue.section || raiserUser?.section || 'Section'} students`,
    };
  }

  // Case 3: Whole campus issues
  return {
    canVote: true,
    scopeLabel: 'Whole campus',
  };
}
