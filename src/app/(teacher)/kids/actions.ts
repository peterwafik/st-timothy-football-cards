'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireTeacher } from '@/lib/auth';
import { parseKidForm } from '@/lib/kid-form';

export async function saveKid(id: string | null, _prev: string | null, fd: FormData): Promise<string | null> {
  const { supabase } = await requireTeacher();
  const parsed = parseKidForm(fd);
  if (!parsed.ok) return parsed.error;
  const { error } = id
    ? await supabase.from('kids').update(parsed.value).eq('id', id)
    : await supabase.from('kids').insert(parsed.value);
  if (error) return 'Could not save. Try again.';
  revalidatePath('/kids');
  redirect('/kids');
}
