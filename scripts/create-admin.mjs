// Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> <name...>
import { createClient } from '@supabase/supabase-js';

const [email, password, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(' ');
if (!email || !password || password.length < 8 || !name) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password(8+)> <name>');
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (error) { console.error(error.message); process.exit(1); }
const { error: tErr } = await db.from('teachers').upsert({ user_id: data.user.id, name, role: 'admin' });
if (tErr) { console.error(tErr.message); process.exit(1); }
const { count } = await db.from('kids').select('*', { count: 'exact', head: true });
console.log(`Admin ${email} created. Kids in database: ${count}`);
