import generated from './clubs.generated.json';

export interface Club { id: string; name: string; country: string; league: string; logo: string | null }

export const ST_TIMOTHY: Club = { id: 'st-timothy', name: 'St. Timothy', country: 'Egypt', league: 'Sunday School', logo: null };
export const CLUBS: Club[] = [ST_TIMOTHY, ...(generated as Club[])];

const BY_ID = new Map(CLUBS.map((c) => [c.id, c]));
export function clubById(id: string): Club {
  return BY_ID.get(id) ?? ST_TIMOTHY;
}

export const CLUB_COUNTRIES: string[] = [
  'Egypt',
  ...[...new Set(CLUBS.map((c) => c.country))].filter((c) => c !== 'Egypt').sort((a, b) => a.localeCompare(b)),
];
