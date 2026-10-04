import { describe, expect, test } from 'vitest';
import { activityBreakdown, recentTimeline, statTone } from './profile';
import type { Activity } from './scoring';

const ACTIVITIES: Activity[] = [
  { key: 'odas', name: 'Odas', points: 150, stat: 'CHA' },
  { key: 'fasl', name: 'Fasl', points: 100, stat: 'SSA' },
];

describe('activityBreakdown', () => {
  test('counts sessions held since the kid joined (and this season) and the ones they attended', () => {
    const entries = [
      { kidId: 'b', activityKey: 'fasl', date: '2026-05-01' }, // last season
      { kidId: 'b', activityKey: 'fasl', date: '2026-10-02' },
      { kidId: 'b', activityKey: 'fasl', date: '2026-10-09' },
      { kidId: 'a', activityKey: 'fasl', date: '2026-10-09' },
      { kidId: 'b', activityKey: 'odas', date: '2026-10-04' },
    ];
    const rows = activityBreakdown({ activities: ACTIVITIES, entries, joinedOn: '2026-10-01', seasonStart: '2026-10-01' }, 'a');
    expect(rows).toEqual([
      { key: 'odas', name: 'Odas', stat: 'CHA', attended: 0, held: 1, points: 0 },
      { key: 'fasl', name: 'Fasl', stat: 'SSA', attended: 1, held: 2, points: 100 },
    ]);
  });

  test('a late joiner is not counted against sessions before they joined', () => {
    const entries = [
      { kidId: 'b', activityKey: 'fasl', date: '2026-10-02' },
      { kidId: 'a', activityKey: 'fasl', date: '2026-10-09' },
    ];
    const fasl = activityBreakdown({ activities: ACTIVITIES, entries, joinedOn: '2026-10-05', seasonStart: '2026-10-01' }, 'a')[1];
    expect(fasl).toMatchObject({ attended: 1, held: 1 });
  });
});

describe('recentTimeline', () => {
  test('newest first, with points; deductions hide the reason', () => {
    const items = recentTimeline(
      {
        activities: ACTIVITIES,
        entries: [
          { kidId: 'a', activityKey: 'fasl', date: '2026-10-02' },
          { kidId: 'a', activityKey: 'odas', date: '2026-10-04' },
          { kidId: 'b', activityKey: 'odas', date: '2026-10-04' },
        ],
        adjustments: [
          { kidId: 'a', points: 50, date: '2026-10-03', reason: 'Helped clean the class' },
          { kidId: 'a', points: -20, date: '2026-10-05', reason: 'Talking during prayer' },
        ],
        seasonStart: '2026-10-01',
      },
      'a',
      10,
    );
    expect(items).toEqual([
      { date: '2026-10-05', label: 'Points deducted', points: -20, kind: 'deduction' },
      { date: '2026-10-04', label: 'Odas', points: 150, kind: 'session' },
      { date: '2026-10-03', label: 'Bonus: Helped clean the class', points: 50, kind: 'bonus' },
      { date: '2026-10-02', label: 'Fasl', points: 100, kind: 'session' },
    ]);
  });

  test('respects the limit and skips last season', () => {
    const entries = ['2026-09-20', '2026-10-02', '2026-10-09', '2026-10-16'].map((date) => ({ kidId: 'a', activityKey: 'fasl', date }));
    const items = recentTimeline({ activities: ACTIVITIES, entries, adjustments: [], seasonStart: '2026-10-01' }, 'a', 2);
    expect(items.map((i) => i.date)).toEqual(['2026-10-16', '2026-10-09']);
  });
});

test('statTone grades a 0-99 stat like a football card', () => {
  expect([95, 80, 79, 60, 59, 40, 39, 0].map(statTone)).toEqual(['great', 'great', 'good', 'good', 'ok', 'ok', 'low', 'low']);
});
