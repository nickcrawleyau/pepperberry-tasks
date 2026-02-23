import { createClient } from '@supabase/supabase-js';

// Service role client — bypasses RLS. Server-side only.
// Disable Next.js fetch cache so queries always hit the database.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, { ...options, cache: 'no-store' });
      },
    },
  }
);
