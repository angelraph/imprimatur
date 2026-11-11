import { NextResponse } from "next/server";
import { fail, sittingView } from "@/lib/http";
import { getSitting } from "@/lib/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sitting = await getSitting(id);
  if (!sitting) return fail("No sitting with that id.", 404);
  return NextResponse.json(sittingView(sitting));
}
