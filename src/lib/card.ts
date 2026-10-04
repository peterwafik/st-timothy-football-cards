import type { StatKey } from './scoring';

export interface CardData {
  name: string;
  photoUrl: string | null;
  flag: string;
  club: string;
  tier: number;
  stats: Record<StatKey, number>;
  active: boolean;
  position: string | null;
}

export function templateForTier(tier: number): string {
  return tier <= 1 ? '0.9' : String(tier - 1);
}

export function isLightTier(tier: number): boolean {
  return tier >= 9;
}

export function rankLabel(tier: number): { num: string; suffix: string } {
  const suffix = tier === 1 ? 'ST' : tier === 2 ? 'ND' : tier === 3 ? 'RD' : 'TH';
  return { num: String(tier), suffix };
}

const BASE_SCALE = 0.085;
const MAX_CHARS_AT_BASE = 13;

export function nameFontScale(name: string): number {
  const len = name.trim().length;
  if (len <= MAX_CHARS_AT_BASE) return BASE_SCALE;
  return Math.max(0.03, (BASE_SCALE * MAX_CHARS_AT_BASE) / len);
}
