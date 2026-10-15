import type { X402Tool } from "../types/x402";

/**
 * Transitous (api.transitous.org, MOTIS 2 API) as tools for the chat model — stop search,
 * departure boards and journey planning across Europe. Free, keyless, open CORS. Verified
 * live against the API on 2026-10-13: an empty User-Agent gets a 403, but a browser's own
 * UA is accepted — and browsers cannot set the header anyway (it is a forbidden header name
 * in fetch, silently dropped), so no attempt is made here. The usage policy's identifiability
 * intent is met by the Origin/Referer of the requests plus the visible citation line
 * (`source: "transitous"` in AssistantChat's `sourceLinks`); it also asks for a heads-up in
 * their Matrix channel before regular use of the routing endpoint, which is a merge
 * precondition rather than a code concern.
 *
 * Deliberately stateless and React-free — see the fetch/select split below — so a future MCP
 * server can import the fetchers and selectors directly and bring its own caching policy,
 * instead of duplicating this logic or inheriting caching it doesn't want.
 *
 * `fetchGeocode`/`fetchStoptimes`/`fetchPlan` are dumb fetch wrappers that throw;
 * `selectStops`/`selectBoard`/`selectJourneys` are pure functions over already-parsed JSON.
 * The wiring lives in AssistantChat.tsx via `queryClient.fetchQuery` for caching and dedup —
 * this module has no cache of its own.
 */

const BASE = "https://api.transitous.org/api";

// Tool results are input tokens on every later hop of a metered chat endpoint, so projection
// is mandatory, not a nicety: a raw single-itinerary /v1/plan response measures ~232 KB
// (legGeometry, steps, intermediateStops); the projected result is ~1 KB. Coordinates are
// dropped everywhere — maps are out of scope, and they are the single biggest token sink in
// MOTIS responses after the per-leg baggage.
const MAX_STOPS = 6;
const MAX_ITINERARIES = 3;
const MAX_LEGS = 8;
const MAX_BOARD_ROWS = 8;
const MAX_NAME_CHARS = 60;

// --- Tool definitions (OpenAI function-calling shape) -------------------------------------

export const searchStopTool: X402Tool = {
  type: "function",
  function: {
    name: "search_stop",
    description:
      "Find stops and stations by name (Transitous, Europe-wide). Call this first when a " +
      "journey or board request names a place, then pass a returned stop id to plan_journey " +
      "or get_departures. If several stops match, pick with the user or take the obvious " +
      "hub (e.g. 'Milano Centrale' over 'Milano Romolo').",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Stop or station name, e.g. 'Heidelberg Hbf', 'Milano Centrale'.",
        },
      },
      required: ["query"],
    },
  },
};

export const planJourneyTool: X402Tool = {
  type: "function",
  function: {
    name: "plan_journey",
    description:
      "Plan door-to-door journeys between two European stops (Transitous/MOTIS) by train, " +
      "bus, coach, ferry or a mix; rail_only restricts to trains. from and to are stop ids " +
      "from search_stop. Returns up to 3 itineraries with legs and live delays where " +
      "operators publish them. All times are UTC ISO — convert to the user's local timezone " +
      "before presenting. Schedules only: prices and booking are out of scope; when an " +
      "itinerary has realTime=false, present times as scheduled and say so.",
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Departure stop id from search_stop." },
        to: { type: "string", description: "Arrival stop id from search_stop." },
        departure: { type: "string", description: "ISO datetime; omit for 'now'." },
        arrive_by: {
          type: "boolean",
          description: "Treat `departure` as the required arrival time instead of the departure time.",
        },
        rail_only: {
          type: "boolean",
          description: "Trains only, excludes buses and long-distance coaches. Default false.",
        },
      },
      required: ["from", "to"],
    },
  },
};

export const getDeparturesTool: X402Tool = {
  type: "function",
  function: {
    name: "get_departures",
    description:
      "Next departures from a stop with live delays (Transitous/MOTIS). Use for questions " +
      "like 'what leaves from X in the next hour', or from a later moment ('tomorrow " +
      "morning') by passing `time`. stop_id comes from search_stop. All times are UTC ISO " +
      "— convert to the user's local timezone before presenting.",
    parameters: {
      type: "object",
      properties: {
        stop_id: { type: "string", description: "Stop id from search_stop." },
        time: {
          type: "string",
          description: "ISO datetime the board starts from; omit for 'now'.",
        },
      },
      required: ["stop_id"],
    },
  },
};

// --- Wire shapes (only the fields we read) -------------------------------------------------

interface RawGeocodeRow {
  type?: string;
  name?: string;
  id?: string;
  modes?: string[];
}

interface RawPlace {
  name?: string;
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  track?: string;
  scheduledTrack?: string;
}

interface RawStoptime {
  place?: RawPlace;
  routeShortName?: string;
  displayName?: string;
  tripShortName?: string;
  headsign?: string;
  cancelled?: boolean;
  realTime?: boolean;
}

interface RawStoptimesResponse {
  stopTimes?: RawStoptime[];
}

interface RawLeg {
  mode?: string;
  duration?: number;
  routeShortName?: string;
  displayName?: string;
  tripShortName?: string;
  headsign?: string;
  agencyName?: string;
  from?: RawPlace;
  to?: RawPlace;
  cancelled?: boolean;
  realTime?: boolean;
}

interface RawItinerary {
  startTime?: string;
  endTime?: string;
  duration?: number;
  transfers?: number;
  legs?: RawLeg[];
}

interface RawPlanResponse {
  itineraries?: RawItinerary[];
}

// --- Result contract ------------------------------------------------------------------------

export type TransitousResult =
  | { status: "ok"; [key: string]: unknown }
  | { status: "bad_query"; reason: string }
  | { status: "fetch_failed"; reason: string };

/** Turns a fetch-time error (thrown by the fetchers) into a result. */
export { fetchFailed } from "./failure";

// --- Fetchers: plain fetch, no cache, throw on failure ---------------------------------------

export class TransitousError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "TransitousError";
  }
}

async function get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const res = await fetch(`${BASE}${path}?${q}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new TransitousError(`Transitous answered ${res.status}`, res.status);
  return res.json() as Promise<T>;
}

export const fetchGeocode = (query: string): Promise<unknown> =>
  get<unknown[]>("/v1/geocode", { text: query });

export const fetchStoptimes = (stopId: string, n = MAX_BOARD_ROWS, time?: string): Promise<unknown> =>
  get<RawStoptimesResponse>("/v1/stoptimes", { stopId, n: String(n), time });

export const fetchPlan = (args: {
  from: string;
  to: string;
  time?: string;
  arriveBy?: boolean;
  transitModes?: string;
}): Promise<unknown> =>
  get<RawPlanResponse>("/v1/plan", {
    fromPlace: args.from,
    toPlace: args.to,
    numItineraries: String(MAX_ITINERARIES),
    time: args.time,
    arriveBy: args.arriveBy ? "true" : undefined,
    transitModes: args.transitModes,
  });

// --- Selectors: pure, synchronous, operate on already-parsed JSON ---------------------------

const minutesBetween = (a?: string, b?: string) =>
  a && b ? Math.round((Date.parse(a) - Date.parse(b)) / 60000) : 0;

const clip = (s: unknown, n = MAX_NAME_CHARS): string | null => {
  if (typeof s !== "string" || !s) return null;
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

/** One board/leg endpoint: name, the live time, the delay in minutes and the track. */
const place = (p: RawPlace = {}) => {
  const time = p.departure ?? p.arrival;
  const scheduled = p.scheduledDeparture ?? p.scheduledArrival;
  return {
    name: clip(p.name),
    time: time ?? null,
    // The one number users act on. Positive = late; the sign must survive projection.
    delayMin: minutesBetween(time, scheduled),
    track: clip(p.track ?? p.scheduledTrack, 8),
  };
};

/** [{name, id, modes}] — ids survive because the next call needs them. */
export function selectStops(raw: unknown): TransitousResult {
  const rows = (Array.isArray(raw) ? raw : []) as RawGeocodeRow[];
  return {
    status: "ok",
    stops: rows
      .filter((r) => r?.type === "STOP")
      .slice(0, MAX_STOPS)
      .map((r) => ({ name: clip(r.name), id: r.id, modes: r.modes ?? [] })),
  };
}

/** Board rows only, no stop name: /v1/stoptimes has no top-level place field, and the model
 *  already knows the stop — it picked the id via search_stop. */
export function selectBoard(raw: unknown): TransitousResult {
  const board = (raw as RawStoptimesResponse | null) ?? {};
  return {
    status: "ok",
    departures: (board.stopTimes ?? []).slice(0, MAX_BOARD_ROWS).map((s) => ({
      line: clip(s.routeShortName ?? s.displayName, 16),
      train: clip(s.tripShortName, 12),
      headsign: clip(s.headsign),
      time: s.place?.departure ?? null,
      delayMin: minutesBetween(s.place?.departure, s.place?.scheduledDeparture),
      track: clip(s.place?.track ?? s.place?.scheduledTrack, 8),
      cancelled: !!s.cancelled,
      // false = the operator publishes no live feed for this trip; the schedule is all we have.
      realTime: !!s.realTime,
    })),
  };
}

export function selectJourneys(raw: unknown): TransitousResult {
  const plan = (raw as RawPlanResponse | null) ?? {};
  return {
    status: "ok",
    itineraries: (plan.itineraries ?? []).slice(0, MAX_ITINERARIES).map((it) => {
      const legs = (it.legs ?? []).slice(0, MAX_LEGS).map((l) =>
        l.mode === "WALK"
          ? { walkMin: Math.round((l.duration ?? 0) / 60) }
          : {
              mode: l.mode ?? null,
              line: clip(l.routeShortName ?? l.displayName, 16),
              train: clip(l.tripShortName, 12),
              headsign: clip(l.headsign),
              agency: clip(l.agencyName, 30),
              from: place(l.from),
              to: place(l.to),
              cancelled: !!l.cancelled,
              realTime: !!l.realTime,
            },
      );
      const rides = (it.legs ?? []).filter((l) => l.mode !== "WALK");
      return {
        start: it.startTime ?? null,
        end: it.endTime ?? null,
        durationMin: Math.round((it.duration ?? 0) / 60),
        transfers: it.transfers ?? Math.max(0, rides.length - 1),
        // No live feed anywhere on the route -> the model must say "scheduled times".
        realTime: rides.some((l) => l.realTime),
        legs,
      };
    }),
  };
}
