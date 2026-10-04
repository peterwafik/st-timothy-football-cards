import { ConfirmButton } from '@/components/ConfirmButton';
import { buttonPrimary, field, Label, PageHeader, Panel } from '@/components/staff/ui';
import { formatDay, weekRangeLabel, weekStart } from '@/lib/dates';
import { requireTeacher } from '@/lib/auth';
import { deleteAdjustment, deleteEntry } from './actions';

type Row = { id: string; kind: 'entry' | 'adjustment'; date: string; createdAt: string; kid: string; what: string; points: number; by: string };

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ kid?: string; activity?: string }> }) {
  const { kid, activity } = await searchParams;
  const { supabase } = await requireTeacher();

  let entriesQ = supabase.from('entries')
    .select('id, date, created_at, created_by, kids(name), activities(name, points)')
    .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(300);
  if (kid) entriesQ = entriesQ.eq('kid_id', kid);
  if (activity) entriesQ = entriesQ.eq('activity_key', activity);

  let adjQ = supabase.from('adjustments')
    .select('id, date, created_at, created_by, points, reason, kids(name)')
    .order('date', { ascending: false }).order('created_at', { ascending: false }).limit(300);
  if (kid) adjQ = adjQ.eq('kid_id', kid);

  const [{ data: entries }, { data: adjustments }, { data: kids }, { data: activities }, { data: teachers }] = await Promise.all([
    entriesQ,
    activity ? Promise.resolve({ data: [] }) : adjQ,
    supabase.from('kids').select('id, name').order('name'),
    supabase.from('activities').select('key, name').order('sort'),
    supabase.from('teachers').select('user_id, name'),
  ]);
  const teacherName = new Map((teachers ?? []).map((t) => [t.user_id, t.name]));
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  const rows: Row[] = [
    ...(entries ?? []).map((e) => ({
      id: e.id, kind: 'entry' as const, date: e.date, createdAt: e.created_at,
      kid: one(e.kids)?.name ?? '?', what: one(e.activities)?.name ?? '?', points: one(e.activities)?.points ?? 0,
      by: teacherName.get(e.created_by) ?? '—',
    })),
    ...((adjustments ?? []) as { id: string; date: string; created_at: string; created_by: string; points: number; reason: string; kids: { name: string } | { name: string }[] | null }[]).map((a) => ({
      id: a.id, kind: 'adjustment' as const, date: a.date, createdAt: a.created_at,
      kid: one(a.kids)?.name ?? '?', what: `${a.points > 0 ? 'Bonus' : 'Deduction'}: ${a.reason}`, points: a.points,
      by: teacherName.get(a.created_by) ?? '—',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  // Group rows by session week (Friday to Thursday) so the list reads like a fixtures list.
  const weeks = new Map<string, Row[]>();
  for (const r of rows) {
    const w = weekStart(r.date);
    weeks.set(w, [...(weeks.get(w) ?? []), r]);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="History" subtitle="Everything logged, newest first. Undo fixes a mistake straight away." />
      <Panel>
        <form className="flex flex-wrap items-end gap-3">
          <Label text="Kid">
            <select name="kid" defaultValue={kid ?? ''} className={`${field} min-w-56`}>
              <option value="">All kids</option>
              {(kids ?? []).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </Label>
          <Label text="Activity">
            <select name="activity" defaultValue={activity ?? ''} className={`${field} min-w-56`}>
              <option value="">All activities and bonuses</option>
              {(activities ?? []).map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            </select>
          </Label>
          <button className={buttonPrimary}>Filter</button>
        </form>
      </Panel>

      {rows.length === 0 && (
        <Panel><p className="font-card text-lg text-chalk/70">Nothing logged yet. Start from the Log page.</p></Panel>
      )}

      {[...weeks.entries()].map(([week, list]) => (
        <Panel key={week} title={`Week ${weekRangeLabel(week)}`}>
          <ul className="divide-y divide-chalk/10">
            {list.map((r) => (
              <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="w-24 font-card text-base text-chalk/60">{formatDay(r.date)}</span>
                <span className="min-w-40 flex-1 font-card text-lg font-bold">{r.kid}</span>
                <span className="min-w-40 flex-1 font-card text-base text-chalk/85">{r.what}</span>
                <span
                  className={`rounded-full px-3 py-0.5 font-stadium text-lg font-bold tabular-nums ${
                    r.points < 0 ? 'bg-[#ef6461]/20 text-[#ff9a96]' : r.kind === 'adjustment' ? 'bg-trophy/20 text-trophy' : 'bg-[#3ddc84]/15 text-[#7ff0b1]'
                  }`}
                >
                  {r.points > 0 ? '+' : ''}{r.points}
                </span>
                <span className="w-32 font-card text-sm text-chalk/50">by {r.by}</span>
                <ConfirmButton
                  label="Undo"
                  confirmLabel="Confirm undo"
                  action={r.kind === 'entry' ? deleteEntry.bind(null, r.id) : deleteAdjustment.bind(null, r.id)}
                />
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
