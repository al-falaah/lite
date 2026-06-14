// Shared Supabase admin-client helper for scripts.
//
// Loads .env from the project root and returns a service-role client.
// Use this from any script that needs to write to the DB — never paste the
// service-role key on the command line, because Claude Code (and other
// shells) record command strings to local logs.
//
// Usage:
//   import { adminClient } from './_lib/supabase.js';
//   const supabase = adminClient();
//
// Then just run:  node scripts/yourScript.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  const url =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      'Missing Supabase credentials. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env (VITE_-prefixed names also work).'
    );
    process.exit(1);
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
