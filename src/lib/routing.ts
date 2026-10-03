import { IssueCategory, IssueScope, CouncilRole } from '@/types';

export interface SuggestedOwnerResult {
  ownerRoleId: string;
  ownerRoleName: string;
  ownerHolderName: string;
  ownerInboxEmail: string;
  ccRoleIds: string[];
  ccRoleNames: string[];
  reason: string;
}

export function determineSuggestedOwner(
  category: IssueCategory,
  scope: IssueScope,
  studentHostel: string,
  roles: CouncilRole[],
  isConductIssue: boolean = false,
  isAboutPresident: boolean = false,
  currentUserId?: string
): SuggestedOwnerResult {
  // Conflict of interest rules
  if (isAboutPresident) {
    return {
      ownerRoleId: 'role-student-affairs',
      ownerRoleName: 'Student Affairs Office',
      ownerHolderName: 'Dean of Student Affairs',
      ownerInboxEmail: 'ashwinsvasv+studentaffairs@gmail.com',
      ccRoleIds: [],
      ccRoleNames: [],
      reason: 'Conflict of interest: complaint is regarding the Student Council President, escalated directly to Student Affairs.',
    };
  }

  if (isConductIssue) {
    const presidentRole = roles.find((r) => r.name.toLowerCase().includes('president'));
    return {
      ownerRoleId: presidentRole ? presidentRole.id : 'role-president',
      ownerRoleName: 'Student Council President',
      ownerHolderName: 'Ashwin Narayan',
      ownerInboxEmail: 'ashwinsvasv+president@gmail.com',
      ccRoleIds: [],
      ccRoleNames: [],
      reason: 'Council member conduct complaint routed confidentially to the President.',
    };
  }

  const infraSec = roles.find((r) => r.name === 'Infra & IT Secretary');
  const messSec = roles.find((r) => r.name === 'Mess Secretary');
  const academicSec = roles.find((r) => r.name === 'Academic Secretary');
  const sportsSec = roles.find((r) => r.name === 'Sports Secretary');
  const eventsSec = roles.find((r) => r.name === 'Events Secretary');
  const culturalSec = roles.find((r) => r.name === 'Cultural Secretary');
  const treasurer = roles.find((r) => r.name === 'Treasurer');
  const president = roles.find((r) => r.name === 'President');

  // Find hostel rep for student's hostel (e.g., "Hostel 3" -> "Hostel Rep H3")
  const hostelNum = studentHostel.replace(/\D/g, '') || '3';
  const hostelRep = roles.find(
    (r) => r.name.includes(`Hostel Rep H${hostelNum}`) || r.name.includes(`Hostel Rep Hostel ${hostelNum}`)
  ) || roles.find((r) => r.name.startsWith('Hostel Rep'));

  let primaryRole = president;
  let ccRoles: (CouncilRole | undefined)[] = [];
  let reason = '';

  switch (category) {
    case 'Infra & IT':
    case 'Hostel life':
      if (scope === 'my room' || scope === 'my hostel') {
        primaryRole = hostelRep || infraSec;
        if (infraSec && primaryRole?.id !== infraSec.id) {
          ccRoles.push(infraSec);
        }
        reason = `Local hostel infrastructure issue routed to ${primaryRole?.name}, with Infra & IT Secretary copied for tracking.`;
      } else {
        primaryRole = infraSec;
        reason = 'Campus-wide infrastructure issue routed directly to the Infra & IT Secretary.';
      }
      break;

    case 'Mess and food':
      primaryRole = messSec;
      reason = 'Mess and dining facility matters route directly to the Mess Secretary.';
      break;

    case 'Academics':
      primaryRole = academicSec;
      reason = 'Academic calendar, scheduling, and course-related issues route to the Academic Secretary.';
      break;

    case 'Sports facilities and events':
      primaryRole = sportsSec;
      reason = 'Sports equipment, grounds, and recreation issues route to the Sports Secretary.';
      break;

    case 'Events':
      primaryRole = eventsSec;
      reason = 'Campus events, guest talks, and festival scheduling route to the Events Secretary.';
      break;

    case 'Cultural':
      primaryRole = culturalSec;
      reason = 'Cultural committee activities and club rooms route to the Cultural Secretary.';
      break;

    case 'Finance and reimbursements':
      primaryRole = treasurer;
      reason = 'Budgeting, reimbursements, and student club payments route to the Treasurer.';
      break;

    case 'Other / not sure':
    default:
      primaryRole = president;
      reason = 'General or unclassified issue routed to the President for review and assignment.';
      break;
  }

  // Prevent self-assignment: if the logged-in student is the holder of the assigned role
  if (currentUserId && primaryRole && primaryRole.holder_user_id === currentUserId) {
    if (president && president.holder_user_id !== currentUserId) {
      primaryRole = president;
      reason = 'Self-assignment safeguard: Issue routed to President because you hold this role.';
    }
  }

  const finalOwnerRole = primaryRole || president || roles[0];
  const validCcRoles = ccRoles.filter((r): r is CouncilRole => Boolean(r));

  return {
    ownerRoleId: finalOwnerRole.id,
    ownerRoleName: finalOwnerRole.name,
    ownerHolderName: 'Assigned Officer',
    ownerInboxEmail: finalOwnerRole.inbox_email,
    ccRoleIds: validCcRoles.map((r) => r.id),
    ccRoleNames: validCcRoles.map((r) => r.name),
    reason,
  };
}
