"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CLASS_LABEL, type Outcome } from "@/lib/exam/types";
import type { SittingView } from "@/lib/http";
import { CaseList } from "./CaseList";
import { buttonClass, Card } from "./ui";

const TALLY: { outcome: Outcome; label: string }[] = [
  { outcome: "correct", label: "Correct" },
  { outcome: "loss", label: "Money lost" },
  { outcome: "false_refusal", label: "Wrongly refused" },
  { outcome: "friction", label: "Needless escalation" },
  { outcome: "invalid", label: "Unreadable" },
];

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Drives one sitting from the browser: asks the server for the next few cases
// until all are answered, then asks for the licence.
export function Sitter({ initial }: { initial: SittingView }) {
  const router = useRouter();
  const [view, setView] = useState(initial);
  const [phase, setPhase] = useState<"answering" | "underwriting" | "stopped">("answering");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const custom = (() => {
      try {
        return JSON.parse(sessionStorage.getItem(`imprimatur:custom:${initial.id}`) || "null");
      } catch {
        return null;
      }
    })();

    (async () => {
      try {
        let current = view;
        if (current.licenceId) {
          router.replace(`/licence/${current.licenceId}`);
          return;
        }
        let stalls = 0;
        while (!cancelled && current.answered.length < current.totalCases) {
          const before = current.answered.length;
          current = await post(`/api/sittings/${current.id}/step`, { custom });
          if (cancelled) return;
          setView(current);
          stalls = current.answered.length === before ? stalls + 1 : 0;
          if (stalls >= 3) throw new Error("The applicant stopped answering.");
        }
        if (cancelled) return;
        setPhase("underwriting");
        const { licenceId } = await post(`/api/sittings/${current.id}/finish`);
        sessionStorage.removeItem(`imprimatur:custom:${initial.id}`);
        if (!cancelled) router.replace(`/licence/${licenceId}?fresh=1`);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
          setPhase("stopped");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // The loop restarts only when the visitor presses "Try again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const done = view.answered.length;
  const progress = Math.round((done / view.totalCases) * 100);
  const latest = view.answered[view.answered.length - 1];

  return (
    <div>
      <p className="kicker">Examination in progress</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{view.applicant.label}</h1>
      <p className="mt-2 text-muted">
        {view.applicant.model}{view.applicant.endpointHost === "built in" ? "" : ` at ${view.applicant.endpointHost}`}. {view.totalCases} cases on a fresh seed.
      </p>

      {view.constraints.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold">Rules carried into this re-sit</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {view.constraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-medium" aria-live="polite">
            {phase === "answering" && `Case ${Math.min(done + 1, view.totalCases)} of ${view.totalCases}`}
            {phase === "underwriting" && "All cases answered. Auditing reasons, underwriting and signing."}
            {phase === "stopped" && "The sitting stopped."}
          </p>
          <p className="font-mono text-sm">{progress}%</p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-rule"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Cases answered"
        >
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TALLY.map((t) => (
            <div key={t.outcome}>
              <dt className="text-xs text-muted">{t.label}</dt>
              <dd className="font-mono text-xl">{view.answered.filter((a) => a.outcome === t.outcome).length}</dd>
            </div>
          ))}
        </dl>
        {latest && phase === "answering" && (
          <p className="mt-4 border-t border-rule pt-3 text-sm text-muted">
            Last answered: {CLASS_LABEL[latest.cls].toLowerCase()}, the agent chose to{" "}
            <span className="font-mono text-ink">{latest.reply?.action ?? "give no decision"}</span>.
          </p>
        )}
        {error && (
          <div className="mt-4 rounded-md border border-bad bg-bad-soft p-3 text-sm text-bad" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className={`${buttonClass} mt-3`}
              onClick={() => {
                setError(null);
                setPhase("answering");
                setAttempt((n) => n + 1);
              }}
            >
              Try again from case {done + 1}
            </button>
          </div>
        )}
      </Card>

      <h2 className="mt-10 text-2xl font-semibold">Answered so far</h2>
      <p className="mt-1 text-sm text-muted">
        Each case shows its ground truth only after the agent has answered it. Open one to read the request and the reply.
      </p>
      <div className="mt-4">
        <CaseList answered={view.answered} />
      </div>
    </div>
  );
}
