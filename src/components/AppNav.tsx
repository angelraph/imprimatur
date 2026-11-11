"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1V9.5Z" },
  { href: "/registry", label: "Registry", icon: "M4 4h12v3H4V4Zm0 4.5h12v3H4v-3ZM4 13h12v3H4v-3Z" },
  { href: "/sit", label: "Sit an exam", icon: "M5 3h7l3 3v11H5V3Zm2.5 7.5 2 2 3.5-4" },
  { href: "/verify", label: "Verify", icon: "M10 2.5 16 5v4.5c0 3.6-2.4 6.6-6 8-3.6-1.400-6-4.400-6-8V5l6-2.500Zm-2.500 7.500 2 2 3.500-4" },
];

const MORE = [
  { href: "/method", label: "Method" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export function AppNav() {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(`${href}/`) || (href === "/registry" && path.startsWith("/licence"));

  return (
    <nav aria-label="App" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active(item.href) ? "page" : undefined}
          className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            active(item.href) ? "bg-raised text-ink" : "text-muted hover:bg-card hover:text-ink"
          }`}
        >
          <svg aria-hidden width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
            <path d={item.icon} />
          </svg>
          {item.label}
        </Link>
      ))}
      <div className="hidden lg:mt-6 lg:block">
        <p className="kicker px-3">Read</p>
        <div className="mt-2 flex flex-col gap-1">
          {MORE.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-card hover:text-ink">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
