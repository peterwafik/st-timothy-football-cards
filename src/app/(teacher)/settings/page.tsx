import { Avatar } from '@/components/Avatar';
import { ConfirmButton } from '@/components/ConfirmButton';
import { buttonPrimary, field, Label, Notice, PageHeader, Panel } from '@/components/staff/ui';
import { requireAdmin } from '@/lib/auth';
import { createTeacher, removeTeacher, saveSettings } from './actions';


export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { supabase, userId } = await requireAdmin();
  const [{ data: settings }, { data: activities }, { data: teachers }] = await Promise.all([
    supabase.from('settings').select('season_start, tier_count, leaderboard_public').eq('id', 1).single(),
    supabase.from('activities').select('key, name, points, stat').order('sort'),
    supabase.from('teachers').select('user_id, name, role').order('name'),
  ]);

  const msgOk = !!msg && /saved|added/i.test(msg) && !/could not|some settings/i.test(msg);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" subtitle="Points, the season and who can log in. Only admins see this page." />
      {msg && <Notice ok={msgOk}>{msg}</Notice>}

      <form action={saveSettings} className="flex flex-col gap-6">
        <Panel title="Points per activity">
          <ul className="grid gap-3 sm:grid-cols-2">
            {(activities ?? []).map((a) => (
              <li key={a.key}>
                <label className="flex items-center gap-3 rounded-xl bg-dugout/60 px-4 py-2 ring-1 ring-chalk/15">
                  <span className="flex-1">
                    <span className="block font-stadium text-2xl font-bold leading-tight">{a.name}</span>
                    <span className="font-card text-sm text-chalk/60">Counts toward {a.stat}</span>
                  </span>
                  <input name={`points_${a.key}`} type="number" min={0} max={10000} defaultValue={a.points} className={`${field} w-28! shrink-0 text-right`} aria-label={`${a.name} points`} />
                </label>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Season">
          <div className="grid gap-5 sm:grid-cols-2">
            <Label text="Season start" hint="Points and stats before this date belong to an earlier season.">
              <input name="season_start" type="date" defaultValue={settings?.season_start} className={field} />
            </Label>
            <Label text="Card tiers" hint="1–11. With 11, the top kids get the crystal card and the last get bronze.">
              <input name="tier_count" type="number" min={1} max={11} defaultValue={settings?.tier_count} className={field} />
            </Label>
          </div>
          <label className="mt-5 flex items-center gap-3 font-card text-lg font-bold">
            <input name="leaderboard_public" type="checkbox" defaultChecked={settings?.leaderboard_public} className="h-6 w-6 accent-[var(--color-trophy)]" />
            Show the league table on the public home page
          </label>
        </Panel>

        <div><button className={buttonPrimary}>Save settings</button></div>
      </form>

      <Panel title="Teachers">
        <ul className="mb-6 divide-y divide-chalk/10">
          {(teachers ?? []).map((t) => (
            <li key={t.user_id} className="flex items-center gap-3 py-3">
              <Avatar name={t.name} photoUrl={null} size={40} />
              <span className="flex-1 font-card text-lg font-bold">{t.name}{t.user_id === userId && <span className="font-medium text-chalk/60"> (you)</span>}</span>
              <span className={`rounded-full px-3 py-0.5 font-card text-sm font-bold ${t.role === 'admin' ? 'bg-trophy text-dugout' : 'bg-chalk/15'}`}>
                {t.role === 'admin' ? 'Admin' : 'Teacher'}
              </span>
              {t.user_id !== userId && (
                <ConfirmButton label="Remove" confirmLabel="Confirm remove" action={removeTeacher.bind(null, t.user_id)} />
              )}
            </li>
          ))}
        </ul>
        <h3 className="mb-3 font-stadium text-2xl font-bold">Add a teacher</h3>
        <form action={createTeacher} className="grid gap-4 sm:grid-cols-2">
          <Label text="Name"><input name="name" required className={field} /></Label>
          <Label text="Email"><input name="email" type="email" required className={field} /></Label>
          <Label text="Temporary password" hint="At least 8 characters. Share it with them privately.">
            <input name="password" type="text" required minLength={8} className={field} />
          </Label>
          <Label text="Role">
            <select name="role" className={field} defaultValue="teacher">
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </Label>
          <div className="sm:col-span-2"><button className={buttonPrimary}>Add teacher</button></div>
        </form>
      </Panel>
    </div>
  );
}
