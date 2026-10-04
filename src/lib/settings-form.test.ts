import { expect, test } from 'vitest';
import { parseSettingsForm } from './settings-form';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}
const KEYS = ['odas', 'fasl'];
const ok = { tier_count: '11', season_start: '2026-10-01', leaderboard_public: 'on', points_odas: '150', points_fasl: '100' };

test('parses valid settings', () => {
  expect(parseSettingsForm(fd(ok), KEYS)).toEqual({
    ok: true,
    value: { tierCount: 11, seasonStart: '2026-10-01', leaderboardPublic: true, points: { odas: 150, fasl: 100 } },
  });
});

test('one bad point value rejects the whole form, so nothing is half-saved', () => {
  expect(parseSettingsForm(fd({ ...ok, points_fasl: '-5' }), KEYS)).toEqual({ ok: false, error: 'Points must be whole numbers 0–10000.' });
  expect(parseSettingsForm(fd({ ...ok, points_odas: '' }), KEYS)).toEqual({ ok: false, error: 'Points must be whole numbers 0–10000.' });
});

test('rejects bad tiers and dates; unchecked leaderboard is private', () => {
  expect(parseSettingsForm(fd({ ...ok, tier_count: '12' }), KEYS)).toEqual({ ok: false, error: 'Tiers must be 1–11.' });
  expect(parseSettingsForm(fd({ ...ok, season_start: 'soon' }), KEYS)).toEqual({ ok: false, error: 'Pick a valid season start.' });
  const rest: Record<string, string> = { ...ok };
  delete rest.leaderboard_public;
  const r = parseSettingsForm(fd(rest), KEYS);
  expect(r.ok && r.value.leaderboardPublic).toBe(false);
});
