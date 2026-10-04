import { describe, expect, test } from 'vitest';
import { assignTiers, computeClass, type Activity, type ClassInput } from './scoring';

const ACTIVITIES: Activity[] = [
  { key: 'odas', name: 'Odas', points: 150, stat: 'CHA' },
  { key: 'fasl', name: 'Fasl', points: 100, stat: 'SSA' },
  { key: 'nota', name: 'Nota Ro7eya', points: 100, stat: 'PRA' },
  { key: 'tasbeha', name: 'Tasbe7a', points: 50, stat: 'PRA' },
  { key: 'dars', name: 'Dars Ketab', points: 50, stat: 'RIB' },
  { key: 'discipline', name: 'Discipline', points: 200, stat: 'BEH' },
];

function input(partial: Partial<ClassInput>): ClassInput {
  return {
    kids: [{ id: 'a', joinedOn: '2026-10-01', active: true, ssk: null }],
    activities: ACTIVITIES,
    entries: [],
    adjustments: [],
    tierCount: 11,
    ...partial,
  };
}

describe('computeClass stats', () => {
  test('new kid with nothing held has all-zero stats and no NaN', () => {
    const r = computeClass(input({})).get('a')!;
    expect(r.score).toBe(0);
    expect(r.stats).toEqual({ SSK: 0, RIB: 0, PRA: 0, CHA: 0, SSA: 0, BEH: 0 });
    expect(r.ovr).toBe(0);
  });

  test('attendance rate maps to 0-99', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-01', active: true, ssk: null },
      { id: 'b', joinedOn: '2026-10-01', active: true, ssk: null },
    ];
    const dates = ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23'];
    const entries = [
      ...dates.map((date) => ({ kidId: 'b', activityKey: 'fasl', date })),
      ...dates.slice(0, 3).map((date) => ({ kidId: 'a', activityKey: 'fasl', date })),
    ];
    const res = computeClass(input({ kids, entries }));
    expect(res.get('a')!.stats.SSA).toBe(74); // round(99*3/4)
    expect(res.get('b')!.stats.SSA).toBe(99);
    expect(res.get('a')!.score).toBe(300);
  });

  test('sessions before joinedOn do not count against a late joiner', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-10', active: true, ssk: null },
      { id: 'b', joinedOn: '2026-10-01', active: true, ssk: null },
    ];
    const dates = ['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23'];
    const entries = [
      ...dates.map((date) => ({ kidId: 'b', activityKey: 'odas', date })),
      { kidId: 'a', activityKey: 'odas', date: '2026-10-16' },
      { kidId: 'a', activityKey: 'odas', date: '2026-10-23' },
    ];
    expect(computeClass(input({ kids, entries })).get('a')!.stats.CHA).toBe(99);
  });

  test('PRA combines nota and tasbeha', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-01', active: true, ssk: null },
      { id: 'b', joinedOn: '2026-10-01', active: true, ssk: null },
    ];
    const entries = [
      { kidId: 'b', activityKey: 'nota', date: '2026-10-02' },
      { kidId: 'b', activityKey: 'nota', date: '2026-10-09' },
      { kidId: 'b', activityKey: 'tasbeha', date: '2026-10-03' },
      { kidId: 'b', activityKey: 'tasbeha', date: '2026-10-10' },
      { kidId: 'a', activityKey: 'nota', date: '2026-10-02' },
      { kidId: 'a', activityKey: 'tasbeha', date: '2026-10-03' },
      { kidId: 'a', activityKey: 'tasbeha', date: '2026-10-10' },
    ];
    expect(computeClass(input({ kids, entries })).get('a')!.stats.PRA).toBe(74);
  });

  test('BEH loses 5 per deduction and floors at 0', () => {
    const entries = [
      { kidId: 'a', activityKey: 'discipline', date: '2026-10-02' },
      { kidId: 'a', activityKey: 'discipline', date: '2026-10-09' },
    ];
    const adjustments = [
      { kidId: 'a', points: -50, date: '2026-10-05' },
      { kidId: 'a', points: -20, date: '2026-10-06' },
      { kidId: 'a', points: 30, date: '2026-10-07' },
    ];
    const r = computeClass(input({ entries, adjustments })).get('a')!;
    expect(r.stats.BEH).toBe(89);
    expect(r.score).toBe(400 - 50 - 20 + 30);

    const floor = computeClass(input({ adjustments: [{ kidId: 'a', points: -10, date: '2026-10-05' }] })).get('a')!;
    expect(floor.stats.BEH).toBe(0);
  });

  test('SSK is manual and ovr averages all six stats', () => {
    const kids = [{ id: 'a', joinedOn: '2026-10-01', active: true, ssk: 84 }];
    const entries = [{ kidId: 'a', activityKey: 'fasl', date: '2026-10-02' }];
    const r = computeClass(input({ kids, entries })).get('a')!;
    expect(r.stats.SSK).toBe(84);
    expect(r.stats.SSA).toBe(99);
    expect(r.ovr).toBe(Math.round((84 + 99) / 6));
  });

  test('score uses current point values', () => {
    const entries = [{ kidId: 'a', activityKey: 'fasl', date: '2026-10-02' }];
    const changed = ACTIVITIES.map((a) => (a.key === 'fasl' ? { ...a, points: 200 } : a));
    expect(computeClass(input({ entries, activities: changed })).get('a')!.score).toBe(200);
  });

  test('entries for unknown activities are ignored', () => {
    const entries = [{ kidId: 'a', activityKey: 'gone', date: '2026-10-02' }];
    expect(computeClass(input({ entries })).get('a')!.score).toBe(0);
  });
});

describe('tiers', () => {
  test('22 distinct scores over 11 tiers gives 2 per tier', () => {
    const rows = Array.from({ length: 22 }, (_, i) => ({ kidId: `k${i}`, score: 1000 - i }));
    const t = assignTiers(rows, 11);
    expect(t.get('k0')).toBe(1);
    expect(t.get('k1')).toBe(1);
    expect(t.get('k2')).toBe(2);
    expect(t.get('k21')).toBe(11);
  });

  test('equal scores share the tier of the first kid with that score', () => {
    const rows = [
      { kidId: 'a', score: 500 }, { kidId: 'b', score: 400 }, { kidId: 'c', score: 400 },
      { kidId: 'd', score: 400 }, { kidId: 'e', score: 100 },
    ];
    const t = assignTiers(rows, 5);
    expect(t.get('b')).toBe(2);
    expect(t.get('c')).toBe(2);
    expect(t.get('d')).toBe(2);
    expect(t.get('e')).toBe(5);
  });

  test('kids with score <= 0 go to the lowest tier (season start => all bronze)', () => {
    const rows = Array.from({ length: 31 }, (_, i) => ({ kidId: `k${i}`, score: 0 }));
    const t = assignTiers(rows, 11);
    expect(new Set(t.values())).toEqual(new Set([11]));
  });

  test('tierCount is clamped to 1..11', () => {
    const rows = [{ kidId: 'a', score: 10 }, { kidId: 'b', score: 5 }];
    expect(assignTiers(rows, 40).get('b')).toBe(6);
    expect(assignTiers(rows, 0).get('b')).toBe(1);
  });

  test('tierCount 8 uses tiers 1..8', () => {
    const rows = Array.from({ length: 16 }, (_, i) => ({ kidId: `k${i}`, score: 100 - i }));
    const t = assignTiers(rows, 8);
    expect(Math.max(...t.values())).toBe(8);
  });

  test('inactive kids get tier null and do not take tier slots', () => {
    const kids = [
      { id: 'a', joinedOn: '2026-10-01', active: true, ssk: null },
      { id: 'x', joinedOn: '2026-10-01', active: false, ssk: null },
    ];
    const entries = [
      { kidId: 'a', activityKey: 'fasl', date: '2026-10-02' },
      { kidId: 'x', activityKey: 'odas', date: '2026-10-02' },
    ];
    const res = computeClass(input({ kids, entries, tierCount: 2 }));
    expect(res.get('x')!.tier).toBeNull();
    expect(res.get('a')!.tier).toBe(1);
  });
});
