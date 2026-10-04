import { requireTeacher } from '@/lib/auth';
import { AdjustForm } from './AdjustForm';

export default async function AdjustPage() {
  const { supabase } = await requireTeacher();
  const { data: kids } = await supabase.from('kids').select('id, name').eq('active', true).order('name');
  return <AdjustForm kids={kids ?? []} />;
}
