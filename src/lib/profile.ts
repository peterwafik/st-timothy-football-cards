import type { Activity, ActivityStat, EntryInput } from './scoring';

export interface ActivityBreakdown {
  key: string;
  name: string;
  stat: ActivityStat;
  attended: number;
  held: number;
  points: number;
}

/** Per activity: sessions held since the kid joined (this season), how many they attended, points earned. */
export function activityBreakdown(
  input: { activities: Activity[]; entries: EntryInput[]; joinedOn: string; seasonStart: string },
  kidId: string,
): ActivityBreakdown[] {
  const from = input.joinedOn > input.seasonStart ? input.joinedOn : input.seasonStart;
  return input.activities.map((a) => {
    const counted = input.entries.filter((e) => e.activityKey === a.key && e.date >= from);
    const held = new Set(counted.map((e) => e.date)).size;
    const attended = new Set(counted.filter((e) => e.kidId === kidId).map((e) => e.date)).size;
    return { key: a.key, name: a.name, stat: a.stat, attended, held, points: attended * a.points };
  });
}

export interface TimelineItem {
  date: string;
  label: string;
  points: number;
  kind: 'session' | 'bonus' | 'deduction';
}

/** The kid's latest sessions and bonuses this season, newest first. Deduction reasons stay private. */
export function recentTimeline(
  input: {
    activities: Activity[];
    entries: EntryInput[];
    adjustments: { kidId: string; points: number; date: string; reason: string }[];
    seasonStart: string;
  },
  kidId: string,
  limit: number,
): TimelineItem[] {
  const byKey = new Map(input.activities.map((a) => [a.key, a]));
  const sessions: TimelineItem[] = input.entries
    .filter((e) => e.kidId === kidId && e.date >= input.seasonStart && byKey.has(e.activityKey))
    .map((e) => ({ date: e.date, label: byKey.get(e.activityKey)!.name, points: byKey.get(e.activityKey)!.points, kind: 'session' }));
  const adjustments: TimelineItem[] = input.adjustments
    .filter((a) => a.kidId === kidId && a.date >= input.seasonStart)
    .map((a) =>
      a.points > 0
        ? { date: a.date, label: `Bonus: ${a.reason}`, points: a.points, kind: 'bonus' }
        : { date: a.date, label: 'Points deducted', points: a.points, kind: 'deduction' },
    );
  return [...sessions, ...adjustments].sort((x, y) => y.date.localeCompare(x.date)).slice(0, limit);
}

export type StatTone = 'great' | 'good' | 'ok' | 'low';

export function statTone(value: number): StatTone {
  if (value >= 80) return 'great';
  if (value >= 60) return 'good';
  if (value >= 40) return 'ok';
  return 'low';
}
