import type { ReppoVerdict } from "../types";

const BASE = "https://eval.reppo.xyz/api/v1/agents/eval-requests";

export const reppoKey = () => process.env.REPPO_API_KEY || "";

export class ReppoError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${reppoKey()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error || `Reppo returned ${res.status}`;
    throw new ReppoError(message, res.status);
  }
  return body;
}

export interface Dossier {
  payload: string;
  context: string;
  criteria: string[];
}

// Reppo judges after a settlement window. Ten minutes is the shortest it offers.
export async function submitEvaluation(d: Dossier): Promise<{ evalId: string }> {
  const body = (await call("/submit", {
    method: "POST",
    body: JSON.stringify({
      type: "trace",
      payload: d.payload.slice(0, 48_000),
      context: d.context.slice(0, 30_000),
      criteria: d.criteria.slice(0, 10),
      settlementMinutes: 10,
    }),
  })) as { evalId: string };
  return { evalId: body.evalId };
}

interface RawEvaluation {
  status: "PENDING" | "SETTLED" | "FAILED" | "DENIED";
  minSettleAt?: string;
  settledAt?: string | null;
  peerAssessmentCount?: number;
  result?: {
    reason?: string;
    verdict?: { score: number; decision: "accept" | "revise" | "reject"; confidence: "high" | "medium" | "low" };
    verdicts?: { criterion: string; score: number; critique: string }[];
    action?: { route: "auto-ship" | "review" | "block" };
    evidence?: { evidenceBasis?: string; peerAssessmentCount?: number };
  } | null;
}

export async function readEvaluation(evalId: string): Promise<Partial<ReppoVerdict> & { state: ReppoVerdict["state"] }> {
  const raw = (await call(`/${encodeURIComponent(evalId)}`)) as RawEvaluation;
  if (raw.status === "PENDING") return { state: "pending", minSettleAt: raw.minSettleAt };
  if (raw.status !== "SETTLED" || !raw.result?.verdict) {
    return { state: "failed", failureReason: raw.result?.reason || "Reppo could not judge this dossier." };
  }
  return {
    state: "settled",
    settledAt: raw.settledAt ?? undefined,
    score: raw.result.verdict.score,
    decision: raw.result.verdict.decision,
    confidence: raw.result.verdict.confidence,
    route: raw.result.action?.route,
    verdicts: raw.result.verdicts ?? [],
    peerAssessments: raw.peerAssessmentCount ?? raw.result.evidence?.peerAssessmentCount ?? 0,
    evidenceBasis: raw.result.evidence?.evidenceBasis,
  };
}
