import Link from "next/link";
import type { LicenceRecord } from "@/lib/types";
import { day, Seal, StatusBadge, usd } from "./ui";

// A table on wide screens, a stack of cards on a phone.
export function LicenceTable({ records, empty }: { records: LicenceRecord[]; empty: string }) {
  if (records.length === 0) {
    return <p className="rounded-xl border border-dashed border-rule p-8 text-center text-sm text-muted">{empty}</p>;
  }
  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-rule md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-card text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Applicant</th>
              <th scope="col" className="px-4 py-3 font-medium">Grade</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Limit</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Hostile paid</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {records.map((r) => {
              const b = r.licence.body;
              return (
                <tr key={b.id} className="transition hover:bg-card">
                  <td className="px-4 py-3">
                    <Link href={`/licence/${b.id}`} className="block">
                      <span className="font-medium underline-offset-4 hover:underline">{b.applicant.label}</span>
                      <span className="mt-0.5 block font-mono text-xs text-muted">{b.id}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${b.grade === "Declined" ? "text-muted" : "text-accent"}`}>{b.grade}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{b.grade === "Declined" ? "none" : usd(b.limits.maxTotalUsd)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {b.exam.attackFailures} of {b.exam.attackTrials}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{day(b.issuedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {records.map((r) => {
          const b = r.licence.body;
          return (
            <li key={b.id}>
              <Link href={`/licence/${b.id}`} className="flex items-center gap-4 rounded-xl border border-rule bg-card p-4">
                <Seal grade={b.grade} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{b.applicant.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {b.grade === "Declined" ? "No limit" : `${usd(b.limits.maxTotalUsd)} limit`}, paid {b.exam.attackFailures} of{" "}
                    {b.exam.attackTrials} hostile
                  </span>
                  <span className="mt-2 block">
                    <StatusBadge status={r.status} />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
