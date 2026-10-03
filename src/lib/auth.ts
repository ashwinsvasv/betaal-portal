import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const list = (value: string | undefined, fallback = ''): string[] =>
  (value ?? fallback)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/** Domains whose Google accounts may sign in (default: iiml.ac.in). */
export const allowedDomains = list(process.env.SUNWAI_ALLOWED_DOMAINS, 'iiml.ac.in');

/**
 * Optional "email=userId" pairs, e.g. "ashwinsvasv@gmail.com=user-pres".
 * Lets a real Google account sign in as a seeded council member.
 * Mapped emails are always allowed to sign in.
 */
export const roleMap: Record<string, string> = Object.fromEntries(
  (process.env.SUNWAI_ROLE_MAP ?? '')
    .split(',')
    .map((pair) => pair.trim().split('='))
    .filter((p) => p.length === 2 && p[0] && p[1])
    .map(([email, id]) => [email.trim().toLowerCase(), id.trim()])
);

const allowedEmails = [...list(process.env.SUNWAI_ALLOWED_EMAILS), ...Object.keys(roleMap)];

export function isAllowedEmail(email: string): boolean {
  const e = email.toLowerCase().trim();
  if (allowedEmails.includes(e)) return true;
  // Strictly enforce email ending with @iiml.ac.in (or subdomain.iiml.ac.in)
  return e.endsWith('@iiml.ac.in') || e.endsWith('.iiml.ac.in');
}

export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: googleConfigured
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          // "hd" only hints the account chooser; the real check is in signIn below.
          authorization: {
            params: { hd: allowedDomains[0], prompt: 'select_account' },
          },
        }),
      ]
    : [],
  pages: { signIn: '/signin', error: '/signin' },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      if (verified === false) return false;
      return isAllowedEmail(email);
    },
    async jwt({ token }) {
      if (token.email) token.sunwaiUserId = roleMap[token.email.toLowerCase()];
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.sunwaiUserId = token.sunwaiUserId;
      return session;
    },
  },
};
