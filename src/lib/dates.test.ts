import { expect, test } from 'vitest';
import { isFutureDate, isValidISODate, toLocalISODate, todayInCairo } from './dates';

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

test('today is taken in Cairo time, not the server clock (Vercel runs in UTC)', () => {
  // 23:30 UTC on Oct 4 is already 01:30/02:30 on Oct 5 in Cairo.
  expect(todayInCairo(new Date(Date.UTC(2026, 9, 4, 23, 30)))).toBe('2026-10-05');
  expect(todayInCairo(new Date(Date.UTC(2026, 9, 4, 12, 0)))).toBe('2026-10-04');
});
