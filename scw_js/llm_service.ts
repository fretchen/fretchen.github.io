import pino from "pino";
import { UpstreamChatCompletionSchema } from "./upstream_schemas.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

interface LLMProviderConfig {
  displayName: string; // for error messages/logs — e.g. "Could not reach Mistral: ..."
  baseUrl: string; // no trailing "/chat/completions" — appended at call time
  defaultModel: string;
  apiKeyEnvVar: string;
  // Price per 1,000,000 tokens, num/den to stay exact bigint math. USD-quoted.
  inputPricePerMillion: { num: bigint; den: bigint };
  outputPricePerMillion: { num: bigint; den: bigint };
}

const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  mistral: {
    displayName: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
    apiKeyEnvVar: "MISTRAL_API_KEY",
    // Mistral Large 3, mistral.ai/pricing/api (fetched 2026-07-21) — re-verify before any
    // mainnet cutover; Mistral has repriced materially before.
    inputPricePerMillion: { num: 50n, den: 100n },
    outputPricePerMillion: { num: 150n, den: 100n },
  },
};

function getLLMProviderConfig(provider: string): LLMProviderConfig {
  const config = LLM_PROVIDERS[provider];
  if (!config) {
    throw new Error(
      `Unknown LLM provider: ${provider}. Valid providers: ${Object.keys(LLM_PROVIDERS).join(", ")}`,
    );
  }
  return config;
}

export interface LLMMessage {
  role: string;
  content: string;
}

export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * An OpenAI chat-completion response object. Mistral (and the other OpenAI-compatible
 * upstreams in LLM_PROVIDERS) already return this shape, so we forward it largely as-is
 * rather than unwrapping it — the endpoint's public contract is the OpenAI chat-completions
 * shape. `usage` is load-bearing: the batch-settlement handler prices the settled amount
 * from it (see getSettleAmount in sc_llm_x402.ts).
 */
export interface LLMResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string | null;
  }>;
  usage: LLMUsage;
}

/**
 * Resolve an OpenAI-style `model` id (as sent by a caller in the request body) to the
 * internal provider whose config serves it. Returns `null` for an unknown/unsupported model
 * so the handler can answer with an OpenAI-shaped `model_not_found` error. One provider is
 * registered today; adding another means an entry in LLM_PROVIDERS and its id in
 * advertisedModelIds().
 */
export function resolveModel(modelId: string): { provider: string } | null {
  for (const [provider, config] of Object.entries(LLM_PROVIDERS)) {
    if (config.defaultModel === modelId) {
      return { provider };
    }
  }
  return null;
}

/** The model ids this endpoint currently advertises + serves (for OpenAPI enum + validation). */
export function advertisedModelIds(): string[] {
  return [LLM_PROVIDERS.mistral.defaultModel];
}

export async function callLLMAPI(
  prompt: LLMMessage[],
  dummy = false,
  provider = "mistral",
  forwardedParams: Record<string, unknown> = {},
): Promise<LLMResponse> {
  if (dummy) {
    return {
      id: "chatcmpl-mock",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "placeholder-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "**Placeholder response**\n\n" +
              "This is a *mock* answer used for local/testnet testing. It includes:\n\n" +
              "- a list item\n" +
              "- some `inline code`\n" +
              "- a [link](https://example.com)\n\n" +
              "```js\nconsole.log('mock code block');\n```",
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 },
    };
  }
  const config = getLLMProviderConfig(provider);
  const apiToken = process.env[config.apiKeyEnvVar];
  logger.info({ provider }, "Work with real API");
  if (!apiToken) {
    throw new Error(
      `API token not found. Please configure the ${config.apiKeyEnvVar} environment variable.`,
    );
  }

  if (!prompt || !prompt.length) {
    throw new Error("No prompt provided.");
  }
  logger.debug({ prompt }, "Generating answer for prompt");

  // Forward the caller's remaining chat params to the upstream model rather than dropping them —
  // `temperature`, `top_p`, `stop`, `seed` and the like cost us nothing and are the upstream's
  // contract to honour. Our own `model` and `messages` are written last so they always win: the
  // model id is resolved against what we actually serve, and `messages` has already been validated.
  // sc_llm_x402.ts strips the params that would move cost past the metered ceiling before we get
  // here (see its deny-list), so anything still present is safe to pass on.
  const body = { ...forwardedParams, model: config.defaultModel, messages: prompt };

  logger.debug("Sending answer generation request...");
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    logger.error(
      { provider, status: response.status, statusText: response.statusText },
      "LLM API error",
    );
    throw new Error(
      `Could not reach ${config.displayName}: ${response.status} ${response.statusText}`,
    );
  }

  // Upstream is OpenAI-compatible; forward its chat-completion envelope, synthesizing only
  // the fields a given provider might omit (id/created/object) so our response is a
  // well-formed OpenAI chat.completion regardless of upstream quirks.
  //
  // Validated rather than cast, because the cast was load-bearing in a place it could not hold:
  // `usage` feeds getSettleAmount() in sc_llm_x402.ts, which runs *after* the try/catch around
  // this function has closed. A non-numeric prompt_tokens therefore threw a TypeError out of
  // handle() as an unhandled rejection — no response, no CORS headers, no log line we own. The
  // schema also subsumes the old `!firstChoice || !data.usage` guard (choices is .min(1), usage
  // is required), so that check is gone rather than duplicated.
  const raw: unknown = await response.json();
  const parsed = UpstreamChatCompletionSchema.safeParse(raw);
  if (!parsed.success) {
    const upstreamModel = (raw as { model?: unknown } | null)?.model;
    logger.error(
      { provider, issues: parsed.error.issues },
      "Upstream returned a completion we cannot bill from",
    );
    throw new Error(
      `LLM API returned an incomplete completion (model: ${
        typeof upstreamModel === "string" ? upstreamModel : config.defaultModel
      })`,
    );
  }
  const data = parsed.data;
  return {
    id: data.id ?? `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: data.created ?? Math.floor(Date.now() / 1000),
    model: data.model ?? config.defaultModel,
    choices: data.choices.map((c, i) => ({
      index: c.index ?? i,
      message: { role: c.message.role ?? "assistant", content: c.message.content },
      finish_reason: c.finish_reason ?? "stop",
    })),
    usage: data.usage,
  };
}

function parseTokenCount(tokenCount: bigint | number | string): bigint {
  if (typeof tokenCount === "bigint") {
    return tokenCount;
  }
  if (typeof tokenCount === "number") {
    if (!Number.isFinite(tokenCount) || tokenCount < 0) {
      throw new TypeError("tokenCount must be a non-negative finite number when given as number");
    }
    return BigInt(Math.floor(tokenCount));
  }
  if (typeof tokenCount === "string" && /^\d+$/.test(tokenCount)) {
    return BigInt(tokenCount);
  }
  throw new TypeError("tokenCount must be a bigint, number, or numeric string");
}

/**
 * USDC-denominated cost (6 decimals) for the given provider, pricing prompt and
 * completion tokens separately — providers typically charge more for completion
 * (output) tokens than prompt (input) tokens, so a single blended rate would
 * systematically mis-price a provider with an asymmetric split (e.g. Mistral:
 * $0.50/M input vs $1.50/M output — a 3x gap. See LLM_PROVIDERS above).
 *
 * USDC has 6 decimals and prices are quoted per 1,000,000 tokens, so the 1e6
 * factors cancel exactly — no separate decimals conversion needed. Prices are
 * USD-quoted and treated as 1 USD = 1 USDC.
 */
export function convertTokensToUsdcCost(
  usage: {
    prompt_tokens: bigint | number | string;
    completion_tokens: bigint | number | string;
  },
  provider: string,
): bigint {
  const config = getLLMProviderConfig(provider);
  const p = parseTokenCount(usage.prompt_tokens);
  const c = parseTokenCount(usage.completion_tokens);
  const { num: inNum, den: inDen } = config.inputPricePerMillion;
  const { num: outNum, den: outDen } = config.outputPricePerMillion;
  // Cross-multiply to keep one shared denominator instead of assuming inDen === outDen.
  // No explicit 1e6 factor here — as in the single-rate formula this replaces, the
  // "per 1,000,000 tokens" divisor and USDC's 6 decimals cancel exactly.
  return (p * inNum * outDen + c * outNum * inDen) / (inDen * outDen);
}
