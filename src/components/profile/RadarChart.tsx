import { radarPoint, strengthsAndWeaknesses } from '@/lib/radar';
import type { StatKey } from '@/lib/scoring';
import { STAT_LABELS } from '@/lib/stat-labels';

const AXES: StatKey[] = ['CHA', 'SSA', 'PRA', 'RIB', 'BEH', 'SSK'];
const RINGS = [25, 50, 75, 99];

// Wide screens label each axis with the full stat name; phones use the short code (as on the card)
// in larger type so it stays readable when the chart is scaled down.
const LAYOUTS = {
  full: { w: 560, h: 420, r: 120, gap: 34, line: 17, name: 15, value: 14 },
  compact: { w: 340, h: 330, r: 105, gap: 22, line: 20, name: 18, value: 17 },
} as const;
type Layout = (typeof LAYOUTS)[keyof typeof LAYOUTS];

// Long stat names (e.g. "Sunday School Attendance") wrap onto two lines so they never run off the chart.
function wrap(name: string): string[] {
  if (name.length <= 14) return [name];
  const words = name.split(' ');
  const diff = (split: number) => Math.abs(words.slice(0, split).join(' ').length - words.slice(split).join(' ').length);
  let best = 1;
  for (let i = 2; i < words.length; i++) if (diff(i) < diff(best)) best = i;
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

function listNames(keys: StatKey[]): string {
  const names = keys.map((k) => STAT_LABELS[k]);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

function Chart({ values, sskRated, layout, compact, className }: {
  values: number[]; sskRated: boolean; layout: Layout; compact: boolean; className: string;
}) {
  const cx = layout.w / 2;
  const cy = layout.h / 2;
  const at = (value: number, index: number, radius: number = layout.r) =>
    radarPoint({ value, index, count: AXES.length, radius, cx, cy });
  const polygon = (vals: number[]) => vals.map((v, i) => at(v, i)).map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${layout.w} ${layout.h}`} className={className} role="img" aria-label="Radar chart of the six stats">
      {/* Recessive grid: rings at 25 / 50 / 75 / 99 and one spoke per stat. */}
      <g fill="none" stroke="var(--color-chalk)" strokeOpacity="0.15" strokeWidth="1">
        {RINGS.map((ring) => (
          <polygon key={ring} points={polygon(AXES.map(() => ring))} />
        ))}
        {AXES.map((_, i) => {
          const end = at(99, i);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} />;
        })}
      </g>

      <polygon
        points={polygon(values)}
        fill="var(--color-floodlight)"
        fillOpacity="0.3"
        stroke="var(--color-floodlight)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {AXES.map((key, i) => {
        const pending = key === 'SSK' && !sskRated;
        const dot = at(values[i], i);
        const label = at(99, i, layout.r + layout.gap);
        const anchor = Math.abs(label.x - cx) < 4 ? 'middle' : label.x > cx ? 'start' : 'end';
        const lines = compact ? [key] : wrap(STAT_LABELS[key]);
        // Top label sits above its anchor, bottom label below, side labels centred on it.
        const block = (lines.length + 1) * layout.line;
        const top = label.y < cy - layout.r ? label.y - block + layout.line : label.y > cy + layout.r ? label.y + 4 : label.y - block / 2 + layout.line * 0.8;
        return (
          <g key={key}>
            {!pending && (
              <circle cx={dot.x} cy={dot.y} r="5" fill="var(--color-floodlight)" stroke="var(--color-dugout)" strokeWidth="2" tabIndex={0}>
                <title>{`${STAT_LABELS[key]}: ${values[i]}`}</title>
              </circle>
            )}
            <text textAnchor={anchor} className="font-card" fontSize={layout.name}>
              {lines.map((line, n) => (
                <tspan key={n} x={label.x} y={top + n * layout.line} className="fill-chalk" fontWeight="700">{line}</tspan>
              ))}
              <tspan x={label.x} y={top + lines.length * layout.line} className="fill-chalk/70" fontSize={layout.value}>
                {pending ? (compact ? '–' : 'Not rated yet') : values[i]}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RadarChart({ stats, sskRated }: { stats: Record<StatKey, number>; sskRated: boolean }) {
  const values = AXES.map((k) => (k === 'SSK' && !sskRated ? 0 : stats[k]));
  const { strongest, weakest } = strengthsAndWeaknesses(stats, sskRated);

  return (
    <div className="flex flex-col items-center gap-4">
      <Chart values={values} sskRated={sskRated} layout={LAYOUTS.compact} compact className="w-full max-w-sm sm:hidden" />
      <Chart values={values} sskRated={sskRated} layout={LAYOUTS.full} compact={false} className="hidden w-full max-w-xl sm:block" />

      {strongest.length > 0 ? (
        <div className="grid w-full gap-3 font-card text-lg sm:grid-cols-2">
          <p className="rounded-xl bg-dugout/70 px-4 py-3 ring-1 ring-chalk/10">
            <span className="block text-sm text-chalk/60">Strongest</span>
            <span className="font-bold">{listNames(strongest)}</span> ({stats[strongest[0]]})
          </p>
          <p className="rounded-xl bg-dugout/70 px-4 py-3 ring-1 ring-chalk/10">
            <span className="block text-sm text-chalk/60">Needs the most work</span>
            <span className="font-bold">{listNames(weakest)}</span> ({stats[weakest[0]]})
          </p>
        </div>
      ) : (
        <p className="font-card text-lg text-chalk/70">Strengths will show here once the first weeks are logged.</p>
      )}
    </div>
  );
}
