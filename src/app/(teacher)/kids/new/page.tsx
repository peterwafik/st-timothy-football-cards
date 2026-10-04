import Link from 'next/link';
import { buttonGhost, PageHeader } from '@/components/staff/ui';
import { requireTeacher } from '@/lib/auth';
import { todayInCairo } from '@/lib/dates';
import { KidForm } from '../KidForm';

export default async function NewKidPage() {
  await requireTeacher();
  return (
    <div>
      <PageHeader title="Add a kid" subtitle="They get their own card and QR code as soon as you save.">
        <Link href="/kids" className={buttonGhost}>All kids</Link>
      </PageHeader>
      <KidForm
        id={null}
        initial={{ name: '', photo_url: null, flag: 'EG', club: 'st-timothy', ssk: null, joined_on: todayInCairo(), active: true, position: null }}
      />
    </div>
  );
}
