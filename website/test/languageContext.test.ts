import { describe, it, expect } from "vitest";
import { formatLanguageContext } from "../utils/languageContext";

const GERMAN_DEFAULT_INSTRUCTION =
  "Answer in German by default. If the user explicitly asks for a different language — a translation request, for instance — answer in that language instead.";

describe("formatLanguageContext", () => {
  it("sets German as the default answer language, with an explicit-request override", () => {
    expect(formatLanguageContext("de")).toBe(GERMAN_DEFAULT_INSTRUCTION);
  });

  it("returns null for the English locale", () => {
    expect(formatLanguageContext("en")).toBeNull();
  });

  it("returns null for anything unexpected, rather than guessing an instruction", () => {
    expect(formatLanguageContext("fr")).toBeNull();
    expect(formatLanguageContext("")).toBeNull();
  });
});
