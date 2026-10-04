import { expect, test } from 'vitest';
import { formatDay, formatLongDate, isFutureDate, isValidISODate, toLocalISODate, todayInCairo, weekRangeLabel, weekStart } from './dates';

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

test('friendly date labels for the player page', () => {
  expect(formatDay('2026-10-04')).toBe('Sun 4 Oct');
  expect(formatLongDate('2026-10-01')).toBe('1 October 2026');
});

test('weeks run Friday to Thursday', () => {
  expect(weekStart('2026-10-02')).toBe('2026-10-02'); // Friday: first week of the system
  expect(weekStart('2026-10-03')).toBe('2026-10-02'); // Saturday
  expect(weekStart('2026-10-04')).toBe('2026-10-02'); // Sunday
  expect(weekStart('2026-10-08')).toBe('2026-10-02'); // Thursday
  expect(weekStart('2026-10-09')).toBe('2026-10-09'); // next Friday
  expect(weekStart('2026-10-01')).toBe('2026-09-25'); // Thursday before belongs to the previous week
  expect(weekStart('2027-01-01')).toBe('2027-01-01'); // across a year boundary (a Friday)
});

test('week range label for the Log page', () => {
  expect(weekRangeLabel('2026-10-04')).toBe('Fri 2 Oct – Thu 8 Oct');
  expect(weekRangeLabel('2026-12-30')).toBe('Fri 25 Dec – Thu 31 Dec');
});
