import { isValidISODate } from './dates';

export interface SettingsFields {
  tierCount: number;
  seasonStart: string;
  leaderboardPublic: boolean;
  points: Record<string, number>;
}

// Validates the whole Settings form before anything is saved, so a bad value never leaves it half-applied.
export function parseSettingsForm(fd: FormData, activityKeys: string[]): { ok: true; value: SettingsFields } | { ok: false; error: string } {
  const tierCount = Number(fd.get('tier_count'));
  if (!Number.isInteger(tierCount) || tierCount < 1 || tierCount > 11) return { ok: false, error: 'Tiers must be 1–11.' };
  const seasonStart = String(fd.get('season_start') ?? '');
  if (!isValidISODate(seasonStart)) return { ok: false, error: 'Pick a valid season start.' };

  const points: Record<string, number> = {};
  for (const key of activityKeys) {
    const raw = String(fd.get(`points_${key}`) ?? '').trim();
    const value = Number(raw);
    if (raw === '' || !Number.isInteger(value) || value < 0 || value > 10000) {
      return { ok: false, error: 'Points must be whole numbers 0–10000.' };
    }
    points[key] = value;
  }
  return { ok: true, value: { tierCount, seasonStart, leaderboardPublic: fd.get('leaderboard_public') === 'on', points } };
}
