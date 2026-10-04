import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { CLUB_COUNTRIES, CLUBS, clubById } from './clubs';
import { FLAGS, isFlagCode } from './flags';

test('flags: Egypt first, home nations present, every file exists', () => {
  expect(FLAGS[0]).toEqual({ code: 'EG', name: 'Egypt' });
  expect(FLAGS.find((f) => f.code === 'GB-ENG')?.name).toBe('England');
  expect(FLAGS.find((f) => f.code === 'GB-SCT')?.name).toBe('Scotland');
  expect(FLAGS.length).toBeGreaterThan(240);
  expect(isFlagCode('EG')).toBe(true);
  expect(isFlagCode('XX')).toBe(false);
  // Locale test regions (XA "Pseudo-Accents", XB "Pseudo-Bidi") are not countries.
  expect(FLAGS.filter((f) => f.name.startsWith('Pseudo'))).toEqual([]);
  for (const f of FLAGS) expect(fs.existsSync(path.join('public', 'flags', `${f.code}.svg`)), f.code).toBe(true);
});

test('clubs: St. Timothy is default, ids unique, every logo file exists', () => {
  expect(CLUBS[0].id).toBe('st-timothy');
  expect(clubById('does-not-exist').id).toBe('st-timothy');
  expect(new Set(CLUBS.map((c) => c.id)).size).toBe(CLUBS.length);
  for (const c of CLUBS) {
    if (c.logo) expect(fs.existsSync(path.join('public', c.logo)), c.id).toBe(true);
  }
});

test('clubs cover Europe and the rest of the world', () => {
  expect(CLUBS.length).toBeGreaterThan(500);
  const egypt = CLUBS.filter((c) => c.country === 'Egypt').map((c) => c.name);
  expect(egypt).toEqual(expect.arrayContaining(['Al Ahly', 'Zamalek']));
  expect(CLUB_COUNTRIES[0]).toBe('Egypt');
  expect(CLUB_COUNTRIES).toEqual(expect.arrayContaining(['England', 'Spain', 'Italy', 'Saudi Arabia', 'Brazil', 'Argentina', 'USA']));
});
