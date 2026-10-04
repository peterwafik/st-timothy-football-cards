import { expect, test } from 'vitest';
import { summarizeInsert } from './log-result';

test('all new', () => {
  expect(summarizeInsert(3, 3)).toEqual({ inserted: 3, skipped: 0, message: 'Saved 3 kids.' });
});
test('some already logged by another teacher', () => {
  expect(summarizeInsert(3, 1)).toEqual({ inserted: 1, skipped: 2, message: 'Saved 1 kid. 2 already logged.' });
});
test('everything already logged', () => {
  expect(summarizeInsert(2, 0).message).toBe('Nothing new — 2 already logged.');
});
