"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow } from "../ui";

export interface Audience {
  id: string;
  tab: string;
  title: string;
  text: string;
  stats: { value: string; label: string }[];
  note: string;
  cta: { href: string; label: string };
}

export function AudienceTabs({ audiences }: { audiences: Audience[] }) {
  const [active, setActive] = useState(audiences[0].id);
  const a = audiences.find((x) => x.id === active)!;

  return (
    <div>
      <div role="tablist" aria-label="Who Imprimatur is for" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-4">
        {audiences.map((x) => (
          <button
            key={x.id}
            role="tab"
            type="button"
            id={`tab-${x.id}`}
            aria-selected={x.id === active}
            aria-controls="audience-panel"
            onClick={() => setActive(x.id)}
            className={`min-h-10 shrink-0 rounded-md px-3 text-sm transition ${
              x.id === active ? "bg-card font-medium text-ink ring-1 ring-rule" : "text-muted hover:text-ink"
            }`}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div id="audience-panel" role="tabpanel" aria-labelledby={`tab-${a.id}`} className="grid border-t border-rule lg:grid-cols-[1fr_22rem]">
        <div className="bg-card p-6 sm:p-10">
          <h3 className="display text-3xl sm:text-4xl lg:text-5xl">{a.title}</h3>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">{a.text}</p>
          <Link href={a.cta.href} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
            {a.cta.label} <Arrow />
          </Link>
          <dl className="mt-12 grid gap-6 sm:mt-20 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule">
            {a.stats.map((s, i) => (
              <div key={s.label} className={i === 0 ? "sm:pr-6" : "sm:px-6"}>
                <dd className="text-3xl font-medium tracking-tight">{s.value}</dd>
                <dt className="mt-1 text-sm text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="theme-dark band-glow flex flex-col justify-between gap-10 p-6 sm:p-10">
          <p className="text-xl font-medium leading-snug sm:text-2xl">{a.note}</p>
          <Link
            href="/method"
            className="inline-flex min-h-10 w-fit items-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-paper transition hover:bg-accent hover:text-white"
          >
            See the method <Arrow />
          </Link>
        </div>
      </div>
    </div>
  );
}
