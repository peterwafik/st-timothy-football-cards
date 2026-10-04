import Link from 'next/link';
import { ClubCrest } from '../ClubCrest';
import { LeagueTable } from './LeagueTable';
import { PitchMarkings } from './PitchMarkings';
import { Podium } from './Podium';
import { withPositions, type LeagueRow } from '@/lib/standings';

// Mown-grass stripes, darkened toward the edges like a floodlit stadium at night.
const GRASS = 'repeating-linear-gradient(180deg, var(--color-grass) 0 80px, var(--color-grass-light) 80px 160px)';
const VIGNETTE = 'radial-gradient(ellipse at 50% 20%, transparent 35%, rgba(0, 0, 0, 0.55) 100%)';

export function Leaderboard({
  rows,
  season,
  showLogin = false,
  emptyMessage = 'No players yet. Teachers can add kids from the Kids page.',
}: {
  rows: LeagueRow[];
  season: string;
  showLogin?: boolean;
  emptyMessage?: string;
}) {
  const table = withPositions(rows);
  const podium = table.filter((r) => r.score > 0).slice(0, 3);

  return (
    <div className="relative min-h-dvh overflow-hidden text-chalk" style={{ background: GRASS }}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: VIGNETTE }} />
      <div className="relative mx-auto max-w-5xl px-4 pb-16">
        <header className="flex items-center gap-3 py-5">
          <span className="block w-8"><ClubCrest club="st-timothy" /></span>
          <p className="flex-1 font-stadium text-lg font-semibold sm:text-xl">St. Timothy Sunday School</p>
          {showLogin && (
            <Link
              href="/login"
              className="rounded-full border border-chalk/40 px-4 py-1.5 font-card text-base font-bold hover:bg-chalk hover:text-dugout focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-floodlight"
            >
              Leaders login
            </Link>
          )}
        </header>

        <section className="relative min-h-[34rem] pt-8 text-center">
          <PitchMarkings />
          <h1 className="relative font-stadium text-6xl font-extrabold leading-[0.9] sm:text-8xl">St. Timothy League</h1>
          <p className="relative mt-3 font-card text-xl text-chalk/75">{season}</p>
          {podium.length > 0 ? (
            <Podium rows={podium} />
          ) : (
            <p className="relative mx-auto mt-16 max-w-sm font-card text-2xl">
              Kick-off soon. The table fills up after the first session is logged.
            </p>
          )}
        </section>

        <LeagueTable rows={table} started={podium.length > 0} emptyMessage={emptyMessage} />
      </div>
    </div>
  );
}
