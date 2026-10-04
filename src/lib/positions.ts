// Playing positions shown on the card under the number, like real football cards.
export const POSITIONS = [
  { code: 'GK', name: 'Goalkeeper' },
  { code: 'CB', name: 'Centre back' },
  { code: 'LB', name: 'Left back' },
  { code: 'RB', name: 'Right back' },
  { code: 'LWB', name: 'Left wing back' },
  { code: 'RWB', name: 'Right wing back' },
  { code: 'CDM', name: 'Defensive midfielder' },
  { code: 'CM', name: 'Central midfielder' },
  { code: 'CAM', name: 'Attacking midfielder' },
  { code: 'LM', name: 'Left midfielder' },
  { code: 'RM', name: 'Right midfielder' },
  { code: 'LW', name: 'Left winger' },
  { code: 'RW', name: 'Right winger' },
  { code: 'CF', name: 'Centre forward' },
  { code: 'ST', name: 'Striker' },
] as const;

export function isPosition(code: string): boolean {
  return POSITIONS.some((p) => p.code === code);
}
