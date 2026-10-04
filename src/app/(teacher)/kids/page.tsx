import Link from 'next/link';
import { requireTeacher } from '@/lib/auth';
import { rankLabel } from '@/lib/card';
import { loadClassSnapshot } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function KidsPage() {
  await requireTeacher();
  const snap = await loadClassSnapshot();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="flex-1 font-card text-3xl font-bold uppercase">Kids</h1>
        <Link href="/kids/qr" className="rounded-lg border border-white/30 px-3 py-2">Print QR codes</Link>
        <Link href="/kids/new" className="rounded-lg bg-gold px-3 py-2 font-bold text-pitch">Add kid</Link>
      </div>
      <ul className="flex flex-col divide-y divide-white/10 rounded-lg bg-pitch-light">
        {snap.kids.map((k) => {
          const r = snap.results.get(k.id)!;
          return (
            <li key={k.id}>
              <Link href={`/kids/${k.id}`} className={`flex items-center gap-3 px-3 py-2 ${k.active ? '' : 'opacity-50'}`}>
                {k.photo_url ? <img src={k.photo_url} alt="" className="h-10 w-10 rounded-full object-cover object-top" /> : <span className="h-10 w-10 rounded-full bg-white/10" />}
                <span className="flex-1">{k.name}{!k.active && ' (inactive)'}</span>
                <span className="text-sm text-white/70">{r.score} pts</span>
                {r.tier && <span className="w-12 text-right font-card text-gold">{rankLabel(r.tier).num}{rankLabel(r.tier).suffix}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
