'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { ClubCrest } from '@/components/ClubCrest';
import { Flag } from '@/components/Flag';
import { field } from '@/components/staff/ui';
import { templateUrl } from '@/lib/card';

export interface SquadRow {
  id: string; name: string; photoUrl: string | null; flag: string; club: string;
  position: string | null; tier: number | null; score: number; active: boolean;
}

export function KidsSquad({ rows }: { rows: SquadRow[] }) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())), [rows, query]);
  return (
    <div className="flex flex-col gap-4">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name" className={field} aria-label="Search kids" />
      <ul className="grid gap-2 md:grid-cols-2">
        {visible.map((r) => (
          <li key={r.id}>
            <Link
              href={`/kids/${r.id}`}
              className={`flex items-center gap-3 rounded-xl bg-dugout/70 px-3 py-2.5 ring-1 ring-chalk/15 transition hover:bg-dugout hover:ring-trophy ${r.active ? '' : 'opacity-50'}`}
            >
              <Avatar name={r.name} photoUrl={r.photoUrl} size={48} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  {r.position && (
                    <span className="rounded bg-chalk px-1.5 font-stadium text-sm font-extrabold text-dugout">{r.position}</span>
                  )}
                  <span className="truncate font-card text-lg font-bold">{r.name}</span>
                </span>
                <span className="mt-1 flex items-center gap-2 font-card text-sm text-chalk/70">
                  <span className="block w-6"><Flag code={r.flag} /></span>
                  <span className="block w-5"><ClubCrest club={r.club} /></span>
                  {!r.active && <span>Retired</span>}
                  {!r.photoUrl && r.active && <span className="text-trophy">Needs a photo</span>}
                </span>
              </span>
              {r.tier && <img src={templateUrl(r.tier)} alt={`Tier ${r.tier} card`} className="h-11 w-auto" />}
              <span className="w-16 text-right">
                <span className="block font-stadium text-2xl font-extrabold leading-none tabular-nums">{r.score}</span>
                <span className="font-card text-xs text-chalk/60">pts</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p className="font-card text-lg text-chalk/70">No kid matches that name.</p>}
    </div>
  );
}
