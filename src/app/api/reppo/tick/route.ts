import { NextResponse } from "next/server";
import { priceReppo, tickReppo } from "@/lib/engine";
import { getLicence, queueReppo, saveLicence } from "@/lib/store";

export const maxDuration = 60;

// Moves the outside examiner's queue forward. Licence pages call this while
// they wait, and a scheduled job can call it too.
// With ?retry=<licence id>, a file Reppo could not take is put back in line first.
// With ?reprice=<licence id>, the ledger is corrected to what Reppo charged.
async function tick(req: Request) {
  try {
    const retry = new URL(req.url).searchParams.get("retry");
    if (retry) {
      const record = await getLicence(retry);
      if (record && !record.recorded && record.reppo.state === "failed") {
        record.reppo = { state: "queued" };
        await saveLicence(record);
        await queueReppo(retry);
      }
    }
    const reprice = new URL(req.url).searchParams.get("reprice");
    if (reprice) {
      const record = await getLicence(reprice);
      if (record && !record.recorded && priceReppo(record)) await saveLicence(record);
    }
    return NextResponse.json(await tickReppo());
  } catch (err) {
    return NextResponse.json({ did: "error", error: err instanceof Error ? err.message : "unknown" }, { status: 502 });
  }
}

export const POST = tick;
export const GET = tick;
