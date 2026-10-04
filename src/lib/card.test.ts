import { describe, expect, test } from 'vitest';
import { isLightTier, nameFontScale, rankLabel, templateForTier } from './card';

describe('card helpers', () => {
  test('tier to template file', () => {
    expect(templateForTier(1)).toBe('0.9');
    expect(templateForTier(2)).toBe('1');
    expect(templateForTier(11)).toBe('10');
  });
  test('light tiers are gold, silver, bronze', () => {
    expect([8, 9, 10, 11].map(isLightTier)).toEqual([false, true, true, true]);
  });
  test('rank labels', () => {
    expect(rankLabel(1)).toEqual({ num: '1', suffix: 'ST' });
    expect(rankLabel(2)).toEqual({ num: '2', suffix: 'ND' });
    expect(rankLabel(3)).toEqual({ num: '3', suffix: 'RD' });
    expect(rankLabel(4)).toEqual({ num: '4', suffix: 'TH' });
    expect(rankLabel(11)).toEqual({ num: '11', suffix: 'TH' });
  });
  test('long names shrink so they fit on one line', () => {
    expect(nameFontScale('Daniel Mina')).toBe(0.085);
    const long = nameFontScale('Filopateer Ayman');
    expect(long).toBeLessThan(0.085);
    // Barlow Condensed bold caps ≈ 0.5em per char; must fit in 90% of width.
    expect('Filopateer Ayman'.length * long * 0.5).toBeLessThanOrEqual(0.9);
    const huge = 'Abanoub Mina Fawzy Abdelmalak';
    expect(huge.length * nameFontScale(huge) * 0.5).toBeLessThanOrEqual(0.9);
  });
});
