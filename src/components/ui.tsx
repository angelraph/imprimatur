import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Outcome } from "@/lib/exam/types";
import type { LicenceStatus } from "@/lib/licence/licence";
import type { Grade } from "@/lib/underwrite/underwrite";

export const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const smallUsd = (n: number) => (n > 0 && n < 0.01 ? `$${n.toFixed(4)}` : usd(n));

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function day(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function Wordmark({ href = "/", size = 28 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Imprimatur, home">
      <Image src="/mark.png" alt="" width={Math.round(size * 1.25)} height={size} priority />
      <span className="text-lg font-semibold tracking-tight">Imprimatur</span>
    </Link>
  );
}

export function Seal({ grade, animate = false, size = "lg" }: { grade: Grade; animate?: boolean; size?: "sm" | "lg" }) {
  const declined = grade === "Declined";
  const box = size === "lg" ? "h-28 w-28 text-5xl" : "h-12 w-12 text-xl";
  return (
    <div
      role="img"
      aria-label={declined ? "Declined" : `Grade ${grade}`}
      className={`seal ${animate ? "seal-animate" : ""} ${box} flex shrink-0 flex-col items-center justify-center rounded-full border-2 ${
        declined ? "border-muted text-muted" : "border-accent text-accent"
      }`}
    >
      <span className="font-semibold leading-none">{declined ? "✕" : grade}</span>
      {size === "lg" && (
        <span className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-[0.2em]">{declined ? "declined" : "imprimatur"}</span>
      )}
    </div>
  );
}

const STATUS_COPY: Record<LicenceStatus, { label: string; tone: string }> = {
  provisional: { label: "Provisional", tone: "bg-warn-soft text-warn" },
  confirmed: { label: "Confirmed by Reppo", tone: "bg-pass-soft text-pass" },
  held: { label: "Held by Reppo", tone: "bg-warn-soft text-warn" },
  refused: { label: "Refused by Reppo", tone: "bg-bad-soft text-bad" },
  suspended: { label: "Suspended", tone: "bg-bad-soft text-bad" },
  declined: { label: "Declined", tone: "bg-raised text-muted" },
};

export function StatusBadge({ status }: { status: LicenceStatus }) {
  const s = STATUS_COPY[status];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.tone}`}>{s.label}</span>;
}

const OUTCOME_COPY: Record<Outcome, { label: string; tone: string }> = {
  correct: { label: "Correct", tone: "bg-pass-soft text-pass" },
  loss: { label: "Money lost", tone: "bg-bad-soft text-bad" },
  false_refusal: { label: "Wrongly refused", tone: "bg-warn-soft text-warn" },
  friction: { label: "Needless escalation", tone: "bg-warn-soft text-warn" },
  invalid: { label: "Unreadable", tone: "bg-raised text-muted" },
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const o = OUTCOME_COPY[outcome];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${o.tone}`}>{o.label}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-rule bg-card p-4 sm:p-6 ${className}`}>{children}</div>;
}

export function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-xl border border-rule bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-3 sm:px-6">
        <h2 className="text-sm font-semibold">{title}</h2>
        {aside}
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function Fact({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{value}</dd>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({ kicker, title, lede, actions }: { kicker?: string; title: string; lede?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {lede && <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">{lede}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";

export const quietButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rule bg-raised px-5 py-2.5 text-sm font-semibold transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50";

export function Arrow() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 2.5 9.5 7 5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
