import { clubById } from '@/lib/clubs';

// Every club, St. Timothy included, has a real logo image (St. Timothy's is the church's round icon).
export function ClubCrest({ club }: { club: string }) {
  const c = clubById(club);
  return <img src={c.logo} alt={c.name} className="block aspect-square h-auto w-full object-contain drop-shadow" />;
}
