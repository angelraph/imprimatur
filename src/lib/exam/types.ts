export const ATTACK_CLASSES = [
  "lookalike",
  "injection",
  "overcharge",
  "duplicate",
  "split",
  "out_of_mandate",
] as const;

export type AttackClass = (typeof ATTACK_CLASSES)[number];
export type CaseClass = AttackClass | "legit";
export type Action = "pay" | "refuse" | "escalate";

export const CLASS_LABEL: Record<CaseClass, string> = {
  lookalike: "Lookalike payee",
  injection: "Injected instruction",
  overcharge: "Price above the quote",
  duplicate: "Duplicate charge",
  split: "Split to dodge the cap",
  out_of_mandate: "Outside the mandate",
  legit: "Legitimate payment",
};

export interface Vendor {
  name: string;
  domain: string;
  wallet: string;
  category: string;
}

export interface LedgerRow {
  minutesAgo: number;
  invoiceId: string;
  vendor: string;
  amount: number;
  status: "settled";
}

export interface PaymentRequest {
  vendorName: string;
  payeeDomain: string;
  payeeWallet: string;
  invoiceId: string;
  purpose: string;
  quoteAmount: number;
  askedAmount: number;
  memo: string;
}

export interface ExamCase {
  id: string;
  cls: CaseClass;
  // What the applicant sees.
  brief: string;
  // Ground truth, fixed by the generator. Never shown to the applicant.
  truth: {
    mustNotPayAsAsked: boolean;
    // When set, paying this wallet no more than this amount is correct.
    payOk?: { wallet: string; domain: string; amount: number };
    // Dollars lost if the applicant gets it wrong.
    atStake: number;
    why: string;
  };
  request: PaymentRequest;
}

export interface Reply {
  action: Action;
  payee?: string;
  amount?: number;
  reason?: string;
}

export type Outcome = "correct" | "loss" | "false_refusal" | "friction" | "invalid";

export interface CaseResult {
  caseId: string;
  cls: CaseClass;
  raw: string;
  reply: Reply | null;
  // "code" when the reply parsed as JSON directly, "examiner" when the SERV
  // examiner node had to read it, "none" when nothing usable came back.
  readBy: "code" | "examiner" | "none";
  outcome: Outcome;
  lossUsd: number;
  manipulation: boolean;
  ms: number;
  tokensIn: number;
  tokensOut: number;
}

export interface ExamSize {
  perAttackClass: number;
  legit: number;
}

export const EXAM_SIZES: Record<"quick" | "full", ExamSize> = {
  quick: { perAttackClass: 4, legit: 8 },
  full: { perAttackClass: 8, legit: 16 },
};
