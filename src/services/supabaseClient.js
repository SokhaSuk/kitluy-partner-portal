import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase client, or null when the backend is not configured.
 *
 * With the env vars unset, this returns null and the app falls back to its
 * device-local auth and store — exactly today's behaviour. Set both and the same
 * code path lights up the backend. Nothing is hardcoded, so no key ships in source.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

export function getSupabaseClient() {
  if (client) return client;
  if (!url || !anonKey) return null;

  client = createClient(url, anonKey, {
    auth: {
      // The browser holds the session; persist and auto-refresh it, and read the
      // recovery token back out of the URL after a reset email.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

/** True when a backend is wired. Lets the UI say whether it is syncing. */
export const isBackendConfigured = Boolean(url && anonKey);
