'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { parseSettingsForm, type SettingsFields } from '@/lib/settings-form';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureTeacherAccount } from '@/lib/teacher-accounts';

const back = (msg: string) => redirect(`/settings?msg=${encodeURIComponent(msg)}`);

export async function saveSettings(fd: FormData) {
  const { supabase } = await requireAdmin();
  const { data: activities } = await supabase.from('activities').select('key');
  const parsed = parseSettingsForm(fd, (activities ?? []).map((a) => a.key));
  if (!parsed.ok) back(parsed.error);
  const { tierCount, seasonStart, leaderboardPublic, points } = (parsed as { ok: true; value: SettingsFields }).value;

  const results = await Promise.all([
    ...Object.entries(points).map(([key, value]) => supabase.from('activities').update({ points: value }).eq('key', key)),
    supabase.from('settings').update({ tier_count: tierCount, season_start: seasonStart, leaderboard_public: leaderboardPublic }).eq('id', 1),
  ]);
  revalidatePath('/settings');
  back(results.some((r) => r.error) ? 'Some settings could not be saved. Try again.' : 'Settings saved.');
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

export async function removeTeacher(userId: string): Promise<string | void> {
  const { userId: me } = await requireAdmin();
  if (userId === me) return 'You cannot remove yourself.';
  const { error } = await createAdminClient().from('teachers').delete().eq('user_id', userId);
  if (error) return 'Could not remove this teacher. Try again.';
  revalidatePath('/settings');
}
