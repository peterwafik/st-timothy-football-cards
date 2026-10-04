import { expect, test } from 'vitest';
import { isFutureDate, isValidISODate, toLocalISODate } from './dates';

test('local date late in the evening stays on the same day', () => {
  expect(toLocalISODate(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-04');
  expect(toLocalISODate(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05');
});
test('validates ISO dates', () => {
  expect(isValidISODate('2026-10-04')).toBe(true);
  expect(isValidISODate('2026-02-30')).toBe(false);
  expect(isValidISODate('04/10/2026')).toBe(false);
});
test('future dates', () => {
  expect(isFutureDate('2026-10-05', '2026-10-04')).toBe(true);
  expect(isFutureDate('2026-10-04', '2026-10-04')).toBe(false);
});
