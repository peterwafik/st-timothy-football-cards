import 'server-only';
import { cache } from 'react';
import type { CardData } from './card';
import { withPositions, type LeagueRow } from './standings';
import { fetchAll } from './fetch-all';
import { activityBreakdown, recentTimeline, type ActivityBreakdown, type TimelineItem } from './profile';
import { computeClass, type Activity, type EntryInput, type KidResult } from './scoring';
import { createAdminClient } from './supabase/admin';
import { isSupabaseConfigured } from './supabase/config';

export interface KidRow {
  id: string; name: string; public_code: string; photo_url: string | null; flag: string;
  club: string; ssk: number | null; joined_on: string; active: boolean; position: string | null;
}
export interface SettingsRow { season_start: string; tier_count: number; leaderboard_public: boolean }
export interface AdjustmentRow { kidId: string; points: number; date: string; reason: string }
export interface ClassSnapshot {
  kids: KidRow[];
  activities: Activity[];
  entries: EntryInput[];
  adjustments: AdjustmentRow[];
  results: Map<string, KidResult>;
  settings: SettingsRow;
}

const KID_COLUMNS = 'id, name, public_code, photo_url, flag, club, ssk, joined_on, active, position';

// Cached per request: a page and its metadata share one load instead of reading the class twice.
export const loadClassSnapshot = cache(async (): Promise<ClassSnapshot> => {
  const db = createAdminClient();
  const [kids, activities, entries, adjustments, settingsRes] = await Promise.all([
    fetchAll<KidRow>((f, t) => db.from('kids').select(KID_COLUMNS).order('name').range(f, t)),
    fetchAll<Activity>((f, t) => db.from('activities').select('key, name, points, stat').order('sort').range(f, t)),
    fetchAll<{ kid_id: string; activity_key: string; date: string }>((f, t) =>
      db.from('entries').select('kid_id, activity_key, date').order('id').range(f, t)),
    fetchAll<{ kid_id: string; points: number; date: string; reason: string }>((f, t) =>
      db.from('adjustments').select('kid_id, points, date, reason').order('id').range(f, t)),
    db.from('settings').select('season_start, tier_count, leaderboard_public').eq('id', 1).single(),
  ]);
  if (settingsRes.error) throw new Error(settingsRes.error.message);
  const settings = settingsRes.data as SettingsRow;

  const entryRows = entries.map((e) => ({ kidId: e.kid_id, activityKey: e.activity_key, date: e.date }));
  const adjustmentRows = adjustments.map((a) => ({ kidId: a.kid_id, points: a.points, date: a.date, reason: a.reason }));
  const results = computeClass({
    kids: kids.map((k) => ({ id: k.id, joinedOn: k.joined_on, active: k.active, ssk: k.ssk })),
    activities,
    entries: entryRows,
    adjustments: adjustmentRows,
    tierCount: settings.tier_count,
    seasonStart: settings.season_start,
  });
  return { kids, activities, entries: entryRows, adjustments: adjustmentRows, results, settings };
});

export function toCardData(kid: KidRow, result: KidResult, tierCount = 11): CardData {
  return {
    name: kid.name, photoUrl: kid.photo_url, flag: kid.flag, club: kid.club,
    tier: result.tier ?? tierCount, stats: result.stats, active: kid.active, position: kid.position,
  };
}

export function leagueRows(snap: ClassSnapshot): LeagueRow[] {
  return snap.kids
    .filter((k) => k.active)
    .map((k) => {
      const result = snap.results.get(k.id)!;
      return { id: k.id, name: k.name, score: result.score, card: toCardData(k, result, snap.settings.tier_count) };
    });
}

export interface PlayerProfile {
  card: CardData;
  name: string;
  joinedOn: string;
  sskRated: boolean;
  score: number;
  /** League position among active kids (ties share), null for retired kids or before anyone has scored. */
  leaguePosition: number | null;
  squadSize: number;
  seasonStart: string;
  breakdown: ActivityBreakdown[];
  recent: TimelineItem[];
}

export async function getPlayerProfile(code: string): Promise<PlayerProfile | null> {
  if (!/^[a-z0-9]{8}$/.test(code) || !isSupabaseConfigured()) return null;
  const snap = await loadClassSnapshot();
  const kid = snap.kids.find((k) => k.public_code === code);
  if (!kid) return null;
  const result = snap.results.get(kid.id)!;
  const table = withPositions(leagueRows(snap));
  const row = table.find((r) => r.id === kid.id);
  const started = table.some((r) => r.score > 0);
  const seasonStart = snap.settings.season_start;
  return {
    card: toCardData(kid, result, snap.settings.tier_count),
    name: kid.name,
    joinedOn: kid.joined_on,
    sskRated: kid.ssk !== null,
    score: result.score,
    leaguePosition: row && started ? row.position : null,
    squadSize: table.length,
    seasonStart,
    breakdown: activityBreakdown({ activities: snap.activities, entries: snap.entries, joinedOn: kid.joined_on, seasonStart }, kid.id),
    recent: recentTimeline({ activities: snap.activities, entries: snap.entries, adjustments: snap.adjustments, seasonStart }, kid.id, 8),
  };
}
