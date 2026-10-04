import { requireTeacher } from '@/lib/auth';
import { LogForm } from './LogForm';

export default async function LogPage() {
  const { supabase } = await requireTeacher();
  const [{ data: kids }, { data: activities }] = await Promise.all([
    supabase.from('kids').select('id, name, photo_url').eq('active', true).order('name'),
    supabase.from('activities').select('key, name, points').order('sort'),
  ]);
  return <LogForm kids={kids ?? []} activities={activities ?? []} />;
}
