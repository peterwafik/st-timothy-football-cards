import Link from 'next/link';
import { buttonGhost, buttonPrimary, PageHeader } from '@/components/staff/ui';
import { requireTeacher } from '@/lib/auth';
import { loadClassSnapshot } from '@/lib/data';
import { KidsSquad } from './KidsSquad';

export const dynamic = 'force-dynamic';

export default async function KidsPage() {
  await requireTeacher();
  const snap = await loadClassSnapshot();
  const active = snap.kids.filter((k) => k.active);
  const needPhoto = active.filter((k) => !k.photo_url).length;
  const rows = snap.kids.map((k) => {
    const r = snap.results.get(k.id)!;
    return {
      id: k.id, name: k.name, photoUrl: k.photo_url, flag: k.flag, club: k.club,
      position: k.position, tier: r.tier, score: r.score, active: k.active,
    };
  });
  return (
    <div>
      <PageHeader
        title="The squad"
        subtitle={`${active.length} kids in the class.${needPhoto ? ` ${needPhoto} still need a photo.` : ''}`}
      >
        <Link href="/kids/qr" className={buttonGhost}>Print QR codes</Link>
        <Link href="/kids/new" className={buttonPrimary}>Add kid</Link>
      </PageHeader>
      <KidsSquad rows={rows} />
    </div>
  );
}
