import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

interface LLMProviderConfig {
  displayName: string; // for error messages/logs — e.g. "Could not reach IONOS: ..."
  baseUrl: string; // no trailing "/chat/completions" — appended at call time
  defaultModel: string;
  apiKeyEnvVar: string;
  // Price per 1,000,000 tokens, num/den to stay exact bigint math. USD for mistral;
  // EUR for ionos (see convertTokensToUsdcCost's doc comment on the EUR/USDC simplification).
  inputPricePerMillion: { num: bigint; den: bigint };
  outputPricePerMillion: { num: bigint; den: bigint };
}

const LLM_PROVIDERS: Record<string, LLMProviderConfig> = {
  ionos: {
    displayName: "IONOS",
    baseUrl: "https://openai.inference.de-txl.ionos.com/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    apiKeyEnvVar: "IONOS_API_TOKEN",
    inputPricePerMillion: { num: 71n, den: 100n },
    outputPricePerMillion: { num: 71n, den: 100n }, // blended rate, unchanged — legacy sc_llm.ts path
  },
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

interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export async function callLLMAPI(
  prompt: LLMMessage[],
  dummy = false,
  provider = "ionos",
): Promise<LLMResponse> {
  if (dummy) {
    return {
      content: "I am a placeholder for the LLM response",
      usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 },
      model: "placeholder model",
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

  const body = { model: config.defaultModel, messages: prompt };

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

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: LLMResponse["usage"];
    model: string;
  };
  const firstChoice = data.choices[0];
  if (!firstChoice) {
    throw new Error(`LLM API returned empty choices (model: ${data.model})`);
  }
  return {
    content: firstChoice.message.content,
    usage: data.usage,
    model: data.model,
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
 * factors cancel exactly — no separate decimals conversion needed. Treats 1
 * EUR = 1 USD = 1 USDC (documented simplification; only relevant for `ionos`,
 * whose price is EUR-quoted — `mistral`'s price is already USD, so USD≈USDC
 * needs no cross-currency approximation at all).
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

