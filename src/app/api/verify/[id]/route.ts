import { NextResponse, type NextRequest } from "next/server";
import { withX402, x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { fail } from "@/lib/http";
import { countVerification, getLicence } from "@/lib/store";
import { paywall, verificationOf } from "@/lib/verify";

export const maxDuration = 60;

// Licence verification for machines. When a Kite receiving wallet is set this is
// an x402 endpoint: an unpaid call gets 402 with the price in a PAYMENT-REQUIRED
// header, and a paid call is settled through the facilitator after the answer is ready.
async function answer(req: NextRequest, paid: boolean): Promise<NextResponse> {
  const id = decodeURIComponent(new URL(req.url).pathname.split("/").pop() ?? "");
  const record = await getLicence(id);
  if (!record) return fail("No licence with that id.", 404);
  if (paid) await countVerification();
  return NextResponse.json({
    ...(await verificationOf(record)),
    payment: paid ? "settled on Kite" : "not required on this deployment",
  });
}

type Handler = (req: NextRequest) => Promise<NextResponse>;
let paidHandler: Handler | null = null;

function paidRoute(wall: NonNullable<ReturnType<typeof paywall>>): Handler {
  if (paidHandler) return paidHandler;
  const server = new x402ResourceServer(new HTTPFacilitatorClient({ url: wall.facilitator })).register(
    wall.chain.network,
    new ExactEvmScheme(),
  );
  paidHandler = withX402(
    (req: NextRequest) => answer(req, true),
    {
      "/api/verify/[id]": {
        accepts: {
          scheme: "exact",
          network: wall.chain.network,
          payTo: wall.payTo,
          price: { asset: wall.chain.asset, amount: wall.amount, extra: { name: wall.chain.name, version: wall.chain.version } },
        },
        description: "Imprimatur: check an agent's spending licence",
        mimeType: "application/json",
      },
    },
    server,
  ) as Handler;
  return paidHandler;
}

export async function GET(req: NextRequest) {
  const wall = paywall();
  if (!wall) return answer(req, false);
  try {
    return await paidRoute(wall)(req);
  } catch {
    return fail("The payment facilitator could not be reached.", 502);
  }
}
