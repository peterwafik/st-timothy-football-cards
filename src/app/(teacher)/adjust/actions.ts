'use server';
import { requireTeacher } from '@/lib/auth';
import { isFutureDate, isValidISODate, todayInCairo } from '@/lib/dates';

export type AdjustState = { ok: boolean; message: string } | null;

export async function addAdjustment(_prev: AdjustState, formData: FormData): Promise<AdjustState> {
  const { supabase } = await requireTeacher();
  const kidId = String(formData.get('kid_id') ?? '');
  const kind = String(formData.get('kind') ?? 'bonus');
  const amount = Number(formData.get('points'));
  const reason = String(formData.get('reason') ?? '').trim();
  const date = String(formData.get('date') ?? '');

  if (!kidId) return { ok: false, message: 'Pick a kid.' };
  if (!Number.isInteger(amount) || amount < 1 || amount > 10000) return { ok: false, message: 'Points must be a whole number from 1 to 10000.' };
  if (!reason) return { ok: false, message: 'Write a short reason.' };
  if (!isValidISODate(date) || isFutureDate(date, todayInCairo())) return { ok: false, message: 'Pick a valid date (not in the future).' };

  const points = kind === 'deduct' ? -amount : amount;
  const { error } = await supabase.from('adjustments').insert({ kid_id: kidId, points, reason, date });
  if (error) return { ok: false, message: 'Could not save. Try again.' };
  return { ok: true, message: `${kind === 'deduct' ? 'Deducted' : 'Added'} ${amount} points.` };
}
