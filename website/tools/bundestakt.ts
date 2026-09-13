import type { X402Tool } from "../types/x402";

/**
 * Bundestakt (bundestakt.de) as tools for the chat model — Bundestag session summaries and
 * fact-checked claims from plenary debates. Free, CC BY 4.0, open CORS, no key. Verified live
 * against the API on 2026-09-13: two parameterless GET endpoints (`/sitzungen`, `/claims`),
 * cached server-side for one hour.
 *
 * Deliberately stateless and React-free — see the fetch/select split below — so a future MCP
 * server can import the fetchers and selectors directly and bring its own caching policy,
 * instead of duplicating this logic or inheriting caching it doesn't want.
 *
 * `fetchSitzungen`/`fetchClaims` are dumb fetch wrappers that throw; `selectSitzungen`/
 * `selectClaims` are pure functions over already-parsed JSON. PR 2 wires the two together via
 * `queryClient.fetchQuery` for caching and dedup — this module has no cache of its own.
 */

const BASE = "https://www.bundestakt.de/api/v1";

// Tool results are input tokens on every later hop of a metered chat endpoint, so projection is
// mandatory, not a nicety. A claim's `begruendung` and `quellen` together average ~4 KB — most of
// a claim's ~4.6 KB total — so both are cut or dropped. 10 projected claims measure ~6 KB.
const MAX_CLAIMS = 10;
const MAX_BEGRUENDUNG_CHARS = 400;

// --- Tool definitions (OpenAI function-calling shape) -------------------------------------

export const getSitzungenTool: X402Tool = {
  type: "function",
  function: {
    name: "get_sitzungen",
    description:
      "List Bundestag plenary sessions (Bundestakt), or fetch one session's full detail by " +
      "slug. Call without a slug first to find the right session, then call again with its " +
      "slug for details (speaking time per party, vote counts, summaries). Source: bundestakt.de " +
      "(an AI-assisted analysis of official transcripts, not an official record itself).",
    parameters: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "A session slug from a previous call's result, e.g. 21-92-2026-09-09.",
        },
        von: { type: "string", description: "ISO date; only sessions on or after this day." },
        bis: { type: "string", description: "ISO date; only sessions on or before this day." },
      },
    },
  },
};

export const searchClaimsTool: X402Tool = {
  type: "function",
  function: {
    name: "search_claims",
    description:
      "Search fact-checked statements made by German MPs during Bundestag debates " +
      "(Bundestakt). Use this for questions like 'is it true that...' or 'what was claimed " +
      "about X'. Returns the statement, speaker, party, verdict, and reasoning.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term, matched against the statement and reasoning." },
        fraktion: {
          type: "string",
          description: "Party or role, substring-matched, e.g. CDU/CSU, AfD, SPD, Die Linke.",
        },
        bewertung: {
          type: "string",
          enum: ["belegt", "teilweise", "irrefuehrend", "falsch", "unbelegbar"],
          description: "Verdict: substantiated, partly true, misleading, false, or unverifiable.",
        },
      },
    },
  },
};

// --- Wire shapes (only the fields we read) -------------------------------------------------

interface RawIn30Sekunden {
  text: string;
  titel: string;
}

interface RawSitzung {
  slug: string;
  url: string;
  wahlperiode: number;
  sitzungNr: number;
  datum: string;
  dokumentnummer: string;
  kernthema: string;
  in30Sekunden: RawIn30Sekunden[];
  zahlen: unknown;
  protokollPdf: string;
}

interface RawSitzungenResponse {
  sitzungen: RawSitzung[];
}

interface RawQuelle {
  url: string;
  titel: string;
  herausgeber: string;
  istPrimaerquelle: boolean;
  abgerufenAm: string;
}

interface RawClaim {
  id: number;
  url: string;
  sitzungDatum: string;
  sprecher: string;
  fraktion: string;
  aussage: string;
  bewertung: string;
  begruendung: string;
  geprueftAm: string;
  quellen: RawQuelle[];
}

interface RawClaimsResponse {
  claims: RawClaim[];
}

// --- Result contract ------------------------------------------------------------------------
//
// Every function returns one of these rather than throwing, so the tool loop keeps running and
// the model can explain a failure instead of the whole chat message crashing.

export type BundestaktResult =
  | { status: "ok"; [key: string]: unknown }
  | { status: "not_found" }
  | { status: "fetch_failed"; reason: string };

/** Turns a fetch-time error (thrown by `fetchSitzungen`/`fetchClaims`) into a result. */
export function fetchFailed(err: unknown): BundestaktResult {
  return { status: "fetch_failed", reason: err instanceof Error ? err.message : String(err) };
}

// --- Fetchers: plain fetch, no cache, throw on failure ---------------------------------------

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Bundestakt request failed: HTTP ${res.status} on ${path}`);
  }
  return res.json();
}

export async function fetchSitzungen(): Promise<unknown> {
  return fetchJson("/sitzungen");
}

export async function fetchClaims(): Promise<unknown> {
  return fetchJson("/claims");
}

// --- Selectors: pure, synchronous, operate on already-parsed JSON ---------------------------

interface GetSitzungenArgs {
  slug?: string;
  von?: string;
  bis?: string;
}

/**
 * Without `slug`: a slim list (enough to pick a session). With `slug`: the full record for
 * that one session, minus `protokollPdf` (a link with no summarization value for the model).
 */
export function selectSitzungen(raw: unknown, args: GetSitzungenArgs): BundestaktResult {
  const sitzungen = (raw as RawSitzungenResponse | null)?.sitzungen ?? [];

  if (args.slug) {
    const found = sitzungen.find((s) => s.slug === args.slug);
    if (!found) return { status: "not_found" };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { protokollPdf, ...rest } = found;
    return { status: "ok", sitzung: rest };
  }

  const filtered = sitzungen.filter((s) => (!args.von || s.datum >= args.von) && (!args.bis || s.datum <= args.bis));
  return {
    status: "ok",
    sitzungen: filtered.map((s) => ({
      slug: s.slug,
      datum: s.datum,
      kernthema: s.kernthema,
      schlagzeilen: (s.in30Sekunden ?? []).map((p) => p.titel),
      url: s.url,
    })),
  };
}

interface SearchClaimsArgs {
  query?: string;
  fraktion?: string;
  bewertung?: string;
}

/** Never returns `quellen` (~2 KB/claim) — the claim's own `url` links to what it shows and
 * satisfies the CC BY attribution requirement in one field. */
export function selectClaims(raw: unknown, args: SearchClaimsArgs): BundestaktResult {
  const claims = (raw as RawClaimsResponse | null)?.claims ?? [];
  const q = args.query?.toLowerCase();
  const fraktion = args.fraktion?.toLowerCase();

  const filtered = claims.filter((c) => {
    if (args.bewertung && c.bewertung !== args.bewertung) return false;
    if (fraktion && !c.fraktion?.toLowerCase().includes(fraktion)) return false;
    if (q && !c.aussage?.toLowerCase().includes(q) && !c.begruendung?.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return {
    status: "ok",
    claims: filtered.slice(0, MAX_CLAIMS).map((c) => ({
      aussage: c.aussage,
      sprecher: c.sprecher,
      fraktion: c.fraktion,
      bewertung: c.bewertung,
      sitzungDatum: c.sitzungDatum,
      url: c.url,
      begruendung: c.begruendung?.slice(0, MAX_BEGRUENDUNG_CHARS),
    })),
    weitereTreffer: Math.max(0, filtered.length - MAX_CLAIMS),
  };
}
