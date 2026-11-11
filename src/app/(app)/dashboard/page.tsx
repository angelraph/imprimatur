import type { Metadata } from "next";
import Link from "next/link";
import { LicenceTable } from "@/components/LicenceTable";
import { Arrow, buttonClass, Card, Fact, PageHeader, quietButtonClass, usd } from "@/components/ui";
import { GRADES, summarise } from "@/lib/stats";
import { listLicences } from "@/lib/store";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const records = await listLicences();
  const s = summarise(records);
  const tallest = Math.max(1, ...GRADES.map((g) => s.byGrade[g]));

  return (
    <div>
      <PageHeader
        title="Examination office"
        lede="Every licence here came from a sitting you can open and replay. Start one yourself, or check a licence someone showed you."
        actions={
          <>
            <Link href="/sit" className={buttonClass}>
              Sit an exam <Arrow />
            </Link>
            <Link href="/verify" className={quietButtonClass}>
              Verify a licence
            </Link>
          </>
        }
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <p className="text-sm text-muted">Spending limit underwritten on live licences</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{usd(s.underwrittenUsd)}</p>
          <p className="mt-2 text-sm text-muted">
            Across {s.granted} granted {s.granted === 1 ? "licence" : "licences"}. {s.declined} applicant{s.declined === 1 ? " was" : "s were"} declined.
          </p>
          <div className="mt-8">
            <p className="text-xs text-muted">Licences by grade</p>
            <div className="mt-3 flex h-36 items-end gap-3 sm:gap-6" role="img" aria-label={GRADES.map((g) => `${g}: ${s.byGrade[g]}`).join(", ")}>
              {GRADES.map((g) => (
                <div key={g} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-mono text-sm">{s.byGrade[g]}</span>
                  <div
                    className={`w-full rounded-t-md ${g === "Declined" ? "bg-rule" : "bg-accent-strong"}`}
                    style={{ height: `${Math.max(4, (s.byGrade[g] / tallest) * 96)}px`, opacity: g === "A" ? 1 : g === "B" ? 0.75 : g === "C" ? 0.5 : 1 }}
                  />
                  <span className="text-xs text-muted">{g}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold">What to do here</h2>
          <ul className="mt-4 divide-y divide-rule">
            {[
              { href: "/sit", title: "Examine an agent", text: "Pick a built-in applicant or point the exam at your own endpoint." },
              { href: "/registry", title: "Read a licence", text: "Open any sitting: every case, every reply, how it was graded." },
              { href: "/verify", title: "Check a licence", text: "Confirm the signature, the status and the limit before you serve an agent." },
              { href: "/method", title: "Question the method", text: "The exam, the underwriting rules and who checks what." },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="group flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium group-hover:text-accent">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">{item.text}</span>
                  </span>
                  <span className="text-muted group-hover:text-accent">
                    <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-rule bg-card p-4 sm:p-6 lg:grid-cols-4">
        <Fact label="Licences issued" value={s.issued} />
        <Fact label="Confirmed by Reppo" value={s.confirmed} />
        <Fact label="Hostile requests put to agents" value={s.hostileCases} hint={`${s.hostilePaid} were wrongly paid`} />
        <Fact label="Lost inside exams" value={usd(s.lostInExamsUsd)} hint="Invented money, real mistakes" />
      </dl>

      <div className="mt-10 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Latest licences</h2>
        <Link href="/registry" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          See the registry
        </Link>
      </div>
      <div className="mt-4">
        <LicenceTable records={records.slice(0, 6)} empty="No sittings yet. Sit the first exam and its licence will appear here." />
      </div>
    </div>
  );
}
