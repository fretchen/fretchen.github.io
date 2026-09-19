import { lookup } from "node:dns/promises";
import pino from "pino";

/**
 * Fetches an arbitrary web page on behalf of /assistent's `fetch_url` tool.
 *
 * Why this is server-side at all: a browser cannot read a response from a third-party origin —
 * CORS forbids it, and `mode: "no-cors"` yields an opaque body. Only the fetch lives here. The
 * HTML goes back to the browser untouched, which then runs the same `extractPageText` it already
 * uses for this site's own pages; Node has no `DOMParser`, so extracting here would mean a new
 * dependency and a second copy of that logic.
 *
 * **Almost everything below is SSRF defence, and it is the point of the file.** Owner-gating does
 * not remove the need: the url is chosen by the *model*, which can be talked into a request by any
 * page it has just read. A server that fetches attacker-chosen urls from inside a cloud network is
 * the classic route to a metadata endpoint.
 *
 * **A payment does not widen any of this.** `/fetch` is sold per call, and the obvious reading of
 * "paid resource" — the customer gets what they asked for — is wrong here: what is bought is *a
 * fetch*, never *a fetch of `169.254.169.254`*. Every check below runs identically for a paid
 * request and an owner's, and a refusal after payment is simply not settled (see `search_api.ts`).
 *
 * Known residual risk, accepted: **DNS rebinding.** The address is validated at resolve time, then
 * `fetch` resolves the name again for the connection, so a name that answers differently between
 * the two wins. Closing it means pinning the resolved IP into the connection through a custom
 * agent/lookup, which is disproportionate here. Everything else — scheme, address space, each
 * redirect hop, body size, content type, time — is enforced.
 */

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

/** Redirects followed before giving up. Each hop is re-validated; see `fetchExternalHtml`. */
const MAX_REDIRECTS = 3;

/**
 * Body bytes read before the download is abandoned.
 *
 * Generous because it is HTML, not text: the extraction that follows typically yields a fifth to
 * a tenth of this, and the model sees at most 10 000 characters of that. The cap exists so a
 * hostile or merely enormous response cannot exhaust the function's memory.
 */
const MAX_BYTES = 1_000_000;

const REQUEST_TIMEOUT_MS = 8_000;

/** Types `extractPageText` can do something with. Anything else is refused before the body. */
const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "text/plain"];

/**
 * A refusal the caller can act on — bad url, wrong type, too big, or an upstream status like 404
 * or 403 — as distinct from this function actually malfunctioning. `search_api.ts` answers 400
 * with the message; anything else is a logged 500 and a generic body.
 */
export class FetchUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchUrlError";
  }
}

export interface FetchedPage {
  /** Where the content actually came from, after redirects. This is what the model should cite. */
  finalUrl: string;
  html: string;
  contentType: string;
}

// --- Address space ------------------------------------------------------------------------------

/**
 * Is this address somewhere a public web page cannot live?
 *
 * Checked against the *resolved* address rather than the hostname, because a hostname is not
 * evidence of anything: `metadata.example.com` may resolve to 169.254.169.254, and an attacker
 * controls their own DNS. The link-local range matters most — that is where cloud metadata
 * services sit, and reading one is how a fetcher becomes a credential leak.
 */
export function isPrivateAddress(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();

  // IPv6, including the IPv4-mapped form ::ffff:10.0.0.1, which must be unwrapped and re-checked.
  if (normalized.includes(":")) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
    if (mapped) {
      return isPrivateAddress(mapped[1]);
    }
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") || // fc00::/7, unique local
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") || // fe80::/10, link-local
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    );
  }

  const octets = normalized.split(".").map(Number);
  if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    // Unparseable: refuse rather than assume it is fine.
    return true;
  }
  const [a, b] = octets;

  return (
    a === 0 || // 0.0.0.0/8, "this network"
    a === 10 || // private
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local — cloud metadata
    (a === 172 && b >= 16 && b <= 31) || // private; note 172.32.x is PUBLIC
    (a === 192 && b === 168) || // private
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    a >= 224 // multicast and reserved
  );
}

/**
 * Parse a caller-supplied url and prove it points somewhere public, or throw.
 *
 * `https:` only. That is not just tidiness: it removes `file:`, `gopher:`, `javascript:` and
 * credentials-in-url in one rule, at the cost of the handful of sites still http-only.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new FetchUrlError("Missing required query parameter 'url'");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new FetchUrlError(`Not a valid absolute url: ${trimmed.slice(0, 100)}`);
  }

  if (url.protocol !== "https:") {
    throw new FetchUrlError(`Only https urls can be fetched, got ${url.protocol}`);
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    throw new FetchUrlError(`Could not resolve ${url.hostname}`);
  }

  // EVERY address, not just the first: a name that answers with one public and one private
  // address would otherwise pass here and connect to whichever the OS prefers.
  const blocked = addresses.find((entry) => isPrivateAddress(entry.address));
  if (blocked) {
    logger.warn({ host: url.hostname, address: blocked.address }, "Refused non-public address");
    throw new FetchUrlError(`${url.hostname} resolves to a non-public address`);
  }

  return url;
}

// --- Fetch --------------------------------------------------------------------------------------

/** Read at most `MAX_BYTES`, then stop pulling. `response.text()` would buffer the whole body. */
async function readCapped(response: Response): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.length;
      if (total > MAX_BYTES) {
        chunks.push(decoder.decode(value.slice(0, value.length - (total - MAX_BYTES))));
        break;
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return chunks.join("");
}

/**
 * Fetch one page, following redirects by hand so each hop can be re-checked.
 *
 * Automatic redirect following is what makes a url allowlist useless: the url handed in is public,
 * the 302 it answers with is not. Node's undici returns the real 3xx with a readable `Location`
 * under `redirect: "manual"` — unlike a browser, where the response would be opaque.
 */
export async function fetchExternalHtml(raw: string): Promise<FetchedPage> {
  let url = await assertPublicUrl(raw);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        // Named honestly. A fetcher that hides what it is invites being treated as one.
        "User-Agent": "fretchen.eu-assistant/1.0 (+https://www.fretchen.eu/assistent)",
        Accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new FetchUrlError(`Redirect with no location from ${url.hostname}`);
      }
      // Re-validated from scratch, which is the entire reason this loop is hand-written.
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }

    if (!response.ok) {
      // The remote's 404 or 403 is not our failure, and a model told "HTTP 500" retries the same
      // url forever. Told the real status it picks another source — 403 in particular is the
      // expected answer for a bot with an honest User-Agent. The hostname here is the caller's
      // own, so saying it leaks nothing internal.
      throw new FetchUrlError(
        `Could not reach ${url.hostname}: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const mediaType = contentType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.includes(mediaType)) {
      // Cancelled rather than read: no reason to pull a video down to discard it.
      await response.body?.cancel().catch(() => undefined);
      throw new FetchUrlError(
        `Cannot read ${mediaType || "an unknown content type"}; only web pages and plain text`,
      );
    }

    const html = await readCapped(response);
    logger.info({ host: url.hostname, bytes: html.length, hops: hop }, "Fetched external page");
    return { finalUrl: url.toString(), html, contentType: mediaType };
  }

  throw new FetchUrlError(`Too many redirects (more than ${MAX_REDIRECTS})`);
}
