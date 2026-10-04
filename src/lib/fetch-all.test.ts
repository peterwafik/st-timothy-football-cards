import { expect, test } from 'vitest';
import { fetchAll } from './fetch-all';

const rows = Array.from({ length: 2345 }, (_, i) => i);

test('fetchAll pages past the 1000-row cap', async () => {
  const result = await fetchAll<number>(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }), 1000);
  expect(result).toEqual(rows);
});

test('fetchAll keeps going when the server caps pages below the requested size', async () => {
  const SERVER_MAX = 500; // project "Max rows" setting lower than our page size
  const result = await fetchAll<number>(
    async (from, to) => ({ data: rows.slice(from, Math.min(to + 1, from + SERVER_MAX)), error: null }),
    1000,
  );
  expect(result).toEqual(rows);
});

test('fetchAll throws on error', async () => {
  await expect(fetchAll(async () => ({ data: null, error: { message: 'boom' } }))).rejects.toThrow('boom');
});
