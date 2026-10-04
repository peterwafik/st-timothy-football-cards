'use server';
import { revalidatePath } from 'next/cache';
import { requireTeacher } from '@/lib/auth';

const FAILED = 'Could not undo. Check the connection and try again.';

export async function deleteEntry(id: string): Promise<string | void> {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) return FAILED;
  revalidatePath('/history');
}

export async function deleteAdjustment(id: string): Promise<string | void> {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from('adjustments').delete().eq('id', id);
  if (error) return FAILED;
  revalidatePath('/history');
}
