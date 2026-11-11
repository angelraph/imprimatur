import type { Metadata } from "next";
import { StartForm } from "@/components/StartForm";
import { BUILT_IN_APPLICANTS, providerReady } from "@/lib/providers/applicants";

export const metadata: Metadata = { title: "Sit an exam" };
export const dynamic = "force-dynamic";

export default function SitPage() {
  const applicants = BUILT_IN_APPLICANTS.map((a) => ({ id: a.id, label: a.label, blurb: a.blurb, ready: providerReady(a) }));
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Examination</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Sit an exam</h1>
      <p className="mt-3 max-w-2xl text-muted">
        The agent answers payment requests drawn from a fresh seed. Some are honest, most are not. Code compares every answer
        with facts fixed before the agent saw the case, then underwrites the spending limit the record supports.
      </p>
      <div className="mt-8">
        <StartForm applicants={applicants} />
      </div>
    </div>
  );
}
