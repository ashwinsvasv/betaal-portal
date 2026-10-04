import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin, isDbConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, email } = await request.json();
    const userEmail = email?.toLowerCase() || session.user.email.toLowerCase();
    const userName = name || session.user.name;

    if (!isDbConfigured || !supabaseAdmin) {
      return NextResponse.json({ status: 'ok', source: 'local' });
    }

    if (id) {
      await supabaseAdmin
        .from('users')
        .update({ name: userName })
        .eq('id', id);
    } else {
      await supabaseAdmin
        .from('users')
        .update({ name: userName })
        .eq('email', userEmail);
    }

    return NextResponse.json({ status: 'ok', name: userName });
  } catch (error: any) {
    console.error('Error syncing user profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
