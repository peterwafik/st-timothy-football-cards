import Link from 'next/link';
import { ClubCrest } from '@/components/ClubCrest';
import { StadiumBackground } from '@/components/league/StadiumBackground';
import { StaffNav } from '@/components/staff/StaffNav';
import { requireTeacher } from '@/lib/auth';
import { signOut } from './actions';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { teacher } = await requireTeacher();
  const links = [
    { href: '/log', label: 'Log' },
    { href: '/adjust', label: 'Bonus / Deduct' },
    { href: '/kids', label: 'Kids' },
    { href: '/history', label: 'History' },
    ...(teacher.role === 'admin' ? [{ href: '/settings', label: 'Settings' }] : []),
  ];
  return (
    <StadiumBackground>
      <header className="flex flex-col gap-4 py-5 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex flex-1 items-center gap-3">
            <span className="block w-11"><ClubCrest club="st-timothy" /></span>
            <span className="font-stadium text-lg font-semibold sm:text-xl">St. Timothy Leaders</span>
          </Link>
          <span className="hidden font-card text-base text-chalk/70 sm:inline">{teacher.name}</span>
          <form action={signOut}>
            <button className="rounded-full border border-chalk/30 px-3 py-1.5 font-card text-sm font-bold hover:bg-chalk hover:text-dugout">
              Sign out
            </button>
          </form>
        </div>
        <StaffNav links={links} />
      </header>
      <div className="pt-2 print:p-0">{children}</div>
    </StadiumBackground>
  );
}
