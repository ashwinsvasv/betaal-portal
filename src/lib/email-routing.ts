/**
 * Email destinations use plus-addressing on one mailbox:
 *   ashwinsvasv+president@gmail.com, ashwinsvasv+mess@gmail.com, ...
 * The role slug is the role id without its "role-" prefix.
 */
export const MAILBOX_USER = 'ashwinsvasv';
export const MAILBOX_DOMAIN = 'gmail.com';

export function plusAddress(slug: string): string {
  return `${MAILBOX_USER}+${slug}@${MAILBOX_DOMAIN}`;
}

export function roleInbox(roleId: string): string {
  return plusAddress(roleId.replace(/^role-/, ''));
}

/** Legacy institute addresses mapped to the role slug they used to represent. */
const LEGACY_SLUGS: Record<string, string> = {
  'president@iiml.ac.in': 'president',
  'infra.sec@iiml.ac.in': 'infra',
  'mess.sec@iiml.ac.in': 'mess',
  'acad.sec@iiml.ac.in': 'acad',
  'sports.sec@iiml.ac.in': 'sports',
  'events.sec@iiml.ac.in': 'events',
  'cultural.sec@iiml.ac.in': 'cultural',
  'treasurer@iiml.ac.in': 'treasurer',
  'h3.rep@iiml.ac.in': 'h3rep',
  'h4.rep@iiml.ac.in': 'h4rep',
  'studentaffairs@iiml.ac.in': 'studentaffairs',
  'techadmin@iiml.ac.in': 'admin',
  'council@iiml.ac.in': 'council',
};

/**
 * Sandbox rule: when a sandbox mailbox is configured, every message lands in it.
 * Role addresses keep their +role tag; anything else (e.g. a student) goes to +student.
 */
export function resolveDestination(recipient: string, sandboxMailbox?: string): string {
  if (!sandboxMailbox) return recipient;
  const [user, domain] = sandboxMailbox.toLowerCase().split('@');
  const lower = recipient.toLowerCase();
  if (lower.startsWith(`${user}+`) && lower.endsWith(`@${domain}`)) return recipient;
  const slug = LEGACY_SLUGS[lower] ?? 'student';
  return `${user}+${slug}@${domain}`;
}
