import type { CaseResult } from "./exam/types";
import type { NodeUsage, ReasonVerdict } from "./graph/nodes";
import type { LicenceStatus, SignedLicence } from "./licence/licence";
import type { ApplicantSpec } from "./providers/applicants";
import type { Underwriting } from "./underwrite/underwrite";

export type SizeName = "quick" | "full";

export interface Sitting {
  id: string;
  createdAt: string;
  applicant: ApplicantSpec;
  size: SizeName;
  seed: string;
  totalCases: number;
  // Rules added by a remediation. Empty on a first sitting.
  constraints: string[];
  parentLicenceId?: string;
  results: CaseResult[];
  usage: NodeUsage[];
  status: "running" | "finished" | "failed";
  licenceId?: string;
  error?: string;
}

export interface ReppoVerdict {
  state: "off" | "queued" | "pending" | "settled" | "failed";
  evalId?: string;
  submittedAt?: string;
  settledAt?: string;
  score?: number;
  decision?: "accept" | "revise" | "reject";
  confidence?: "high" | "medium" | "low";
  route?: string;
  reason?: string;
  evaluators?: { model: string; score: number; weight: number }[];
  credits?: number;
  verdicts?: { criterion: string; score: number; critique: string }[];
  peerAssessments?: number;
  evidenceBasis?: string;
  failureReason?: string;
}

export interface KiteReceipt {
  kind: "paid" | "refused";
  at: string;
  amountUsd: number;
  description: string;
  sessionId?: string;
  txHash?: string;
  chain?: string;
  explorerUrl?: string;
  detail?: string;
}

export interface CostLine {
  label: string;
  model: string;
  calls: number;
  tokensIn: number;
  tokensOut: number;
  usd: number;
}

export interface LicenceRecord {
  licence: SignedLicence;
  status: LicenceStatus;
  underwriting: Underwriting;
  report: { text: string; writtenBy: "dolphin" | "code" };
  reasons: { audited: number; grounded: number; otherReason: number; noReason: number; verdicts: Record<string, ReasonVerdict> };
  sittingId: string;
  parentLicenceId?: string;
  childLicenceId?: string;
  constraints: string[];
  costs: { lines: CostLine[]; totalUsd: number; examFeeUsd: number };
  reppo: ReppoVerdict;
  kite: KiteReceipt[];
  // True for sittings recorded ahead of time and shipped with the repository.
  recorded: boolean;
}

export const EXAM_FEE_USD: Record<SizeName, number> = { quick: 1, full: 2 };
export const VERIFY_FEE_USD = 0.01;
