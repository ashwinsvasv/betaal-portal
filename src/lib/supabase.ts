import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isDbConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

/**
 * Server-only Supabase admin client.
 * Uses the service_role key to bypass Row-Level Security safely on Vercel API routes.
 * Never import or expose this client in client-side React components.
 */
export const supabaseAdmin = isDbConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
