import { notFound } from 'next/navigation';
import { Leaderboard } from '@/components/league/Leaderboard';
import { assignTiers } from '@/lib/scoring';
import { CLUBS } from '@/lib/clubs';
import type { LeagueRow } from '@/lib/standings';

const NAMES = [
  'Efraim Remon', 'George Raafat', 'Daniel Samy', 'Seif Sherif', 'Carlos John', 'Oliver Mofeed', 'Steven Mina',
  'Rojer George', 'Paula Tarek', 'David Eissa', 'Kevin Ossama', 'Freddy Maged', 'George Ayman', 'David George',
  'Filopateer Mina', 'Thomas Sameh', 'Kerolos Emad', 'Patrick Nabil', 'Filopateer Ayman', 'Justin Remon',
  'Kareem Joseph', 'Mina Hesham', 'Youssef Medhat', 'Andrew Amgad', 'Johnny Sameh', 'Selim Ibrahim',
  'Youssef Hany', 'Jerome Maged', 'Johnny Mina', 'Matthew Adel', 'Pierre George',
];
const FLAGS = ['EG', 'AR', 'BR', 'PT', 'ES', 'GB-ENG', 'FR', 'EG', 'EG', 'IT'];

// Sample data so the design can be seen before the database exists. /dev/leaderboard?preseason=1 shows kick-off.
export default async function DevLeaderboard({ searchParams }: { searchParams: Promise<{ preseason?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const preseason = (await searchParams).preseason === '1';
  const scores = NAMES.map((name, i) => ({ kidId: name, score: preseason ? 0 : Math.max(0, 2600 - i * 83 - (i % 4) * 40) }));
  const tiers = assignTiers(scores, 11);
  const rows: LeagueRow[] = scores.map(({ kidId, score }, i) => ({
    id: kidId,
    name: kidId,
    score,
    card: {
      name: kidId, photoUrl: null, flag: FLAGS[i % FLAGS.length], club: CLUBS[(i * 37) % CLUBS.length].id,
      tier: tiers.get(kidId)!, active: true, position: ['ST', 'CM', 'GK', 'CB', 'RW', 'CAM'][i % 6],
      stats: { SSK: 0, RIB: 60 + (i % 5) * 7, PRA: 90 - i, CHA: 99 - i * 2, SSA: 95 - i, BEH: 80 + (i % 3) * 6 },
    },
  }));
  return <Leaderboard rows={rows} season="Season 2026–27" showLogin />;
}
