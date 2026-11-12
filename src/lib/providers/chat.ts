import OpenAI from "openai";

export const DOLPHIN_BASE_URL = "https://lighthouse.dphn.ai/run/text-v/v1";
export const DOLPHIN_MODEL = "deepseek-ai/DeepSeek-V4.1-Flash";
export const SERV_BASE_URL = "https://inference-api.openserv.ai/v1";
export const SERV_MODEL = process.env.SERV_MODEL || "gpt-6-luna";

// Dollars per million tokens, from each provider's published price list.
export const PRICES: Record<string, { in: number; out: number }> = {
  [DOLPHIN_MODEL]: { in: 0.01, out: 0.07 },
  "gpt-6-luna": { in: 0.13, out: 0.65 },
  "gpt-5.6-luna": { in: 0.25, out: 1.5 },
  "gpt-5.4-nano": { in: 0.25, out: 1.6 },
};

export interface ChatCall {
  baseURL: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[];
  jsonSchema?: { name: string; schema: Record<string, unknown> };
  timeoutMs?: number;
}

export interface ChatResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  ms: number;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function chat(call: ChatCall): Promise<ChatResult> {
  const client = new OpenAI({
    baseURL: call.baseURL,
    apiKey: call.apiKey,
    timeout: call.timeoutMs ?? 60_000,
    maxRetries: 0,
  });
  const started = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: call.model,
        messages: [
          { role: "system", content: call.system },
          { role: "user", content: call.user },
        ],
        // SERV sizes its own budget when none is given and can overshoot the model's ceiling.
        ...(call.baseURL === SERV_BASE_URL ? { max_completion_tokens: 6000 } : {}),
        ...(call.tools ? { tools: call.tools } : {}),
        ...(call.jsonSchema
          ? {
              response_format: {
                type: "json_schema" as const,
                json_schema: { name: call.jsonSchema.name, strict: true, schema: call.jsonSchema.schema },
              },
            }
          : {}),
      });
      return {
        text: res.choices[0]?.message?.content ?? "",
        tokensIn: res.usage?.prompt_tokens ?? 0,
        tokensOut: res.usage?.completion_tokens ?? 0,
        ms: Date.now() - started,
      };
    } catch (err) {
      lastError = err;
      const status = err instanceof OpenAI.APIError ? err.status : undefined;
      const overshoot = status === 400 && err instanceof Error && /max_tokens is too large/.test(err.message);
      const retryable = overshoot || status === undefined || status === 429 || (status >= 500 && status < 600);
      if (!retryable || attempt === 2) break;
      await sleep(800 * (attempt + 1));
    }
  }

  const status = lastError instanceof OpenAI.APIError ? lastError.status : undefined;
  const message = lastError instanceof Error ? lastError.message : "request failed";
  throw new ProviderError(message, status);
}

export function costUsd(model: string, tokensIn: number, tokensOut: number): number {
  const price = PRICES[model];
  if (!price) return 0;
  return (tokensIn * price.in + tokensOut * price.out) / 1_000_000;
}

// SERV features are switched on by declaring specially named tools.
export const SERV_PROMPT_GUARD: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: { name: "serv_prompt_guard" },
};

export function servShadowAgent(hint: string, maxIterations = 3): OpenAI.Chat.Completions.ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: "serv_shadow_agent",
      description: "Enable SERV shadow-agent validation.",
      parameters: {
        type: "object",
        properties: {
          hint: { type: "string", default: hint },
          max_iterations: { type: "integer", default: maxIterations },
        },
      },
    },
  };
}

export const servKey = () => process.env.SERV_API_KEY || "";
export const dolphinKey = () => process.env.DOLPHIN_API_KEY || "";
