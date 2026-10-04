export const STAT_KEYS = ['SSK', 'RIB', 'PRA', 'CHA', 'SSA', 'BEH'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type ActivityStat = Exclude<StatKey, 'SSK'>;
const ACTIVITY_STATS: ActivityStat[] = ['RIB', 'PRA', 'CHA', 'SSA', 'BEH'];

export interface Activity { key: string; name: string; points: number; stat: ActivityStat }
export interface KidInput { id: string; joinedOn: string; active: boolean; ssk: number | null }
export interface EntryInput { kidId: string; activityKey: string; date: string }
export interface AdjustmentInput { kidId: string; points: number; date: string }
export interface ClassInput {
  kids: KidInput[];
  activities: Activity[];
  entries: EntryInput[];
  adjustments: AdjustmentInput[];
  tierCount: number;
  /** Entries and adjustments dated before this (YYYY-MM-DD) belong to an earlier season and are ignored. */
  seasonStart?: string;
}
export interface KidResult {
  kidId: string;
  score: number;
  stats: Record<StatKey, number>;
  ovr: number;
  tier: number | null;
}

export const MAX_TIERS = 11;
const BEH_DEDUCTION_PENALTY = 5;

const clampStat = (n: number) => Math.min(99, Math.max(0, Math.round(n)));

export function computeClass(input: ClassInput): Map<string, KidResult> {
  const seasonStart = input.seasonStart ?? '';
  const entriesThisSeason = input.entries.filter((e) => e.date >= seasonStart);
  const adjustmentsThisSeason = input.adjustments.filter((a) => a.date >= seasonStart);
  const activityByKey = new Map(input.activities.map((a) => [a.key, a]));

  // Session = "activityKey|date"; grouped by the stat it feeds.
  const heldByStat = new Map<ActivityStat, Set<string>>();
  const entriesByKid = new Map<string, EntryInput[]>();
  for (const e of entriesThisSeason) {
    const activity = activityByKey.get(e.activityKey);
    if (!activity) continue;
    let held = heldByStat.get(activity.stat);
    if (!held) heldByStat.set(activity.stat, (held = new Set()));
    held.add(`${e.activityKey}|${e.date}`);
    let list = entriesByKid.get(e.kidId);
    if (!list) entriesByKid.set(e.kidId, (list = []));
    list.push(e);
  }

  const results = new Map<string, KidResult>();
  for (const kid of input.kids) {
    const kidEntries = entriesByKid.get(kid.id) ?? [];
    const kidAdjustments = adjustmentsThisSeason.filter((a) => a.kidId === kid.id);

    let score = 0;
    for (const e of kidEntries) score += activityByKey.get(e.activityKey)!.points;
    for (const a of kidAdjustments) score += a.points;

    const stats = { SSK: clampStat(kid.ssk ?? 0) } as Record<StatKey, number>;
    for (const stat of ACTIVITY_STATS) {
      const held = [...(heldByStat.get(stat) ?? [])].filter((s) => s.split('|')[1] >= kid.joinedOn).length;
      const attended = new Set(
        kidEntries
          .filter((e) => activityByKey.get(e.activityKey)!.stat === stat && e.date >= kid.joinedOn)
          .map((e) => `${e.activityKey}|${e.date}`),
      ).size;
      stats[stat] = held === 0 ? 0 : clampStat((99 * attended) / held);
    }
    const deductions = kidAdjustments.filter((a) => a.points < 0 && a.date >= kid.joinedOn).length;
    stats.BEH = Math.max(0, stats.BEH - BEH_DEDUCTION_PENALTY * deductions);

    const ovr = Math.round(STAT_KEYS.reduce((sum, k) => sum + stats[k], 0) / STAT_KEYS.length);
    results.set(kid.id, { kidId: kid.id, score, stats, ovr, tier: null });
  }

  const activeRows = input.kids
    .filter((k) => k.active)
    .map((k) => ({ kidId: k.id, score: results.get(k.id)!.score }));
  for (const [kidId, tier] of assignTiers(activeRows, input.tierCount)) {
    results.get(kidId)!.tier = tier;
  }
  return results;
}

export function assignTiers(rows: { kidId: string; score: number }[], tierCount: number): Map<string, number> {
  const tiers = Math.min(MAX_TIERS, Math.max(1, Math.floor(tierCount)));
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const out = new Map<string, number>();
  let firstIndexOfScore = 0;
  sorted.forEach((row, i) => {
    if (i > 0 && row.score !== sorted[i - 1].score) firstIndexOfScore = i;
    const tier = row.score <= 0 ? tiers : Math.floor((firstIndexOfScore * tiers) / sorted.length) + 1;
    out.set(row.kidId, tier);
  });
  return out;
}
