import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseList } from "@/components/CaseList";
import { CopyButton, ReppoWatcher, ResitButton } from "@/components/LicenceLive";
import { dateTime, Fact, Panel, pct, Seal, smallUsd, StatusBadge, usd } from "@/components/ui";
import { CLASS_LABEL } from "@/lib/exam/types";
import { EXAM_GRAPH } from "@/lib/graph/nodes";
import { sittingView } from "@/lib/http";
import { isExpired, kpassSessionCommand, verifyLicence } from "@/lib/licence/licence";
import { getLicence, getSitting } from "@/lib/store";
import { needsRemediation } from "@/lib/underwrite/underwrite";
import { VERIFY_FEE_USD, type LicenceRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/licence/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Licence ${id}` };
}

const KIND_TONE = { script: "bg-raised text-ink", decision: "bg-accent-soft text-accent", language: "bg-warn-soft text-warn" } as const;

function Comparison({ before, after }: { before: LicenceRecord; after: LicenceRecord }) {
  const rows = [
    { label: "Grade", a: before.licence.body.grade, b: after.licence.body.grade },
    { label: "Hostile requests paid", a: `${before.underwriting.attackFailures} of ${before.underwriting.attackTrials}`, b: `${after.underwriting.attackFailures} of ${after.underwriting.attackTrials}` },
    { label: "Legitimate payments paid", a: pct(before.underwriting.legitPayRate), b: pct(after.underwriting.legitPayRate) },
    { label: "Total limit", a: usd(before.licence.body.limits.maxTotalUsd), b: usd(after.licence.body.limits.maxTotalUsd) },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] text-left text-sm">
        <thead className="text-xs text-muted">
          <tr>
            <th scope="col" className="py-2 pr-4 font-medium">Measure</th>
            <th scope="col" className="py-2 pr-4 font-medium">
              <Link href={`/licence/${before.licence.body.id}`} className="underline underline-offset-4">First sitting</Link>
            </th>
            <th scope="col" className="py-2 font-medium">
              <Link href={`/licence/${after.licence.body.id}`} className="underline underline-offset-4">Re-sit, fresh seed</Link>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {rows.map((r) => (
            <tr key={r.label}>
              <th scope="row" className="py-2.5 pr-4 font-normal text-muted">{r.label}</th>
              <td className="py-2.5 pr-4 font-mono">{r.a}</td>
              <td className="py-2.5 font-mono font-medium text-accent">{r.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LicencePage({ params, searchParams }: PageProps<"/licence/[id]">) {
  const { id } = await params;
  const { fresh } = await searchParams;
  const record = await getLicence(id);
  if (!record) notFound();

  const sitting = await getSitting(record.sittingId);
  const view = sitting ? sittingView(sitting) : null;
  const [parent, child, signatureValid] = await Promise.all([
    record.parentLicenceId ? getLicence(record.parentLicenceId) : null,
    record.childLicenceId ? getLicence(record.childLicenceId) : null,
    verifyLicence(record.licence),
  ]);

  const b = record.licence.body;
  const u = record.underwriting;
  const declined = b.grade === "Declined";
  const expired = isExpired(b);
  const command = kpassSessionCommand(b);
  const margin = record.costs.examFeeUsd - record.costs.totalUsd;
  const canResit = sitting && sitting.applicant.provider !== "custom" && sitting.applicant.provider !== "scripted" && !record.childLicenceId;

  return (
    <div>
      <ReppoWatcher licenceId={b.id} state={record.reppo.state} />
      <p className="text-sm text-muted">
        <Link href="/registry" className="underline-offset-4 hover:text-ink hover:underline">Registry</Link> / <span className="font-mono">{b.id}</span>
      </p>

      <section className="mt-4 rounded-xl border border-rule bg-card p-5 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="kicker">{declined ? "Application declined" : "Spending licence"}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{b.applicant.label}</h1>
            <p className="break-anywhere mt-2 text-sm text-muted">
              {b.applicant.model}{b.applicant.endpointHost === "built in" ? "" : ` at ${b.applicant.endpointHost}`}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={record.status} />
              {expired && !declined && <span className="rounded-full bg-raised px-2.5 py-0.5 text-xs font-medium text-muted">Expired</span>}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${signatureValid ? "bg-pass-soft text-pass" : "bg-bad-soft text-bad"}`}>
                {signatureValid ? "Signature valid" : "Signature does not match"}
              </span>
            </div>
          </div>
          <Seal grade={b.grade} animate={fresh === "1"} />
        </div>

        <p className="mt-6 max-w-3xl text-base leading-relaxed">{record.report.text}</p>
        <p className="mt-2 text-xs text-muted">
          {record.report.writtenBy === "dolphin"
            ? "Note drafted by the open model on Dolphin. Code checked every figure in it against the results before it was kept."
            : "Note written by code from the results."}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-rule pt-6 lg:grid-cols-4">
          <Fact label="Per payment" value={declined ? "none" : usd(b.limits.maxPerPaymentUsd)} />
          <Fact label="In total" value={declined ? "none" : usd(b.limits.maxTotalUsd)} />
          <Fact label="Valid for" value={declined ? "none" : `${b.limits.ttlHours} h`} hint={declined ? undefined : `Until ${dateTime(b.expiresAt)}`} />
          <Fact label="Issued" value={<span className="text-base sm:text-lg">{dateTime(b.issuedAt)}</span>} />
        </dl>
      </section>

      {(parent || child) && (
        <Panel title="Did the feedback change anything?">
          <p className="mb-4 max-w-2xl text-sm text-muted">
            The re-sit used a new seed, so none of the cases repeated. Any gain comes from the rules written after the first sitting,
            not from remembering answers.
          </p>
          <Comparison before={parent ?? record} after={parent ? record : child!} />
        </Panel>
      )}

      {record.constraints.length > 0 && (
        <Panel title="Rules this applicant carried in">
          <p className="mb-3 text-sm text-muted">Compiled by SERV from the failures of the earlier sitting and the outside examiner&apos;s critique.</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {record.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </Panel>
      )}

      <Panel
        title="Outside examiner (Reppo)"
        aside={record.reppo.state === "settled" && record.reppo.score !== undefined ? <span className="font-mono text-sm">{record.reppo.score} / 100</span> : undefined}
      >
        {record.reppo.state === "off" && (
          <p className="text-sm text-muted">
            This deployment has no Reppo key, so the licence stays provisional. With a key, the examiner&apos;s file goes to Reppo&apos;s evaluation
            network and the verdict lands here.
          </p>
        )}
        {record.reppo.state === "queued" && (
          <p className="text-sm text-muted" aria-live="polite">
            Waiting to be sent to Reppo. This usually takes a few seconds. You can leave this page open.
          </p>
        )}
        {record.reppo.state === "pending" && (
          <p className="text-sm text-muted" aria-live="polite">
            The file is with Reppo&apos;s evaluators. A verdict usually lands within a minute, and this page updates by itself. The licence is provisional
            until then.
          </p>
        )}
        {record.reppo.state === "failed" && <p className="text-sm text-warn">Reppo could not judge this file: {record.reppo.failureReason}</p>}
        {record.reppo.state === "settled" && (
          <div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact label="Decision" value={<span className="capitalize">{record.reppo.decision}</span>} />
              <Fact label="Route" value={<span className="capitalize">{record.reppo.route ?? "none"}</span>} />
              <Fact label="Confidence" value={<span className="capitalize">{record.reppo.confidence}</span>} />
              <Fact label="Evaluators" value={record.reppo.peerAssessments ?? 0} />
            </dl>
            {record.reppo.reason && <p className="mt-6 text-sm leading-relaxed">{record.reppo.reason}</p>}
            <ul className="mt-6 divide-y divide-rule border-t border-rule">
              {(record.reppo.verdicts ?? []).map((v) => (
                <li key={v.criterion} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium">{v.criterion}</p>
                    <p className="shrink-0 font-mono text-sm">{v.score} / 100</p>
                  </div>
                  {v.critique && <p className="mt-1.5 text-sm text-muted">{v.critique}</p>}
                </li>
              ))}
            </ul>
            {(record.reppo.evaluators ?? []).length > 0 && (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Independent evaluators: {(record.reppo.evaluators ?? []).map((e) => `${e.model} gave ${e.score}`).join(", ")}.
              </p>
            )}
            {record.reppo.settledAt && <p className="mt-2 text-xs text-muted">Settled {dateTime(record.reppo.settledAt)}.</p>}
          </div>
        )}
      </Panel>

      <Panel title="How the limit was reached">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Kind of request</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Wrongly paid</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Upper bound</th>
                <th scope="col" className="py-2 text-right font-medium">Lost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {u.classes.map((c) => (
                <tr key={c.cls}>
                  <th scope="row" className="py-2.5 pr-4 font-normal">
                    {CLASS_LABEL[c.cls]}
                    {u.openHoles.includes(c.cls) && <span className="ml-2 rounded-full bg-bad-soft px-2 py-0.5 text-xs text-bad">open hole</span>}
                  </th>
                  <td className="py-2.5 pr-4 text-right font-mono">{c.failures} of {c.trials}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-muted">{pct(c.upperBound)}</td>
                  <td className="py-2.5 text-right font-mono">{usd(c.lossUsd)}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <th scope="row" className="py-2.5 pr-4 font-medium">All hostile requests</th>
                <td className="py-2.5 pr-4 text-right font-mono">{u.attackFailures} of {u.attackTrials}</td>
                <td className="py-2.5 pr-4 text-right font-mono text-accent">{pct(u.failureBound, 1)}</td>
                <td className="py-2.5 text-right font-mono">{usd(u.classes.reduce((s, c) => s + c.lossUsd, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-rule pt-6 lg:grid-cols-4">
          <Fact label="Legitimate payments paid" value={`${u.legitPaid} of ${u.legitTrials}`} hint={`${u.falseRefusals} refused, ${u.friction} escalated`} />
          <Fact
            label="Refusals for the right reason"
            value={record.reasons.audited ? `${record.reasons.grounded} of ${record.reasons.audited}` : "not audited"}
            hint="Audited by a SERV decision node"
          />
          <Fact label="Unreadable replies" value={u.invalid} />
          <Fact label="Expected loss per dollar" value={u.expectedLossPerDollar.toFixed(4)} hint={`Assumes ${pct(u.inputs.attackPrevalence)} of requests are hostile`} />
        </dl>
        <div className="mt-6 space-y-2 border-t border-rule pt-5 text-sm text-muted">
          {u.reasons.map((r) => (
            <p key={r}>{r}</p>
          ))}
          {!declined && (
            <p>
              The owner accepts losing {usd(u.inputs.lossToleranceUsd)} over the life of the licence. Dividing that by the expected loss per dollar
              gives the most this record can carry. The grade band caps it.
            </p>
          )}
        </div>
      </Panel>

      {!declined && (
        <Panel title="Enforce it with Kite Passport" aside={<CopyButton text={command} label="Copy command" />}>
          <p className="max-w-2xl text-sm text-muted">
            A licence is only a document until something enforces it. Run this to open a Kite Passport spending session with exactly these
            limits. You approve it once with your passkey, and Kite refuses anything beyond it.
          </p>
          <pre className="brief mt-4 rounded-lg border border-rule bg-paper p-4 font-mono text-xs leading-relaxed">{command}</pre>
          {record.kite.length > 0 && (
            <ul className="mt-5 divide-y divide-rule border-t border-rule">
              {record.kite.map((k) => (
                <li key={`${k.at}-${k.kind}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${k.kind === "paid" ? "bg-pass-soft text-pass" : "bg-bad-soft text-bad"}`}>
                    {k.kind === "paid" ? "Paid" : "Refused by Kite"}
                  </span>
                  <span className="font-mono">{smallUsd(k.amountUsd)}</span>
                  <span className="min-w-0 flex-1 text-muted">{k.description}</span>
                  {k.explorerUrl && (
                    <a href={k.explorerUrl} target="_blank" rel="noreferrer" className="font-mono text-xs underline underline-offset-4">
                      {k.txHash?.slice(0, 10)}...
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {canResit && (
        <Panel title="Remediate and re-sit">
          <p className="mb-4 max-w-2xl text-sm text-muted">
            SERV turns the classes this applicant failed and the outside examiner&apos;s critique into corrective rules. The applicant then sits a
            new exam on a new seed. The two records are set side by side.
          </p>
          <ResitButton licenceId={b.id} label={needsRemediation(u) ? "Write the rules and re-sit" : "Re-sit on a fresh seed"} />
        </Panel>
      )}

      <Panel title="What this sitting cost and earned">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[24rem] text-left text-sm">
            <tbody className="divide-y divide-rule">
              {record.costs.lines.map((l) => (
                <tr key={l.label}>
                  <th scope="row" className="py-2.5 pr-4 font-normal">
                    {l.label}
                    <span className="mt-0.5 block text-xs text-muted">
                      {l.model}, {l.calls} call{l.calls === 1 ? "" : "s"}
                      {l.tokensIn + l.tokensOut > 0 ? `, ${(l.tokensIn + l.tokensOut).toLocaleString("en-US")} tokens` : ""}
                    </span>
                  </th>
                  <td className="py-2.5 text-right align-top font-mono">{smallUsd(l.usd)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2.5 pr-4 font-normal text-muted">Cost of the sitting, from published token prices</th>
                <td className="py-2.5 text-right font-mono">{smallUsd(record.costs.totalUsd)}</td>
              </tr>
              <tr>
                <th scope="row" className="py-2.5 pr-4 font-normal text-muted">Exam fee</th>
                <td className="py-2.5 text-right font-mono">{usd(record.costs.examFeeUsd)}</td>
              </tr>
              <tr className="font-medium">
                <th scope="row" className="py-2.5 pr-4 font-medium">Margin</th>
                <td className="py-2.5 text-right font-mono text-accent">{usd(margin)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Each check of this licence by a merchant or another agent costs {usd(VERIFY_FEE_USD)}, paid over x402. A custom endpoint&apos;s own token price is unknown and counted as zero.
        </p>
      </Panel>

      <Panel title="The examination graph">
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Ten steps, three kinds. Code does what must be exact, SERV makes the typed judgements, and an open model writes only where prose is wanted.
        </p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {EXAM_GRAPH.map((n, i) => (
            <li key={n.id} className="flex gap-3 rounded-lg border border-rule bg-paper p-3">
              <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide ${KIND_TONE[n.kind]}`}>{n.kind}</span>
                </span>
                <span className="mt-1 block text-xs text-muted">{n.does} Runs on {n.runsOn}.</span>
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Signature">
        <dl className="space-y-3 text-sm">
          {[
            ["Issuer", record.licence.issuer],
            ["Signature", record.licence.signature],
            ["Results hash", b.exam.resultsHash],
            ["Applicant fingerprint", b.applicant.fingerprint],
            ["Exam seed", b.exam.seed],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <dt className="w-44 shrink-0 text-muted">{k}</dt>
              <dd className="break-anywhere min-w-0 font-mono text-xs leading-5">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">
          The seed is published so anyone can redraw this exact exam and regrade the replies. <Link href="/docs" className="underline underline-offset-4">How to verify a licence yourself</Link>.
        </p>
      </Panel>

      {view && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Every case in this sitting</h2>
          <p className="mt-1 text-sm text-muted">{view.answered.length} cases. Open one to read what the agent was asked, the ground truth and its reply.</p>
          <div className="mt-4">
            <CaseList answered={view.answered} reasons={record.reasons.verdicts} />
          </div>
        </section>
      )}
    </div>
  );
}
