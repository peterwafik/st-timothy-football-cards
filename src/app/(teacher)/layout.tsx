import Link from 'next/link';
import { requireTeacher } from '@/lib/auth';
import { signOut } from './actions';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { teacher } = await requireTeacher();
  const links = [
    ['/log', 'Log'], ['/adjust', 'Bonus / Deduct'], ['/kids', 'Kids'], ['/history', 'History'],
    ...(teacher.role === 'admin' ? [['/settings', 'Settings']] : []),
  ];
  return (
    <div className="min-h-dvh bg-pitch">
      <nav className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 bg-pitch-light px-4 py-3 font-card text-lg uppercase print:hidden">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="hover:text-gold">{label}</Link>
        ))}
        <span className="ml-auto text-sm normal-case text-white/60">{teacher.name}</span>
        <form action={signOut}><button className="text-sm text-white/80 underline">Sign out</button></form>
      </nav>
      <div className="mx-auto max-w-3xl p-4 print:max-w-none print:p-0">{children}</div>
    </div>
  );
}
