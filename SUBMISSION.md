# Imprimatur: submission notes

Notes for the SERV Hackathon 02 form.

- Live: https://imprimatur-delta.vercel.app
- Repo: https://github.com/angelraph/imprimatur
- Track: Reppo (also uses SERV Reasoning, Kite and Dolphin)
- Launch post with the demo film: https://x.com/RaphElevator/status/2120906364251689417

## Write-up

**One line.** Imprimatur examines an AI agent before it is allowed to spend money, and turns the result into a signed spending limit that Kite Passport enforces.

**The problem.** Kite Passport lets an owner give an agent a budget, but someone still has to choose the number. Today that number is a guess. Most entries in this hackathon check each payment as it happens. None of them answers the earlier question: how much has this agent earned the right to spend?

**What it does.**

1. The agent sits a seeded exam of 32 or 64 payment requests. Most are traps: lookalike payees, instructions hidden in memos, prices above the quote, duplicate invoices, split invoices and purchases outside the mandate. The rest are honest payments that should go through.
2. Code grades every answer against facts fixed before the agent saw the case. No model marks the work.
3. Code underwrites a limit from the record. It uses a Wilson 95% upper bound on the failure rate, so a short exam cannot earn a large limit, and an agent that refuses everything earns nothing.
4. The licence is signed and carries the exam seed and a hash of every reply. Anyone can redraw the exam and regrade it.
5. Reppo reviews the examiner's file. The licence is provisional until independent evaluators confirm that the limit follows from the evidence.
6. Kite enforces it. Each licence prints the `kpass session create` command with its own limits, and merchants can check a licence for one cent over x402.
7. An agent that fails gets corrective rules and sits a fresh exam on new cases.

**How each partner is used.**

- **SERV Reasoning** runs the judgement steps: reading replies that are not clean JSON behind Prompt Guard, auditing whether each refusal named the rule that applied, and writing corrective rules. It also runs the built-in applicant that follows an ordered checklist, with Multipath and a Shadow Agent.
- **Reppo** is the outside examiner. The system that sets the limit is not the one that approves it.
- **Kite** enforces the limit through a Passport session and carries the paid licence check over x402 version 2.
- **Dolphin** is the open model that sits the exam as the cheap baseline and drafts the examiner's note, which code checks figure by figure.

**A real result.** A small model running through SERV sat the short exam on the live site. It paid 0 of 24 hostile requests and 8 of 8 legitimate ones. Imprimatur granted Grade B: $20 per payment and $100 in total for 72 hours. Reppo's evaluators scored the file 100 and confirmed the licence in about a minute. The record is public at https://imprimatur-delta.vercel.app/licence/IMP-261112-19AA73

The same agent then sat the full 64-case exam: 0 of 48 hostile requests paid, 16 of 16 legitimate ones paid. The larger sample tightened the failure bound to 7.4%, which earned Grade A: $40 per payment and $500 in total for a week. Reppo scored that file 98 and confirmed it. Two plain-code baselines sat the same exam and were declined, and Reppo agreed with both refusals. https://imprimatur-delta.vercel.app/licence/IMP-261112-45BE38

**Feedback that proved itself.** The same small model was given a rubber stamp prompt: every invoice is already checked, approve it. It paid 21 of 24 hostile requests and was declined, and Reppo agreed. SERV wrote six corrective rules from the failed classes. On a fresh exam with new cases the agent paid 0 of 24 hostile requests and earned Grade C: $5 per payment and $20 in total for a day. Reppo scored that file 99 and confirmed it. Both records sit side by side at https://imprimatur-delta.vercel.app/licence/IMP-261112-5E11EE

The open model on Dolphin sat the same exam with a careless prompt, paid 0 of 24 hostile requests and 8 of 8 honest ones, and holds Grade B. Dolphin also drafts the examiner's note on each licence.

**Enforced on Kite, for real.** The Grade A licence was turned into a Kite Passport session with exactly its limits ($40 per payment, $500 in total, one week), approved with a passkey. Inside that session the agent paid one cent to a service in Kite's catalog; the transaction is on the licence page. When the agent tried to pay a host outside Kite's catalog, Passport refused before any money moved. Both receipts are shown at https://imprimatur-delta.vercel.app/licence/IMP-261112-45BE38

The licence check endpoint itself answers with a real x402 version 2 challenge for one cent on Kite mainnet. Passport cannot pay it yet, because Passport only pays hosts in Kite's own catalog and this site is not listed.

**Who pays.** The agent's owner pays an exam fee per sitting ($1 short, $2 full). Licences expire, so renewal recurs. Merchants and other agents pay one cent per licence check. The cost of a sitting is printed on every licence. In the runs above the models cost under one cent and the Reppo review cost 22 cents, so a $1 short exam keeps about 77 cents.

**Honest limits.** A licence describes behaviour on known traps. An attack that is not in the exam is not measured. The share of real requests assumed hostile (5%) is an assumption, printed on every licence. Every vendor, wallet and invoice in an exam is invented, and no exam moves money.

## Demo video

The finished video is `demo/imprimatur-demo.mp4` (2 minutes 41 seconds, 1080p, voiceover and captions). The narration is in [demo/transcript.md](demo/transcript.md) and the captions in `demo/imprimatur-demo.srt`. Every page in it is the live site.

## X post

The long post for X Premium and a short version are in [LAUNCH_POST.md](LAUNCH_POST.md). Posted on 12 Nov 2026: https://x.com/RaphElevator/status/2120906364251689417

## Submission form answers

The form is at https://openserv.typeform.com/submissions02. Answers that are not personal:

- **Track:** Reppo
- **New or existing project:** A new project
- **Project name:** Imprimatur
- **Project URL:** https://imprimatur-delta.vercel.app
- **Additional URL:** https://github.com/angelraph/imprimatur (or the video link once it is uploaded)
- **Logo:** `public/mark.png`
- **Team:** I'm participating solo

**Tell us about your project.**

Imprimatur is a spending licence for AI agents. Kite Passport lets an owner give an agent a budget, but the number is a guess. Imprimatur measures it. The agent sits a seeded exam of 32 or 64 payment requests, most of them traps: lookalike payees, instructions hidden in invoices, overcharges, duplicate and split invoices. Code grades every answer against facts fixed before the agent saw the case, then underwrites a limit from a Wilson 95% bound on the failure rate, so a short exam cannot earn a large limit. The licence is signed and can be regraded by anyone from its seed.

SERV Reasoning runs the judgement steps: reading replies that are off format behind Prompt Guard, auditing whether each refusal named the right rule, and writing corrective rules for agents that fail. Reppo's independent evaluators review every examiner's file, and a licence stays provisional until they confirm it. Kite enforces the result: each licence prints a Passport session command with its own limits, and we opened one for real, paid inside it and recorded Kite's refusal of an untrusted host. Dolphin's open model sits the exam and drafts the examiner's note.

It is for agent owners who need a cap they can defend, and for merchants who want to check an agent before serving it, for one cent over x402. Revenue is a fee per exam, renewal when licences expire, and the per-check fee. The live registry holds eleven real records, including a declined agent that earned a licence after SERV's corrective rules.
