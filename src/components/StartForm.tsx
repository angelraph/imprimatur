"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, Card } from "./ui";

interface Choice {
  id: string;
  label: string;
  blurb: string;
  ready: boolean;
}

export function StartForm({ applicants }: { applicants: Choice[] }) {
  const router = useRouter();
  const firstReady = applicants.find((a) => a.ready)?.id ?? "custom";
  const [applicantId, setApplicantId] = useState(firstReady);
  const [size, setSize] = useState<"quick" | "full">("quick");
  const [baseURL, setBaseURL] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const custom = applicantId === "custom" ? { baseURL, model, apiKey, label } : undefined;
      const res = await fetch("/api/sittings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The key is not sent when the sitting is created. It travels only with each batch of cases.
        body: JSON.stringify({ applicantId, size, custom: custom ? { baseURL, model, label } : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The sitting could not be started.");
      if (custom) sessionStorage.setItem(`imprimatur:custom:${data.id}`, JSON.stringify(custom));
      router.push(`/sit/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The sitting could not be started.");
      setBusy(false);
    }
  }

  const input = "mt-1 block w-full rounded-lg border border-rule bg-paper px-3 py-2.5 font-mono text-sm";

  return (
    <form onSubmit={start} className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold">Who sits the exam?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[...applicants, { id: "custom", label: "Your own agent", blurb: "Any OpenAI-compatible chat endpoint you can reach over https.", ready: true }].map(
            (a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${
                  applicantId === a.id ? "border-accent bg-card" : "border-rule bg-card/60"
                } ${a.ready ? "" : "cursor-not-allowed opacity-60"}`}
              >
                <input
                  type="radio"
                  name="applicant"
                  value={a.id}
                  checked={applicantId === a.id}
                  disabled={!a.ready}
                  onChange={() => setApplicantId(a.id)}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-medium">{a.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{a.blurb}</span>
                  {!a.ready && <span className="mt-1 block text-xs text-warn">Live sittings are off for this one here.</span>}
                </span>
              </label>
            ),
          )}
        </div>
      </fieldset>

      {applicantId === "custom" && (
        <Card>
          <p className="text-sm text-muted">
            Your agent receives each case as a user message and must reply with one JSON object holding action, payee, amount and
            reason. Your key stays in this browser tab, is sent only with each batch of cases, and is never stored.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Endpoint base URL
              <input required type="url" placeholder="https://api.example.com/v1" value={baseURL} onChange={(e) => setBaseURL(e.target.value)} className={input} />
            </label>
            <label className="block text-sm">
              Model name
              <input required value={model} onChange={(e) => setModel(e.target.value)} className={input} />
            </label>
            <label className="block text-sm">
              API key
              <input type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={input} />
            </label>
            <label className="block text-sm">
              Name to print on the licence
              <input maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} className={input} />
            </label>
          </div>
        </Card>
      )}

      <fieldset>
        <legend className="text-sm font-semibold">Length</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { id: "quick" as const, label: "Short exam, 32 cases", blurb: "About two minutes. The limit is smaller because the sample is smaller." },
            { id: "full" as const, label: "Full exam, 64 cases", blurb: "About four minutes. Needed for the top grade to carry weight." },
          ].map((s) => (
            <label key={s.id} className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${size === s.id ? "border-accent bg-card" : "border-rule bg-card/60"}`}>
              <input type="radio" name="size" value={s.id} checked={size === s.id} onChange={() => setSize(s.id)} className="mt-1 accent-[var(--accent)]" />
              <span>
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{s.blurb}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="rounded-md border border-bad bg-bad-soft p-3 text-sm text-bad" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className={`${buttonClass} w-full sm:w-auto`}>
        {busy ? "Drawing the exam" : "Begin the examination"}
      </button>
    </form>
  );
}
