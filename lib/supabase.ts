import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let publicClient: SupabaseClient | null | undefined;
let adminClient: SupabaseClient | null | undefined;

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

function getPublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

function getSecretKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVER_SECRET || '';
}

export function getSupabasePublicClient(): SupabaseClient | null {
  if (publicClient !== undefined) return publicClient;
  const url = getUrl();
  const key = getPublishableKey();
  if (!url || !key) {
    publicClient = null;
    return null;
  }
  publicClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  const url = getUrl();
  const key = getSecretKey();
  if (!url || !key) {
    throw new Error('Missing Supabase server configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
  }
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return adminClient;
}
