import { keccak256, toHex, verifyMessage, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Grade } from "../underwrite/underwrite";

export type LicenceStatus = "provisional" | "confirmed" | "held" | "refused" | "suspended" | "declined";

// The part of a licence that is signed. Status lives outside it because it
// changes after issue (Reppo confirms, an incident suspends).
export interface LicenceBody {
  id: string;
  version: 1;
  mandateId: string;
  applicant: {
    label: string;
    model: string;
    endpointHost: string;
    fingerprint: Hex;
  };
  grade: Grade;
  limits: { maxPerPaymentUsd: number; maxTotalUsd: number; ttlHours: number };
  exam: {
    seed: string;
    cases: number;
    attackTrials: number;
    attackFailures: number;
    failureBound: number;
    legitPayRate: number;
    resultsHash: Hex;
  };
  assumptions: { lossToleranceUsd: number; attackPrevalence: number };
  issuedAt: string;
  expiresAt: string;
}

export interface SignedLicence {
  body: LicenceBody;
  issuer: Hex;
  signature: Hex;
}

// JSON with keys in a fixed order, so the same licence always hashes the same.
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(",")}}`;
}

export const hashOf = (value: unknown): Hex => keccak256(toHex(canonical(value)));

export function applicantFingerprint(endpointHost: string, model: string, systemPrompt: string): Hex {
  return hashOf({ endpointHost, model, systemPrompt });
}

const messageFor = (body: LicenceBody) => `Imprimatur licence ${body.id}\n${hashOf(body)}`;

export async function signLicence(body: LicenceBody, issuerKey: Hex): Promise<SignedLicence> {
  const account = privateKeyToAccount(issuerKey);
  const signature = await account.signMessage({ message: messageFor(body) });
  return { body, issuer: account.address, signature };
}

export async function verifyLicence(licence: SignedLicence, expectedIssuer?: Hex): Promise<boolean> {
  if (expectedIssuer && expectedIssuer.toLowerCase() !== licence.issuer.toLowerCase()) return false;
  try {
    return await verifyMessage({
      address: licence.issuer,
      message: messageFor(licence.body),
      signature: licence.signature,
    });
  } catch {
    return false;
  }
}

export function isExpired(body: LicenceBody, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(body.expiresAt).getTime();
}

// The exact Kite Passport command that enforces a licence.
export function kpassSessionCommand(body: LicenceBody): string {
  const { maxPerPaymentUsd, maxTotalUsd, ttlHours } = body.limits;
  return [
    "kpass session create",
    `--task-summary "Imprimatur licence ${body.id}, grade ${body.grade}"`,
    `--max-amount-per-tx ${maxPerPaymentUsd}`,
    `--max-total-amount ${maxTotalUsd}`,
    `--ttl ${ttlHours}h`,
    "--assets USDC",
    "--output json",
  ].join(" ");
}
