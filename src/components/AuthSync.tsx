'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSunwai } from '@/lib/store';
import { parseRollNumber } from '@/lib/student-upload';

/**
 * Links the Google session to a Betaal user (once per sign-in) and sends brand-new
 * users to the one-time "pick your hostel" step on /signin.
 */
export function AuthSync() {
  const { data: session, status } = useSession();
  const { users, currentUser, setCurrentUser, createUser, updateUser } = useSunwai();
  const router = useRouter();
  const pathname = usePathname();
  const syncedEmail = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      syncedEmail.current = null;
      const isDemo = typeof document !== 'undefined' && document.cookie.includes('betaal_demo_session=1');
      if (status === 'unauthenticated' && currentUser && !isDemo && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
        setCurrentUser(null);
      }
      return;
    }
    const email = session?.user?.email?.toLowerCase();
    if (!email || syncedEmail.current === email) return;
    syncedEmail.current = email;

    const mapped = session.user?.sunwaiUserId
      ? users.find((u) => u.id === session.user.sunwaiUserId)
      : undefined;
    const existing = mapped ?? users.find((u) => u.email.toLowerCase() === email);
    const googleName = session.user?.name;

    if (existing) {
      if (googleName && googleName.trim() && existing.name !== googleName) {
        const updated = { ...existing, name: googleName };
        updateUser(existing.id, { name: googleName });
        setCurrentUser(updated);
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, name: googleName, email: existing.email }),
        }).catch(() => {});
        return;
      }
      setCurrentUser(existing);
      return;
    }

    // First sign-in: create a student; auto-extract course/batch if email username is a roll number
    const username = email.split('@')[0].toUpperCase();
    const parsed = parseRollNumber(username);
    const created = createUser({
      roll_no: parsed.isValid ? username : username,
      name: googleName || username,
      email,
      course: parsed.course || 'PGP',
      batch: parsed.batch || '42',
      hostel: '',
      is_active: true,
    });
    setCurrentUser(created);
    fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: googleName || username, email }),
    }).catch(() => {});
  }, [status, session, users, currentUser, setCurrentUser, createUser, updateUser]);

  // Profile incomplete: keep the user on the one-time setup screen.
  useEffect(() => {
    if (status === 'authenticated' && currentUser && currentUser.hostel === '' && pathname !== '/signin') {
      router.replace('/signin');
    }
  }, [status, currentUser, pathname, router]);

  return null;
}
