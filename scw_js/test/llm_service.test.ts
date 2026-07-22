import { describe, test, expect, beforeEach, afterEach } from "vitest";

// Import common setup
import {
  setupGlobalMocks,
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockFetchResponse,
  mockLLMResponse,
} from "./setup.js";

// Setup global mocks
setupGlobalMocks();

import { callLLMAPI, convertTokensToUsdcCost } from "../llm_service.js";

describe("llm_service.js", () => {
  beforeEach(() => {
    setupTestEnvironment();
    mockFetchResponse(mockLLMResponse);
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test("gibt Antwort und usage zurück bei gültigem Prompt", async () => {
    const prompt = [{ role: "user", content: "Was ist die Hauptstadt von Frankreich?" }];
    const result = await callLLMAPI(prompt);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openai.inference.de-txl.ionos.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("test-token"),
        }),
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct",
          messages: [{ role: "user", content: "Was ist die Hauptstadt von Frankreich?" }],
        }),
      }),
    );
    expect(result).toEqual({
      content: "Antwort vom LLM",
      usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
      model: "meta-llama/Llama-3.3-70B-Instruct",
    });
  });

  test("wirft Fehler, wenn kein Prompt übergeben wird", async () => {
    await expect(callLLMAPI("")).rejects.toThrow("No prompt provided.");
    await expect(callLLMAPI(null)).rejects.toThrow("No prompt provided.");
    await expect(callLLMAPI(undefined)).rejects.toThrow("No prompt provided.");
  });

  test("wirft Fehler, wenn kein API-Token gesetzt ist", async () => {
    delete process.env.IONOS_API_TOKEN;
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow(
      "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
    );
  });

  test("wirft Fehler bei API-Fehler (z.B. 401)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow("Could not reach IONOS: 401 Unauthorized");
  });

  test("wirft Fehler bei Netzwerkproblemen", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network timeout"));
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow("Network timeout");
  });

  test("verarbeitet Multi-Message-Prompts korrekt", async () => {
    const prompt = [
      { role: "system", content: "Du bist ein Assistent." },
      { role: "user", content: "Erkläre Quantenphysik." },
      { role: "assistant", content: "Quantenphysik ist..." },
    ];
    const result = await callLLMAPI(prompt);
    expect(result.content).toBe("Antwort vom LLM");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct",
          messages: [
            { role: "system", content: "Du bist ein Assistent." },
            { role: "user", content: "Erkläre Quantenphysik." },
            { role: "assistant", content: "Quantenphysik ist..." },
          ],
        }),
      }),
    );
  });

  test("uses the Mistral endpoint/model/auth when provider is 'mistral'", async () => {
    setupTestEnvironment({ MISTRAL_API_KEY: "test-mistral-key" });
    const prompt = [{ role: "user", content: "Test" }];

    try {
      await callLLMAPI(prompt, false, "mistral");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.mistral.ai/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("test-mistral-key"),
          }),
          body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [{ role: "user", content: "Test" }],
          }),
        }),
      );
    } finally {
      // setupTestEnvironment's custom overrides aren't cleared by the shared afterEach
      // (base testEnvironment keys only) — clear this one explicitly.
      cleanupTestEnvironment(["MISTRAL_API_KEY"]);
    }
  });

  test("throws when MISTRAL_API_KEY is not set", async () => {
    delete process.env.MISTRAL_API_KEY;
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt, false, "mistral")).rejects.toThrow(
      "API token not found. Please configure the MISTRAL_API_KEY environment variable.",
    );
  });

  test("throws a friendly error for an unknown provider", async () => {
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt, false, "openai")).rejects.toThrow(
      /Unknown LLM provider: openai/,
    );
  });
});

describe("convertTokensToUsdcCost — per-provider, input/output-split USDC conversion", () => {
  describe("ionos — blended rate (input === output), unchanged math", () => {
    test("converts a known token split to the expected USDC atomic units", () => {
      // 500,000 prompt + 500,000 completion = 1,000,000 tokens total, both priced at
      // ionos's blended 0.71 EUR/USDC per 1M tokens = 710,000 atomic units ($0.71) —
      // same total as the old single-rate formula, since input === output for ionos.
      expect(
        convertTokensToUsdcCost({ prompt_tokens: 500_000n, completion_tokens: 500_000n }, "ionos"),
      ).toBe(710_000n);
    });

    test("blended rate is split-independent — same total regardless of prompt/completion mix", () => {
      const allPrompt = convertTokensToUsdcCost(
        { prompt_tokens: 1_000_000n, completion_tokens: 0n },
        "ionos",
      );
      const allCompletion = convertTokensToUsdcCost(
        { prompt_tokens: 0n, completion_tokens: 1_000_000n },
        "ionos",
      );
      expect(allPrompt).toBe(710_000n);
      expect(allCompletion).toBe(710_000n);
    });

    test("returns zero for zero tokens", () => {
      expect(convertTokensToUsdcCost({ prompt_tokens: 0n, completion_tokens: 0n }, "ionos")).toBe(
        0n,
      );
    });
  });

  describe("mistral — asymmetric input/output rates ($0.50/M in, $1.50/M out)", () => {
    test("matches the estimated-tokens-per-message ceiling convention used by sc_llm_x402.ts", () => {
      // sc_llm_x402.ts prices the whole pre-auth estimate as completion (output)
      // tokens (the pricier rate) since no real split exists yet for the ceiling.
      // 2000 tokens * $1.50/M = 3000 atomic units ($0.003).
      expect(
        convertTokensToUsdcCost({ prompt_tokens: 0n, completion_tokens: 2000n }, "mistral"),
      ).toBe(3000n);
    });

    test("prices input tokens at the input rate only", () => {
      // 1,000,000 prompt tokens * $0.50/M = 500,000 atomic units.
      expect(
        convertTokensToUsdcCost({ prompt_tokens: 1_000_000n, completion_tokens: 0n }, "mistral"),
      ).toBe(500_000n);
    });

    test("prices completion tokens at the (higher) output rate only", () => {
      // 1,000,000 completion tokens * $1.50/M = 1,500,000 atomic units.
      expect(
        convertTokensToUsdcCost({ prompt_tokens: 0n, completion_tokens: 1_000_000n }, "mistral"),
      ).toBe(1_500_000n);
    });

    test("sums input and output cost for a mixed split", () => {
      // 500,000 * $0.50/M + 500,000 * $1.50/M = 250,000 + 750,000 = 1,000,000 atomic units.
      expect(
        convertTokensToUsdcCost(
          { prompt_tokens: 500_000n, completion_tokens: 500_000n },
          "mistral",
        ),
      ).toBe(1_000_000n);
    });
  });

  test("accepts number and numeric-string inputs equivalently to bigint", () => {
    const viaBigint = convertTokensToUsdcCost(
      { prompt_tokens: 1000n, completion_tokens: 500n },
      "mistral",
    );
    expect(
      convertTokensToUsdcCost({ prompt_tokens: 1000, completion_tokens: 500 }, "mistral"),
    ).toBe(viaBigint);
    expect(
      convertTokensToUsdcCost({ prompt_tokens: "1000", completion_tokens: "500" }, "mistral"),
    ).toBe(viaBigint);
  });

  test("rejects a negative number", () => {
    expect(() =>
      convertTokensToUsdcCost({ prompt_tokens: -5, completion_tokens: 0 }, "mistral"),
    ).toThrow(TypeError);
  });

  test("rejects a non-finite number", () => {
    expect(() =>
      convertTokensToUsdcCost({ prompt_tokens: Infinity, completion_tokens: 0 }, "mistral"),
    ).toThrow(TypeError);
  });

  test("rejects a non-numeric string", () => {
    expect(() =>
      convertTokensToUsdcCost({ prompt_tokens: "abc", completion_tokens: 0 }, "mistral"),
    ).toThrow(TypeError);
  });

  test("rejects an unknown provider", () => {
    expect(() =>
      convertTokensToUsdcCost({ prompt_tokens: 100n, completion_tokens: 100n }, "openai"),
    ).toThrow(/Unknown LLM provider: openai/);
  });
});
