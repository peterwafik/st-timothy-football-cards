import { notFound } from 'next/navigation';
import { PlayerCard } from '@/components/PlayerCard';
import { CLUBS } from '@/lib/clubs';

export default function DevCards() {
  if (process.env.NODE_ENV === 'production') notFound();
  const names = ['Daniel Mina', 'Filopateer Ayman', 'George Raafat', 'Kerolos Emad'];
  return (
    <main className="flex flex-wrap gap-6 p-6">
      {Array.from({ length: 11 }, (_, i) => i + 1).map((tier) => (
        <PlayerCard
          key={tier}
          width={240}
          data={{
            name: names[tier % names.length], photoUrl: null, flag: tier % 2 ? 'EG' : 'AR',
            club: tier % 2 ? 'st-timothy' : CLUBS[tier]?.id ?? 'st-timothy', tier, active: tier !== 11,
            stats: { SSK: 0, RIB: 45, PRA: 66, CHA: 80, SSA: 99, BEH: 74 },
          }}
        />
      ))}
    </main>
  );
}
