import type { Metadata } from "next";
import Link from "next/link";
import { ClosingCall, PageIntro } from "@/components/site/SiteChrome";
import { Arrow, usd } from "@/components/ui";
import { EXAM_SIZES } from "@/lib/exam/types";
import { PRICES, DOLPHIN_MODEL } from "@/lib/providers/chat";
import { EXAM_FEE_USD, VERIFY_FEE_USD } from "@/lib/types";

export const metadata: Metadata = {
  title: "Pricing",
  description: "What a sitting and a licence check cost, and what they cost Imprimatur to run.",
};

const cases = (s: { perAttackClass: number; legit: number }) => s.perAttackClass * 6 + s.legit;

const PLANS = [
  {
    name: "Short exam",
    price: usd(EXAM_FEE_USD.quick),
    unit: "per sitting",
    points: [`${cases(EXAM_SIZES.quick)} cases on a fresh seed`, "Signed licence with Kite limits", "Reppo confirmation", "One re-sit record, side by side"],
    note: "Enough to find an open hole. The limit is smaller because the sample is.",
  },
  {
    name: "Full exam",
    price: usd(EXAM_FEE_USD.full),
    unit: "per sitting",
    points: [`${cases(EXAM_SIZES.full)} cases on a fresh seed`, "A tighter failure bound, so a larger limit", "Reppo confirmation", "One re-sit record, side by side"],
    note: "The sitting to take before an agent is given real money.",
    featured: true,
  },
  {
    name: "Licence check",
    price: usd(VERIFY_FEE_USD),
    unit: "per call",
    points: ["Signature, status, grade and limits", "Paid over x402 from a Kite Passport session", "No account and no API key", "Free on the website for people"],
    note: "For merchants and agents deciding whether to serve a licensed agent.",
  },
];

export default function PricingPage() {
  const dolphin = PRICES[DOLPHIN_MODEL];
  return (
    <>
      <PageIntro
        kicker="Pricing"
        title="Pay for the exam, not the seat"
        lede="A fee per sitting and a cent per check. No subscription. Licences expire, so an agent in use sits again."
      />
      <div className="theme-light">
        <div className="frame py-12 sm:py-16">
          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((p) => (
              <article key={p.name} className={`flex flex-col rounded-lg border p-6 sm:p-8 ${p.featured ? "border-accent bg-raised" : "border-rule bg-card"}`}>
                <p className="kicker">{p.name}</p>
                <p className="mt-6">
                  <span className="display text-5xl">{p.price}</span> <span className="text-muted">{p.unit}</span>
                </p>
                <p className="mt-4 text-muted">{p.note}</p>
                <ul className="mt-6 space-y-2.5 border-t border-rule pt-6 text-sm">
                  {p.points.map((x) => (
                    <li key={x} className="flex gap-2.5">
                      <span aria-hidden className="text-accent">+</span>
                      {x}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className="mt-6 text-sm text-muted">
            During SERV Hackathon 02 the sittings on this site are free and capped per visitor per day. The fees above are what each licence page uses when it shows its margin.
          </p>

          <section className="mt-20 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="kicker">Unit economics</p>
              <h2 className="display mt-4 text-3xl sm:text-4xl">What a sitting costs to run</h2>
              <p className="mt-5 text-lg text-muted">
                Every licence page carries its own ledger: tokens used at each step, priced from the providers&apos; published rates, next to the fee. You do not have to take the margin on trust.
              </p>
              <Link href="/registry" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
                Open a licence and read its ledger <Arrow />
              </Link>
            </div>
            <dl className="divide-y divide-rule border-y border-rule">
              {[
                ["Open model on Dolphin", `${usd(dolphin.in)} in and ${usd(dolphin.out)} out per million tokens. A full sitting uses tens of thousands of tokens, a fraction of a cent.`],
                ["SERV Reasoning", "A small model reads messy replies, audits reasons and writes corrective rules. Charged per token at SERV's listed price."],
                ["Reppo", "One evaluation per sitting, paid in Reppo credits. A file costs about 22 cents and is charged only when a verdict comes back."],
                ["Kite", "Opening a Passport session costs nothing here. Checks are paid by whoever asks."],
              ].map(([t, d]) => (
                <div key={t} className="py-5">
                  <dt className="font-semibold">{t}</dt>
                  <dd className="mt-1 text-muted">{d}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-20">
            <p className="kicker">Why it recurs</p>
            <h2 className="display mt-4 max-w-2xl text-3xl sm:text-4xl">Three reasons an agent comes back</h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                ["Licences expire", "One day, three days or seven, by grade. An agent in daily use sits about once a week at the top grade."],
                ["Agents change", "A new prompt or model changes the fingerprint. The old licence no longer describes the agent that is running."],
                ["Limits grow with evidence", "A longer exam and a clean re-sit earn a tighter bound and a larger limit. Owners who want more headroom sit more."],
              ].map(([t, d]) => (
                <article key={t} className="rounded-lg border border-rule bg-card p-6 sm:p-8">
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-muted">{d}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
      <ClosingCall />
    </>
  );
}
