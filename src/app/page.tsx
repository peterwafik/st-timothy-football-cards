import { Leaderboard } from '@/components/league/Leaderboard';
import { leagueRows, loadClassSnapshot, type ClassSnapshot } from '@/lib/data';
import { seasonLabel } from '@/lib/standings';
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

// Public home page (no account needed): the league table. Teachers sign in from the header.
export default async function Home() {
  let snap: ClassSnapshot | null = null;
  if (isSupabaseConfigured()) {
    try {
      snap = await loadClassSnapshot();
    } catch {
      // Database unreachable: fall through to the empty table with a message.
    }
  }

  const now = new Date();
  const fallbackSeason = seasonLabel(String(now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1));
  if (!snap) {
    const message = isSupabaseConfigured()
      ? 'The league table could not be loaded. Try again in a minute.'
      : NOT_CONFIGURED_MESSAGE;
    return <Leaderboard rows={[]} season={fallbackSeason} showLogin emptyMessage={message} />;
  }
  if (!snap.settings.leaderboard_public) {
    return (
      <Leaderboard
        rows={[]}
        season={seasonLabel(snap.settings.season_start)}
        showLogin
        emptyMessage="The league table is private this season. Scan your QR code to see your own card."
      />
    );
  }
  return <Leaderboard rows={leagueRows(snap)} season={seasonLabel(snap.settings.season_start)} showLogin />;
}
