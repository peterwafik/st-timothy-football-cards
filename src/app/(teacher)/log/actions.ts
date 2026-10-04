'use server';
import { requireTeacher } from '@/lib/auth';
import { isFutureDate, isValidISODate, toLocalISODate } from '@/lib/dates';
import { summarizeInsert } from '@/lib/log-result';

export async function getLoggedKidIds(activityKey: string, date: string): Promise<string[]> {
  if (!isValidISODate(date)) return [];
  const { supabase } = await requireTeacher();
  const { data } = await supabase.from('entries').select('kid_id').eq('activity_key', activityKey).eq('date', date);
  return (data ?? []).map((r) => r.kid_id);
}

export type LogResult = { ok: true; message: string } | { ok: false; error: string };

export async function logSession(input: { activityKey: string; date: string; kidIds: string[] }): Promise<LogResult> {
  const { supabase } = await requireTeacher();
  if (!isValidISODate(input.date)) return { ok: false, error: 'Pick a valid date.' };
  // Allow one day of slack: the server runs in UTC, teachers are in Egypt (UTC+2/+3).
  const tomorrow = toLocalISODate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  if (isFutureDate(input.date, tomorrow)) return { ok: false, error: 'You can’t log a future date.' };
  const kidIds = [...new Set(input.kidIds)];
  if (kidIds.length === 0) return { ok: false, error: 'Tick at least one kid.' };

  const rows = kidIds.map((kid_id) => ({ kid_id, activity_key: input.activityKey, date: input.date }));
  const { data, error } = await supabase
    .from('entries')
    .upsert(rows, { onConflict: 'kid_id,activity_key,date', ignoreDuplicates: true })
    .select('id');
  if (error) return { ok: false, error: 'Could not save. Check your connection and try again.' };
  return { ok: true, message: summarizeInsert(kidIds.length, data?.length ?? 0).message };
}
