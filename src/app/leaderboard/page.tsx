import { notFound } from 'next/navigation';
import { SquadGrid } from '@/components/SquadGrid';
import { loadClassSnapshot } from '@/lib/data';
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leaderboard · St. Timothy' };

export default async function Leaderboard() {
  if (!isSupabaseConfigured()) {
    return <main className="flex min-h-dvh items-center justify-center p-6 text-center text-white/70">{NOT_CONFIGURED_MESSAGE}</main>;
  }
  const snap = await loadClassSnapshot();
  if (!snap.settings.leaderboard_public) notFound();
  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-center font-card text-5xl font-bold uppercase text-gold">St. Timothy Squad</h1>
      <SquadGrid snap={snap} />
    </main>
  );
}
