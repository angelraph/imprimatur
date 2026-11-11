import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { generateExam } from "./exam/generator";
import { EXAM_SIZES } from "./exam/types";
import type { CustomApplicant } from "./providers/applicants";
import type { Sitting } from "./types";

export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export function visitorId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return createHash("sha256").update(forwarded).digest("hex").slice(0, 16);
}

export const DAILY_SITTING_LIMIT = Number(process.env.DAILY_SITTING_LIMIT || 6);

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i;

function privateAddress(host: string): boolean {
  if (isIP(host) === 4) {
    const [a, b] = host.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
  }
  return isIP(host.replace(/^\[|\]$/g, "")) === 6;
}

// A visitor may point the exam at their own agent. The server will call that
// address, so it must be a public https endpoint and nothing on a private network.
export function checkCustom(input: unknown): { ok: true; custom: CustomApplicant } | { ok: false; error: string } {
  const c = input as Partial<CustomApplicant> | null;
  if (!c || typeof c.baseURL !== "string" || typeof c.model !== "string") {
    return { ok: false, error: "Give the endpoint address and a model name." };
  }
  let url: URL;
  try {
    url = new URL(c.baseURL.trim());
  } catch {
    return { ok: false, error: "The endpoint address is not a valid URL." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "The endpoint must use https." };
  if (PRIVATE_HOST.test(url.hostname) || privateAddress(url.hostname)) {
    return { ok: false, error: "The endpoint must be a public address." };
  }
  if (!c.model.trim() || c.model.length > 120) return { ok: false, error: "The model name is missing or too long." };
  return {
    ok: true,
    custom: {
      baseURL: url.toString().replace(/\/$/, ""),
      apiKey: typeof c.apiKey === "string" ? c.apiKey : "",
      model: c.model.trim(),
      label: typeof c.label === "string" ? c.label.trim().slice(0, 60) : "",
    },
  };
}

// What the browser may see of a sitting: only cases already answered,
// each with its brief, the ground truth and how it was graded.
export function sittingView(sitting: Sitting) {
  const cases = generateExam(sitting.seed, EXAM_SIZES[sitting.size]);
  const byId = new Map(cases.map((c) => [c.id, c]));
  return {
    id: sitting.id,
    createdAt: sitting.createdAt,
    applicant: {
      id: sitting.applicant.id,
      label: sitting.applicant.label,
      model: sitting.applicant.model,
      endpointHost: sitting.applicant.endpointHost,
      systemPrompt: sitting.applicant.systemPrompt,
    },
    size: sitting.size,
    seed: sitting.status === "finished" ? sitting.seed : null,
    totalCases: sitting.totalCases,
    constraints: sitting.constraints,
    parentLicenceId: sitting.parentLicenceId ?? null,
    status: sitting.status,
    licenceId: sitting.licenceId ?? null,
    answered: sitting.results.map((r) => {
      const c = byId.get(r.caseId)!;
      return {
        ...r,
        brief: c.brief,
        request: c.request,
        truth: c.truth,
      };
    }),
  };
}

export type SittingView = ReturnType<typeof sittingView>;
