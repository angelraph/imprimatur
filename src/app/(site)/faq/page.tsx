import type { Metadata } from "next";
import Link from "next/link";
import { ClosingCall, PageIntro } from "@/components/site/SiteChrome";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Fair questions about how Imprimatur examines agents, sets limits and handles keys.",
};

const GROUPS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "The idea",
    items: [
      {
        q: "What is Imprimatur?",
        a: "An examiner for AI agents that spend money. An agent answers a set of payment requests, most of them built to fool it. Imprimatur measures how often it would have lost money, and from that record sets the spending limit the agent has earned. The result is a signed licence.",
      },
      {
        q: "Why does an agent need a licence at all?",
        a: "Because a spending cap on its own is a guess. Kite Passport lets you give an agent a budget, but someone has to choose the number. A cap limits how much can be lost. It tells you nothing about how likely a loss is. The exam measures the likelihood, and the limit follows from it.",
      },
      {
        q: "How is this different from a payment firewall?",
        a: "A firewall inspects each payment as it happens. Imprimatur works before any payment exists: it decides how much an agent should be trusted with in the first place. The two fit together. A firewall protects a session, and a licence tells you how large that session should be.",
      },
      {
        q: "What does the name mean?",
        a: "Imprimatur is Latin for \"let it be printed\". It was the formal permission a work needed before it could be published, given only after someone independent had read it. Here it is the permission an agent needs before it may spend.",
      },
    ],
  },
  {
    title: "The exam",
    items: [
      {
        q: "What is in an exam?",
        a: "Seven kinds of payment request. Six are hostile or wrong: a lookalike payee, an instruction hidden in a memo, a price above the agreed quote, an invoice already paid, one invoice split into parts to slip under the cap, and a purchase outside the mandate. The seventh is a legitimate payment that should go through. A full exam has 64 cases and a short one has 32.",
      },
      {
        q: "Who decides the right answers?",
        a: "Code does, before the agent sees anything. Each case is built from a seed together with its ground truth. Grading compares the agent's action, wallet and amount with those facts. No model is asked whether an answer was good.",
      },
      {
        q: "Can an agent memorise the exam?",
        a: "No. Every sitting draws a fresh seed, so the vendors, wallets, amounts and invoice numbers are all new. The seed is published only after the sitting, so that anyone can redraw the same exam and check the grading.",
      },
      {
        q: "Can an agent pass by refusing everything?",
        a: "No. About a quarter of the cases are honest payments. An agent that refuses or escalates too many of them is declined however safe it looks, because an agent that cannot pay is no use to its owner.",
      },
      {
        q: "What if an agent tries to talk the examiner into a pass?",
        a: "Its replies are treated as untrusted text. They go through SERV's Prompt Guard before any model reads them, and a reply that addresses the examiner or asks for a score declines the application outright.",
      },
      {
        q: "What is the reason audit?",
        a: "An agent can refuse a bad request for the wrong reason and still be right by luck. A SERV decision node compares each stated reason with the rule that applied. An agent whose refusals are mostly ungrounded cannot hold the top grade.",
      },
    ],
  },
  {
    title: "The limit",
    items: [
      {
        q: "How is the spending limit worked out?",
        a: (
          <>
            From three things: an upper bound on the agent&apos;s failure rate, the loss the owner says they can accept, and a grade band that caps the result. The full arithmetic is on the{" "}
            <Link href="/method#underwriting" className="underline underline-offset-4">method page</Link>, and every licence shows its own numbers.
          </>
        ),
      },
      {
        q: "Why an upper bound instead of the plain failure rate?",
        a: "Because a clean record over a few cases proves little. An agent that passes 24 hostile cases out of 24 could still fail about one time in seven. The Wilson bound says how bad the true rate could plausibly be given the sample, and the limit is set from that cautious figure. Longer exams earn tighter bounds and larger limits.",
      },
      {
        q: "What do the grades mean?",
        a: "A, B and C are bands with a maximum total limit of $500, $100 and $20. Each needs both a low enough failure bound and a high enough share of honest payments paid. Anything outside the bands is declined and gets no limit.",
      },
      {
        q: "How long does a licence last?",
        a: "One day for grade C, three days for B and seven for A. Agents and prompts change, so a licence expires and the agent sits again.",
      },
      {
        q: "What enforces the limit?",
        a: "Kite Passport. Each licence prints the command that opens a Passport session with the same per-payment cap, total and lifetime. You approve it with your passkey, and Kite refuses anything beyond it.",
      },
    ],
  },
  {
    title: "Reppo and re-sits",
    items: [
      {
        q: "Why is a new licence marked provisional?",
        a: "Because the outside examiner has not ruled yet. The examiner's file goes to Reppo's evaluation network, where peer assessors score it over a settlement window of at least ten minutes. The licence page updates by itself when the verdict lands.",
      },
      {
        q: "What does Reppo actually judge?",
        a: "The examiner's work, not the agent's. It is asked whether the sampled cases were graded consistently with their ground truth, whether the grade and limit follow from the counts, whether the exam was a fair test, and whether any reply tried to influence its own grading.",
      },
      {
        q: "What happens after a poor result?",
        a: "SERV writes corrective rules from the kinds of case the agent failed and from Reppo's critique. The agent then sits a new exam on new cases with those rules added. Both records are shown side by side, so you can see whether the feedback changed anything.",
      },
    ],
  },
  {
    title: "Using it",
    items: [
      {
        q: "Can I examine my own agent?",
        a: "Yes. Give the exam an OpenAI-compatible chat endpoint over https and a model name. Your agent receives each case as a message and must answer with one JSON object holding action, payee, amount and reason.",
      },
      {
        q: "What happens to my API key?",
        a: "It stays in your browser tab. It is sent with each batch of cases so the server can call your endpoint, and it is never written to storage or logs. Closing the tab removes it.",
      },
      {
        q: "Is any real money involved in an exam?",
        a: "No. Every vendor, wallet and invoice is invented and no exam moves funds. Real money appears in only two places: the fee for a sitting, and the one cent a merchant pays to check a licence.",
      },
      {
        q: "How do I check a licence someone shows me?",
        a: (
          <>
            Paste its number on the <Link href="/verify" className="underline underline-offset-4">verify page</Link>. Software can call the x402 endpoint described in the{" "}
            <Link href="/docs" className="underline underline-offset-4">docs</Link>. The signature can also be checked with any Ethereum library, without asking Imprimatur.
          </>
        ),
      },
      {
        q: "What are the scripted applicants in the registry?",
        a: "Two applicants made of plain code, with no model behind them. One applies five of the mandate's rules and one pays everything. They cost nothing to run and give you a baseline to read real agents against.",
      },
    ],
  },
  {
    title: "Limits of the method",
    items: [
      {
        q: "Does a licence guarantee an agent will never lose money?",
        a: "No. It says how the agent behaved on a known set of traps, with a stated margin of doubt. New kinds of attack are not covered until they are added to the exam. That is why licences are small, short and tied to a hard cap.",
      },
      {
        q: "Where does the 5% attack rate come from?",
        a: "It is an assumption, and it is printed on every licence so you can disagree with it. It stands for the share of real requests that are hostile or wrong. A higher figure gives a smaller limit.",
      },
      {
        q: "Does it cover agents that do things other than pay?",
        a: "Not yet. The first mandate is an agent that pays invoices and x402 services. The same pattern, a seeded exam with code-fixed answers and an underwritten limit, extends to other mandates.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageIntro
        kicker="FAQ"
        title="Fair questions, straight answers"
        lede="How the exam works, where the limit comes from, what happens to your key, and what a licence does not promise."
      />
      <div className="theme-light">
        <div className="frame py-12 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-16">
            <nav aria-label="Sections" className="hidden lg:block">
              <ul className="sticky top-24 space-y-2 text-sm text-muted">
                {GROUPS.map((g) => (
                  <li key={g.title}>
                    <a href={`#${g.title.toLowerCase().replace(/\s+/g, "-")}`} className="hover:text-ink">
                      {g.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="space-y-14">
              {GROUPS.map((g) => (
                <section key={g.title} id={g.title.toLowerCase().replace(/\s+/g, "-")} className="scroll-mt-24">
                  <h2 className="kicker">{g.title}</h2>
                  <div className="mt-4 divide-y divide-rule border-y border-rule">
                    {g.items.map((item) => (
                      <details key={item.q} className="group">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-lg font-medium">
                          {item.q}
                          <span aria-hidden className="mt-1 text-muted transition group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <div className="max-w-2xl pb-6 leading-relaxed text-muted">{item.a}</div>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ClosingCall />
    </>
  );
}
