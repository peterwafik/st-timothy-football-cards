import { ConfirmButton } from '@/components/ConfirmButton';
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-card text-3xl font-bold uppercase">History</h1>
      <form className="flex flex-wrap gap-2 text-black">
        <select name="kid" defaultValue={kid ?? ''} className="rounded-lg bg-white px-3 py-2">
          <option value="">All kids</option>
          {(kids ?? []).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select name="activity" defaultValue={activity ?? ''} className="rounded-lg bg-white px-3 py-2">
          <option value="">All activities + bonuses</option>
          {(activities ?? []).map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
        </select>
        <button className="rounded-lg bg-gold px-4 font-bold text-pitch">Filter</button>
      </form>
      {rows.length === 0 && <p className="text-white/60">Nothing logged yet.</p>}
      <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
        {rows.map((r) => (
          <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
            <span className="w-24 text-white/60">{r.date}</span>
            <span className="flex-1 font-semibold">{r.kid}</span>
            <span className="flex-1">{r.what}</span>
            <span className={r.points < 0 ? 'text-red-300' : 'text-green-300'}>{r.points > 0 ? '+' : ''}{r.points}</span>
            <span className="text-xs text-white/50">by {r.by}</span>
            <ConfirmButton
              label="Undo"
              confirmLabel="Confirm undo"
              action={r.kind === 'entry' ? deleteEntry.bind(null, r.id) : deleteAdjustment.bind(null, r.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
