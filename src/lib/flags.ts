import generated from './flags.generated.json';

export interface FlagOption { code: string; name: string }

const all = generated as FlagOption[];
export const FLAGS: FlagOption[] = [all.find((f) => f.code === 'EG')!, ...all.filter((f) => f.code !== 'EG')];

const CODES = new Set(all.map((f) => f.code));
export function isFlagCode(code: string): boolean {
  return CODES.has(code);
}
