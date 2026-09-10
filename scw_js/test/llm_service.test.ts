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
      "https://api.mistral.ai/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("test-mistral-key"),
        }),
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: "Was ist die Hauptstadt von Frankreich?" }],
        }),
      }),
    );
    // callLLMAPI forwards the upstream OpenAI chat.completion envelope, synthesizing any
    // fields the upstream omits (id/created/object, and per-choice index/role/finish_reason).
    expect(result).toEqual({
      id: expect.any(String),
      object: "chat.completion",
      created: expect.any(Number),
      model: "meta-llama/Llama-3.3-70B-Instruct",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Antwort vom LLM" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
    });
  });

  test("wirft Fehler, wenn kein Prompt übergeben wird", async () => {
    await expect(callLLMAPI("")).rejects.toThrow("No prompt provided.");
    await expect(callLLMAPI(null)).rejects.toThrow("No prompt provided.");
    await expect(callLLMAPI(undefined)).rejects.toThrow("No prompt provided.");
  });

  test("wirft Fehler, wenn kein API-Token gesetzt ist", async () => {
    delete process.env.MISTRAL_API_KEY;
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow(
      "API token not found. Please configure the MISTRAL_API_KEY environment variable.",
    );
  });

  test("wirft Fehler bei API-Fehler (z.B. 401)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow("Could not reach Mistral: 401 Unauthorized");
  });

  test("wirft Fehler bei Netzwerkproblemen", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network timeout"));
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow("Network timeout");
  });

  test("rejects a non-numeric usage instead of passing it downstream", async () => {
    // `usage` is priced by getSettleAmount() in sc_llm_x402.ts, outside the try/catch around
    // callLLMAPI — so a non-numeric prompt_tokens used to escape handle() as an unhandled
    // rejection. Caught here, it is an ordinary 500.
    mockFetchResponse({
      ...mockLLMResponse,
      usage: { prompt_tokens: "many", completion_tokens: 7, total_tokens: 12 },
    });
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow(/incomplete completion/);
  });

  test("rejects an empty choices array", async () => {
    mockFetchResponse({ ...mockLLMResponse, choices: [] });
    const prompt = [{ role: "user", content: "Test" }];
    await expect(callLLMAPI(prompt)).rejects.toThrow(/incomplete completion/);
  });

  test("preserves tool_calls on a tool-call completion", async () => {
    // A tool-call turn has content: null and carries tool_calls. Two independent layers used to
    // break it: UpstreamChatCompletionSchema required a string content (a 500), and the
    // field-by-field rebuild reconstructed `message` as { role, content }, dropping tool_calls
    // even once validation passed — which would have been the quieter, worse failure.
    const toolCall = {
      id: "call_abc123",
      type: "function",
      function: { name: "generate_image", arguments: '{"prompt":"a cat"}' },
    };
    mockFetchResponse({
      ...mockLLMResponse,
      choices: [
        {
          message: { role: "assistant", content: null, tool_calls: [toolCall] },
          finish_reason: "tool_calls",
        },
      ],
    });

    const result = await callLLMAPI([{ role: "user", content: "draw a cat" }]);

    expect(result.choices[0].message.tool_calls).toEqual([toolCall]);
    expect(result.choices[0].message.content).toBeNull();
    expect(result.choices[0].finish_reason).toBe("tool_calls");
  });

  test("omits tool_calls entirely on an ordinary completion", async () => {
    // Guards the conditional spread: a plain response must keep its exact previous shape rather
    // than gaining a `tool_calls: undefined` key that would serialize into the wire body.
    const result = await callLLMAPI([{ role: "user", content: "Test" }]);
    expect("tool_calls" in result.choices[0].message).toBe(false);
  });

  // The mock upstream (dummy=true) is what testnet and `useDummyData: true` get. It had no
  // coverage at all before it became tool-aware. These cases never touch `fetch` — the mock now
  // flows through the same schema + rebuild as a real completion, so they also cover the schema
  // accepting `content: null` and the rebuild preserving `tool_calls`.
  describe("mock upstream completion (dummy=true)", () => {
    const tool = {
      type: "function",
      function: { name: "generate_image", parameters: { type: "object" } },
    };

    test("returns a text completion when no tools are offered", async () => {
      const result = await callLLMAPI([{ role: "user", content: "hi" }], true);

      expect(result.model).toBe("placeholder-model");
      expect(result.choices[0].finish_reason).toBe("stop");
      expect(result.choices[0].message.content).toContain("Placeholder response");
      expect("tool_calls" in result.choices[0].message).toBe(false);
      // Unchanged from the pre-tool-aware mock: getSettleAmount is priced off these.
      expect(result.usage).toEqual({ prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 });
    });

    test("asks for the offered tool", async () => {
      const result = await callLLMAPI([{ role: "user", content: "draw a cat" }], true, "mistral", {
        tools: [tool],
      });

      expect(result.choices[0].finish_reason).toBe("tool_calls");
      expect(result.choices[0].message.content).toBeNull();
      expect(result.choices[0].message.tool_calls).toEqual([
        {
          id: "call_mock_1",
          type: "function",
          function: { name: "generate_image", arguments: "{}" },
        },
      ]);
      // Identical to the text branch, so which branch ran cannot move the settled amount.
      expect(result.usage).toEqual({ prompt_tokens: 5, completion_tokens: 15, total_tokens: 15 });
    });

    test("answers with text once a tool result is in the conversation", async () => {
      // The second hop of the loop: tools are still offered, but the mock must not ask again or
      // the caller would spin. Presence of a role:"tool" message is the signal.
      const result = await callLLMAPI(
        [
          { role: "user", content: "draw a cat" },
          {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_mock_1",
                type: "function",
                function: { name: "generate_image", arguments: "{}" },
              },
            ],
          },
          { role: "tool", tool_call_id: "call_mock_1", content: '{"status":"ok"}' },
        ],
        true,
        "mistral",
        { tools: [tool] },
      );

      expect(result.choices[0].finish_reason).toBe("stop");
      expect(result.choices[0].message.content).toContain("tool result came back");
      expect("tool_calls" in result.choices[0].message).toBe(false);
    });

    test("synthesizes the fields the mock omits", async () => {
      // created and the per-choice index/role are left out of the raw mock so the rebuild's
      // synthesis path runs on this route too.
      const result = await callLLMAPI([{ role: "user", content: "hi" }], true);

      expect(result.object).toBe("chat.completion");
      expect(result.created).toEqual(expect.any(Number));
      expect(result.choices[0].index).toBe(0);
      expect(result.choices[0].message.role).toBe("assistant");
    });
  });

  test("verarbeitet Multi-Message-Prompts korrekt", async () => {
    const prompt = [
      { role: "system", content: "Du bist ein Assistent." },
      { role: "user", content: "Erkläre Quantenphysik." },
      { role: "assistant", content: "Quantenphysik ist..." },
    ];
    const result = await callLLMAPI(prompt);
    expect(result.choices[0].message.content).toBe("Antwort vom LLM");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({
          model: "mistral-large-latest",
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
