import type { ReppoVerdict } from "../types";

const BASE = "https://eval.reppo.xyz/api/v1/agents/evals";

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

// Reppo judges an "action": an instruction and what was done about it. Here the
// instruction is the examiner's brief and the action is the licence it issued.
export function dossierInput(d: Dossier): string {
  return [
    `INSTRUCTION GIVEN TO THE EXAMINER\n${d.context}`,
    `WHAT THE EXAMINER DID\n${d.payload}`,
    `QUESTIONS FOR THE REVIEW\n${d.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`,
  ]
    .join("\n\n")
    .slice(0, 14_000);
}

export async function submitEvaluation(d: Dossier): Promise<{ evalId: string }> {
  const body = (await call("", {
    method: "POST",
    body: JSON.stringify({ taskType: "action", input: dossierInput(d) }),
  })) as { id: string };
  if (!body?.id) throw new ReppoError("Reppo did not return an evaluation id.", 502);
  return { evalId: body.id };
}

interface RawEvaluation {
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  completedAt?: string | null;
  creditsCharged?: number;
  error?: string | null;
  result?: {
    score?: number;
    decision?: "accept" | "revise" | "reject";
    route?: string;
    confidence?: "high" | "medium" | "low";
    reason?: string;
    rubric_scores?: Record<string, number>;
    consensus?: { evaluators?: { model?: string; overall?: number; weight?: number }[] };
  } | null;
}

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");

export async function readEvaluation(evalId: string): Promise<Partial<ReppoVerdict> & { state: ReppoVerdict["state"] }> {
  const raw = (await call(`/${encodeURIComponent(evalId)}`)) as RawEvaluation;
  if (raw.status === "QUEUED" || raw.status === "PROCESSING") return { state: "pending" };
  const res = raw.result;
  if (raw.status !== "COMPLETED" || !res || typeof res.score !== "number" || !res.decision) {
    return { state: "failed", failureReason: raw.error || res?.reason || "Reppo could not judge this file." };
  }
  const evaluators = (res.consensus?.evaluators ?? []).map((e) => ({
    model: e.model ?? "unnamed",
    score: Math.round(e.overall ?? 0),
    weight: e.weight ?? 0,
  }));
  return {
    state: "settled",
    settledAt: raw.completedAt ?? undefined,
    score: Math.round(res.score),
    decision: res.decision,
    confidence: res.confidence,
    route: res.route,
    reason: res.reason,
    verdicts: Object.entries(res.rubric_scores ?? {}).map(([k, v]) => ({ criterion: title(k), score: Math.round(v), critique: "" })),
    evaluators,
    peerAssessments: evaluators.length,
    credits: raw.creditsCharged,
  };
}
