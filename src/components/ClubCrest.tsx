import { clubById } from '@/lib/clubs';

const SHIELD = 'M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z';

export function ClubCrest({ club }: { club: string }) {
  const c = clubById(club);
  if (c.logo) {
    return <img src={c.logo} alt={c.name} className="block aspect-square h-auto w-full object-contain drop-shadow" />;
  }
  // St. Timothy has no official crest: draw a gold/navy shield.
  return (
    <svg viewBox="0 0 40 46" className="block h-auto w-full drop-shadow" aria-label={c.name}>
      <path d={SHIELD} fill="#14213d" stroke="#d4af37" strokeWidth="2" />
      <path d="M20 9 V37 M11 18 H29" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
