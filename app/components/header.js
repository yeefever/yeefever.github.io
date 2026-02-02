'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 flex-shrink-0 border-r border-[var(--border)] bg-[var(--background)]">
      <nav className="sticky top-0 py-8 px-6">
        <ul className="flex flex-col gap-4 text-sm tracking-wide">
          {navItems.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={
                    isActive
                      ? 'text-[var(--foreground)] font-medium'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors'
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
