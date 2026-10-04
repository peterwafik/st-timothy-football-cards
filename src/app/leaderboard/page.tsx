import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';
import { loadClassSnapshot, toCardData } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leaderboard · St. Timothy' };

export default async function Leaderboard() {
  const snap = await loadClassSnapshot();
  if (!snap.settings.leaderboard_public) notFound();
  const rows = snap.kids
    .filter((k) => k.active)
    .map((k) => ({ kid: k, result: snap.results.get(k.id)! }))
    .sort((a, b) => b.result.score - a.result.score || a.kid.name.localeCompare(b.kid.name));
  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="mb-6 text-center font-card text-5xl font-bold uppercase text-gold">St. Timothy Squad</h1>
      <div className="flex flex-wrap justify-center gap-4">
        {rows.map(({ kid, result }) => (
          <PlayerCard key={kid.id} width={160} hideStats data={toCardData(kid, result, snap.settings.tier_count)} />
        ))}
      </div>
    </main>
  );
}
