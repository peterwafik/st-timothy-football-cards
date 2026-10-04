import Link from 'next/link';
import { ClubCrest } from '../ClubCrest';

const PILL =
  'rounded-full border border-chalk/40 px-4 py-1.5 font-card text-base font-bold hover:bg-chalk hover:text-dugout focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-floodlight';

export function SiteHeader({ link }: { link?: { href: string; label: string } }) {
  return (
    <header className="flex items-center gap-3 py-5">
      <Link href="/" className="flex flex-1 items-center gap-3">
        <span className="block w-8"><ClubCrest club="st-timothy" /></span>
        <span className="font-stadium text-lg font-semibold sm:text-xl">St. Timothy Sunday School</span>
      </Link>
      {link && <Link href={link.href} className={PILL}>{link.label}</Link>}
    </header>
  );
}
