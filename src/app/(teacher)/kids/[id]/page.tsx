import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';
import { buttonGhost, PageHeader, Panel } from '@/components/staff/ui';
import { requireTeacher } from '@/lib/auth';
import { loadClassSnapshot, toCardData } from '@/lib/data';
import { cardUrl, qrDataUrl } from '@/lib/qr';
import { KidForm } from '../KidForm';

export const dynamic = 'force-dynamic';

export default async function EditKidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireTeacher();
  const snap = await loadClassSnapshot();
  const kid = snap.kids.find((k) => k.id === id);
  if (!kid) notFound();
  const result = snap.results.get(kid.id)!;
  const qr = await qrDataUrl(kid.public_code);
  return (
    <div>
      <PageHeader title={kid.name} subtitle={`${result.score} points this season`}>
        <Link href="/kids" className={buttonGhost}>All kids</Link>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-6">
          <PlayerCard width={240} data={toCardData(kid, result, snap.settings.tier_count)} />
          <Panel title="QR code" className="w-full text-center">
            <img src={qr} alt={`QR code for ${kid.name}`} className="mx-auto h-44 w-44 rounded-lg bg-white p-2" />
            <Link href={cardUrl(kid.public_code)} target="_blank" className={`${buttonGhost} mt-4 inline-block`}>
              Open {kid.name.split(' ')[0]}’s page
            </Link>
          </Panel>
        </div>
        <KidForm id={kid.id} initial={kid} />
      </div>
    </div>
  );
}
