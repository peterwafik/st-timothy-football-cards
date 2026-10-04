import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlayerProfileView } from '@/components/profile/PlayerProfileView';
import { getPlayerProfile } from '@/lib/data';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPlayerProfile((await params).code);
  return { title: profile ? `${profile.name} · St. Timothy` : 'Card not found' };
}

// Where each kid's QR code leads: their card plus everything behind it.
export default async function CardPage({ params }: Props) {
  const profile = await getPlayerProfile((await params).code);
  if (!profile) notFound();
  return <PlayerProfileView profile={profile} />;
}
