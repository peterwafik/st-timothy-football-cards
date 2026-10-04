'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { Avatar } from '@/components/Avatar';
import { buttonGhost, buttonPrimary, field, Notice, PageHeader, Panel } from '@/components/staff/ui';
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
  const activity = activities.find((a) => a.key === activityKey);

  function chooseActivity(key: string) {
    setActivityKey(key);
    setSelected(new Set());
    setStatus(null);
  }

  function toggle(id: string) {
    setStatus(null);
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
    <div className="flex flex-col gap-6 pb-36">
      <PageHeader title="Log a session" subtitle={isValidISODate(date) ? `Week ${weekRangeLabel(date)}` : 'Pick a date'} />

      <Panel title="1. Activity">
        <div role="group" aria-label="Activity" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activities.map((a) => {
            const on = a.key === activityKey;
            return (
              <button
                key={a.key}
                type="button"
                aria-pressed={on}
                onClick={() => chooseActivity(a.key)}
                className={`flex flex-col items-start rounded-xl px-4 py-3 text-left ring-1 transition ${
                  on ? 'bg-trophy text-dugout ring-trophy' : 'bg-dugout/60 text-chalk ring-chalk/20 hover:ring-chalk/50'
                }`}
              >
                <span className="font-stadium text-2xl font-extrabold leading-tight">{a.name}</span>
                <span className={`font-card text-base font-bold ${on ? 'text-dugout/80' : 'text-trophy'}`}>+{a.points} pts</span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="2. Date">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} sm:max-w-xs`} aria-label="Date" />
      </Panel>

      <Panel title="3. Who was there?">
        <div className="mb-4 flex flex-wrap gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name" className={`${field} min-w-0 flex-1`} />
          <button type="button" onClick={selectAll} className={buttonGhost}>Select all</button>
          {selected.size > 0 && (
            <button type="button" onClick={() => setSelected(new Set())} className={buttonGhost}>Clear</button>
          )}
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((k) => {
            const isLogged = logged.has(k.id);
            const on = selected.has(k.id);
            return (
              <li key={k.id}>
                <button
                  type="button"
                  aria-pressed={isLogged || on}
                  aria-label={k.name}
                  disabled={isLogged}
                  onClick={() => toggle(k.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition ${
                    isLogged
                      ? 'bg-chalk/5 opacity-60 ring-chalk/10'
                      : on
                        ? 'bg-trophy/20 ring-2 ring-trophy'
                        : 'bg-dugout/60 ring-chalk/15 hover:ring-chalk/40'
                  }`}
                >
                  <Avatar name={k.name} photoUrl={k.photo_url} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-card text-lg font-bold leading-tight">{k.name}</span>
                    {isLogged && <span className="block font-card text-sm text-trophy">✓ logged this week</span>}
                  </span>
                  {on && (
                    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-trophy font-bold text-dugout">✓</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {visible.length === 0 && <p className="font-card text-lg text-chalk/70">No kid matches that name.</p>}
      </Panel>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-chalk/15 bg-dugout/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <p className="flex-1 font-card text-lg">
            <span className="font-stadium text-2xl font-extrabold">{selected.size}</span> selected
            {activity && selected.size > 0 && <span className="text-chalk/70"> for {activity.name}</span>}
          </p>
          <button type="button" onClick={save} disabled={pending || selected.size === 0} className={buttonPrimary}>
            {pending ? 'Saving…' : `Save ${selected.size} kid${selected.size === 1 ? '' : 's'}`}
          </button>
          {status && <div className="w-full"><Notice ok={status.ok}>{status.text}</Notice></div>}
        </div>
      </div>
    </div>
  );
}
