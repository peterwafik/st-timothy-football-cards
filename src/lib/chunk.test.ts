import { expect, test } from 'vitest';
import { chunk } from './chunk';

test('splits into pages of 12 for the QR sheet', () => {
  const pages = chunk(Array.from({ length: 31 }, (_, i) => i), 12);
  expect(pages.map((p) => p.length)).toEqual([12, 12, 7]);
  expect(chunk([], 12)).toEqual([]);
});
