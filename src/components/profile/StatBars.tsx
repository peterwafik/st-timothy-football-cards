import type { StatKey } from '@/lib/scoring';
import { statTone, type StatTone } from '@/lib/profile';
import { STAT_LABELS } from '@/lib/stat-labels';

const ORDER: StatKey[] = ['CHA', 'SSA', 'PRA', 'RIB', 'BEH', 'SSK'];
const TONE: Record<StatTone, string> = { great: '#3ddc84', good: '#b5e655', ok: '#f2c94c', low: '#ef6461' };

export function StatBars({ stats, sskRated }: { stats: Record<StatKey, number>; sskRated: boolean }) {
  return (
    <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
      {ORDER.map((key) => {
        const value = stats[key];
        const pending = key === 'SSK' && !sskRated;
        return (
          <li key={key}>
            <div className="flex items-baseline gap-3">
              <span className="w-12 font-stadium text-3xl font-extrabold tabular-nums" style={{ color: pending ? undefined : TONE[statTone(value)] }}>
                {pending ? '–' : value}
              </span>
              <span className="flex-1 font-card text-lg font-bold">{STAT_LABELS[key]}</span>
              <span className="font-card text-sm text-chalk/60">{key}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-chalk/10" role="presentation">
              <div className="h-full rounded-full" style={{ width: `${pending ? 0 : value}%`, background: TONE[statTone(value)] }} />
            </div>
            {pending && <p className="mt-1 font-card text-sm text-chalk/60">Rated by your servants later in the year.</p>}
          </li>
        );
      })}
    </ul>
  );
}
