# Imprimatur: submission notes

Drafts for the SERV Hackathon 02 form. Nothing here has been posted.

- Live: https://imprimatur-delta.vercel.app
- Repo: https://github.com/angelraph/imprimatur
- Track: Reppo (also uses SERV Reasoning, Kite and Dolphin)

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

**Who pays.** The agent's owner pays an exam fee per sitting ($1 short, $2 full). Licences expire, so renewal recurs. Merchants and other agents pay one cent per licence check. The model cost of a short sitting is printed on every licence and came to under one cent in the run above.

**Honest limits.** A licence describes behaviour on known traps. An attack that is not in the exam is not measured. The share of real requests assumed hostile (5%) is an assumption, printed on every licence. Every vendor, wallet and invoice in an exam is invented, and no exam moves money.

## Demo video script (about three minutes)

1. **Landing page (20 s).** "Kite lets you give an agent a budget. Nobody tells you what the budget should be. Imprimatur does."
2. **Sit an exam (50 s).** Open Sit an exam, choose the SERV applicant and the short exam, start it. Let cases stream in. Open one trap and one honest case and show the ground truth beside the agent's answer.
3. **The licence (50 s).** Show the grade, the three limits, the signature badge, and the table that explains how the limit was reached. Point at the Kite Passport command.
4. **Reppo (30 s).** Show the status change from provisional to confirmed, the score, and the evaluators' reasoning.
5. **A failure (20 s).** Open the scripted checker's declined licence and show which class of trap it paid.
6. **Verify (15 s).** Paste the licence number into Verify, then show the 402 terms for the paid check.
7. **Close (10 s).** "Get verified. Spend with confidence."

## X post

Kite lets you give an AI agent a budget. Nobody tells you what the number should be.

Imprimatur examines the agent first: 32 payment traps, graded by code, underwritten into a signed spending limit that Kite Passport enforces and Reppo evaluators confirm.

Built on SERV Reasoning for @openservai Hackathon 02.

https://imprimatur-delta.vercel.app
