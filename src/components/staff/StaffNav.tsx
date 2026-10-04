'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Tab bar for the leaders' pages; the current page's tab is lit up like a scoreboard.
export function StaffNav({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Leaders" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-max gap-1 rounded-full bg-dugout/80 p-1 ring-1 ring-chalk/15">
        {links.map(({ href, label }) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-full px-4 py-2 font-card text-lg font-bold transition-colors ${
                  active ? 'bg-trophy text-dugout' : 'text-chalk/80 hover:bg-chalk/10 hover:text-chalk'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
