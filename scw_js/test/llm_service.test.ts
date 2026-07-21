import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// ===== Additional hoisted mocks for processMerkleTree tests =====
const { mockProcessBatch, mockWaitForTransactionReceipt } = vi.hoisted(() => ({
  mockProcessBatch: vi.fn(),
  mockWaitForTransactionReceipt: vi.fn(),
}));

vi.mock("../getChain.js", () => ({
  getChain: vi.fn().mockReturnValue({ id: 10, name: "OP Mainnet" }),
  getLLMv1ContractConfig: vi.fn().mockReturnValue({
    address: "0xB3dbD44477a7bcf253f2fA68eDb4be5aF2F2cA56",
    abi: [],
  }),
}));

// Import common setup
import {
  setupGlobalMocks,
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockFetchResponse,
  mockLLMResponse,
  mockGetS3Object,
  mockPutS3Object,
  mockViemFunctions,
} from "./setup.js";

// Setup global mocks
setupGlobalMocks();

// direktes Named-Import statt dynamic import in beforeAll
import {
  callLLMAPI,
  appendLeafToTrees,
  startNewTree,
  processMerkleTree,
  checkWalletBalance,
  convertTokensToCost,
  convertTokensToUsdcCost,
} from "../llm_service.js";
import type { Leaf } from "../llm_service.js";

describe("llm_service.js", () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();
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

const sampleLeaf: Leaf = {
  id: 0,
  user: "0x1111111111111111111111111111111111111111",
  serviceProvider: "0x2222222222222222222222222222222222222222",
  tokenCount: 100n,
  cost: 10n,
  timestamp: "2024-01-01T00:00:00.000Z",
};

const emptyTreesJson = JSON.stringify({
  currentTreeIndex: 0,
  trees: [
    {
      treeIndex: 0,
      root: null,
      processed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      processedAt: null,
      leaves: [],
    },
  ],
});

// Merkle tree data is public by design: settled batches are published on-chain
// as LLMv1.processBatch calldata, and the usage ledger is treated as public.
// Only the merkle root is a commitment; the leaves are not secrets. The write
// paths therefore set ACL "public-read" deterministically. See scw_js/README.md
// "S3 Storage Layout & Data Classification".
describe("S3 writes — merkle data is public-read (public by design)", () => {
  beforeEach(() => {
    setupTestEnvironment();
    // Reset only specific mocks — NOT vi.clearAllMocks(), which would wipe
    // the S3-utils mock implementation set in setupGlobalMocks().
    mockGetS3Object.mockReset();
    mockPutS3Object.mockReset();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test("appendLeafToTrees: putS3Object called with ACL public-read (new file)", async () => {
    // GET returns null → file doesn't exist yet → function creates a fresh structure
    mockGetS3Object.mockResolvedValueOnce(null);

    await appendLeafToTrees(sampleLeaf, "merkle/trees.json");

    expect(mockPutS3Object).toHaveBeenCalledTimes(1);
    const [, , opts] = mockPutS3Object.mock.calls[0];
    expect(opts.acl).toBe("public-read");
  });

  test("appendLeafToTrees: putS3Object called with ACL public-read (existing file)", async () => {
    // GET succeeds with existing trees data
    mockGetS3Object.mockResolvedValueOnce(emptyTreesJson);

    await appendLeafToTrees(sampleLeaf, "merkle/trees.json");

    expect(mockPutS3Object).toHaveBeenCalledTimes(1);
    const [, , opts] = mockPutS3Object.mock.calls[0];
    expect(opts.acl).toBe("public-read");
  });

  test("startNewTree: putS3Object called with ACL public-read", async () => {
    mockGetS3Object.mockResolvedValueOnce(emptyTreesJson);

    await startNewTree("merkle/trees.json");

    expect(mockPutS3Object).toHaveBeenCalledTimes(1);
    const [, , opts] = mockPutS3Object.mock.calls[0];
    expect(opts.acl).toBe("public-read");
  });
});

// ===== Security: processMerkleTree must not persist state when tx fails (Finding 2) =====

const singleLeafTreesJson = JSON.stringify({
  currentTreeIndex: 0,
  trees: [
    {
      treeIndex: 0,
      root: null,
      processed: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      processedAt: null,
      leaves: [
        {
          id: 1,
          user: "0x1111111111111111111111111111111111111111",
          serviceProvider: "0x2222222222222222222222222222222222222222",
          tokenCount: "100",
          cost: "10",
          timestamp: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
});

describe("processMerkleTree — tx failure must not mark tree as processed", () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();

    // Set up viem contract mock with processBatch and waitForTransactionReceipt
    const mockPublicClient = {
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
    };
    const mockContract = {
      write: { processBatch: mockProcessBatch },
      read: {},
    };
    mockViemFunctions.createPublicClient.mockReturnValue(mockPublicClient);
    mockViemFunctions.createWalletClient.mockReturnValue({ account: {} });
    mockViemFunctions.getContract.mockReturnValue(mockContract);
    mockViemFunctions.http.mockReturnValue({});
    mockProcessBatch.mockResolvedValue("0xdeadbeef");
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test("throws and does not write to S3 when transaction reverts", async () => {
    mockGetS3Object.mockResolvedValueOnce(singleLeafTreesJson);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: "reverted" });

    await expect(processMerkleTree("merkle/trees.json")).rejects.toThrow(
      /processBatch transaction reverted/,
    );

    // S3 PUT must NOT have been called — tree state must not be persisted
    expect(mockPutS3Object).not.toHaveBeenCalled();
  });

  test("throws and does not write to S3 when processBatch itself throws", async () => {
    mockGetS3Object.mockResolvedValueOnce(singleLeafTreesJson);
    mockProcessBatch.mockRejectedValue(new Error("out of gas"));

    await expect(processMerkleTree("merkle/trees.json")).rejects.toThrow("out of gas");
    expect(mockPutS3Object).not.toHaveBeenCalled();
  });

  test("writes to S3 and marks tree processed when transaction succeeds", async () => {
    mockGetS3Object.mockResolvedValueOnce(singleLeafTreesJson);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: "success", logs: [] });

    await processMerkleTree("merkle/trees.json");

    expect(mockPutS3Object).toHaveBeenCalledTimes(1);
    const [, body, opts] = mockPutS3Object.mock.calls[0];
    const persisted = JSON.parse(body);
    expect(persisted.trees[0].processed).toBe(true);
    expect(opts.acl).toBe("public-read");
  });
});

// ===== Security: checkWalletBalance must enforce the ETH deposit gate =====

const USER_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678" as const;
const REQUIRED = 10_000_000_000_000n; // 0.00001 ETH in wei

describe("checkWalletBalance — ETH deposit gate", () => {
  const mockCheckBalance = vi.fn();

  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();
    mockViemFunctions.createPublicClient.mockReturnValue({});
    mockViemFunctions.http.mockReturnValue({});
    mockViemFunctions.getContract.mockReturnValue({
      read: { checkBalance: mockCheckBalance },
    });
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test("resolves when on-chain balance meets the requirement", async () => {
    mockCheckBalance.mockResolvedValue(REQUIRED);
    await expect(checkWalletBalance(USER_ADDRESS, REQUIRED)).resolves.toBeUndefined();
  });

  test("resolves when on-chain balance exceeds the requirement", async () => {
    mockCheckBalance.mockResolvedValue(REQUIRED * 2n);
    await expect(checkWalletBalance(USER_ADDRESS, REQUIRED)).resolves.toBeUndefined();
  });

  test("throws when on-chain balance is zero", async () => {
    mockCheckBalance.mockResolvedValue(0n);
    await expect(checkWalletBalance(USER_ADDRESS, REQUIRED)).rejects.toThrow(
      /Insufficient balance/,
    );
  });

  test("throws when on-chain balance is one wei short", async () => {
    mockCheckBalance.mockResolvedValue(REQUIRED - 1n);
    await expect(checkWalletBalance(USER_ADDRESS, REQUIRED)).rejects.toThrow(
      /Insufficient balance/,
    );
  });

  test("error message includes required and current balance", async () => {
    mockCheckBalance.mockResolvedValue(5_000_000_000_000n);
    await expect(checkWalletBalance(USER_ADDRESS, REQUIRED)).rejects.toThrow(
      `Insufficient balance. Required: ${REQUIRED}, Current: 5000000000000`,
    );
  });

  // ===== RPC endpoint wiring (getChain().id -> CAIP-2 -> getRpcUrl -> http()) =====
  // getChain() is mocked above to return { id: 10, ... } (OP Mainnet), so the
  // relevant env var is RPC_URL_EIP155_10.

  test("uses the configured RPC_URL_EIP155_10 endpoint when set", async () => {
    const rpcUrl = "https://opt-mainnet.g.alchemy.com/v2/test-key";
    setupTestEnvironment({ RPC_URL_EIP155_10: rpcUrl });
    mockCheckBalance.mockResolvedValue(REQUIRED);

    try {
      await checkWalletBalance(USER_ADDRESS, REQUIRED);
      // Not viem's rate-limited public default.
      expect(mockViemFunctions.http).toHaveBeenCalledWith(rpcUrl);
    } finally {
      // setupTestEnvironment's custom overrides aren't cleared by the shared
      // afterEach (base testEnvironment keys only) — clear this one explicitly.
      cleanupTestEnvironment(["RPC_URL_EIP155_10"]);
    }
  });

  test("falls back to the public endpoint when RPC_URL_EIP155_10 is unset", async () => {
    // No RPC_URL_EIP155_10 set — default test env from setupTestEnvironment().
    mockCheckBalance.mockResolvedValue(REQUIRED);

    await checkWalletBalance(USER_ADDRESS, REQUIRED);

    expect(mockViemFunctions.http).toHaveBeenCalledWith(undefined);
  });
});

describe("convertTokensToCost — ETH wei conversion (regression check after parseTokenCount refactor)", () => {
  test("converts a known token count to the expected wei amount", () => {
    // 1,000,000 tokens * 0.71 EUR / 3000 EUR/ETH = 0.71/3000 ETH
    expect(convertTokensToCost(1_000_000n)).toBe(236_666_666_666_666n);
  });

  test("accepts number and numeric-string inputs equivalently to bigint", () => {
    const viaBigint = convertTokensToCost(1500n);
    expect(convertTokensToCost(1500)).toBe(viaBigint);
    expect(convertTokensToCost("1500")).toBe(viaBigint);
  });

  test("rejects a negative number", () => {
    expect(() => convertTokensToCost(-5)).toThrow(TypeError);
  });

  test("rejects a non-numeric string", () => {
    expect(() => convertTokensToCost("abc")).toThrow(TypeError);
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
