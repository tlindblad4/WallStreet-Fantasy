import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

// Browser client (lazy initialization - only on client)
export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side - return a dummy client that will error if used
    throw new Error('createClient should only be called in browser environment');
  }
  
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
