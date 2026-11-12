# Imprimatur demo: transcript

Length 2:41. Narration by a synthetic voice. Every page shown is the live site at https://imprimatur-delta.vercel.app

## 0:00 Intro

Kite lets you give an AI agent a budget. But nobody tells you what that budget should be. Imprimatur does. It examines an agent before it is allowed to spend, and turns the result into a signed spending limit.

## 0:14 The idea

The idea is simple. Before an agent gets money, it sits an exam. Most of the requests are traps: lookalike payees, instructions hidden inside invoices, prices above the quote, duplicate and split invoices. The rest are honest payments that should go through. Code grades every answer against facts fixed in advance, so no model ever marks its own work.

## 0:39 The exam room

This is the exam room. Choose a built in applicant, or point the exam at your own agent. Pick the short exam or the full one, and begin. Every sitting draws a fresh seed, so the answers cannot be memorised. Each reply is graded the moment it arrives.

## 0:56 The licence

The result is a licence. This agent earned Grade A: forty dollars per payment, five hundred dollars in total, valid for one week. That limit is not a guess. It comes from a ninety five percent confidence bound on the failure rate, so a short exam can never earn a large limit.

## 1:14 The outside examiner

The system that sets the limit is not the one that approves it. Reppo's independent evaluators review the examiner's file. The licence stays provisional until they confirm it. This one scored ninety eight out of one hundred.

## 1:29 Enforced by Kite

A licence is only a document until something enforces it. So each one prints a Kite Passport command with its own limits. We opened this session with a passkey, and the agent made a real payment inside it. When it tried to pay a host that Kite does not trust, Kite refused.

## 1:46 The record

Nothing is hidden. Every case is on the record, with the ground truth beside the agent's answer, and a signature anyone can check.

## 1:55 Feedback that proves itself

Not every agent passes. This one was told to approve everything. It paid twenty one of twenty four traps, and was declined. SERV Reasoning wrote corrective rules from its failures. On a new exam, with new cases, it paid none of the traps, and earned a small licence. Feedback has to prove itself.

## 2:15 Verify a licence

Anyone can check a licence. Paste the number to see the signature, the status and the limit. Merchants and other agents call one endpoint, priced at one cent over x402.

## 2:27 The public registry

Every licence, granted or declined, is public in the registry.

## 2:33 Close

Imprimatur runs on SERV Reasoning, with Reppo, Kite and Dolphin. Get verified. Spend with confidence.
