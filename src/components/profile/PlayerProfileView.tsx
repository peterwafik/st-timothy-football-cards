import { ClubCrest } from '../ClubCrest';
import { DownloadCardButton } from '../DownloadCardButton';
import { Flag } from '../Flag';
import { PlayerCard } from '../PlayerCard';
import { SiteHeader } from '../league/SiteHeader';
import { StadiumBackground } from '../league/StadiumBackground';
import { AttendanceList } from './AttendanceList';
import { RadarChart } from './RadarChart';
import { RecentActivity } from './RecentActivity';
import { StatBars } from './StatBars';
import { clubById } from '@/lib/clubs';
import { formatLongDate } from '@/lib/dates';
import { FLAGS } from '@/lib/flags';
import { POSITIONS } from '@/lib/positions';
import { ordinal, seasonLabel } from '@/lib/standings';
import { templateForTier } from '@/lib/card';
import type { PlayerProfile } from '@/lib/data';

const PANEL = 'rounded-2xl bg-dugout/90 p-5 shadow-2xl ring-1 ring-chalk/15 backdrop-blur sm:p-7';

function KeyNumber({ value, label, children }: { value: string; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl bg-dugout/70 px-2 py-3 text-center ring-1 ring-chalk/10 sm:justify-start sm:px-4 sm:text-left">
      {children}
      <div>
        <p className="font-stadium text-3xl font-extrabold leading-none tabular-nums sm:text-4xl">{value}</p>
        <p className="mt-1 font-card text-xs text-chalk/70 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}

export function PlayerProfileView({ profile }: { profile: PlayerProfile }) {
  const { card } = profile;
  const position = POSITIONS.find((p) => p.code === card.position);
  const country = FLAGS.find((f) => f.code === card.flag)?.name ?? 'Egypt';
  const club = clubById(card.club);
  const fileName = `${profile.name.replace(/\s+/g, '-')}-card.png`;

  return (
    <StadiumBackground>
      <SiteHeader link={{ href: '/', label: 'League table' }} />

      <section className="grid items-center gap-8 pt-4 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="relative mx-auto flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(closest-side, var(--color-floodlight), transparent)' }}
          />
          <div id="card" className="relative p-2">
            <PlayerCard data={card} width={290} />
          </div>
          <div className="relative">
            <DownloadCardButton targetId="card" fileName={fileName} />
          </div>
        </div>

        <div className="text-center md:text-left">
          {position && (
            <p className="font-card text-xl text-chalk/80">
              <span className="mr-2 rounded-md bg-chalk px-2 py-0.5 font-stadium text-2xl font-extrabold text-dugout">{position.code}</span>
              {position.name}
            </p>
          )}
          <h1 className="mt-3 font-stadium text-6xl font-extrabold leading-[0.9] sm:text-7xl">{profile.name}</h1>
          {!card.active && <p className="mt-3 font-card text-xl text-trophy">Retired from the squad</p>}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-card text-lg md:justify-start">
            <span className="flex items-center gap-2"><span className="block w-8"><Flag code={card.flag} /></span>{country}</span>
            <span className="flex items-center gap-2"><span className="block w-7"><ClubCrest club={card.club} /></span>{club.name}</span>
          </div>
          <p className="mt-2 font-card text-base text-chalk/60">In the squad since {formatLongDate(profile.joinedOn)}</p>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <KeyNumber
              value={profile.leaguePosition ? ordinal(profile.leaguePosition) : '–'}
              label={profile.leaguePosition ? `of ${profile.squadSize} in the league` : 'League position'}
            />
            <KeyNumber value={String(profile.score)} label={`Points, ${seasonLabel(profile.seasonStart).replace('Season ', '')}`} />
            <KeyNumber value={String(card.tier)} label="Card tier">
              <img src={`/templates/${templateForTier(card.tier)}.png`} alt="" className="hidden h-12 w-auto sm:block" />
            </KeyNumber>
          </div>
        </div>
      </section>

      <section className={`mt-12 ${PANEL}`}>
        <h2 className="mb-5 font-stadium text-3xl font-bold">Stats</h2>
        <StatBars stats={card.stats} sskRated={profile.sskRated} />
      </section>

      <section className={`mt-6 ${PANEL}`}>
        <h2 className="mb-2 font-stadium text-3xl font-bold">Strengths & weaknesses</h2>
        <RadarChart stats={card.stats} sskRated={profile.sskRated} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={PANEL}>
          <h2 className="mb-2 font-stadium text-3xl font-bold">Attendance & Points</h2>
          <AttendanceList rows={profile.breakdown} />
        </section>
        <section className={PANEL}>
          <h2 className="mb-2 font-stadium text-3xl font-bold">Recent activity</h2>
          <RecentActivity items={profile.recent} />
        </section>
      </div>
    </StadiumBackground>
  );
}
