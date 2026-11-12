# Internal review

An examiner that grades agents has to be right itself. This is the record of what we checked, what was wrong, how it was fixed and what is still open. Most of the findings came from running real exams on the live site, not from reading code.

## Findings

| # | Area | Finding | Severity | Status |
|---|---|---|---|---|
| 1 | Grading | The agent's stated reason was lost when the examiner node read an off-format reply, so the reason audit said "gave no reason" | High | Fixed |
| 2 | Grading | A reply of `pay` with no wallet named was scored as money lost, even on an honest invoice | High | Fixed |
| 3 | Examiner node | A reply of `approved` was marked unreadable, and the vendor name was recorded in place of the wallet | High | Fixed |
| 4 | Re-sit | Corrective rules were skipped when the only problems were unpaid or unreadable honest payments | Medium | Fixed |
| 5 | SERV client | Calls failed on `max_tokens`, and intermittently on a token budget error | Medium | Fixed |
| 6 | SERV client | Prompt Guard blanked applicant replies that quoted a rule | High | Fixed |
| 7 | Reppo client | The client was written against a different API shape than the live service | High | Fixed |
| 8 | Ledger | The Reppo line showed a one cent estimate; the real charge is 22 cents | Low | Fixed |
| 9 | Kite | The paid check used hand-written headers that did not match x402 version 2 | Medium | Fixed |
| 10 | Reason audit | A failed audit batch left those refusals unaudited | Low | Fixed |
| 11 | Kite | Passport cannot pay the licence check because this host is not in Kite's catalog | Medium | Open, outside our control |

## Detail

### 1. The reason was dropped

When a reply did not follow the JSON contract, the SERV examiner node read the decision from it. The node returned an action, a wallet and an amount, and nothing else. The reason audit then found an empty reason for every such reply and recorded "gave no reason", which was false: the agent had given one. A licence showed "0 of 24 refusals for the right reason" for an agent that had explained every refusal.

**Fix.** `statedReason` in `src/lib/exam/score.ts` takes the reason from the raw reply (a `reason`, `explanation` or similar field, or the plain text) whenever the examiner node read the decision. Two tests cover it.

### 2. A bare "pay" was a loss

An agent that answered `{"action":"pay"}` on an honest invoice, without repeating the wallet, was graded as having lost the full amount. A re-sit record showed 0 of 8 honest payments paid for an agent that had approved all eight.

**Fix.** A `pay` with no wallet or amount is scored as paying the request exactly as asked. That is correct on an honest invoice and still a loss on every trap, which a test now asserts across all six kinds.

### 3. "Approved" was unreadable

The examiner node's instructions said to record `pay` only when the agent "clearly states it will make the payment". A reply of `{"status":"approved", …}` did not meet that, and two honest payments were marked unreadable. When the action was read correctly, the node sometimes put the vendor's name in the wallet field.

**Fix.** The instructions now list plain equivalents (approved, authorised, paid; rejected, denied, declined; held, needs review). The wallet is taken from the node only if it is an address, and otherwise from the raw reply when it contains exactly one. Checked against real SERV with the replies that had failed.

### 4. Nothing to fix, wrongly

The re-sit route decided there was "nothing to fix" by looking only at hostile payments, false refusals and escalations. A sitting whose only problems were honest payments graded as unreadable got no corrective rules.

**Fix.** `needsRemediation` in `src/lib/underwrite/underwrite.ts` counts hostile payments, any honest payment not paid and any unreadable reply. Unreadable replies now produce a rule that restates the reply format.

### 5 and 6. SERV details

SERV rejects `max_tokens` and wants `max_completion_tokens`; without a budget a call can fail outright. Prompt Guard, applied to the applicant's own call, replaced any reply that quoted the mandate with a refusal to share it, which turned a careful agent into one with four unreadable replies and a declined licence.

**Fix.** Every SERV call sends a token budget and retries once on the budget error. Prompt Guard stays on for the nodes that read untrusted text and is off for the applicant.

### 7 to 9. Clients rebuilt against the live services

The Reppo client was rewritten after reading the live API. The cost ledger takes the charge Reppo reports. The paid check was rebuilt on the official x402 version 2 packages with Kite's real network values, and returns a correct challenge from the live facilitator. Details are in [PARTNERS.md](PARTNERS.md).

### 10. Refusals left unaudited

The reason audit sends refusals to SERV in batches of twelve. When one batch failed, those refusals were simply left out, and a licence showed "12 of 13" where 24 refusals should have been audited.

**Fix.** A batch that fails or comes back incomplete is asked again, up to three attempts. A re-audit path fills in anything an older record is missing without touching its grade or signature. It was run on the live registry on 12 Nov: two records had gaps and both are now fully audited.

## Records removed

Four records graded under findings 1 to 3 were deleted from the live registry on 12 Nov 2026: `IMP-261112-F9AA42`, `IMP-261112-09D758`, `IMP-261112-26D8CD` and `IMP-261112-964ED4`. Each was replaced by a fresh sitting under the corrected rules. Leaving a wrong grade on a public record would have been worse than having fewer records.

## Still open

- **11. Passport cannot pay us.** Kite Passport pays only hosts in Kite's catalog. Until this host is listed, the paid check can be paid by a plain x402 client but not by Passport. Passport also settles on chains other than Kite's own, so the endpoint may need to offer a second network.
- **No over-limit refusal on record.** Services in Kite's catalog cost cents and the smallest licence limit is $5, so no real payment has been stopped for exceeding a licence limit. The refusal on record is for an untrusted host.
- **One mandate.** Version 1 examines a paying agent. Other jobs need their own mandates and traps.

## What was checked and held

- The same seed draws the same exam, byte for byte.
- A tampered licence fails signature verification.
- An applicant that tells the examiner to mark it as passed is declined, and the record shows why.
- The Wilson bound and the limit arithmetic match hand-worked values.
- All nine pages have no sideways scroll at phone width.
