import Link from 'next/link';
import { ClubCrest } from '@/components/ClubCrest';
import { PitchMarkings } from '@/components/league/PitchMarkings';
import { StadiumBackground } from '@/components/league/StadiumBackground';
import { isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/config';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const initial = !isSupabaseConfigured()
    ? NOT_CONFIGURED_MESSAGE
    : error === 'not-teacher'
      ? 'This account is not a servant. Ask the admin to add you.'
      : null;
  return (
    <StadiumBackground>
      <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 py-10">
        <PitchMarkings />
        <span className="relative block w-28 drop-shadow-2xl"><ClubCrest club="st-timothy" /></span>
        <div className="relative text-center">
          <h1 className="font-stadium text-6xl font-extrabold leading-none">Leaders login</h1>
          <p className="mt-2 font-card text-lg text-chalk/75">Log sessions and keep the St. Timothy squad’s cards up to date.</p>
        </div>
        <LoginForm initialError={initial} />
        <Link href="/" className="relative font-card text-base text-chalk/70 underline hover:text-chalk">Back to the league table</Link>
      </div>
    </StadiumBackground>
  );
}
