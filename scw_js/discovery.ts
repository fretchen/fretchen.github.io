/**
 * Discovery helpers shared by the x402 function handlers.
 *
 * The Scaleway/Envoy gateway intercepts the exact path /favicon.ico with its own 404
 * before our function runs, so we cannot serve favicon.ico directly. x402scan
 * (@agentcash/discovery) resolves an icon by first fetching the origin root and parsing
 * <link rel="icon"> from the HTML, and only then probing COMMON_FAVICON_PATHS
 * (/favicon.ico, /favicon.png, /favicon.svg). We satisfy the root-HTML path here and
 * point it at /favicon.png (which, unlike /favicon.ico, does reach the function).
 */

/** Minimal HTML served at the origin root so scrapers can discover the favicon. */
export const FAVICON_DISCOVERY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="icon" href="/favicon.png" type="image/jpeg">
<title>Fretchen x402 service</title>
</head>
<body></body>
</html>`;

/**
 * True when the client is asking for HTML (a browser or discovery scraper), rather than
 * an x402 payment client — those POST JSON and never send `Accept: text/html`. Used to
 * decide whether a GET on the origin root should return the discovery HTML instead of the
 * normal "only POST" rejection. Header lookup is case-insensitive.
 */
export function wantsHtml(headers: Record<string, string> | undefined): boolean {
  if (!headers) {
    return false;
  }
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "accept") {
      return typeof value === "string" && value.toLowerCase().includes("text/html");
    }
  }
  return false;
}
