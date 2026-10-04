import { expect, test } from 'vitest';
import { CLUBS } from './clubs';
import { parseKidForm } from './kid-form';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}
const base = { name: ' Mina Hesham ', flag: 'EG', club: 'st-timothy', ssk: '', joined_on: '2026-10-01', active: 'on', photo_url: '' };

test('parses a valid kid with blank SSK as null', () => {
  expect(parseKidForm(fd(base))).toEqual({
    ok: true,
    value: { name: 'Mina Hesham', photo_url: null, flag: 'EG', club: 'st-timothy', ssk: null, joined_on: '2026-10-01', active: true },
  });
});
test('rejects empty name', () => {
  expect(parseKidForm(fd({ ...base, name: '  ' }))).toEqual({ ok: false, error: 'Name is required.' });
});
test('rejects SSK out of range', () => {
  expect(parseKidForm(fd({ ...base, ssk: '120' }))).toEqual({ ok: false, error: 'SSK must be 0–99.' });
});
test('keeps a real club id and a home-nation flag', () => {
  const realClub = CLUBS[1].id;
  const r = parseKidForm(fd({ ...base, club: realClub, flag: 'GB-ENG' }));
  expect(r.ok && r.value.club).toBe(realClub);
  expect(r.ok && r.value.flag).toBe('GB-ENG');
});
test('unknown flag/club fall back to defaults; unchecked active is false', () => {
  const { active: _drop, ...rest } = base;
  const r = parseKidForm(fd({ ...rest, flag: 'XX', club: 'nope' }));
  expect(r.ok && r.value.flag).toBe('EG');
  expect(r.ok && r.value.club).toBe('st-timothy');
  expect(r.ok && r.value.active).toBe(false);
});
