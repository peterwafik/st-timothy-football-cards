'use client';
import { useState } from 'react';
import { ClubCrest } from '@/components/ClubCrest';
import { Flag } from '@/components/Flag';
import { CLUB_COUNTRIES, CLUBS, clubById, type Club } from '@/lib/clubs';
import { FLAGS } from '@/lib/flags';
import { POSITIONS } from '@/lib/positions';
import { field } from '@/components/staff/ui';

const select = `${field} flex-1`;

export function FlagPicker({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  return (
    <label className="flex flex-col gap-1.5 font-card text-base font-bold text-chalk/90">Country flag
      <span className="flex items-center gap-3">
        <select name="flag" value={code} onChange={(e) => setCode(e.target.value)} className={select}>
          {FLAGS.map((f) => <option key={f.code} value={f.code}>{f.name}</option>)}
        </select>
        <span className="w-12 shrink-0"><Flag code={code} /></span>
      </span>
    </label>
  );
}

function byLeague(clubs: Club[]): [string, Club[]][] {
  const groups = new Map<string, Club[]>();
  for (const c of clubs) groups.set(c.league || 'Other', [...(groups.get(c.league || 'Other') ?? []), c]);
  return [...groups.entries()];
}

export function ClubPicker({ initial }: { initial: string }) {
  const start = clubById(initial);
  const [country, setCountry] = useState(start.country);
  const [club, setClub] = useState(start.id);
  const clubs = CLUBS.filter((c) => c.country === country);

  function changeCountry(next: string) {
    setCountry(next);
    setClub(CLUBS.find((c) => c.country === next)?.id ?? 'st-timothy');
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 font-card text-base font-bold text-chalk/90">Club country
        <select value={country} onChange={(e) => changeCountry(e.target.value)} className={select}>
          {CLUB_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 font-card text-base font-bold text-chalk/90">Club
        <span className="flex items-center gap-3">
          <select name="club" value={club} onChange={(e) => setClub(e.target.value)} className={select}>
            {byLeague(clubs).map(([league, list]) => (
              <optgroup key={league} label={league}>
                {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          <span className="w-12 shrink-0"><ClubCrest club={club} /></span>
        </span>
      </label>
    </div>
  );
}

export function PositionPicker({ initial }: { initial: string | null }) {
  return (
    <label className="flex flex-col gap-1.5 font-card text-base font-bold text-chalk/90">Playing position (shown on the card)
      <select name="position" defaultValue={initial ?? ''} className={select}>
        <option value="">No position</option>
        {POSITIONS.map((p) => (
          <option key={p.code} value={p.code}>{p.code} ({p.name})</option>
        ))}
      </select>
    </label>
  );
}
