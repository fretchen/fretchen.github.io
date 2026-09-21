/**
 * Fixtures are literal (truncated only by array length) copies of the live API response,
 * captured 2026-09-13 — see tools/bundestakt.ts's header. Most tests here are pure function
 * tests against them: no fetch mocking, no cache to reset, because the module has neither.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  selectSitzungen,
  selectClaims,
  fetchSitzungen,
  fetchClaims,
  fetchFailed,
  type BundestaktResult,
} from "../tools/bundestakt";
import sitzungenFixture from "./fixtures/bundestakt/sitzungen.json";
import claimsFixture from "./fixtures/bundestakt/claims.json";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Narrows the result union to its "ok" shape, asserting that status along the way. */
function assertOk<T extends object>(result: BundestaktResult): asserts result is { status: "ok" } & T {
  expect(result.status).toBe("ok");
}

describe("selectSitzungen", () => {
  it("without a slug returns a slim list, not the full record", () => {
    const result = selectSitzungen(sitzungenFixture, {});
    assertOk<{ sitzungen: Record<string, unknown>[] }>(result);

    expect(result.sitzungen).toHaveLength(3);
    const first = result.sitzungen[0];
    expect(Object.keys(first).sort()).toEqual(["datum", "kernthema", "schlagzeilen", "slug", "url"]);
    expect(first.zahlen).toBeUndefined();
    expect(first.protokollPdf).toBeUndefined();
    expect(first.wahlperiode).toBeUndefined();
  });

  it("projects in30Sekunden titles as schlagzeilen", () => {
    const result = selectSitzungen(sitzungenFixture, {});
    assertOk<{ sitzungen: { schlagzeilen: string[] }[] }>(result);

    expect(result.sitzungen[0].schlagzeilen.length).toBeGreaterThan(0);
    expect(typeof result.sitzungen[0].schlagzeilen[0]).toBe("string");
  });

  it("with a slug returns the full record minus protokollPdf", () => {
    const slug = (sitzungenFixture.sitzungen[0] as { slug: string }).slug;
    const result = selectSitzungen(sitzungenFixture, { slug });
    assertOk<{ sitzung: Record<string, unknown> }>(result);

    expect(result.sitzung.slug).toBe(slug);
    expect(result.sitzung.zahlen).toBeDefined();
    expect(result.sitzung.protokollPdf).toBeUndefined();
  });

  it("returns not_found for an unknown slug", () => {
    const result = selectSitzungen(sitzungenFixture, { slug: "does-not-exist" });
    expect(result).toEqual({ status: "not_found" });
  });

  it("filters the list by von/bis", () => {
    const dates = (sitzungenFixture.sitzungen as { datum: string }[]).map((s) => s.datum).sort();
    const result = selectSitzungen(sitzungenFixture, { von: dates[dates.length - 1] });
    assertOk<{ sitzungen: unknown[] }>(result);

    expect(result.sitzungen).toHaveLength(1);
  });

  it("does not crash on a session with no in30Sekunden", () => {
    const raw = { sitzungen: [{ slug: "s", url: "u", datum: "2026-01-01", kernthema: "k" }] };
    const result = selectSitzungen(raw, {});
    assertOk<{ sitzungen: { schlagzeilen: string[] }[] }>(result);

    expect(result.sitzungen[0].schlagzeilen).toEqual([]);
  });
});

describe("selectClaims", () => {
  it("never returns quellen and respects MAX_CLAIMS", () => {
    const result = selectClaims(claimsFixture, {});
    assertOk<{ claims: Record<string, unknown>[]; weitereTreffer: number }>(result);

    for (const claim of result.claims) {
      expect(claim.quellen).toBeUndefined();
      expect(claim.url).toBeDefined();
    }
    expect(result.claims.length).toBeLessThanOrEqual(10);
  });

  it("truncates begruendung", () => {
    const result = selectClaims(claimsFixture, {});
    assertOk<{ claims: { begruendung: string }[] }>(result);

    for (const claim of result.claims) {
      expect(claim.begruendung.length).toBeLessThanOrEqual(400);
    }
  });

  // Regression guard: the first sketch guessed a "wahr"/"unbelegt" scale that does not exist —
  // the real bewertungsskala is belegt/teilweise/irrefuehrend/falsch/unbelegbar.
  it("filters by the real bewertung values", () => {
    const falsch = selectClaims(claimsFixture, { bewertung: "falsch" });
    assertOk<{ claims: { bewertung: string }[] }>(falsch);

    expect(falsch.claims.length).toBeGreaterThan(0);
    expect(falsch.claims.every((c) => c.bewertung === "falsch")).toBe(true);
  });

  it("returns nothing for the guessed-but-nonexistent bewertung value 'wahr'", () => {
    const result = selectClaims(claimsFixture, { bewertung: "wahr" });
    assertOk<{ claims: unknown[] }>(result);

    expect(result.claims).toEqual([]);
  });

  it("matches fraktion by case-insensitive substring", () => {
    const result = selectClaims(claimsFixture, { fraktion: "linke" });
    assertOk<{ claims: { fraktion: string }[] }>(result);

    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.claims.every((c) => c.fraktion.toLowerCase().includes("linke"))).toBe(true);
  });

  it("matches query against aussage and begruendung, case-insensitively", () => {
    const anyClaim = claimsFixture.claims[0] as { aussage: string };
    const term = anyClaim.aussage.split(" ").find((w) => w.length > 5) ?? anyClaim.aussage;
    const result = selectClaims(claimsFixture, { query: term.toUpperCase() });
    assertOk<{ claims: unknown[] }>(result);

    expect(result.claims.length).toBeGreaterThan(0);
  });

  it("reports weitereTreffer honestly when results exceed MAX_CLAIMS", () => {
    const claim = claimsFixture.claims[0];
    const many = { claims: Array.from({ length: 15 }, () => claim) };
    const result = selectClaims(many, {});
    assertOk<{ claims: unknown[]; weitereTreffer: number }>(result);

    expect(result.claims).toHaveLength(10);
    expect(result.weitereTreffer).toBe(5);
  });

  it("does not crash on an empty claims array", () => {
    const result = selectClaims({ claims: [] }, {});
    assertOk<{ claims: unknown[] }>(result);

    expect(result.claims).toEqual([]);
  });

  // The first sketch's truncate-then-JSON.parse approach threw on any truncated result. Element
  // slicing keeps the result valid JSON no matter how large the input.
  it("result is always JSON-round-trippable", () => {
    const result = selectClaims(claimsFixture, {});
    expect(() => JSON.parse(JSON.stringify(result))).not.toThrow();
  });

  it("stays within the measured token budget for 10 claims", () => {
    const result = selectClaims(claimsFixture, {});
    const bytes = Buffer.byteLength(JSON.stringify(result), "utf8");
    expect(bytes).toBeLessThan(8000);
  });
});

describe("fetchSitzungen / fetchClaims", () => {
  it("throws a readable error on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(fetchSitzungen()).rejects.toThrow(/503/);
  });

  it("resolves the parsed JSON body on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => claimsFixture }));
    await expect(fetchClaims()).resolves.toEqual(claimsFixture);
  });
});

describe("fetchFailed", () => {
  it("wraps a thrown Error as a fetch_failed result", () => {
    expect(fetchFailed(new Error("network down"))).toEqual({ status: "fetch_failed", reason: "network down" });
  });

  it("wraps a non-Error throw via String()", () => {
    expect(fetchFailed("boom")).toEqual({ status: "fetch_failed", reason: "boom" });
  });
});

/**
 * Opt-in only (`BUNDESTAKT_LIVE=1 npx vitest run test/bundestakt.test.ts`) — never runs in CI.
 * Checks only that the fields the selectors read are still there; not a correctness test, an
 * early warning if bundestakt.de renames or drops one. Fixtures were manually verified once
 * (2026-09-13); this is what catches silent drift afterward without a notebook to re-run by hand.
 */
describe.skipIf(!process.env.BUNDESTAKT_LIVE)("live API shape (opt-in)", () => {
  it("sitzungen still has the fields we project", async () => {
    const raw = (await fetchSitzungen()) as { sitzungen: Record<string, unknown>[] };
    const first = raw.sitzungen[0];
    for (const field of ["slug", "url", "datum", "kernthema", "in30Sekunden", "protokollPdf"]) {
      expect(first).toHaveProperty(field);
    }
  });

  it("claims still has the fields we project, and the verdict scale is unchanged", async () => {
    const raw = (await fetchClaims()) as {
      bewertungsskala: string[];
      claims: Record<string, unknown>[];
    };
    expect(raw.bewertungsskala).toEqual(["belegt", "teilweise", "irrefuehrend", "falsch", "unbelegbar"]);
    const first = raw.claims[0];
    for (const field of ["aussage", "sprecher", "fraktion", "bewertung", "sitzungDatum", "url", "begruendung"]) {
      expect(first).toHaveProperty(field);
    }
  });
});
