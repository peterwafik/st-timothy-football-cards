'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { isValidISODate } from '@/lib/dates';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureTeacherAccount } from '@/lib/teacher-accounts';

const back = (msg: string) => redirect(`/settings?msg=${encodeURIComponent(msg)}`);

export async function saveSettings(fd: FormData) {
  const { supabase } = await requireAdmin();
  const tierCount = Number(fd.get('tier_count'));
  const seasonStart = String(fd.get('season_start') ?? '');
  if (!Number.isInteger(tierCount) || tierCount < 1 || tierCount > 11) back('Tiers must be 1–11.');
  if (!isValidISODate(seasonStart)) back('Pick a valid season start.');

  const { data: activities } = await supabase.from('activities').select('key');
  for (const a of activities ?? []) {
    const points = Number(fd.get(`points_${a.key}`));
    if (!Number.isInteger(points) || points < 0 || points > 10000) back('Points must be whole numbers 0–10000.');
    await supabase.from('activities').update({ points }).eq('key', a.key);
  }
  const { error } = await supabase.from('settings').update({
    tier_count: tierCount, season_start: seasonStart, leaderboard_public: fd.get('leaderboard_public') === 'on',
  }).eq('id', 1);
  revalidatePath('/settings');
  back(error ? 'Could not save settings.' : 'Settings saved.');
}

export async function createTeacher(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get('name') ?? '').trim();
  const email = String(fd.get('email') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  const role = fd.get('role') === 'admin' ? 'admin' : 'teacher';
  if (!name || !email) back('Name and email are required.');
  if (password.length < 8) back('Temporary password must be at least 8 characters.');

  const admin = createAdminClient();
  const result = await ensureTeacherAccount(
    {
      auth: admin.auth.admin,
      upsertTeacher: async (row) => admin.from('teachers').upsert(row),
    },
    { name, email, password, role },
  );
  revalidatePath('/settings');
  if (!result.ok) back(result.error);
  back(`${name} added. Share the email and temporary password with them.`);
}

export async function removeTeacher(userId: string) {
  const { userId: me } = await requireAdmin();
  if (userId === me) back('You cannot remove yourself.');
  await createAdminClient().from('teachers').delete().eq('user_id', userId);
  revalidatePath('/settings');
}
