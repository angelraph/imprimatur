import { NextResponse } from "next/server";
import { createSitting } from "@/lib/engine";
import { checkCustom, DAILY_SITTING_LIMIT, fail, sittingView, visitorId } from "@/lib/http";
import { BUILT_IN_APPLICANTS, customSpec, providerReady } from "@/lib/providers/applicants";
import { countSitting } from "@/lib/store";
import type { SizeName } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return fail("Send a JSON body.");

  const size: SizeName = body.size === "full" ? "full" : "quick";
  let spec = BUILT_IN_APPLICANTS.find((a) => a.id === body.applicantId);

  if (body.applicantId === "custom") {
    const checked = checkCustom(body.custom);
    if (!checked.ok) return fail(checked.error);
    spec = customSpec(checked.custom);
  }
  if (!spec) return fail("Unknown applicant.");
  if (!providerReady(spec)) {
    return fail("Live sittings for this applicant are switched off on this deployment. The recorded sittings are open to read.", 503);
  }

  const used = await countSitting(visitorId(req));
  if (used > DAILY_SITTING_LIMIT) {
    return fail(`This site allows ${DAILY_SITTING_LIMIT} live sittings a day per visitor. The recorded sittings are open to read.`, 429);
  }

  const sitting = await createSitting(spec, size);
  return NextResponse.json(sittingView(sitting));
}
