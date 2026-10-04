import { PlayerCard } from '../PlayerCard';
import type { LeagueRow } from '@/lib/standings';

type Placed = LeagueRow & { position: number };

const STEP_HEIGHT: Record<number, string> = { 0: 'h-28 sm:h-36', 1: 'h-24 sm:h-28', 2: 'h-20 sm:h-24' };
const RISE_DELAY = ['450ms', '200ms', '50ms']; // 1st arrives last
// Read in rank order (1, 2, 3) but shown as a podium: 2nd left, 1st centre, 3rd right.
const VISUAL_ORDER = ['order-2', 'order-1', 'order-3'];

function Spot({ row, place }: { row: Placed; place: number }) {
  const first = place === 0;
  return (
    <li className={`flex w-1/3 max-w-[220px] flex-col items-center ${VISUAL_ORDER[place]}`}>
      <div className="motion-safe:animate-rise" style={{ animationDelay: RISE_DELAY[place] }}>
        <div className="sm:hidden">
          <PlayerCard data={row.card} width={first ? 118 : 100} hideStats />
        </div>
        <div className="hidden sm:block">
          <PlayerCard data={row.card} width={first ? 210 : 170} />
        </div>
      </div>
      <div
        className={`mt-2 flex w-full flex-col items-center justify-start rounded-t-lg pt-2 ${STEP_HEIGHT[place]} ${
          first ? 'bg-trophy text-dugout' : 'bg-chalk/90 text-dugout'
        }`}
      >
        <span className="font-stadium text-3xl font-extrabold leading-none sm:text-5xl">{row.position}</span>
        <span className="font-card text-base font-bold tabular-nums sm:text-lg">{row.score} pts</span>
      </div>
    </li>
  );
}

export function Podium({ rows }: { rows: Placed[] }) {
  return (
    <div className="relative mt-10">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[120%] w-[90%] max-w-xl -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--color-floodlight), transparent)' }}
      />
      <ol className="relative flex items-end justify-center gap-2 sm:gap-6" aria-label="Top three">
        {rows.slice(0, 3).map((row, i) => (
          <Spot key={row.id} row={row} place={i} />
        ))}
      </ol>
    </div>
  );
}
