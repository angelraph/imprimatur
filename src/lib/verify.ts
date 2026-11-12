import { isExpired, verifyLicence } from "./licence/licence";
import type { LicenceRecord } from "./types";

// What a merchant or another agent needs to know before serving a licensed agent.
export async function verificationOf(record: LicenceRecord) {
  const b = record.licence.body;
  const signatureValid = await verifyLicence(record.licence);
  const expired = isExpired(b);
  const inForce = signatureValid && !expired && (record.status === "provisional" || record.status === "confirmed");
  return {
    id: b.id,
    inForce,
    status: record.status,
    signatureValid,
    expired,
    grade: b.grade,
    limits: b.limits,
    applicant: { label: b.applicant.label, model: b.applicant.model, fingerprint: b.applicant.fingerprint },
    issuer: record.licence.issuer,
    issuedAt: b.issuedAt,
    expiresAt: b.expiresAt,
    outsideExaminer: record.reppo.state === "settled" ? { decision: record.reppo.decision, score: record.reppo.score } : { decision: null, score: null },
    licence: record.licence,
  };
}

export type Verification = Awaited<ReturnType<typeof verificationOf>>;

// Kite's two networks, as pinned in Kite's own x402 service templates.
export const KITE_CHAINS = {
  mainnet: { network: "eip155:2366", asset: "0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e", symbol: "USDC.e", decimals: 6, name: "Bridged USDC (Kite AI)", version: "2" },
  testnet: { network: "eip155:2368", asset: "0x38129cf4CE5E183eFF248F42A7D345Bb1B47621A", symbol: "pieUSD", decimals: 18, name: "pieUSD", version: "1" },
} as const;

// The paid endpoint is switched on by setting a Kite receiving wallet.
export function paywall() {
  const payTo = process.env.KITE_PAY_TO;
  if (!payTo || !/^0x[0-9a-fA-F]{40}$/.test(payTo)) return null;
  const chain = process.env.KITE_NETWORK === "testnet" ? KITE_CHAINS.testnet : KITE_CHAINS.mainnet;
  return {
    payTo: payTo as `0x${string}`,
    chain,
    // One cent in the token's smallest unit.
    amount: "1" + "0".repeat(chain.decimals - 2),
    facilitator: process.env.KITE_FACILITATOR_URL || "https://facilitator.pieverse.io/v2",
  };
}
