'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSunwai } from '@/lib/store';

/**
 * Links the Google session to a Sunwai user (once per sign-in) and sends brand-new
 * users to the one-time "pick your hostel" step on /signin.
 */
export function AuthSync() {
  const { data: session, status } = useSession();
  const { users, currentUser, setCurrentUser, createUser } = useSunwai();
  const router = useRouter();
  const pathname = usePathname();
  const syncedEmail = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      syncedEmail.current = null;
      return;
    }
    const email = session.user?.email?.toLowerCase();
    if (!email || syncedEmail.current === email) return;
    syncedEmail.current = email;

    const mapped = session.user.sunwaiUserId
      ? users.find((u) => u.id === session.user.sunwaiUserId)
      : undefined;
    const existing = mapped ?? users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      setCurrentUser(existing);
      return;
    }
    // First sign-in: create a student with an empty hostel; /signin asks for it.
    const created = createUser({
      roll_no: '',
      name: session.user.name || email.split('@')[0],
      email,
      course: '',
      batch: '',
      hostel: '',
      is_active: true,
    });
    setCurrentUser(created);
  }, [status, session, users, setCurrentUser, createUser]);

  // Profile incomplete: keep the user on the one-time setup screen.
  useEffect(() => {
    if (status === 'authenticated' && currentUser.hostel === '' && pathname !== '/signin') {
      router.replace('/signin');
    }
  }, [status, currentUser.hostel, pathname, router]);

  return null;
}
