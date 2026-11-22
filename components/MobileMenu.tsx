'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-white hover:bg-white/5" aria-label="Меню" aria-expanded={open}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-white/10 bg-ink px-4 pb-4">
          {[...items, { href: '/favorites', label: 'Избранное' }].map((n) => (
            <Link key={n.href} href={n.href} className="block border-b border-white/5 py-3 text-base font-medium text-white/85">{n.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
