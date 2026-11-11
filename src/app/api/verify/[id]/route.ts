import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { countVerification, getLicence } from "@/lib/store";
import { paywall, verificationOf } from "@/lib/verify";

export const maxDuration = 60;

// Licence verification for machines. When the Kite receiving details are set,
// this is an x402 endpoint: an unpaid call gets 402 with the price, and a call
// carrying X-PAYMENT is settled through the facilitator before the answer is sent.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const record = await getLicence(id);
  if (!record) return fail("No licence with that id.", 404);

  const wall = paywall();
  if (!wall) {
    return NextResponse.json({ ...(await verificationOf(record)), payment: "not required on this deployment" });
  }

  const resource = new URL(req.url).toString();
  const payment = req.headers.get("x-payment");
  if (!payment) {
    return NextResponse.json(
      {
        error: "X-PAYMENT header is required",
        accepts: [
          {
            scheme: "gokite-aa",
            network: wall.network,
            maxAmountRequired: wall.amount,
            resource,
            description: "Imprimatur: verify an agent spending licence",
            mimeType: "application/json",
            outputSchema: {
              input: { discoverable: true, method: "GET", type: "http" },
              output: {
                type: "object",
                required: ["id", "inForce", "grade", "limits"],
                properties: {
                  id: { type: "string", description: "Licence id" },
                  inForce: { type: "boolean", description: "True when the signature is valid, the licence has not expired and it has not been held, refused or suspended" },
                  grade: { type: "string", description: "A, B, C or Declined" },
                  limits: { type: "object", description: "Per-payment cap, total cap and lifetime in hours" },
                },
              },
            },
            payTo: wall.payTo,
            maxTimeoutSeconds: 300,
            asset: wall.asset,
            extra: null,
            merchantName: "Imprimatur",
          },
        ],
        x402Version: 1,
      },
      { status: 402 },
    );
  }

  let decoded: { authorization?: unknown; signature?: unknown };
  try {
    decoded = JSON.parse(Buffer.from(payment, "base64").toString("utf8"));
  } catch {
    return fail("The X-PAYMENT header is not valid base64 JSON.", 400);
  }

  try {
    const settle = await fetch(`${wall.facilitator}/v2/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorization: decoded.authorization, signature: decoded.signature, network: wall.network }),
    });
    const receipt = await settle.json().catch(() => ({}));
    if (!settle.ok || receipt.success === false) {
      return NextResponse.json({ error: "The payment could not be settled.", detail: receipt }, { status: 402 });
    }
    await countVerification();
    return NextResponse.json({ ...(await verificationOf(record)), payment: receipt });
  } catch {
    return fail("The payment facilitator could not be reached.", 502);
  }
}
