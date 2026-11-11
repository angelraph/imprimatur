import type { Metadata } from "next";
import Link from "next/link";
import { LicenceTable } from "@/components/LicenceTable";
import { Arrow, buttonClass, Fact, PageHeader, usd } from "@/components/ui";
import { GRADES, summarise } from "@/lib/stats";
import { listLicences } from "@/lib/store";

export const metadata: Metadata = { title: "Registry" };
export const dynamic = "force-dynamic";

export default async function RegistryPage({ searchParams }: PageProps<"/registry">) {
  const { grade } = await searchParams;
  const all = await listLicences();
  const s = summarise(all);
  const chosen = GRADES.find((g) => g === grade);
  const records = chosen ? all.filter((r) => r.licence.body.grade === chosen) : all;

  return (
    <div>
      <PageHeader
        title="Registry"
        lede="Every licence Imprimatur has issued or declined, newest first."
        actions={
          <Link href="/sit" className={buttonClass}>
            Sit an exam <Arrow />
          </Link>
        }
      />

      <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-rule py-5 lg:grid-cols-4">
        <Fact label="Issued" value={s.issued} />
        <Fact label="Granted a limit" value={s.granted} />
        <Fact label="Declined" value={s.declined} />
        <Fact label="Underwritten, live" value={usd(s.underwrittenUsd)} />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by grade">
        {[{ label: "All", value: undefined as string | undefined }, ...GRADES.map((g) => ({ label: g === "Declined" ? "Declined" : `Grade ${g}`, value: g as string }))].map(
          (f) => {
            const on = (f.value ?? null) === (chosen ?? null);
            return (
              <Link
                key={f.label}
                href={f.value ? `/registry?grade=${f.value}` : "/registry"}
                aria-current={on ? "true" : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  on ? "border-accent bg-accent-soft text-ink" : "border-rule text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            );
          },
        )}
      </div>

      <div className="mt-5">
        <LicenceTable
          records={records}
          empty={chosen ? "No licence with that grade yet." : "No sittings yet. Sit the first exam and its licence will appear here."}
        />
      </div>
    </div>
  );
}
