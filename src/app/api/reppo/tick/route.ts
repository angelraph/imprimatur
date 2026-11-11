import { NextResponse } from "next/server";
import { tickReppo } from "@/lib/engine";

export const maxDuration = 60;

// Moves the outside examiner's queue forward. Licence pages call this while
// they wait, and a scheduled job can call it too.
async function tick() {
  try {
    return NextResponse.json(await tickReppo());
  } catch (err) {
    return NextResponse.json({ did: "error", error: err instanceof Error ? err.message : "unknown" }, { status: 502 });
  }
}

export const POST = tick;
export const GET = tick;
