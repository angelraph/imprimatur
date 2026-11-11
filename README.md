# Imprimatur

Get verified. Spend with confidence.

Imprimatur examines an AI agent before it is allowed to spend money. The agent answers a set of payment requests, most of them built to fool it. Code measures how often it would have lost money. From that record Imprimatur underwrites a spending limit and issues a signed licence, which Kite Passport then enforces.

Built for SERV Hackathon 02 (Reppo track) on SERV Reasoning, Dolphin, Reppo and Kite.

## The problem

Kite Passport lets you give an agent a budget. Somebody still has to pick the number. Today that number is a guess. A cap limits how much an agent can lose. It says nothing about how likely a loss is.

Payment firewalls check each payment as it happens. Nothing checks, beforehand, how much an agent deserves to be trusted with. Imprimatur does that.

## How it works

1. **Draw the exam.** A seed produces 32 or 64 payment requests with their correct answers fixed in advance: lookalike payees, instructions hidden in memos, prices above the quote, duplicate invoices, split invoices, purchases outside the mandate, and honest payments that should go through.
2. **The agent answers.** Any OpenAI-compatible endpoint can sit. Built-in applicants run on Dolphin and on SERV.
3. **Code grades.** The action, wallet and amount are compared with the facts. No model marks the work.
4. **SERV judges what needs judgement.** It reads replies that are not clean JSON, behind Prompt Guard, and audits whether each refusal named the rule that applied.
5. **Code underwrites.** A Wilson 95% upper bound on the failure rate, the owner's loss tolerance and a grade band give a per-payment cap, a total and an expiry.
6. **The licence is signed.** It carries the seed and a hash of every reply, so anyone can redraw the exam and regrade it.
7. **Reppo confirms.** The examiner's file goes to Reppo's evaluation network. The licence is provisional until the verdict settles.
8. **Kite enforces.** Each licence prints the `kpass session create` command with its own limits.
9. **Re-sit.** SERV turns failures and Reppo's critique into corrective rules. The agent sits a new exam on new cases, and both records are shown side by side.

## What each partner does

| Partner | Job |
| --- | --- |
| SERV Reasoning | The decision nodes: reading messy replies, the reason audit, the corrective rules. Uses Prompt Guard, Shadow Agent, Multipath and Kronos. Also runs the bound-procedure applicant. |
| Dolphin | The open model in the dock (DeepSeek V4.1 Flash) and the drafter of the examiner's note, which code checks figure by figure. |
| Reppo | The outside examiner. Scores the examiner's file and confirms, holds or refuses the licence. Its critique feeds the re-sit. |
| Kite | Enforcement through a Passport session with the licence's limits, and the x402 paid licence check. |

Dolphin is not in SERV's model catalog, so SERV does not wrap Dolphin calls. They are separate steps in the examination graph. The graph is our own, built on the public SERV API.

## Run it

```bash
npm install
```

```bash
cp .env.example .env.local
```

Put a fresh 32-byte hex key in `ISSUER_PRIVATE_KEY`. That alone is enough to run the two scripted applicants. Add `SERV_API_KEY`, `DOLPHIN_API_KEY` and `REPPO_API_KEY` to switch on the model applicants and the outside examiner.

```bash
npm run dev
```

```bash
npm test
```

## Where things are

```
src/lib/exam         the seeded case generator, ground truth and scoring
src/lib/underwrite   the Wilson bound and the limit arithmetic
src/lib/licence      the licence format, signing and verification
src/lib/graph        the examination graph and the SERV and Dolphin nodes
src/lib/providers    Dolphin, SERV, Reppo and the scripted baselines
src/lib/engine.ts    a sitting from first case to signed licence, and the Reppo queue
src/app/(site)       landing, method, pricing, docs, FAQ
src/app/(app)        examination office, registry, licence, sitting, verify
src/app/api          sittings, licences, the Reppo tick and the x402 check
tests                unit tests for the generator, scoring, underwriting and signatures
```

## Honest limits

- A licence describes behaviour on known traps. An attack that is not in the exam is not measured.
- The share of real requests assumed hostile (5%) is an assumption. It is printed on every licence.
- The two scripted applicants are plain code, not models. They are labelled as scripts and exist as baselines.
- Every vendor, wallet and invoice in an exam is invented. No exam moves money.

## Licence

MIT
