import type { X402Tool } from "../types/x402";

/**
 * This site's own pages as a tool for the chat model: a list of every English page, and the text
 * of any one of them.
 *
 * The content comes from the page's *prerendered HTML*, fetched same-origin from /assistent, and
 * is turned into text here in the browser. That is the only design that covers the whole site: a
 * third of the 172 prerendered pages have no markdown source at all — /x402 is TSX plus
 * locales/en.ts, /agent-onboarding is 52 KB of prose inside its +Page.tsx — so reading blog/*.mdx
 * would cover 70 pages and structurally miss the rest. Fetching the built HTML costs nothing, needs
 * no CORS, needs no new artifact holding a second copy of the content, and works in `vike dev`.
 *
 * Note this is emphatically *not* a general web fetcher: `pagePath` below rejects anything that is
 * not an absolute path on this origin, because the fetch runs in the visitor's browser with the
 * visitor's cookies. Server-side fetching is off the table too — openapi.llm.json publishes that
 * the endpoint "never calls a tool on your behalf".
 *
 * Deliberately stateless and React-free, like `tools/analytics.ts`: dumb fetchers that throw, pure
 * functions over an already-fetched string, no cache of its own (the runner in AssistantChat.tsx
 * wraps these in `queryClient.fetchQuery`). That keeps the module importable from a non-browser
 * caller — with the one caveat that `extractPageText` needs a DOMParser, which the browser and
 * vitest's jsdom env both have.
 */

/** Where the build writes the page list. See utils/generateSitemap.ts. */
const CONTENT_INDEX_URL = "/content-index.json";

/**
 * Longest page text worth returning in one call.
 *
 * A tool result is charged as input tokens on *every* later hop of the turn, so this is a cost
 * ceiling, not a formatting choice. 10 000 characters is roughly 2 500 tokens and fits 55% of the
 * site's pages whole (median page is 9 433 characters); the rest come back truncated with their
 * outline, and the model asks for the section it needs. The cap is what keeps the 27 000-character
 * /agent-onboarding from landing in the conversation and being re-billed on every subsequent hop.
 */
const MAX_CONTENT_CHARS = 10000;

/** Below this a page has no prose worth returning — see the listing pages in `selectPage`. The
 *  shortest real page on the site is /imagegen at ~850 characters, so this clears it comfortably. */
const MIN_PROSE_CHARS = 200;

export const getPageTool: X402Tool = {
  type: "function",
  function: {
    name: "get_page",
    description:
      "Read the content of a page on this site (fretchen.eu) — blog posts, quantum lecture " +
      "notes, and the project pages. Call without arguments first to list every page with its " +
      "url and title, then call again with the url of the one you want. If the result sets " +
      "truncated, call once more with the same url and a heading from its outline to get that " +
      "section in full. Quote and link what the page actually says rather than answering from " +
      "training knowledge.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "A page path from a previous call's result, e.g. /blog/36/.",
        },
        section: {
          type: "string",
          description: "A heading from the page's outline; returns only that section.",
        },
      },
    },
  },
};

// --- Result contract -------------------------------------------------------------------------
//
// Returned rather than thrown, so the tool loop keeps running and the model can explain a
// failure instead of the whole chat message crashing.

export interface ContentIndexEntry {
  url: string;
  title: string;
}

export type PageResult =
  | { status: "ok"; [key: string]: unknown }
  | { status: "not_found"; url: string; hint: string }
  | { status: "no_prose"; url: string; hint: string }
  | { status: "invalid_url"; url: string }
  | { status: "index_unavailable"; hint: string }
  | { status: "fetch_failed"; reason: string };

/** Turns a fetch-time error (thrown by the fetchers below) into a result. */
export { fetchFailed } from "./failure";

/**
 * The page list is missing — it is generated at build time, so this is the normal state of a
 * deploy that predates it.
 *
 * The hint matters more than the status. Listing and reading are independent: a url still loads
 * without the index, so a model told only "that failed" gives up on a request it could have
 * served, while one told where to go next spends a single hop recovering.
 */
export function indexUnavailable(): PageResult {
  return {
    status: "index_unavailable",
    hint: "The page list is unavailable, but individual pages still load. Call this tool again with the url directly, e.g. /blog/36/, if you know or can infer it.",
  };
}

// --- URL handling: the security boundary -------------------------------------------------------

/**
 * Normalises a model-supplied url to a path on this origin, or null if it is not one.
 *
 * The fetch this guards runs in the visitor's browser, so an unchecked url would let the model
 * point it at any origin it liked. Only absolute same-origin paths pass: a scheme, a protocol-
 * relative `//host`, or a `..` traversal is rejected outright rather than resolved.
 *
 * The trailing slash is required, not cosmetic — the prerendered pages are `<path>/index.html`,
 * and a request without it is a redirect at best.
 */
export function pagePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  const path = trimmed.split(/[?#]/)[0];
  if (path.split("/").includes("..")) return null;
  return path.endsWith("/") ? path : `${path}/`;
}

// --- Fetchers: plain fetch, no cache, throw on failure -----------------------------------------

export async function fetchContentIndex(): Promise<unknown> {
  const res = await fetch(CONTENT_INDEX_URL);
  if (!res.ok) {
    throw new Error(`Content index request failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchPageHtml(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Page request failed: HTTP ${res.status}`);
  }
  return res.text();
}

// --- Extraction: pure, synchronous, operates on an already-fetched HTML string -------------------

export interface ExtractedPage {
  title: string;
  outline: string[];
  text: string;
}

/** Block-level elements after which a line break belongs, since `textContent` preserves none. */
const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, pre, blockquote, tr, figcaption";

/**
 * Turns a prerendered page into plain text, its title, and its heading outline.
 *
 * Two details carry their weight:
 *
 * - KaTeX renders each formula three times over — MathML glyphs, the TeX source in an
 *   `<annotation>`, and the visual HTML glyph spans — so naive text extraction prints every
 *   equation three times as unreadable glyph soup. One quantum lecture measured 18.8 KB of that.
 *   Keeping the annotation and dropping the two glyph trees is what makes the maths readable.
 * - The root is `article ?? main ?? body`, because pages built from components rather than MDX
 *   (/x402, /imagegen) have neither landmark; the chrome is stripped explicitly instead.
 */
export function extractPageText(html: string): ExtractedPage {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.title.replace(/\s*\|\s*[^|]*$/, "").trim();

  const root = doc.querySelector("article") ?? doc.querySelector("main") ?? doc.body;
  if (!root) return { title, outline: [], text: "" };

  root.querySelectorAll("script, style, noscript, nav, header, footer").forEach((el) => el.remove());

  // Anything not rendered to a reader is not page content. On this site that is mostly the
  // microformats layer every post carries — a hidden h-card, u-url, p-summary and p-category, plus
  // the Bridgy Fed links — which otherwise opens each post with a run-on of its own metadata.
  root.querySelectorAll('[hidden], [style*="display:none"], [style*="display: none"]').forEach((el) => el.remove());

  root.querySelectorAll(".katex").forEach((el) => {
    const tex = el.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim();
    el.replaceWith(doc.createTextNode(tex ? ` $${tex}$ ` : " "));
  });

  const outline = Array.from(root.querySelectorAll("h2, h3"))
    .map((h) => h.textContent?.trim() ?? "")
    .filter(Boolean);

  root.querySelectorAll(BLOCK_SELECTOR).forEach((el) => el.append(doc.createTextNode("\n")));

  const text = (root.textContent ?? "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .trim();

  return { title, outline, text };
}

/**
 * Cuts the slice of a page that runs from one heading to the next.
 *
 * Matched case-insensitively as a substring so the model can name a heading without reproducing
 * its punctuation — the headings on this site carry em dashes and question marks that a model
 * paraphrasing from the outline routinely drops.
 */
export function sliceSection(page: ExtractedPage, section: string): string | null {
  const wanted = page.outline.find((h) => h.toLowerCase().includes(section.trim().toLowerCase()));
  if (!wanted) return null;

  const start = page.text.indexOf(wanted);
  if (start === -1) return null;

  const rest = page.outline.slice(page.outline.indexOf(wanted) + 1);
  const ends = rest.map((h) => page.text.indexOf(h, start + wanted.length)).filter((i) => i !== -1);
  const end = ends.length > 0 ? Math.min(...ends) : page.text.length;

  return page.text.slice(start, end).trim();
}

// --- Selectors: pure, build the object the model actually sees ----------------------------------

/** Is this actually the generated index? A 404 page served as 200 would otherwise become a
 *  confidently invented list of pages. */
export function selectIndex(raw: unknown): PageResult {
  const isEntry = (entry: unknown): entry is ContentIndexEntry => {
    const candidate = entry as Partial<ContentIndexEntry> | null;
    return !!candidate && typeof candidate.url === "string" && typeof candidate.title === "string";
  };

  if (!Array.isArray(raw) || !raw.every(isEntry)) {
    return indexUnavailable();
  }
  return { status: "ok", pages: raw };
}

export function selectPage(page: ExtractedPage, url: string, section: unknown): PageResult {
  // Six of the 86 pages are listings — /blog, /quantum/amo, /analytics — whose entries are built
  // in the browser from data, so their prerendered HTML holds no prose at all. Saying so beats
  // returning an empty string the model would read as "this page says nothing".
  if (page.text.length < MIN_PROSE_CHARS) {
    return {
      status: "no_prose",
      url,
      hint: "This is an index page whose entries are rendered from data, not text. The pages it links to are in the list this tool returns when called without a url.",
    };
  }

  const body = typeof section === "string" && section.trim() ? sliceSection(page, section) : page.text;

  if (body === null) {
    return {
      status: "not_found",
      url,
      hint: `No such section. This page's headings are: ${page.outline.join(" | ")}`,
    };
  }

  const truncated = body.length > MAX_CONTENT_CHARS;
  return {
    status: "ok",
    url,
    title: page.title,
    outline: page.outline,
    content: truncated ? body.slice(0, MAX_CONTENT_CHARS) : body,
    truncated,
    // Only present when it means something, so an untruncated result stays as small as it reads.
    ...(truncated ? { totalChars: body.length } : {}),
  };
}
