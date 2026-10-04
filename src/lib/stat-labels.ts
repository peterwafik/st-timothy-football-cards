import type { StatKey } from './scoring';

// The stat names as the class uses them. Activity names (Odas, Fasl, Nota Ro7eya, Tasbe7a, Dars Ketab)
// are never translated.
export const STAT_LABELS: Record<StatKey, string> = {
  CHA: 'Church Attendance',
  SSA: 'Sunday School Attendance',
  PRA: 'Prayers',
  RIB: 'Read in Bible',
  BEH: 'Behaviour and Discipline',
  SSK: 'Social Skills',
};
