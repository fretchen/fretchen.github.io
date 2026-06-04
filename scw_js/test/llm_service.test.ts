import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// Import common setup
import {
  setupGlobalMocks,
  setupTestEnvironment,
  cleanupTestEnvironment,
  mockFetchResponse,
  mockLLMResponse,
  mockS3Send,
  mockPutObjectCommand,
} from "./setup.js";

// Setup global mocks
setupGlobalMocks();

// direktes Named-Import statt dynamic import in beforeAll
import { callLLMAPI, appendLeafToTrees, startNewTree, appendToS3Json } from "../llm_service.js";
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

// Helper: create a minimal async-iterable stream from a string, matching the
// AsyncIterable<Uint8Array> shape that llm_service's streamToString expects.
function makeStream(data: string): AsyncIterable<Uint8Array> {
  return {
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from(data) as unknown as Uint8Array;
    },
  };
}

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

// Security: merkle tree data must never be written with ACL "public-read".
// The file contains wallet addresses and usage data for all users — it is
// only ever read server-side using S3 credentials, so public access is wrong.
describe("S3 writes — merkle data must not be public-read", () => {
  beforeEach(() => {
    setupTestEnvironment();
    // Reset only specific mocks — NOT vi.clearAllMocks(), which would wipe
    // the S3Client constructor implementation set in setupGlobalMocks().
    mockS3Send.mockReset();
    mockPutObjectCommand.mockReset();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  test("appendLeafToTrees: PutObjectCommand has no ACL field (new file)", async () => {
    // GET throws → file doesn't exist yet → function creates a fresh structure
    mockS3Send.mockRejectedValueOnce(new Error("NoSuchKey"));
    mockS3Send.mockResolvedValueOnce({});

    await appendLeafToTrees(sampleLeaf, "merkle/trees.json");

    expect(mockPutObjectCommand).toHaveBeenCalledTimes(1);
    const params = mockPutObjectCommand.mock.calls[0][0];
    expect(params).not.toHaveProperty("ACL");
  });

  test("appendLeafToTrees: PutObjectCommand has no ACL field (existing file)", async () => {
    // GET succeeds with existing trees data
    mockS3Send.mockResolvedValueOnce({ Body: makeStream(emptyTreesJson) });
    mockS3Send.mockResolvedValueOnce({});

    await appendLeafToTrees(sampleLeaf, "merkle/trees.json");

    expect(mockPutObjectCommand).toHaveBeenCalledTimes(1);
    const params = mockPutObjectCommand.mock.calls[0][0];
    expect(params).not.toHaveProperty("ACL");
  });

  test("startNewTree: PutObjectCommand has no ACL field", async () => {
    mockS3Send.mockResolvedValueOnce({ Body: makeStream(emptyTreesJson) });
    mockS3Send.mockResolvedValueOnce({});

    await startNewTree("merkle/trees.json");

    expect(mockPutObjectCommand).toHaveBeenCalledTimes(1);
    const params = mockPutObjectCommand.mock.calls[0][0];
    expect(params).not.toHaveProperty("ACL");
  });

  test("appendToS3Json: PutObjectCommand has no ACL field (new file)", async () => {
    mockS3Send.mockRejectedValueOnce(new Error("NoSuchKey"));
    mockS3Send.mockResolvedValueOnce({});

    await appendToS3Json(sampleLeaf, "merkle/some.json");

    expect(mockPutObjectCommand).toHaveBeenCalledTimes(1);
    const params = mockPutObjectCommand.mock.calls[0][0];
    expect(params).not.toHaveProperty("ACL");
  });
});
