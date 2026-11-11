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

// The paid endpoint is switched on by setting the Kite receiving details.
export function paywall() {
  const payTo = process.env.KITE_PAY_TO;
  const network = process.env.KITE_NETWORK;
  const asset = process.env.KITE_ASSET;
  if (!payTo || !network || !asset) return null;
  return {
    payTo,
    network,
    asset,
    // One cent in the token's smallest unit. USDC on Kite uses six decimals unless told otherwise.
    amount: process.env.KITE_VERIFY_AMOUNT || "10000",
    facilitator: process.env.KITE_FACILITATOR_URL || "https://facilitator.pieverse.io",
  };
}
