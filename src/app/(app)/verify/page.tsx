import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass, Card, dateTime, Fact, PageHeader, Seal, StatusBadge, usd } from "@/components/ui";
import { getLicence } from "@/lib/store";
import { VERIFY_FEE_USD } from "@/lib/types";
import { paywall, verificationOf } from "@/lib/verify";

export const metadata: Metadata = { title: "Verify a licence" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const params = await searchParams;
  const id = typeof params.id === "string" ? params.id.trim() : "";
  const record = id ? await getLicence(id) : null;
  const v = record ? await verificationOf(record) : null;
  const paid = paywall() !== null;

  return (
    <div>
      <PageHeader
        title="Verify a licence"
        lede="An agent says it holds an Imprimatur licence. Paste the licence number to see whether the signature holds, whether it is still in force and what limit it carries."
      />

      <form method="get" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="licence-id">Licence number</label>
        <input
          id="licence-id"
          name="id"
          defaultValue={id}
          required
          placeholder="IMP-261111-A1B2C3"
          autoComplete="off"
          className="min-h-11 w-full rounded-lg border border-rule bg-card px-4 font-mono text-sm sm:max-w-md"
        />
        <button type="submit" className={buttonClass}>Check it</button>
      </form>

      {id && !v && (
        <Card className="mt-6">
          <p className="font-medium">No licence has that number.</p>
          <p className="mt-1 text-sm text-muted">Check for a typing slip. Licence numbers look like IMP, six digits, six characters.</p>
        </Card>
      )}

      {v && (
        <Card className="mt-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className={`text-2xl font-semibold tracking-tight ${v.inForce ? "text-pass" : "text-bad"}`}>
                {v.inForce ? "In force" : "Not in force"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {v.applicant.label}, {v.applicant.model}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={v.status} />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${v.signatureValid ? "bg-pass-soft text-pass" : "bg-bad-soft text-bad"}`}>
                  {v.signatureValid ? "Signature valid" : "Signature does not match"}
                </span>
                {v.expired && <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs font-medium text-muted">Expired</span>}
              </div>
            </div>
            <Seal grade={v.grade} size="sm" />
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-rule pt-6 lg:grid-cols-4">
            <Fact label="Per payment" value={v.grade === "Declined" ? "none" : usd(v.limits.maxPerPaymentUsd)} />
            <Fact label="In total" value={v.grade === "Declined" ? "none" : usd(v.limits.maxTotalUsd)} />
            <Fact label="Expires" value={<span className="text-base">{dateTime(v.expiresAt)}</span>} />
            <Fact label="Outside examiner" value={<span className="capitalize">{v.outsideExaminer.decision ?? "pending"}</span>} />
          </dl>
          <Link href={`/licence/${v.id}`} className="mt-6 inline-block text-sm underline underline-offset-4">
            Open the full record
          </Link>
        </Card>
      )}

      <Card className="mt-10">
        <h2 className="text-sm font-semibold">For software: the paid check</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Merchants and other agents call one endpoint before serving a licensed agent. It speaks x402, so a Kite Passport agent can pay the{" "}
          {usd(VERIFY_FEE_USD)} fee inside its spending session with no account and no API key.
        </p>
        <pre className="brief mt-4 rounded-lg border border-rule bg-paper p-4 font-mono text-xs leading-relaxed">
          {`GET /api/verify/{licence number}\n\n402  price and payee, when called without X-PAYMENT\n200  { id, inForce, status, grade, limits, signatureValid, licence }`}
        </pre>
        <p className="mt-3 text-xs text-muted">
          {paid
            ? "The paywall is on for this deployment."
            : "The paywall is off on this deployment because no Kite receiving wallet is set, so the endpoint answers without charging."}
        </p>
      </Card>
    </div>
  );
}
