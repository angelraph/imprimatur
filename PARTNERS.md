# Partner integrations, as verified live

What SERV Reasoning, Reppo, Kite and Dolphin actually accept and return. Everything here was checked against the live services on 12 Nov 2026. Where the live behaviour differed from what we first expected, the difference is written down, because the next team will hit the same thing.

## SERV Reasoning (OpenServ)

| | |
|---|---|
| Base URL | `https://inference-api.openserv.ai/v1` (OpenAI-compatible) |
| Model | `gpt-6-luna` |
| Client | `openai` SDK, in `src/lib/providers/chat.ts` |

**Where it is used**

| Node | Model string | Features |
|---|---|---|
| Applicant, bound procedure | `gpt-6-luna-serv-multipath` | Shadow Agent, 2 iterations |
| Examiner reads off-format replies | `gpt-6-luna` | Prompt Guard, JSON schema output |
| Reason audit | `gpt-6-luna` | Prompt Guard, Shadow Agent |
| Corrective rules | `gpt-6-luna-serv-kronos-multipath` | Prompt Guard, Shadow Agent |

**What we learned**

- The API rejects `max_tokens`. It wants `max_completion_tokens`.
- Without a token budget, a call can fail with `max_tokens is too large`. Every SERV call now sends an explicit budget and retries once on that error.
- Prompt Guard withholds a reply that quotes the system prompt. That is right for the examiner, whose input is untrusted text from the applicant. It is wrong for the applicant, whose job is to cite the rule it applied, so the guard is off on that one call.
- A small model on a careful procedure is strong. The bound applicant paid 0 of 72 hostile requests across two exams.

## Reppo

| | |
|---|---|
| Submit | `POST https://eval.reppo.xyz/api/v1/agents/evals` with `{ "taskType": "action", "input": "<the examiner's file>" }` |
| Read | `GET https://eval.reppo.xyz/api/v1/agents/evals/{id}` |
| Client | `src/lib/providers/reppo.ts` |

**The result**

A settled evaluation carries a `score` from 0 to 100, a `decision` (accept, revise or reject), a `route` (ship, review or block), a `confidence`, a written `reason`, rubric scores for scope, safety, correctness and reversibility, and the list of evaluator models with the score each gave.

| Reppo decision | Licence status |
|---|---|
| accept | confirmed |
| revise | held |
| reject | refused |

**What we learned**

- Evaluations settle in one to two minutes.
- One file costs 440 credits, which is 22 cents. The licence ledger shows the charge Reppo reports, not an estimate.
- The file we send is the examiner's work, not the agent's: the mandate, the counts, the underwriting rules, the outcome, a sample of cases with replies and grades, and five questions for the review. Reppo is asked whether the limit follows from the evidence. It is not asked to re-run the agent.
- Reppo also reviews refusals. All three declined records were scored, and Reppo agreed with each.

## Kite

**The paid licence check (seller side)**

| | |
|---|---|
| Endpoint | `GET /api/verify/{id}`, in `src/app/api/verify/[id]/route.ts` |
| Protocol | x402 version 2, scheme `exact` |
| Packages | `@x402/next`, `@x402/core`, `@x402/evm` |
| Network | Kite mainnet, `eip155:2366` |
| Asset | USDC.e `0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e`, 6 decimals, EIP-712 name `Bridged USDC (Kite AI)`, version `2` |
| Price | `10000` units, one cent |
| Facilitator | `https://facilitator.pieverse.io/v2` |
| Headers | `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE` |

Testnet is `eip155:2368` with pieUSD (`0x38129cf4CE5E183eFF248F42A7D345Bb1B47621A`, 18 decimals). Set `KITE_NETWORK=testnet` to use it.

**Kite Passport (buyer side)**

| Step | Command |
|---|---|
| Install on Windows | `irm https://cli.gokite.ai/install.ps1 \| iex` (the bash installer refuses to run on Windows) |
| Sign up | `kpass signup init --email <email>`, then the emailed link and passkey, then `kpass signup exchange --signup-id <id> --code <code>` |
| Register the agent | `kpass agent:register --type <name>` |
| Open a session | `kpass session create --max-amount-per-tx 40 --max-total-amount 500 --ttl 7d --assets USDC --separate` and approve with the passkey |
| Pay | `kpass session execute --url <url> --method GET --idempotency-key <key>` |

**What we learned**

- Passport only pays hosts in Kite's own service catalog (`ksearch service list`). A payment to any other host is refused with `payment_target_forbidden` before any money moves. Our endpoint is not in the catalog, so Passport cannot pay it yet.
- This version of Passport settles on Base, Polygon, Avalanche, Solana and a few other chains. The Passport wallet is one address across the EVM chains.
- A very small payment that needs a cross-chain route can be refused as insufficient balance. Funding the chain the merchant settles on avoids it.
- The session really is the limit. Its policy carries the per-payment cap, the total and the expiry, and usage is reported after every payment.

## Dolphin

| | |
|---|---|
| Base URL | `https://lighthouse.dphn.ai/run/text-v/v1` (OpenAI-compatible chat completions) |
| Model | `deepseek-ai/DeepSeek-V4.1-Flash` |
| Price | $0.01 in and $0.07 out per million tokens |
| Credit | A coupon redeemed at `app.dphn.ai` |

**Where it is used**

- Two applicants: a plain purchasing-agent prompt and a careless one.
- The examiner's note on each licence. Dolphin drafts it, and code rejects the draft if any figure differs from the results, falling back to a note written by code.

**What we learned**

- A request with no credit returns 402. The site switches the Dolphin applicants off when no key is set, and says so on the exam page.
- Dolphin is not in SERV's catalog, so SERV cannot wrap a Dolphin call. The two are separate steps in our own graph.
- The open model did well: 0 of 72 hostile requests paid across three exams, even with the careless prompt.
