import type { ActivityBreakdown } from '@/lib/profile';

const MAX_DOTS = 16;

// One dot per week the activity was held: filled when the kid was there. Long seasons fall back to a bar.
function Sessions({ attended, held }: { attended: number; held: number }) {
  if (held === 0) return <span className="font-card text-chalk/60">Not held yet</span>;
  if (held > MAX_DOTS) {
    return (
      <div className="h-2.5 w-40 overflow-hidden rounded-full bg-chalk/15">
        <div className="h-full rounded-full bg-chalk" style={{ width: `${(100 * attended) / held}%` }} />
      </div>
    );
  }
  return (
    <span className="flex flex-wrap gap-1" aria-hidden>
      {Array.from({ length: held }, (_, i) => (
        <span key={i} className={`h-3 w-3 rounded-full ${i < attended ? 'bg-chalk' : 'border border-chalk/40'}`} />
      ))}
    </span>
  );
}

export function AttendanceList({ rows }: { rows: ActivityBreakdown[] }) {
  return (
    <ul className="divide-y divide-chalk/10">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-3 py-3 sm:gap-4">
          <div className="w-28 shrink-0 sm:w-44">
            <p className="font-card text-xl font-bold">{r.name}</p>
          </div>
          <div className="min-w-0 flex-1">
            <Sessions attended={r.attended} held={r.held} />
            {r.held > 0 && (
              <p className="mt-1 font-card text-sm text-chalk/70">
                {r.attended} of {r.held} {r.held === 1 ? 'week' : 'weeks'}
              </p>
            )}
          </div>
          <p className="shrink-0 font-stadium text-2xl font-bold tabular-nums">
            {r.points} <span className="font-card text-base font-medium text-chalk/60">pts</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
