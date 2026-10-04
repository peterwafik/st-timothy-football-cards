import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export interface Teacher { name: string; role: 'teacher' | 'admin' }

export async function requireTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: teacher } = await supabase.from('teachers').select('name, role').eq('user_id', user.id).maybeSingle();
  if (!teacher) redirect('/login?error=not-teacher');
  return { supabase, userId: user.id, teacher: teacher as Teacher };
}

export async function requireAdmin() {
  const ctx = await requireTeacher();
  if (ctx.teacher.role !== 'admin') redirect('/log');
  return ctx;
}
