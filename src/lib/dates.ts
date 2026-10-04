const pad = (n: number) => String(n).padStart(2, '0');

export function toLocalISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isFutureDate(date: string, today: string): boolean {
  return date > today;
}

/** Today's date (YYYY-MM-DD) in Egypt, regardless of the server's clock (Vercel runs in UTC). */
export function todayInCairo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

// Date-only strings are formatted in UTC so the day never shifts with the server's timezone.
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** '2026-10-04' → 'Sun 4 Oct' */
export function formatDay(iso: string): string {
  const d = asDate(iso);
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(d);
  const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
  return `${weekday} ${dayMonth}`;
}

/** '2026-10-01' → '1 October 2026' */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(asDate(iso));
}

/** The Friday that starts this date's week (sessions run Friday to Thursday). */
export function weekStart(iso: string): string {
  const d = asDate(iso);
  const daysSinceFriday = (d.getUTCDay() + 2) % 7; // Fri=5 → 0, Sat=6 → 1, ..., Thu=4 → 6
  d.setUTCDate(d.getUTCDate() - daysSinceFriday);
  return d.toISOString().slice(0, 10);
}

/** '2026-10-04' → 'Fri 2 Oct – Thu 8 Oct' (the session week this date belongs to). */
export function weekRangeLabel(iso: string): string {
  const start = weekStart(iso);
  const end = asDate(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${formatDay(start)} – ${formatDay(end.toISOString().slice(0, 10))}`;
}
