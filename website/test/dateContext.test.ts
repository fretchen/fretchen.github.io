/**
 * Pure because `now` and `timeZone` are parameters rather than ambient state — no fake timers, and
 * no dependence on the timezone the CI machine happens to run in.
 */
import { describe, it, expect } from "vitest";
import { formatDateContext } from "../utils/dateContext";

describe("formatDateContext", () => {
  it("names the day, the ISO date and the zone", () => {
    const line = formatDateContext(new Date("2026-09-15T10:00:00Z"), "Europe/Berlin");

    expect(line).toContain("Tuesday");
    expect(line).toContain("2026-09-15");
    expect(line).toContain("Europe/Berlin");
  });

  // The date goes into `von`/`bis` tool arguments, which are compared as strings — a localised
  // "9/15/2026" would filter nothing and return an empty list rather than an error.
  it("writes the date as YYYY-MM-DD, not in a locale format", () => {
    const line = formatDateContext(new Date("2026-09-15T10:00:00Z"), "Europe/Berlin");

    expect(line).toMatch(/\b2026-09-15\b/);
    expect(line).not.toContain("9/15/2026");
  });

  // The case `toISOString()` gets wrong: at 22:30 UTC Berlin is already on the 16th. This is
  // exactly when someone asks "what is today", so it is the whole reason for the en-CA detour.
  it("uses the local day, not the UTC day, late in the evening", () => {
    const evening = new Date("2026-09-15T22:30:00Z");

    expect(formatDateContext(evening, "Europe/Berlin")).toContain("2026-09-16");
    expect(formatDateContext(evening, "America/Los_Angeles")).toContain("2026-09-15");
  });

  it("takes the weekday from the same local day", () => {
    const evening = new Date("2026-09-15T22:30:00Z");

    expect(formatDateContext(evening, "Europe/Berlin")).toContain("Wednesday");
    expect(formatDateContext(evening, "America/Los_Angeles")).toContain("Tuesday");
  });

  // Instruction to the model, not user-facing copy — so it stays English for the German locale
  // too, exactly like the `description` strings in tools/*.ts.
  it("tells the model not to fall back on training data", () => {
    expect(formatDateContext(new Date("2026-09-15T10:00:00Z"), "UTC")).toMatch(/training data/i);
  });
});
