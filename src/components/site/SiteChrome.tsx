import Link from "next/link";
import { Arrow, Wordmark } from "../ui";

const LINKS = [
  { href: "/method", label: "Method" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
  { href: "/registry", label: "Registry" },
];

export function SiteNav() {
  return (
    <header className="theme-dark sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="frame flex h-16 items-center justify-between gap-4 !border-x-0">
        <Wordmark />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-3 text-sm font-semibold text-paper transition hover:bg-accent hover:text-white sm:px-4"
          >
            Open the app <Arrow />
          </Link>
          <details className="relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-rule" aria-label="Menu">
              <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M3 5h12M3 9h12M3 13h12" />
              </svg>
            </summary>
            <nav aria-label="Menu" className="absolute right-0 top-12 w-52 rounded-xl border border-rule bg-card p-2 shadow-2xl">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-raised">
                  {l.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

const FOOTER = [
  {
    title: "Product",
    links: [
      { href: "/dashboard", label: "Examination office" },
      { href: "/sit", label: "Sit an exam" },
      { href: "/registry", label: "Registry" },
      { href: "/verify", label: "Verify a licence" },
    ],
  },
  {
    title: "Read",
    links: [
      { href: "/method", label: "Method" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Docs" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Built on",
    links: [
      { href: "https://www.openserv.ai/", label: "SERV Reasoning" },
      { href: "https://dphn.ai/", label: "Dolphin" },
      { href: "https://reppo.xyz/", label: "Reppo" },
      { href: "https://gokite.ai/", label: "Kite" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="theme-dark border-t border-rule">
      <div className="frame grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">Get verified. Spend with confidence.</p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.href.startsWith("http") ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="transition hover:text-ink">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="transition hover:text-ink">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-rule">
        <div className="frame flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Built for SERV Hackathon 02. Every vendor, wallet and invoice in an exam is invented.</p>
          <p>Imprimatur, 2026</p>
        </div>
      </div>
    </footer>
  );
}

// The left-heading, right-lede opening that every reading section shares.
export function SectionIntro({ kicker, title, lede, children }: { kicker: string; title: React.ReactNode; lede: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="kicker">{kicker}</p>
      <div className="mt-10 grid gap-6 lg:mt-16 lg:grid-cols-2 lg:gap-16">
        <h2 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
        <div className="lg:pt-2">
          <p className="text-lg leading-snug sm:text-xl">{lede}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PageIntro({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <section className="theme-dark hero-glow border-b border-rule">
      <div className="frame py-16 sm:py-24">
        <p className="kicker">{kicker}</p>
        <h1 className="display mt-6 max-w-3xl text-4xl sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-snug text-muted sm:text-xl">{lede}</p>
      </div>
    </section>
  );
}

export function ClosingCall() {
  return (
    <section className="theme-dark band-glow">
      <div className="frame py-20 text-center sm:py-28">
        <h2 className="display mx-auto max-w-3xl text-4xl sm:text-6xl">Know the limit before the first payment</h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Sit an exam in two minutes, with no account and no key. Read every case it was graded on.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/sit" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-ink px-6 text-sm font-semibold text-paper transition hover:bg-accent hover:text-white">
            Sit an exam <Arrow />
          </Link>
          <Link href="/registry" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-rule px-6 text-sm font-semibold transition hover:border-accent">
            Read the registry
          </Link>
        </div>
      </div>
    </section>
  );
}
