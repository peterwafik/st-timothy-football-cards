import { LeagueTable } from './LeagueTable';
import { PitchMarkings } from './PitchMarkings';
import { Podium } from './Podium';
import { SiteHeader } from './SiteHeader';
import { StadiumBackground } from './StadiumBackground';
import { withPositions, type LeagueRow } from '@/lib/standings';

export function Leaderboard({
  rows,
  season,
  showLogin = false,
  emptyMessage = 'No players yet. Servants can add kids from the Kids page.',
}: {
  rows: LeagueRow[];
  season: string;
  showLogin?: boolean;
  emptyMessage?: string;
}) {
  const table = withPositions(rows);
  const podium = table.filter((r) => r.score > 0).slice(0, 3);

  return (
    <StadiumBackground>
      <SiteHeader link={showLogin ? { href: '/login', label: 'Leaders login' } : undefined} />

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
    </StadiumBackground>
  );
}
