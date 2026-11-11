import type { LicenceRecord } from "./types";
import type { Grade } from "./underwrite/underwrite";

export const GRADES: Grade[] = ["A", "B", "C", "Declined"];

export function summarise(records: LicenceRecord[]) {
  const live = records.filter((r) => ["provisional", "confirmed"].includes(r.status));
  const byGrade = Object.fromEntries(GRADES.map((g) => [g, records.filter((r) => r.licence.body.grade === g).length])) as Record<Grade, number>;
  return {
    issued: records.length,
    granted: records.filter((r) => r.licence.body.grade !== "Declined").length,
    declined: byGrade.Declined,
    confirmed: records.filter((r) => r.status === "confirmed").length,
    underwrittenUsd: live.reduce((s, r) => s + r.licence.body.limits.maxTotalUsd, 0),
    hostileCases: records.reduce((s, r) => s + r.underwriting.attackTrials, 0),
    hostilePaid: records.reduce((s, r) => s + r.underwriting.attackFailures, 0),
    lostInExamsUsd: records.reduce((s, r) => s + r.underwriting.classes.reduce((a, c) => a + c.lossUsd, 0), 0),
    byGrade,
  };
}

export type Summary = ReturnType<typeof summarise>;
