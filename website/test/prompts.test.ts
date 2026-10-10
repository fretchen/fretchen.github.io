import { describe, it, expect } from "vitest";
import { parsePromptFile, toolContractPrompt, teenPrompt, researchPrompt } from "../utils/prompts";

describe("prompt files", () => {
  it("loads all three with non-empty frontmatter and body", () => {
    for (const prompt of [toolContractPrompt, teenPrompt, researchPrompt]) {
      expect(prompt.name).toBeTruthy();
      expect(prompt.description).toBeTruthy();
      expect(prompt.body).toBeTruthy();
    }
  });

  it("ships only the body — no frontmatter remnants on the wire", () => {
    for (const prompt of [toolContractPrompt, teenPrompt, researchPrompt]) {
      expect(prompt.body.startsWith("---")).toBe(false);
      expect(prompt.body).not.toContain("description:");
    }
  });

  it("carries the tool contract's known content", () => {
    // A stable marker per prompt, so a file/getter mix-up cannot pass silently.
    expect(toolContractPrompt.body).toContain("bundestakt.de");
    expect(teenPrompt.body).toContain("teenagers");
    expect(researchPrompt.body).toContain("note_findings");
  });

  /**
   * The two rule-heavy prompts are deliberately structured (sections, bullets, numbered
   * steps) so the model can retrieve the right rule instead of digging through packed
   * prose — and so future rules land in the right section. Teen stays prose: structure
   * adds nothing to tone guidance. These assertions guard against accidental re-flattening.
   */
  it("keeps the rule-heavy prompts structured", () => {
    expect(toolContractPrompt.body).toContain("## Tool routing");
    expect(toolContractPrompt.body).toContain("## Rules that hold for every tool");
    expect(toolContractPrompt.body).toContain("## Relative dates");
    expect(researchPrompt.body).toMatch(/^1\. /m);
    expect(researchPrompt.body).toMatch(/^4\. /m);
  });

  it("throws on malformed frontmatter, naming the file", () => {
    expect(() => parsePromptFile("no frontmatter at all", "prompts/broken.md")).toThrow(
      /prompts\/broken\.md/,
    );
    expect(() => parsePromptFile("---\nname: x\n---\n\nbody", "prompts/broken.md")).toThrow(
      /expected exactly name and description/,
    );
    expect(() => parsePromptFile("---\nname: x\ndescription: y\n", "prompts/broken.md")).toThrow(
      /missing closing ---/,
    );
    expect(() => parsePromptFile("---\nname: x\ndescription: y\n---\n\n", "prompts/broken.md")).toThrow(
      /empty body/,
    );
  });
});
