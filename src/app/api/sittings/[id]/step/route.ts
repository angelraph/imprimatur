import { NextResponse } from "next/server";
import { stepSitting } from "@/lib/engine";
import { checkCustom, fail, sittingView } from "@/lib/http";
import { getSitting } from "@/lib/store";

export const maxDuration = 300;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sitting = await getSitting(id);
  if (!sitting) return fail("No sitting with that id.", 404);

  let custom;
  if (sitting.applicant.provider === "custom") {
    const body = await req.json().catch(() => null);
    const checked = checkCustom(body?.custom);
    if (!checked.ok) return fail(checked.error);
    if (new URL(checked.custom.baseURL).host !== sitting.applicant.endpointHost) {
      return fail("The endpoint does not match the one this sitting started with.");
    }
    custom = checked.custom;
  }

  try {
    return NextResponse.json(sittingView(await stepSitting(id, custom)));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "The applicant did not answer.", 502);
  }
}
