'use client';
import { useState } from 'react';
import { ClubCrest } from '@/components/ClubCrest';
import { Flag } from '@/components/Flag';
import { CLUB_COUNTRIES, CLUBS, clubById, type Club } from '@/lib/clubs';
import { FLAGS } from '@/lib/flags';

const field = 'flex-1 rounded-lg bg-white px-3 py-2 text-black';

export function FlagPicker({ initial }: { initial: string }) {
  const [code, setCode] = useState(initial);
  return (
    <label className="flex flex-col gap-1 text-sm">Country flag
      <span className="flex items-center gap-3">
        <select name="flag" value={code} onChange={(e) => setCode(e.target.value)} className={field}>
          {FLAGS.map((f) => <option key={f.code} value={f.code}>{f.name}</option>)}
        </select>
        <span className="w-12"><Flag code={code} /></span>
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
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">Club country
        <select value={country} onChange={(e) => changeCountry(e.target.value)} className={field}>
          {CLUB_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">Club
        <span className="flex items-center gap-3">
          <select name="club" value={club} onChange={(e) => setClub(e.target.value)} className={field}>
            {byLeague(clubs).map(([league, list]) => (
              <optgroup key={league} label={league}>
                {list.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          <span className="w-12"><ClubCrest club={club} /></span>
        </span>
      </label>
    </div>
  );
}
