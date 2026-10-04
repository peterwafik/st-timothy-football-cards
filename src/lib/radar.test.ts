import { describe, expect, test } from 'vitest';
import { radarPoint, strengthsAndWeaknesses } from './radar';

describe('radarPoint', () => {
  test('first axis points straight up; a full value reaches the radius', () => {
    const p = radarPoint({ value: 99, index: 0, count: 6, radius: 100, cx: 150, cy: 150 });
    expect(p.x).toBeCloseTo(150);
    expect(p.y).toBeCloseTo(50);
  });
  test('axes go clockwise, 60 degrees apart for six stats', () => {
    const p = radarPoint({ value: 99, index: 1, count: 6, radius: 100, cx: 0, cy: 0 });
    expect(p.x).toBeCloseTo(100 * Math.sin(Math.PI / 3));
    expect(p.y).toBeCloseTo(-100 * Math.cos(Math.PI / 3));
  });
  test('zero sits at the centre and values are clamped to 0-99', () => {
    expect(radarPoint({ value: 0, index: 3, count: 6, radius: 100, cx: 10, cy: 20 })).toEqual({ x: 10, y: 20 });
    const over = radarPoint({ value: 150, index: 0, count: 6, radius: 100, cx: 0, cy: 0 });
    expect(over.y).toBeCloseTo(-100);
  });
});

describe('strengthsAndWeaknesses', () => {
  const stats = { CHA: 99, SSA: 20, PRA: 99, RIB: 60, BEH: 75, SSK: 0 };
  test('names the highest and lowest stats, ties included, ignoring unrated Social Skills', () => {
    expect(strengthsAndWeaknesses(stats, false)).toEqual({ strongest: ['CHA', 'PRA'], weakest: ['SSA'] });
  });
  test('includes Social Skills once it has been rated', () => {
    expect(strengthsAndWeaknesses(stats, true)).toEqual({ strongest: ['CHA', 'PRA'], weakest: ['SSK'] });
  });
  test('nothing to say when every stat is the same (e.g. before the first week)', () => {
    const flat = { CHA: 0, SSA: 0, PRA: 0, RIB: 0, BEH: 0, SSK: 0 };
    expect(strengthsAndWeaknesses(flat, false)).toEqual({ strongest: [], weakest: [] });
  });
});
