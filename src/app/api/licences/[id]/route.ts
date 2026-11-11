import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { getLicence } from "@/lib/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const record = await getLicence(id);
  if (!record) return fail("No licence with that id.", 404);
  return NextResponse.json({ status: record.status, reppo: record.reppo, childLicenceId: record.childLicenceId ?? null });
}
