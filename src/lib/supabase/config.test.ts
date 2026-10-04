import { expect, test } from 'vitest';
import { isSupabaseConfigured } from './config';

test('needs both the project URL and the anon key', () => {
  expect(isSupabaseConfigured({})).toBe(false);
  expect(isSupabaseConfigured({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' })).toBe(false);
  expect(isSupabaseConfigured({ NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' })).toBe(false);
  expect(isSupabaseConfigured({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k' })).toBe(true);
});
