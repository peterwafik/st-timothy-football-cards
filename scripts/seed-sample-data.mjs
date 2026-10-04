// Adds a few sample sessions and bonuses so the cards and league table can be tried out.
// Everything is recorded as created by the test admin (E2E_EMAIL), so clear-sample-data.mjs can remove it.
// Usage: node --env-file=.env.local scripts/seed-sample-data.mjs
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
const admin = users.users.find((u) => u.email === process.env.E2E_EMAIL);
if (!admin) throw new Error(`Test admin ${process.env.E2E_EMAIL} not found`);

const { data: kids } = await db.from('kids').select('id, name').eq('active', true).order('name');
const sessions = [
  ['fasl', '2026-10-02'], ['tasbeha', '2026-10-03'], ['odas', '2026-10-04'], ['nota', '2026-10-04'],
  ['dars', '2026-10-02'], ['discipline', '2026-10-02'],
];
// Deterministic but varied "attendance": each kid gets their own commitment level (3 to 9 out of 10),
// so the sample table shows a spread of scores rather than big ties.
const entries = [];
kids.forEach((kid, k) => {
  const commitment = 3 + ((k * 5) % 7);
  sessions.forEach(([activity_key, date], s) => {
    if ((k * 13 + s * 7) % 10 < commitment) entries.push({ kid_id: kid.id, activity_key, date, created_by: admin.id });
  });
});
const { error: eErr } = await db.from('entries').upsert(entries, { onConflict: 'kid_id,activity_key,week_start', ignoreDuplicates: true });
if (eErr) throw new Error(eErr.message);

const adjustments = [
  { kid_id: kids[0].id, points: 50, reason: 'Sample: helped set up the class', date: '2026-10-02', created_by: admin.id },
  { kid_id: kids[5].id, points: 100, reason: 'Sample: memorised the verse', date: '2026-10-04', created_by: admin.id },
  { kid_id: kids[9].id, points: -30, reason: 'Sample: talking during prayer', date: '2026-10-04', created_by: admin.id },
];
const { error: aErr } = await db.from('adjustments').insert(adjustments);
if (aErr) throw new Error(aErr.message);
console.log(`Added ${entries.length} sample entries and ${adjustments.length} sample adjustments.`);
