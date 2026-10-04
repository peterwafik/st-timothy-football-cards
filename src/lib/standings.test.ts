import { expect, test } from 'vitest';
import { seasonLabel, withPositions } from './standings';

test('sorts by score then name, ties share a position (1, 2, 2, 4)', () => {
  const rows = withPositions([
    { name: 'Mina', score: 300 },
    { name: 'Andrew', score: 500 },
    { name: 'Carlos', score: 300 },
    { name: 'David', score: 100 },
  ]);
  expect(rows.map((r) => [r.name, r.position])).toEqual([
    ['Andrew', 1],
    ['Carlos', 2],
    ['Mina', 2],
    ['David', 4],
  ]);
});

test('empty list stays empty', () => {
  expect(withPositions([])).toEqual([]);
});

test('season label spans two years', () => {
  expect(seasonLabel('2026-10-01')).toBe('Season 2026–27');
  expect(seasonLabel('2099-09-15')).toBe('Season 2099–00');
});
