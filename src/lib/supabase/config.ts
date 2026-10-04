type Env = { NEXT_PUBLIC_SUPABASE_URL?: string; NEXT_PUBLIC_SUPABASE_ANON_KEY?: string };

/** False until the Supabase keys are in .env.local (or the Vercel env vars). */
export function isSupabaseConfigured(
  env: Env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const NOT_CONFIGURED_MESSAGE =
  'The database is not set up yet. Follow docs/setup-checklist.md to connect Supabase, then restart the site.';
