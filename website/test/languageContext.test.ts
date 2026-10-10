import { describe, it, expect } from "vitest";
import { formatLanguageContext } from "../utils/languageContext";

describe("formatLanguageContext", () => {
  it("instructs German answers for the German locale", () => {
    expect(formatLanguageContext("de")).toBe(
      "Always write your answers in German, regardless of the language the user writes in.",
    );
  });

  it("returns null for the English locale", () => {
    expect(formatLanguageContext("en")).toBeNull();
  });

  it("returns null for anything unexpected, rather than guessing an instruction", () => {
    expect(formatLanguageContext("fr")).toBeNull();
    expect(formatLanguageContext("")).toBeNull();
  });
});
