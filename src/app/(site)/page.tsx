import Link from "next/link";
import { AudienceTabs, type Audience } from "@/components/site/AudienceTabs";
import { FunnelArt, LoopArt, OrbitArt, StackArt } from "@/components/site/art";
import { ClosingCall, SectionIntro } from "@/components/site/SiteChrome";
import { Arrow, usd } from "@/components/ui";
import { generateExam } from "@/lib/exam/generator";
import { CLASS_LABEL, EXAM_SIZES } from "@/lib/exam/types";
import { EXAM_GRAPH } from "@/lib/graph/nodes";
import { summarise } from "@/lib/stats";
import { listLicences } from "@/lib/store";
import { EXAM_FEE_USD, VERIFY_FEE_USD } from "@/lib/types";

export const dynamic = "force-dynamic";

const AUDIENCES: Audience[] = [
  {
    id: "owners",
    tab: "Agent owners",
    title: "Set a cap you can defend",
    text: "Kite Passport asks you for a per-payment cap and a total. Today that number is a guess. Imprimatur gives you one that follows from how your agent behaved on hostile requests.",
    stats: [
      { value: "64", label: "cases in a full exam" },
      { value: "7", label: "kinds of request, six of them hostile" },
      { value: "4 min", label: "from start to a signed licence" },
    ],
    note: "A spending cap limits how much an agent can lose. It says nothing about how often it will. The exam measures that.",
    cta: { href: "/sit", label: "Examine your agent" },
  },
  {
    id: "merchants",
    tab: "Merchants and x402 sellers",
    title: "Know who is at the till",
    text: "An agent arrives with a wallet and a request. One call tells you whether it holds a licence in force, what grade it earned and how much it may spend.",
    stats: [
      { value: usd(VERIFY_FEE_USD), label: "per check, paid over x402" },
      { value: "0", label: "accounts or API keys needed" },
      { value: "1", label: "signature anyone can verify" },
    ],
    note: "Identity tells you who the agent is. A licence tells you what it has shown it can be trusted with.",
    cta: { href: "/verify", label: "Verify a licence" },
  },
  {
    id: "builders",
    tab: "Agent builders",
    title: "Find the hole before a stranger does",
    text: "Point the exam at any OpenAI-compatible endpoint. You get every case your agent failed, the ground truth for each, and corrective rules written from its mistakes.",
    stats: [
      { value: "Fresh", label: "seed on every sitting" },
      { value: "100%", label: "of cases open to read afterwards" },
      { value: "1", label: "re-sit to show the fix worked" },
    ],
    note: "The re-sit draws new cases. A higher score cannot come from memory, only from the agent getting better.",
    cta: { href: "/sit", label: "Bring your endpoint" },
  },
  {
    id: "risk",
    tab: "Risk and compliance",
    title: "A file you can hand to an auditor",
    text: "Each licence carries the seed, a hash of every reply, the underwriting arithmetic and the verdict of an examiner who did not build the agent or write the exam.",
    stats: [
      { value: "95%", label: "confidence bound, not a point estimate" },
      { value: "3", label: "independent checks: code, SERV, Reppo" },
      { value: "0", label: "grades given by the agent to itself" },
    ],
    note: "The system that decides should never be the only one grading the decision. Here it is not even one of them.",
    cta: { href: "/method", label: "Read the method" },
  },
];

const PARTNERS = [
  { name: "SERV Reasoning", role: "Runs the typed judgements: reads messy replies, audits reasons, writes corrective rules. Prompt Guard, Shadow Agent and Multipath are on." },
  { name: "Dolphin", role: "The open model in the dock. DeepSeek V4.1 Flash on a decentralised network sits the exam and drafts the examiner's note." },
  { name: "Reppo", role: "The outside examiner. Its evaluation network scores the examiner's file and confirms, holds or refuses the licence." },
  { name: "Kite", role: "Enforcement and the till. The licence becomes a Passport session with the same limits, and checks are paid over x402." },
];

export default async function LandingPage() {
  const records = await listLicences();
  const s = summarise(records);
  const specimen = generateExam("specimen", EXAM_SIZES.quick).filter((c) => c.cls !== "legit");
  const heroCase = specimen.find((c) => c.cls === "lookalike") ?? specimen[0];
  const exhibits = ["injection", "split", "overcharge"].map((cls) => specimen.find((c) => c.cls === cls)!);

  return (
    <>
      {/* Hero */}
      <section className="theme-dark hero-glow relative overflow-hidden border-b border-rule">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[38rem] max-w-3xl opacity-70">
          <OrbitArt />
        </div>
        <div className="frame relative pb-16 pt-10 sm:pb-24 sm:pt-14">
          <div className="rise mx-auto max-w-2xl rounded-2xl border border-rule bg-card/80 p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="kicker">[seed specimen, case {heroCase.id.slice(-2)}]</p>
              <span className="rounded-full bg-bad-soft px-2.5 py-0.5 text-xs font-medium text-bad">{CLASS_LABEL[heroCase.cls]}</span>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Vendor", heroCase.request.vendorName],
                ["Payment domain", heroCase.request.payeeDomain],
                ["Pay to wallet", heroCase.request.payeeWallet],
                ["Amount", usd(heroCase.request.askedAmount)],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-32 shrink-0 text-muted">{k}</dt>
                  <dd className="break-anywhere min-w-0 font-mono text-xs leading-5">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-rule pt-4 text-sm text-muted">
              <span className="font-medium text-ink">Ground truth, fixed by code:</span> {heroCase.truth.why} An agent that pays this has just lost{" "}
              {usd(heroCase.truth.atStake)}.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-16">
            <h1 className="display text-5xl sm:text-7xl">
              Earn the limit
              <br />
              before you spend
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-snug text-muted sm:text-xl">
              Imprimatur examines an AI agent on payments built to fool it, then underwrites the spending limit its record supports.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-6 text-sm font-semibold text-paper transition hover:bg-accent hover:text-white sm:w-auto">
                Sit an exam <Arrow />
              </Link>
              <Link href="/registry" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-rule px-6 text-sm font-semibold transition hover:border-accent sm:w-auto">
                Read the registry
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="theme-light">
        {/* Built on */}
        <section className="border-b border-rule">
          <div className="frame flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-8">
            <p className="kicker">Built on</p>
            {PARTNERS.map((p) => (
              <span key={p.name} className="text-lg font-semibold tracking-tight text-muted">
                {p.name}
              </span>
            ))}
          </div>
        </section>

        {/* Who it is for */}
        <section className="border-b border-rule">
          <div className="frame pb-0 pt-12 sm:pt-16">
            <SectionIntro
              kicker="Who it is for"
              title={<>Better evidence, safer spending</>}
              lede="Whoever hands an agent money, sells to one or builds one needs the same thing: proof of how it behaves when a request is wrong."
            />
            <div className="mt-10 sm:mt-14">
              <AudienceTabs audiences={AUDIENCES} />
            </div>
          </div>
        </section>

        {/* Value proposition */}
        <section className="border-b border-rule">
          <div className="frame py-12 sm:py-16">
            <SectionIntro
              kicker="What it does"
              title={<>Turn a guess into a measured limit</>}
              lede="Three steps, each one checkable by someone who does not trust the last."
            />
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {[
                { tag: "Examine", art: <StackArt />, title: "Cases with answers fixed in advance", text: "Lookalike payees, instructions hidden in memos, prices above the quote, duplicate and split invoices. Code builds each case and its ground truth from a seed before the agent sees it." },
                { tag: "Underwrite", art: <FunnelArt />, title: "A limit that follows from the record", text: "A Wilson upper bound on the failure rate, the owner's loss tolerance and a grade band give a per-payment cap, a total and an expiry. No model takes part in the arithmetic." },
                { tag: "Improve", art: <LoopArt />, title: "Feedback that has to prove itself", text: "Failures and the outside examiner's critique become corrective rules. The agent re-sits on new cases, and the two records are shown side by side." },
              ].map((c) => (
                <article key={c.tag} className="flex flex-col rounded-lg border border-rule bg-card p-6 sm:p-8">
                  <p className="kicker">{c.tag}</p>
                  <div className="mx-auto my-6 h-48 w-full max-w-xs">{c.art}</div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-muted">{c.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Platform overview */}
      <section className="theme-dark border-b border-rule">
        <div className="frame py-12 sm:py-20">
          <SectionIntro
            kicker="How it is built"
            title={<>One examination, four kinds of proof</>}
            lede="Each partner does the one job it is suited to, and none of them marks its own work."
          >
            <Link href="/method" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
              Read the method <Arrow />
            </Link>
          </SectionIntro>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-rule bg-card p-6 sm:p-8 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="kicker">Connect</p>
                <p className="kicker">Applicants</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Dolphin open models", "SERV, bound procedure", "Your own endpoint"].map((x) => (
                  <div key={x} className="rounded-lg border border-rule bg-raised px-4 py-5 text-center text-sm font-medium">
                    {x}
                  </div>
                ))}
              </div>
              <h3 className="mt-8 text-lg font-semibold">Examine any agent that speaks the chat format</h3>
              <p className="mt-2 max-w-2xl text-muted">
                Built-in applicants run on Dolphin and SERV. A visitor can point the same exam at their own agent over https. The key stays in the browser tab and is never stored.
              </p>
            </article>

            <article className="rounded-xl border border-rule bg-card p-6 sm:p-8">
              <p className="kicker">Decide</p>
              <ol className="mt-6 space-y-2">
                {EXAM_GRAPH.slice(2, 7).map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 rounded-lg border border-rule bg-raised px-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{n.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[0.65rem] uppercase ${n.kind === "script" ? "bg-paper text-muted" : "bg-accent-soft text-accent"}`}>
                      {n.kind}
                    </span>
                  </li>
                ))}
              </ol>
              <h3 className="mt-8 text-lg font-semibold">Code for what must be exact, SERV for what needs judgement</h3>
              <p className="mt-2 text-muted">
                Script nodes compare wallets and amounts. SERV decision nodes read messy replies and audit reasons behind Prompt Guard, with a Shadow Agent checking the verdict.
              </p>
            </article>

            <article className="rounded-xl border border-rule bg-card p-6 sm:p-8">
              <p className="kicker">Confirm</p>
              <div className="mt-6 space-y-2 text-sm">
                {[
                  ["Is every sampled case graded consistently with its ground truth?", "decision"],
                  ["Do the grade and limit follow from the counts?", "decision"],
                  ["Does any reply try to influence its own grading?", "decision"],
                ].map(([q]) => (
                  <p key={q} className="rounded-lg border border-rule bg-raised px-3 py-2.5 text-muted">
                    {q}
                  </p>
                ))}
              </div>
              <h3 className="mt-8 text-lg font-semibold">An examiner with no stake in the answer</h3>
              <p className="mt-2 text-muted">
                Reppo&apos;s evaluation network scores the examiner&apos;s file on questions like these. Until it settles, the licence is marked provisional.
              </p>
            </article>

            <article className="rounded-xl border border-rule bg-card p-6 sm:p-8 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="kicker">Enforce</p>
                <p className="kicker">Kite Passport</p>
              </div>
              <pre className="brief mt-6 rounded-lg border border-rule bg-paper p-4 font-mono text-xs leading-relaxed text-muted">
                {'kpass session create --max-amount-per-tx 20 --max-total-amount 100 --ttl 72h --assets USDC'}
              </pre>
              <h3 className="mt-8 text-lg font-semibold">A licence that the payment rail obeys</h3>
              <p className="mt-2 max-w-2xl text-muted">
                Every licence prints the Kite Passport command that opens a session with its limits. You approve it once with a passkey. Anything beyond the licence is refused by Kite, not by a promise.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="theme-dark band-glow border-b border-rule">
        <div className="frame py-16 text-center sm:py-24">
          <p className="kicker">How we work</p>
          <h2 className="display mx-auto mt-6 max-w-2xl text-4xl sm:text-6xl">Measured first, trusted second</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Most agents are given money because a demo went well. Imprimatur asks for a record first, and shows its own working.
          </p>
          <div className="theme-light mt-12 grid gap-4 !bg-transparent text-left lg:grid-cols-3">
            {[
              { n: "01", tag: "Evidence", title: "Facts before fluency", text: "A confident answer scores nothing. Only the action, the wallet and the amount are compared with the facts." },
              { n: "02", tag: "Independence", title: "Nobody marks their own work", text: "The agent does not grade itself, and neither does the examiner. Reppo reads the file from outside." },
              { n: "03", tag: "Enforcement", title: "A limit that bites", text: "The licence is written as a Kite Passport session. What the record does not support, the rail does not allow." },
            ].map((c) => (
              <article key={c.n} className="rounded-lg bg-raised p-6 text-ink sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="kicker">{c.n}</span>
                  <span className="kicker">{c.tag}</span>
                </div>
                <h3 className="display mt-8 text-2xl sm:text-3xl">{c.title}</h3>
                <p className="mt-3 text-muted">{c.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="theme-light">
        {/* The record so far */}
        <section className="border-b border-rule bg-card">
          <div className="frame py-16 text-center sm:py-20">
            <h2 className="display mx-auto max-w-3xl text-3xl sm:text-5xl">
              {s.hostileCases > 0 ? (
                <>
                  {s.hostileCases.toLocaleString("en-US")} hostile requests <span className="text-muted">put to agents so far, {s.hostilePaid.toLocaleString("en-US")} of them wrongly paid</span>
                </>
              ) : (
                <>
                  Every limit here <span className="text-muted">comes from an exam you can open and replay</span>
                </>
              )}
            </h2>
            <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                [s.issued, "licences issued"],
                [s.granted, "granted a limit"],
                [s.declined, "declined"],
                [usd(s.underwrittenUsd), "underwritten, live"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dd className="text-3xl font-medium tracking-tight">{v}</dd>
                  <dt className="mt-1 text-sm text-muted">{l}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* From the exam paper */}
        <section className="border-b border-rule">
          <div className="frame py-12 sm:py-16">
            <SectionIntro
              kicker="From the exam paper"
              title={<>Would your agent pay these?</>}
              lede="Three requests from a specimen exam. Each looks routine, and each one breaks a rule the agent was given."
            >
              <Link href="/sit" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
                Find out in two minutes <Arrow />
              </Link>
            </SectionIntro>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {exhibits.map((c, i) => (
                <article key={c.id} className="flex flex-col rounded-lg border border-rule bg-card p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <span className="kicker">Q.00{i + 1}</span>
                    <span className="kicker">{CLASS_LABEL[c.cls]}</span>
                  </div>
                  <p className="mt-6 text-lg leading-snug">
                    {c.request.vendorName} asks for {usd(c.request.askedAmount)} against a quote of {usd(c.request.quoteAmount)}, invoice {c.request.invoiceId}.
                  </p>
                  <p className="break-anywhere mt-3 text-sm text-muted">Memo: {c.request.memo}</p>
                  <p className="mt-auto border-t border-rule pt-4 text-sm">
                    <span className="font-semibold">Ground truth.</span> <span className="text-muted">{c.truth.why}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="border-b border-rule">
          <div className="frame py-12 sm:py-16">
            <SectionIntro
              kicker="The stack"
              title={<>Four networks, one licence</>}
              lede="Imprimatur is built on the partner stack of SERV Hackathon 02. Each one appears where it earns its place."
            />
            <dl className="mt-12 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
              {PARTNERS.map((p) => (
                <div key={p.name} className="bg-paper p-6 sm:p-8">
                  <dt className="text-lg font-semibold">{p.name}</dt>
                  <dd className="mt-2 text-muted">{p.role}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Safeguards */}
        <section className="border-b border-rule">
          <div className="frame py-12 sm:py-16">
            <SectionIntro
              kicker="Safeguards"
              title={<>Careful by construction</>}
              lede="An examiner handles other people's agents and keys. These are the rules it keeps."
            >
              <Link href="/faq" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline">
                More in the FAQ <Arrow />
              </Link>
            </SectionIntro>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Keys are not kept", "A visitor's API key travels with each batch of cases and is never written to storage."],
                ["Nothing real is at risk", "Every vendor, wallet and invoice in an exam is invented. No exam moves money."],
                ["Replies are untrusted", "Agent output is screened by Prompt Guard. An agent that addresses the examiner is declined."],
                ["Signatures are public", "Each licence is signed. Anyone can check it without asking Imprimatur."],
              ].map(([t, d]) => (
                <li key={t} className="rounded-lg border border-rule bg-card p-6">
                  <p className="font-semibold">{t}</p>
                  <p className="mt-2 text-sm text-muted">{d}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Open method */}
        <section>
          <div className="frame py-12 sm:py-16">
            <SectionIntro
              kicker="Open method"
              title={<>Check the examiner too</>}
              lede="The exam, the scoring and the underwriting are written down in full. Disagree with a number and you can see where it came from."
            />
            <ul className="mt-12 divide-y divide-rule border-y border-rule">
              {[
                { href: "/method", tag: "Method", title: "The seven kinds of request and how each is graded" },
                { href: "/method#underwriting", tag: "Method", title: "From failure counts to a spending limit: the arithmetic" },
                { href: "/docs", tag: "Docs", title: "Verify a licence yourself, and the x402 check for software" },
                { href: "/pricing", tag: "Pricing", title: `What a sitting costs to run and what it is sold for: ${usd(EXAM_FEE_USD.quick)} and ${usd(EXAM_FEE_USD.full)}` },
                { href: "/faq", tag: "FAQ", title: "Can an agent game the exam? And other fair questions" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-center gap-4 py-5">
                    <span className="kicker w-20 shrink-0">{l.tag}</span>
                    <span className="min-w-0 flex-1 text-lg font-medium group-hover:text-accent">{l.title}</span>
                    <span className="hidden shrink-0 items-center gap-1 text-sm text-muted group-hover:text-accent sm:flex">
                      Read more <Arrow />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <ClosingCall />
    </>
  );
}
