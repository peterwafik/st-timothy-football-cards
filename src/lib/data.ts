import 'server-only';
import type { CardData } from './card';
import type { LeagueRow } from './standings';
import { fetchAll } from './fetch-all';
import { computeClass, type Activity, type KidResult } from './scoring';
import { createAdminClient } from './supabase/admin';
import { isSupabaseConfigured } from './supabase/config';

export interface KidRow {
  id: string; name: string; public_code: string; photo_url: string | null; flag: string;
  club: string; ssk: number | null; joined_on: string; active: boolean;
}
export interface SettingsRow { season_start: string; tier_count: number; leaderboard_public: boolean }
export interface ClassSnapshot { kids: KidRow[]; activities: Activity[]; results: Map<string, KidResult>; settings: SettingsRow }

const KID_COLUMNS = 'id, name, public_code, photo_url, flag, club, ssk, joined_on, active';

export async function loadClassSnapshot(): Promise<ClassSnapshot> {
  const db = createAdminClient();
  const [kids, activities, entries, adjustments, settingsRes] = await Promise.all([
    fetchAll<KidRow>((f, t) => db.from('kids').select(KID_COLUMNS).order('name').range(f, t)),
    fetchAll<Activity>((f, t) => db.from('activities').select('key, name, points, stat').order('sort').range(f, t)),
    fetchAll<{ kid_id: string; activity_key: string; date: string }>((f, t) =>
      db.from('entries').select('kid_id, activity_key, date').order('id').range(f, t)),
    fetchAll<{ kid_id: string; points: number; date: string }>((f, t) =>
      db.from('adjustments').select('kid_id, points, date').order('id').range(f, t)),
    db.from('settings').select('season_start, tier_count, leaderboard_public').eq('id', 1).single(),
  ]);
  if (settingsRes.error) throw new Error(settingsRes.error.message);
  const settings = settingsRes.data as SettingsRow;

  const results = computeClass({
    kids: kids.map((k) => ({ id: k.id, joinedOn: k.joined_on, active: k.active, ssk: k.ssk })),
    activities,
    entries: entries.map((e) => ({ kidId: e.kid_id, activityKey: e.activity_key, date: e.date })),
    adjustments: adjustments.map((a) => ({ kidId: a.kid_id, points: a.points, date: a.date })),
    tierCount: settings.tier_count,
    seasonStart: settings.season_start,
  });
  return { kids, activities, results, settings };
}

export function toCardData(kid: KidRow, result: KidResult, tierCount = 11): CardData {
  return {
    name: kid.name, photoUrl: kid.photo_url, flag: kid.flag, club: kid.club,
    tier: result.tier ?? tierCount, stats: result.stats, active: kid.active,
  };
}

export async function getCardByCode(code: string): Promise<CardData | null> {
  if (!/^[a-z0-9]{8}$/.test(code) || !isSupabaseConfigured()) return null;
  const snap = await loadClassSnapshot();
  const kid = snap.kids.find((k) => k.public_code === code);
  if (!kid) return null;
  return toCardData(kid, snap.results.get(kid.id)!, snap.settings.tier_count);
}

export function leagueRows(snap: ClassSnapshot): LeagueRow[] {
  return snap.kids
    .filter((k) => k.active)
    .map((k) => {
      const result = snap.results.get(k.id)!;
      return { id: k.id, name: k.name, score: result.score, card: toCardData(k, result, snap.settings.tier_count) };
    });
}
