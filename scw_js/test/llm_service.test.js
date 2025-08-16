import { describe, test, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";

global.fetch = vi.fn();

describe("llm_service.js", () => {
  let callLLMAPI;

  beforeAll(async () => {
    const module = await import("../llm_service.js");
    callLLMAPI = module.callLLMAPI;
  });

  beforeEach(() => {
    process.env.IONOS_API_TOKEN = "test-token";
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: "Antwort vom LLM" } }],
          usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
          model: "meta-llama/Llama-3.3-70B-Instruct",
        }),
    });
  });

  afterEach(() => {
    delete process.env.IONOS_API_TOKEN;
  });

  test("gibt Antwort und usage zurück bei gültigem Prompt", async () => {
    const prompt = JSON.stringify([
      { role: "user", content: "Was ist die Hauptstadt von Frankreich?" },
    ]);
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
    const prompt = JSON.stringify([{ role: "user", content: "Test" }]);
    await expect(callLLMAPI(prompt)).rejects.toThrow(
      "API token not found. Please configure the IONOS_API_TOKEN environment variable.",
    );
  });

  test("wirft Fehler bei ungültigem JSON", async () => {
    await expect(callLLMAPI("{ invalid json }")).rejects.toThrow();
  });

  test("wirft Fehler bei API-Fehler (z.B. 401)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });
    const prompt = JSON.stringify([{ role: "user", content: "Test" }]);
    await expect(callLLMAPI(prompt)).rejects.toThrow("Could not reach IONOS: 401 Unauthorized");
  });

  test("wirft Fehler bei Netzwerkproblemen", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network timeout"));
    const prompt = JSON.stringify([{ role: "user", content: "Test" }]);
    await expect(callLLMAPI(prompt)).rejects.toThrow("Network timeout");
  });

  test("verarbeitet Multi-Message-Prompts korrekt", async () => {
    const prompt = JSON.stringify([
      { role: "system", content: "Du bist ein Assistent." },
      { role: "user", content: "Erkläre Quantenphysik." },
      { role: "assistant", content: "Quantenphysik ist..." },
    ]);
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
