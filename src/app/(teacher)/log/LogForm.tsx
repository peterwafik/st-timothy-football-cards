'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { isValidISODate, toLocalISODate, weekRangeLabel } from '@/lib/dates';
import { getLoggedKidIds, logSession } from './actions';

type Kid = { id: string; name: string; photo_url: string | null };
type Activity = { key: string; name: string; points: number };

export function LogForm({ kids, activities }: { kids: Kid[]; activities: Activity[] }) {
  const [date, setDate] = useState(() => toLocalISODate(new Date()));
  const [activityKey, setActivityKey] = useState(activities[0]?.key ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getLoggedKidIds(activityKey, date).then((ids) => {
      if (!cancelled) setLogged(new Set(ids));
    });
    return () => { cancelled = true; };
  }, [activityKey, date]);

  const visible = useMemo(
    () => kids.filter((k) => k.name.toLowerCase().includes(query.trim().toLowerCase())),
    [kids, query],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(visible.filter((k) => !logged.has(k.id)).map((k) => k.id)));
  }

  function save() {
    start(async () => {
      const res = await logSession({ activityKey, date, kidIds: [...selected] });
      if (res.ok) {
        setStatus({ ok: true, text: res.message });
        setSelected(new Set());
        setLogged(new Set(await getLoggedKidIds(activityKey, date)));
      } else {
        setStatus({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <h1 className="font-card text-3xl font-bold uppercase">Log session</h1>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg bg-white px-3 py-2 text-black" />
          {isValidISODate(date) && <span className="text-xs text-white/70">Counts for the week {weekRangeLabel(date)}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">Activity
          <select aria-label="Activity" value={activityKey} onChange={(e) => setActivityKey(e.target.value)} className="rounded-lg bg-white px-3 py-2 text-black">
            {activities.map((a) => <option key={a.key} value={a.key}>{a.name} (+{a.points})</option>)}
          </select>
        </label>
      </div>
      <div className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name" className="flex-1 rounded-lg bg-white px-3 py-2 text-black" />
        <button type="button" onClick={selectAll} className="rounded-lg border border-white/30 px-3">Select all</button>
      </div>
      <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
        {visible.map((k) => {
          const isLogged = logged.has(k.id);
          return (
            <li key={k.id}>
              <label className={`flex items-center gap-3 px-3 py-3 ${isLogged ? 'opacity-60' : ''}`}>
                <input type="checkbox" className="h-6 w-6" checked={isLogged || selected.has(k.id)} disabled={isLogged} onChange={() => toggle(k.id)} aria-label={k.name} />
                {k.photo_url ? <img src={k.photo_url} alt="" className="h-9 w-9 rounded-full object-cover object-top" /> : <span className="h-9 w-9 rounded-full bg-white/10" />}
                <span className="flex-1">{k.name}</span>
                {isLogged && <span className="text-xs text-gold">✓ logged this week</span>}
              </label>
            </li>
          );
        })}
      </ul>
      <div className="fixed inset-x-0 bottom-0 flex flex-col items-center gap-2 bg-pitch/95 p-3">
        {status && <p role="status" className={status.ok ? 'text-green-300' : 'text-red-300'}>{status.text}</p>}
        <button type="button" onClick={save} disabled={pending || selected.size === 0} className="w-full max-w-3xl rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch disabled:opacity-50">
          {pending ? 'Saving…' : `Save ${selected.size} kid${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
