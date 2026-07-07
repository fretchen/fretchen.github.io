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
});
