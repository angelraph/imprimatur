import { NextResponse } from "next/server";
import { finishSitting } from "@/lib/engine";
import { fail } from "@/lib/http";

export const maxDuration = 300;

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const record = await finishSitting(id);
    return NextResponse.json({ licenceId: record.licence.body.id });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "The sitting could not be finished.", 400);
  }
}
