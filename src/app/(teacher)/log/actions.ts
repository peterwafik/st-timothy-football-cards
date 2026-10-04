'use server';
import { requireTeacher } from '@/lib/auth';
import { isFutureDate, isValidISODate, todayInCairo, weekStart } from '@/lib/dates';
import { summarizeInsert } from '@/lib/log-result';

// Kids already logged for this activity in the same week (Friday to Thursday) as `date`.
export async function getLoggedKidIds(activityKey: string, date: string): Promise<string[]> {
  if (!isValidISODate(date)) return [];
  const { supabase } = await requireTeacher();
  const { data } = await supabase.from('entries').select('kid_id').eq('activity_key', activityKey).eq('week_start', weekStart(date));
  return (data ?? []).map((r) => r.kid_id);
}

export type LogResult = { ok: true; message: string } | { ok: false; error: string };

export async function logSession(input: { activityKey: string; date: string; kidIds: string[] }): Promise<LogResult> {
  const { supabase } = await requireTeacher();
  if (!isValidISODate(input.date)) return { ok: false, error: 'Pick a valid date.' };
  if (isFutureDate(input.date, todayInCairo())) return { ok: false, error: 'You can’t log a future date.' };
  const kidIds = [...new Set(input.kidIds)];
  if (kidIds.length === 0) return { ok: false, error: 'Tick at least one kid.' };

  const rows = kidIds.map((kid_id) => ({ kid_id, activity_key: input.activityKey, date: input.date }));
  const { data, error } = await supabase
    .from('entries')
    .upsert(rows, { onConflict: 'kid_id,activity_key,week_start', ignoreDuplicates: true })
    .select('id');
  if (error) return { ok: false, error: 'Could not save. Check your connection and try again.' };
  return { ok: true, message: summarizeInsert(kidIds.length, data?.length ?? 0).message };
}
