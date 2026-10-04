'use server';
import { revalidatePath } from 'next/cache';
import { requireTeacher } from '@/lib/auth';

export async function deleteEntry(id: string) {
  const { supabase } = await requireTeacher();
  await supabase.from('entries').delete().eq('id', id);
  revalidatePath('/history');
}

export async function deleteAdjustment(id: string) {
  const { supabase } = await requireTeacher();
  await supabase.from('adjustments').delete().eq('id', id);
  revalidatePath('/history');
}
