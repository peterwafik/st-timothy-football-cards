import { PlayerCard } from './PlayerCard';
import { toCardData, type ClassSnapshot } from '@/lib/data';

export function SquadGrid({ snap }: { snap: ClassSnapshot }) {
  const rows = snap.kids
    .filter((k) => k.active)
    .map((k) => ({ kid: k, result: snap.results.get(k.id)! }))
    .sort((a, b) => b.result.score - a.result.score || a.kid.name.localeCompare(b.kid.name));
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {rows.map(({ kid, result }) => (
        <PlayerCard key={kid.id} width={160} hideStats data={toCardData(kid, result, snap.settings.tier_count)} />
      ))}
    </div>
  );
}
