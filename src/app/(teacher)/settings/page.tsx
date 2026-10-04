import { ConfirmButton } from '@/components/ConfirmButton';
import { requireAdmin } from '@/lib/auth';
import { createTeacher, removeTeacher, saveSettings } from './actions';

const field = 'rounded-lg bg-white px-3 py-2 text-black';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const { supabase, userId } = await requireAdmin();
  const [{ data: settings }, { data: activities }, { data: teachers }] = await Promise.all([
    supabase.from('settings').select('season_start, tier_count, leaderboard_public').eq('id', 1).single(),
    supabase.from('activities').select('key, name, points, stat').order('sort'),
    supabase.from('teachers').select('user_id, name, role').order('name'),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-card text-3xl font-bold uppercase">Settings</h1>
      {msg && <p role="status" className="rounded bg-white/10 p-3">{msg}</p>}

      <form action={saveSettings} className="flex flex-col gap-3">
        <h2 className="font-card text-2xl uppercase text-gold">Points per activity</h2>
        {(activities ?? []).map((a) => (
          <label key={a.key} className="flex items-center gap-3">
            <span className="flex-1">{a.name} <span className="text-xs text-white/50">→ {a.stat}</span></span>
            <input name={`points_${a.key}`} type="number" min={0} max={10000} defaultValue={a.points} className={`${field} w-28`} />
          </label>
        ))}
        <h2 className="mt-4 font-card text-2xl uppercase text-gold">Season</h2>
        <label className="flex items-center gap-3"><span className="flex-1">Season start</span>
          <input name="season_start" type="date" defaultValue={settings?.season_start} className={field} />
        </label>
        <label className="flex items-center gap-3"><span className="flex-1">Number of card tiers (1–11)</span>
          <input name="tier_count" type="number" min={1} max={11} defaultValue={settings?.tier_count} className={`${field} w-28`} />
        </label>
        <label className="flex items-center gap-2">
          <input name="leaderboard_public" type="checkbox" defaultChecked={settings?.leaderboard_public} /> Public leaderboard
        </label>
        <button className="rounded-lg bg-gold py-3 font-card text-xl font-bold uppercase text-pitch">Save settings</button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-card text-2xl uppercase text-gold">Teachers</h2>
        <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
          {(teachers ?? []).map((t) => (
            <li key={t.user_id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1">{t.name}</span>
              <span className="text-xs uppercase text-white/60">{t.role}</span>
              {t.user_id !== userId && (
                <ConfirmButton label="Remove" confirmLabel="Confirm remove" action={removeTeacher.bind(null, t.user_id)} />
              )}
            </li>
          ))}
        </ul>
        <form action={createTeacher} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input name="name" required placeholder="Name" className={field} />
          <input name="email" type="email" required placeholder="Email" className={field} />
          <input name="password" type="text" required minLength={8} placeholder="Temporary password (8+)" className={field} />
          <select name="role" className={field} defaultValue="teacher">
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button className="rounded-lg bg-gold py-2 font-bold text-pitch sm:col-span-2">Add teacher</button>
        </form>
      </section>
    </div>
  );
}
