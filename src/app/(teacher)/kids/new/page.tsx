import { requireTeacher } from '@/lib/auth';
import { todayInCairo } from '@/lib/dates';
import { KidForm } from '../KidForm';

export default async function NewKidPage() {
  await requireTeacher();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-card text-3xl font-bold uppercase">Add kid</h1>
      <KidForm id={null} initial={{ name: '', photo_url: null, flag: 'EG', club: 'st-timothy', ssk: null, joined_on: todayInCairo(), active: true }} />
    </div>
  );
}
