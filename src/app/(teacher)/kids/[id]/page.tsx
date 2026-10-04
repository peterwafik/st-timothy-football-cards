import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';
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
  const qr = await qrDataUrl(kid.public_code);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-card text-3xl font-bold uppercase">{kid.name}</h1>
      <div className="flex flex-wrap items-start gap-6">
        <PlayerCard width={220} data={toCardData(kid, snap.results.get(kid.id)!, snap.settings.tier_count)} />
        <div className="flex flex-col items-center gap-2">
          <img src={qr} alt={`QR code for ${kid.name}`} className="h-40 w-40 rounded bg-white p-1" />
          <Link href={cardUrl(kid.public_code)} target="_blank" className="text-sm underline">Open public card</Link>
        </div>
      </div>
      <KidForm id={kid.id} initial={kid} />
    </div>
  );
}
