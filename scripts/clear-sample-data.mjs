// Removes every entry and adjustment made by the test accounts (E2E_EMAIL, TEST_TEACHER_EMAIL),
// including the sample data from seed-sample-data.mjs. Real teachers' entries are untouched.
// Usage: node --env-file=.env.local scripts/clear-sample-data.mjs
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const testEmails = [process.env.E2E_EMAIL, process.env.TEST_TEACHER_EMAIL].filter(Boolean);
const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
const ids = users.users.filter((u) => testEmails.includes(u.email)).map((u) => u.id);
if (ids.length === 0) {
  console.log('No test accounts found; nothing to clear.');
  process.exit(0);
}
const e = await db.from('entries').delete({ count: 'exact' }).in('created_by', ids);
const a = await db.from('adjustments').delete({ count: 'exact' }).in('created_by', ids);
if (e.error || a.error) throw new Error((e.error ?? a.error).message);
console.log(`Removed ${e.count} entries and ${a.count} adjustments made by the test accounts.`);
