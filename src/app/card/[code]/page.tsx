import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DownloadCardButton } from '@/components/DownloadCardButton';
import { PlayerCard } from '@/components/PlayerCard';
import { getCardByCode } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCardByCode((await params).code);
  return { title: card ? `${card.name} · St. Timothy` : 'Card not found' };
}

export default async function CardPage({ params }: Props) {
  const { code } = await params;
  const card = await getCardByCode(code);
  if (!card) notFound();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div id="card" className="p-2">
        <PlayerCard data={card} width={340} />
      </div>
      <DownloadCardButton targetId="card" fileName={`${card.name.replace(/\s+/g, '-')}-card.png`} />
    </main>
  );
}
