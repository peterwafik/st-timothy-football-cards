import { ClubCrest } from '../ClubCrest';
import { Flag } from '../Flag';
import { clubById } from '@/lib/clubs';
import { templateUrl } from '@/lib/card';
import type { LeagueRow } from '@/lib/standings';

type Placed = LeagueRow & { position: number };

function Avatar({ row }: { row: Placed }) {
  if (row.card.photoUrl) {
    return <img src={row.card.photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full bg-chalk/10 object-cover object-top" />;
  }
  const initials = row.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-chalk/15 font-stadium text-lg font-bold">
      {initials}
    </span>
  );
}

// Before anyone scores, every kid would be "1st"; show a dash instead until kick-off.
export function LeagueTable({ rows, started, emptyMessage }: { rows: Placed[]; started: boolean; emptyMessage: string }) {
  return (
    <section className="mt-14 overflow-hidden rounded-2xl bg-dugout/90 shadow-2xl ring-1 ring-chalk/15 backdrop-blur">
      <h2 className="px-5 pt-5 font-stadium text-3xl font-bold">League table</h2>
      {rows.length === 0 ? (
        <p className="px-5 pb-8 pt-3 font-card text-xl text-chalk/80">{emptyMessage}</p>
      ) : (
        <table className="mt-3 w-full font-card text-lg">
          <thead className="text-left text-sm text-chalk/60">
            <tr>
              <th scope="col" className="w-14 py-2 pl-5 font-medium">Pos</th>
              <th scope="col" className="py-2 font-medium">Player</th>
              <th scope="col" className="hidden py-2 font-medium sm:table-cell">Country</th>
              <th scope="col" className="hidden py-2 font-medium sm:table-cell">Club</th>
              <th scope="col" className="py-2 font-medium">Card</th>
              <th scope="col" className="py-2 pr-5 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-chalk/10 odd:bg-chalk/[0.03]">
                <td className={`py-2 pl-5 font-stadium text-2xl font-bold tabular-nums ${row.position <= 3 && row.score > 0 ? 'text-trophy' : ''}`}>
                  {started ? row.position : '–'}
                </td>
                <td className="py-2">
                  <span className="flex items-center gap-3">
                    <Avatar row={row} />
                    <span className="font-bold leading-tight">{row.name}</span>
                  </span>
                </td>
                <td className="hidden py-2 sm:table-cell">
                  <span className="block w-8"><Flag code={row.card.flag} /></span>
                </td>
                <td className="hidden py-2 sm:table-cell">
                  <span className="flex items-center gap-2">
                    <span className="block w-7"><ClubCrest club={row.card.club} /></span>
                    <span className="text-base text-chalk/70">{clubById(row.card.club).name}</span>
                  </span>
                </td>
                <td className="py-2">
                  <img src={templateUrl(row.card.tier)} alt={`Tier ${row.card.tier} card`} className="h-10 w-auto" />
                </td>
                <td className="py-2 pr-5 text-right font-stadium text-2xl font-bold tabular-nums">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
