import { expect, test } from 'vitest';
import { fetchAll } from './fetch-all';

test('fetchAll pages past the 1000-row cap', async () => {
  const rows = Array.from({ length: 2345 }, (_, i) => i);
  const calls: [number, number][] = [];
  const result = await fetchAll<number>(async (from, to) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  }, 1000);
  expect(result).toHaveLength(2345);
  expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
});

test('fetchAll throws on error', async () => {
  await expect(fetchAll(async () => ({ data: null, error: { message: 'boom' } }))).rejects.toThrow('boom');
});
