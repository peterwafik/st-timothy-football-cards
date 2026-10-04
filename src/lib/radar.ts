import type { StatKey } from './scoring';

/** Position of a 0-99 value on a radar axis; axis 0 points up and the rest follow clockwise. */
export function radarPoint({ value, index, count, radius, cx, cy }: {
  value: number; index: number; count: number; radius: number; cx: number; cy: number;
}): { x: number; y: number } {
  const r = (Math.min(99, Math.max(0, value)) / 99) * radius;
  const angle = (2 * Math.PI * index) / count;
  return { x: cx + r * Math.sin(angle), y: cy - r * Math.cos(angle) };
}

/** The kid's best and weakest stats (ties included). Unrated Social Skills is left out. */
export function strengthsAndWeaknesses(
  stats: Record<StatKey, number>,
  sskRated: boolean,
): { strongest: StatKey[]; weakest: StatKey[] } {
  const keys = (['CHA', 'SSA', 'PRA', 'RIB', 'BEH', 'SSK'] as StatKey[]).filter((k) => k !== 'SSK' || sskRated);
  const values = keys.map((k) => stats[k]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  if (max === min) return { strongest: [], weakest: [] };
  return { strongest: keys.filter((k) => stats[k] === max), weakest: keys.filter((k) => stats[k] === min) };
}
