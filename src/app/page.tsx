import Link from 'next/link';
import { SquadGrid } from '@/components/SquadGrid';
import { loadClassSnapshot, type ClassSnapshot } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Public home page: no account needed. Teachers sign in from the button.
export default async function Home() {
  let snap: ClassSnapshot | null = null;
  try {
    snap = await loadClassSnapshot();
  } catch {
    // Database not reachable or not configured yet: still show the welcome screen.
  }
  const showSquad = snap !== null && snap.settings.leaderboard_public;

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 p-4">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="flex-1 font-card text-4xl font-bold uppercase text-gold sm:text-5xl">St. Timothy Squad</h1>
        <Link href="/login" className="rounded-full bg-gold px-5 py-2 font-card text-lg font-bold uppercase text-pitch">
          Leaders login
        </Link>
      </header>
      {showSquad ? (
        <SquadGrid snap={snap!} />
      ) : (
        <p className="mt-16 text-center text-lg text-white/70">
          Welcome to the St. Timothy Sunday School squad! Scan your QR code to see your player card.
        </p>
      )}
    </main>
  );
}
