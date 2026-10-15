/**
 * Fixtures are literal copies of the live API responses, captured 2026-10-13 against
 * api.transitous.org — see tools/transitous.ts's header. Trimmed only where a field is
 * unbounded per leg (intermediateStops cut to 2 entries; legGeometry/steps kept but
 * minimal, so the selectors' dropping them is asserted against a response that really
 * carries them). Most tests here are pure function tests against them: no fetch mocking,
 * no cache to reset, because the module has neither.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  selectStops,
  selectBoard,
  selectJourneys,
  fetchGeocode,
  fetchStoptimes,
  fetchPlan,
  fetchFailed,
  type TransitousResult,
} from "../tools/transitous";
import geocodeFixture from "./fixtures/transitous/geocode.json";
import stoptimesFixture from "./fixtures/transitous/stoptimes.json";
import planFixture from "./fixtures/transitous/plan.json";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Narrows the result union to its "ok" shape, asserting that status along the way. */
function assertOk<T extends object>(result: TransitousResult): asserts result is { status: "ok" } & T {
  expect(result.status).toBe("ok");
}

/** Fixture rows carry 7 STOP and 3 PLACE entries, so filter and cap are both exercised. */
describe("selectStops", () => {
  it("keeps only STOP entries and caps the list at six", () => {
    const result = selectStops(geocodeFixture);
    assertOk<{ stops: { id: string; type?: string }[] }>(result);

    expect(result.stops).toHaveLength(6);
    for (const stop of result.stops) {
      expect(typeof stop.id).toBe("string");
      expect(stop.type).toBeUndefined();
    }
  });

  it("projects each stop to exactly name, id and modes", () => {
    const result = selectStops(geocodeFixture);
    assertOk<{ stops: Record<string, unknown>[] }>(result);

    expect(Object.keys(result.stops[0]).sort()).toEqual(["id", "modes", "name"]);
  });

  it("returns an empty list, not an error, when nothing matches", () => {
    const result = selectStops([{ type: "PLACE", name: "Somewhere", id: "node/1", modes: [] }]);

    expect(result).toEqual({ status: "ok", stops: [] });
  });
});

describe("selectBoard", () => {
  it("projects each departure to the board row and drops the stop name the API does not send", () => {
    const result = selectBoard(stoptimesFixture);
    assertOk<{ departures: Record<string, unknown>[]; stop?: unknown }>(result);

    expect(result.stop).toBeUndefined();
    expect(result.departures).toHaveLength(8);
    expect(Object.keys(result.departures[0]).sort()).toEqual([
      "cancelled",
      "delayMin",
      "headsign",
      "line",
      "realTime",
      "time",
      "track",
      "train",
    ]);
  });

  it("keeps the delay's sign: late is positive, early is negative", () => {
    const result = selectBoard(stoptimesFixture);
    assertOk<{ departures: { delayMin: number; realTime: boolean }[] }>(result);

    // The fixture board has a delayed S2 (+2), a delayed S3 (+1) and an early RNV 28 (-2).
    expect(result.departures.some((d) => d.delayMin > 0)).toBe(true);
    expect(result.departures.some((d) => d.delayMin < 0)).toBe(true);
    expect(result.departures.some((d) => d.realTime)).toBe(true);
  });

  it("projects the whole board inside the byte budget of a tool result", () => {
    const result = selectBoard(stoptimesFixture);

    expect(new TextEncoder().encode(JSON.stringify(result)).length).toBeLessThanOrEqual(2048);
  });
});

describe("selectJourneys", () => {
  it("caps the itinerary list at three", () => {
    const raw = { itineraries: [...planFixture.itineraries, ...planFixture.itineraries, ...planFixture.itineraries] };
    const result = selectJourneys(raw);
    assertOk<{ itineraries: unknown[] }>(result);

    expect(result.itineraries).toHaveLength(3);
  });

  it("projects an itinerary to start, end, durationMin, transfers, realTime and legs", () => {
    const result = selectJourneys(planFixture);
    assertOk<{ itineraries: Record<string, unknown>[] }>(result);

    expect(result.itineraries).toHaveLength(2);
    expect(Object.keys(result.itineraries[0]).sort()).toEqual([
      "durationMin",
      "end",
      "legs",
      "realTime",
      "start",
      "transfers",
    ]);
    expect(typeof result.itineraries[0].transfers).toBe("number");
    expect(result.itineraries[0].realTime).toBe(true);
  });

  it("aggregates realTime over transit legs only", () => {
    const raw = JSON.parse(JSON.stringify(planFixture));
    for (const itinerary of raw.itineraries) {
      for (const leg of itinerary.legs) leg.realTime = false;
    }
    const result = selectJourneys(raw);
    assertOk<{ itineraries: { realTime: boolean }[] }>(result);

    expect(result.itineraries.every((it) => it.realTime === false)).toBe(true);
  });

  it("renders WALK legs as a single walkMin field", () => {
    const result = selectJourneys(planFixture);
    assertOk<{ itineraries: { legs: Record<string, unknown>[] }[] }>(result);

    const walkLegs = result.itineraries.flatMap((it) => it.legs).filter((leg) => leg.walkMin !== undefined);
    expect(walkLegs.length).toBeGreaterThan(0);
    for (const leg of walkLegs) expect(Object.keys(leg)).toEqual(["walkMin"]);
  });

  it("drops the per-leg baggage the model must not pay for", () => {
    const result = selectJourneys(planFixture);
    assertOk<{ itineraries: { legs: Record<string, unknown>[] }[] }>(result);

    const transitLegs = result.itineraries.flatMap((it) => it.legs).filter((leg) => leg.mode !== undefined);
    expect(transitLegs.length).toBeGreaterThan(0);
    for (const leg of transitLegs) {
      expect(Object.keys(leg).sort()).toEqual([
        "agency",
        "cancelled",
        "from",
        "headsign",
        "line",
        "mode",
        "realTime",
        "to",
        "train",
      ]);
      expect(leg.intermediateStops).toBeUndefined();
      expect(leg.legGeometry).toBeUndefined();
      expect(leg.steps).toBeUndefined();
    }
  });

  it("projects the whole plan inside the byte budget of a tool result", () => {
    const result = selectJourneys(planFixture);

    expect(new TextEncoder().encode(JSON.stringify(result)).length).toBeLessThanOrEqual(4096);
  });
});

describe("fetchers", () => {
  it("throw a TransitousError with the HTTP status when the API answers non-OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    await expect(fetchGeocode("Heidelberg Hbf")).rejects.toMatchObject({ name: "TransitousError", status: 503 });
    await expect(fetchStoptimes("de-DELFI_de:08221:1160")).rejects.toMatchObject({ status: 503 });
    await expect(fetchPlan({ from: "a", to: "b" })).rejects.toMatchObject({ status: 503 });
  });

  it("sends the query as URL parameters and reads the JSON body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ stopTimes: [] }) });
    vi.stubGlobal("fetch", mockFetch);

    await fetchGeocode("Heidelberg Hbf");

    const url = new URL(vi.mocked(mockFetch).mock.calls[0][0] as string);
    expect(url).toMatchObject({ origin: "https://api.transitous.org", pathname: "/api/v1/geocode" });
    expect(url.searchParams.get("text")).toBe("Heidelberg Hbf");

    await fetchStoptimes("de-DELFI_de:08221:1160", undefined, "2026-10-16T08:00:00Z");

    const boardUrl = new URL(vi.mocked(mockFetch).mock.calls[1][0] as string);
    expect(boardUrl.pathname).toBe("/api/v1/stoptimes");
    expect(boardUrl.searchParams.get("stopId")).toBe("de-DELFI_de:08221:1160");
    expect(boardUrl.searchParams.get("n")).toBe("8");
    expect(boardUrl.searchParams.get("time")).toBe("2026-10-16T08:00:00Z");
  });

  it("exports the shared failure shape for the runner's catch", () => {
    expect(fetchFailed(new Error("Transitous answered 503"))).toEqual({
      status: "fetch_failed",
      reason: "Transitous answered 503",
    });
  });
});
