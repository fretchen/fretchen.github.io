import type { X402Tool } from "../types/x402";
import { SITE_CONFIG } from "../utils/siteConfig";

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
 *  shortest real page on the site is /imagegen at ~850 characters, so this clears it comfortably.
 *  Calibrated against *this site*: `tools/webFetch.ts` passes its own, because a stranger's short
 *  page is short, not broken. */
const MIN_PROSE_CHARS = 200;

/**
 * Ceilings on the two fields that are not `content` but are still page text.
 *
 * `content` has been capped since this tool existed; `outline` and `title` were not, which is
 * harmless for our own pages and not for a fetched one — an outline is an unbounded array of
 * foreign strings, re-billed on every later hop exactly like `content`. Generous for this site
 * (the longest page has ~30 headings), a ceiling for a stranger's. `tools/search.ts` caps Brave's
 * fields for the same reason.
 */
const MAX_OUTLINE_ENTRIES = 50;
const MAX_HEADING_CHARS = 120;
const MAX_TITLE_CHARS = 200;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);

/** Only what the model is shown. `sliceSection` reads the uncapped outline, so a section named
 *  from a heading past the cap still resolves. */
const capOutline = (outline: string[]) => outline.slice(0, MAX_OUTLINE_ENTRIES).map((h) => clip(h, MAX_HEADING_CHARS));

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
 * The fetch this guards runs in the visitor's browser, so an unchecked url would let the model —
 * or anything that has talked the model into it — point that browser at any origin it liked, and
 * the response would land in the conversation as a tool result. Cross-origin fetches carry no
 * cookies and CORS usually blocks reading the body, but an attacker-controlled endpoint simply
 * sets `Access-Control-Allow-Origin: *`, so this check is the boundary.
 *
 * It resolves the url with the same parser `fetch` will use rather than pattern-matching the
 * string, because the two disagree in ways that are invisible to string checks: the WHATWG URL
 * parser folds `\` into `/` for http(s) and strips tab, CR and LF outright. An earlier version of
 * this function tested `startsWith("/")` and `startsWith("//")`, and `"/\evil.example/"`,
 * `"/<TAB>/evil.example/"` and `"/<LF>/evil.example/"` all passed it and fetched
 * `https://evil.example/`. Comparing resolved origins closes the class rather than those three
 * spellings of it.
 *
 * Consequences of resolving rather than rejecting: an absolute same-origin url is accepted and
 * reduced to its path, which is what models tend to produce, and `..` is normalised away by the
 * parser instead of being refused — it cannot leave the origin, so the worst case is a 404 here.
 *
 * The trailing slash is required, not cosmetic — the prerendered pages are `<path>/index.html`,
 * and a request without it is a redirect at best.
 *
 * `origin` is a parameter so the module stays usable outside a browser; `SITE_CONFIG` lives in
 * `utils/siteConfig.ts` precisely for callers that cannot process image imports.
 */
export function pagePath(raw: unknown, origin: string = globalThis.location?.origin ?? SITE_CONFIG.url): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  let url: URL;
  let base: URL;
  try {
    base = new URL(origin);
    url = new URL(raw, base);
  } catch {
    return null;
  }
  if (url.origin !== base.origin) return null;

  return url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
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
 * Runs of space to one space, runs of blank line to one blank line, no trailing indentation.
 *
 * Exported because `tools/webFetch.ts` needs it for a `text/plain` response, which never goes
 * through the DOM walk below: a second copy would drift, and the two must agree, since
 * `sliceSection` finds a heading by searching text normalised exactly this way.
 */
export function collapseText(raw: string): string {
  return raw
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .trim();
}

/**
 * Turns a prerendered page into plain text, its title, and its heading outline.
 *
 * Three details carry their weight:
 *
 * - KaTeX renders each formula three times over — MathML glyphs, the TeX source in an
 *   `<annotation>`, and the visual HTML glyph spans — so naive text extraction prints every
 *   equation three times as unreadable glyph soup. One quantum lecture measured 18.8 KB of that.
 *   Keeping the annotation and dropping the two glyph trees is what makes the maths readable.
 * - The root is the page's *only* `article` when it has one, and `main` otherwise. Preferring any
 *   `article` meant taking the first of many on every listing page: /blog renders one per entry,
 *   so the tool returned a single 258-character teaser for a 9019-character page, and
 *   /quantum/amo returned a 54-character one that read as an empty page. A lone article is still
 *   worth preferring on a post, where it excludes the table of contents, comments, support button
 *   and webmentions that surround it inside `main`.
 * - Only the site chrome is stripped, named explicitly. Removing every `header` also removed each
 *   post's own — it sits inside the article (components/ArticleShell.tsx) and carries the H1 and
 *   the publication date — so posts came back opening mid-sentence, with no title and no date.
 */
export function extractPageText(html: string): ExtractedPage {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.title.replace(/\s*\|\s*[^|]*$/, "").trim();

  const articles = doc.querySelectorAll("article");
  const root = (articles.length === 1 ? articles[0] : null) ?? doc.querySelector("main") ?? doc.body;
  if (!root) return { title, outline: [], text: "" };

  // `#Appbar` and the page footer live outside `main`, so they are only reachable via the `body`
  // fallback; naming them keeps that case clean without touching an article's own header.
  root.querySelectorAll("script, style, noscript, nav, footer, #Appbar").forEach((el) => el.remove());

  // Anything not rendered to a reader is not page content. On this site that is mostly the
  // microformats layer every post carries — a hidden h-card, u-url, p-summary and p-category, plus
  // the Bridgy Fed links — which otherwise opens each post with a run-on of its own metadata.
  root.querySelectorAll('[hidden], [style*="display:none"], [style*="display: none"]').forEach((el) => el.remove());

  root.querySelectorAll(".katex").forEach((el) => {
    const tex = el.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim();
    el.replaceWith(doc.createTextNode(tex ? ` $${tex}$ ` : " "));
  });

  // Collapsed exactly as `text` is below, because `sliceSection` locates a section by searching the
  // text for its heading. The KaTeX replacement above pads with spaces, so a heading containing
  // maths — six of them on this site — ends up with a double space here and a single space there,
  // and the search misses every time: the model asks for a section it was just offered and is told
  // it does not exist, then asks again until the hops run out.
  const outline = Array.from(root.querySelectorAll("h2, h3"))
    .map((h) => (h.textContent ?? "").replace(/[^\S\n]+/g, " ").trim())
    .filter(Boolean);

  root.querySelectorAll(BLOCK_SELECTOR).forEach((el) => el.append(doc.createTextNode("\n")));

  return { title, outline, text: collapseText(root.textContent ?? "") };
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

/** Why one of *our* pages has no prose. `tools/webFetch.ts` passes its own, because a stranger's
 *  page is empty for entirely different reasons. */
const SITE_NO_PROSE_HINT =
  "This is an index page whose entries are rendered from data, not text. The pages it links to are in the list this tool returns when called without a url.";

/**
 * What differs between the two tools this function serves, both about an empty page.
 *
 * The reason a page yields no text differs by origin — one of ours is a client-rendered dashboard,
 * a fetched one is usually a JavaScript shell or a paywall — and so does the length at which that
 * becomes true: `MIN_PROSE_CHARS` is measured against this site's own pages, and applying it to a
 * stranger's discards short documents that were fetched perfectly well.
 */
export interface PageSelectOptions {
  noProseHint?: string;
  minProseChars?: number;
}

export function selectPage(
  page: ExtractedPage,
  url: string,
  section: unknown,
  options: PageSelectOptions = {},
): PageResult {
  const { noProseHint = SITE_NO_PROSE_HINT, minProseChars = MIN_PROSE_CHARS } = options;

  // Two of the 86 pages — /analytics and /growth — are dashboards built entirely in the browser,
  // and prerender ~20 characters between them. Saying so beats returning an empty string the model
  // would read as "this page says nothing". (The listing pages used to land here too, but that was
  // the first-`article` bug above hiding their entries, not an absence of content.)
  if (page.text.length < minProseChars) {
    return { status: "no_prose", url, hint: noProseHint };
  }

  const body = typeof section === "string" && section.trim() ? sliceSection(page, section) : page.text;

  if (body === null) {
    return {
      status: "not_found",
      url,
      hint: `No such section. This page's headings are: ${capOutline(page.outline).join(" | ")}`,
    };
  }

  const truncated = body.length > MAX_CONTENT_CHARS;
  return {
    status: "ok",
    url,
    title: clip(page.title, MAX_TITLE_CHARS),
    outline: capOutline(page.outline),
    content: truncated ? body.slice(0, MAX_CONTENT_CHARS) : body,
    truncated,
    // Only present when it means something, so an untruncated result stays as small as it reads.
    ...(truncated ? { totalChars: body.length } : {}),
  };
}
