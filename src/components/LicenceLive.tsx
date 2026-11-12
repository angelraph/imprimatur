"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReppoVerdict } from "@/lib/types";
import { buttonClass, quietButtonClass } from "./ui";

// While Reppo has not settled, nudge the queue and reload when something changes.
export function ReppoWatcher({ licenceId, state }: { licenceId: string; state: ReppoVerdict["state"] }) {
  const router = useRouter();
  useEffect(() => {
    if (state !== "queued" && state !== "pending") return;
    let stopped = false;
    const check = async () => {
      try {
        await fetch("/api/reppo/tick", { method: "POST" });
        const res = await fetch(`/api/licences/${licenceId}`, { cache: "no-store" });
        const data = await res.json();
        if (!stopped && data.reppo?.state && data.reppo.state !== state) router.refresh();
      } catch {
        // A missed poll is harmless. The next one will catch up.
      }
    };
    check();
    const timer = setInterval(check, 8_000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [licenceId, state, router]);
  return null;
}

export function ResitButton({ licenceId, label }: { licenceId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/licences/${licenceId}/resit`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The re-sit could not be started.");
      router.push(`/sit/${data.sittingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The re-sit could not be started.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={busy} className={buttonClass}>
        {busy ? "Writing the corrective rules" : label}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-bad bg-bad-soft p-3 text-sm text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`${quietButtonClass} min-h-9 px-3 py-1.5 text-xs`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
