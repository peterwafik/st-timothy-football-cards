/** League-table order: highest score first, then name; equal scores share a position (1, 2, 2, 4). */
export function withPositions<T extends { name: string; score: number }>(rows: T[]): (T & { position: number })[] {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let position = 0;
  return sorted.map((row, i) => {
    if (i === 0 || row.score !== sorted[i - 1].score) position = i + 1;
    return { ...row, position };
  });
}

/** '2026-10-01' → 'Season 2026–27' (a Sunday School year runs autumn to summer). */
export function seasonLabel(seasonStart: string): string {
  const year = Number(seasonStart.slice(0, 4));
  return `Season ${year}–${String((year + 1) % 100).padStart(2, '0')}`;
}

export interface LeagueRow {
  id: string;
  name: string;
  score: number;
  card: import('./card').CardData;
}
