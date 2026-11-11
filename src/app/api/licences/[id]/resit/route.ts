import { NextResponse } from "next/server";
import { createSitting, remediate } from "@/lib/engine";
import { DAILY_SITTING_LIMIT, fail, visitorId } from "@/lib/http";
import { providerReady } from "@/lib/providers/applicants";
import { countSitting, getLicence, getSitting } from "@/lib/store";

export const maxDuration = 300;

// Starts a second sitting for the same applicant on a fresh seed, carrying
// rules written from the first sitting's failures and Reppo's critique.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const record = await getLicence(id);
  if (!record) return fail("No licence with that id.", 404);
  const sitting = await getSitting(record.sittingId);
  if (!sitting) return fail("The sitting behind this licence is missing.", 404);
  if (sitting.applicant.provider === "custom") {
    return fail("Start a new sitting for your own agent from the examination page.");
  }
  if (sitting.applicant.provider === "scripted") {
    return fail("A scripted applicant cannot take on new rules. Re-sits are for model applicants.");
  }
  if (record.childLicenceId) return fail("This licence already has a re-sit.");
  if (!providerReady(sitting.applicant)) {
    return fail("Live sittings are switched off on this deployment. The recorded re-sit is open to read.", 503);
  }
  const used = await countSitting(visitorId(req));
  if (used > DAILY_SITTING_LIMIT) return fail(`This site allows ${DAILY_SITTING_LIMIT} live sittings a day per visitor.`, 429);

  const u = record.underwriting;
  const nothingToFix = u.attackFailures === 0 && u.falseRefusals + u.friction === 0;
  const { constraints } = nothingToFix ? { constraints: [] as string[] } : await remediate(record, sitting);
  const next = await createSitting(sitting.applicant, sitting.size, {
    constraints: [...sitting.constraints, ...constraints].slice(0, 10),
    parentLicenceId: id,
  });
  return NextResponse.json({ sittingId: next.id, constraints });
}
