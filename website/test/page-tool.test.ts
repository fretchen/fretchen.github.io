/**
 * `tools/page.ts` turns a prerendered page into something a chat model can read, so what is
 * tested here is the extraction and the budget rather than the wiring: which element the text is
 * taken from, that maths survives as TeX instead of glyph soup, that the cap holds, and that the
 * url guard refuses anything off this origin.
 *
 * Fixtures are inline HTML, small but shaped like the real output — `build/` is gitignored, so a
 * real page cannot be checked in as one. `extractPageText` needs a DOMParser, which the jsdom test
 * environment provides just as the browser does.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  extractPageText,
  sliceSection,
  selectIndex,
  selectPage,
  pagePath,
  fetchPageHtml,
  fetchContentIndex,
  getPageTool,
} from "../tools/page";
import { TOOL_REGISTRY } from "../components/AssistantChat";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Mirrors the two caps in scw_js/llm_schemas.ts, which the endpoint validates server-side. */
const MAX_TOOLS = 8;
const MAX_TOOLS_BYTES = 8192;

function page(body: string, title = "A Post | fretchen.eu"): string {
  return `<!doctype html><html><head><title>${title}</title></head><body>
    <header><nav>Welcome Blog Quantum Lab</nav></header>
    ${body}
    <footer>Imprint</footer>
  </body></html>`;
}

/**
 * KaTeX's real output shape: the same formula as MathML, as a TeX annotation, and as visual
 * glyph spans. Naive text extraction prints all three.
 */
function katex(tex: string, glyphs: string): string {
  return `<span class="katex"><span class="katex-mathml"><math><semantics><mrow>${glyphs}</mrow>
    <annotation encoding="application/x-tex">${tex}</annotation></semantics></math></span>
    <span class="katex-html">${glyphs}</span></span>`;
}

describe("extractPageText", () => {
  it("prefers <article> and drops the site chrome", () => {
    const result = extractPageText(page("<article><p>The body.</p></article>"));

    expect(result.text).toBe("The body.");
    expect(result.text).not.toContain("Welcome");
    expect(result.text).not.toContain("Imprint");
  });

  it("falls back to <body> on pages built from components, which have no article or main", () => {
    // /x402 and /imagegen are TSX, not MDX, and render neither landmark.
    const result = extractPageText(page("<div><h1>x402</h1><p>Pay per request.</p></div>"));

    expect(result.text).toContain("Pay per request.");
    expect(result.text).not.toContain("Welcome");
  });

  /**
   * Listing pages render one `<article class="h-entry">` per entry — 37 on /blog, 20 on
   * /quantum/amo, 3 on the home page. Preferring any article took the first, so /blog came back as
   * a 258-character teaser of one post where the page holds 9019 characters, and /quantum/amo came
   * back as 54 characters that read as an empty page.
   */
  it("takes the whole page when it has many articles, not the first entry", () => {
    const entries = ["<article><p>First entry.</p></article>", "<article><p>Second entry.</p></article>"].join("");
    const { text } = extractPageText(page(`<main>${entries}</main>`));

    expect(text).toContain("First entry.");
    expect(text).toContain("Second entry.");
  });

  it("still narrows to the article when the page has exactly one", () => {
    // On a post, `main` also holds the table of contents, comments and webmentions.
    const html = page("<main><article><p>The post.</p></article><div><p>Comments go here.</p></div></main>");

    expect(extractPageText(html).text).toBe("The post.");
  });

  it("keeps the post's own header, which carries its title and date", () => {
    // components/ArticleShell.tsx puts it inside the article; only the site chrome should go.
    const html = page(
      "<main><article><header><h1>A Post</h1><span>15 September 2026</span></header>" +
        "<p>The body.</p></article></main>",
    );

    const { text } = extractPageText(html);

    expect(text).toContain("A Post");
    expect(text).toContain("15 September 2026");
    expect(text).not.toContain("Welcome");
  });

  it("strips the site-name suffix from the title", () => {
    expect(extractPageText(page("<article><p>x</p></article>")).title).toBe("A Post");
  });

  it("drops the hidden microformats layer every post carries", () => {
    const html = page(
      '<article class="h-entry"><time class="dt-published" style="display:none">2026-09-15</time>' +
        '<a class="u-url" style="display:none">https://www.fretchen.eu/blog/36</a>' +
        '<a class="p-category" style="display: none">ai</a>' +
        '<a class="u-bridgy-fed" hidden="" style="display:none"></a>' +
        "<p>The actual post.</p></article>",
    );

    expect(extractPageText(html).text).toBe("The actual post.");
  });

  it("drops scripts and styles rather than reading them as prose", () => {
    const html = page("<article><script>var hydrate = 1;</script><style>.a{color:red}</style><p>Prose.</p></article>");

    expect(extractPageText(html).text).toBe("Prose.");
  });

  it("keeps a formula once, as TeX, instead of three times as glyph soup", () => {
    const html = page(`<article><p>Where ${katex("\\omega_3 = \\omega_1", "ω 3 ​ = ω 1")} holds.</p></article>`);

    const { text } = extractPageText(html);

    expect(text).toContain("$\\omega_3 = \\omega_1$");
    // The glyph spans appear twice in the source and must survive zero times.
    expect(text).not.toContain("ω 3");
    expect(text.match(/omega_3/g)).toHaveLength(1);
  });

  it("collects h2 and h3 into an outline in document order", () => {
    const html = page("<article><h2>First</h2><p>a</p><h3>Nested</h3><p>b</p><h2>Second</h2></article>");

    expect(extractPageText(html).outline).toEqual(["First", "Nested", "Second"]);
  });

  it("keeps block elements on separate lines", () => {
    const { text } = extractPageText(page("<article><p>One.</p><p>Two.</p><li>Three.</li></article>"));

    expect(text).toBe("One.\nTwo.\nThree.");
  });
});

describe("sliceSection", () => {
  const extracted = extractPageText(
    page("<article><h2>Setup</h2><p>Install it.</p><h2>Usage — daily</h2><p>Run it.</p></article>"),
  );

  it("returns one heading's section and stops at the next", () => {
    expect(sliceSection(extracted, "Setup")).toBe("Setup\nInstall it.");
  });

  it("runs to the end of the page for the last heading", () => {
    expect(sliceSection(extracted, "Usage — daily")).toBe("Usage — daily\nRun it.");
  });

  it("matches case-insensitively on a substring, so punctuation need not be reproduced", () => {
    // A model paraphrasing from the outline routinely drops the em dash.
    expect(sliceSection(extracted, "usage")).toBe("Usage — daily\nRun it.");
  });

  it("returns null for a heading the page does not have", () => {
    expect(sliceSection(extracted, "Troubleshooting")).toBeNull();
  });

  /**
   * Six real headings contain maths (/quantum/amo/2, /quantum/hardware/0). The KaTeX replacement
   * pads with spaces, so before the outline was collapsed the same way as the text, the heading
   * held a double space and the text a single one — `indexOf` missed, and the model was told the
   * section it had just been offered did not exist, over and over until the hops ran out.
   */
  it("finds a section whose heading contains maths", () => {
    const withMath = extractPageText(
      page(
        `<article><h2>Case of no perturbation ${katex("\\Omega = 0", "Ω = 0")}</h2>` +
          "<p>The state does not evolve.</p></article>",
      ),
    );

    const heading = withMath.outline[0];
    expect(heading).toBe("Case of no perturbation $\\Omega = 0$");
    expect(sliceSection(withMath, heading)).toContain("The state does not evolve.");
  });
});

describe("selectPage", () => {
  const long = { title: "Long", outline: ["A", "B"], text: "x".repeat(12000) };

  it("caps an over-long page and says so", () => {
    const result = selectPage(long, "/blog/1/", undefined) as Record<string, unknown>;

    expect(result.status).toBe("ok");
    expect(result.truncated).toBe(true);
    expect((result.content as string).length).toBe(10000);
    expect(result.totalChars).toBe(12000);
  });

  it("leaves a short page whole and omits the size fields", () => {
    // Roughly /x402's real length: short, but prose rather than a client-rendered listing.
    const short = "x402 revives the HTTP 402 status code as a real payment protocol. ".repeat(10);
    const result = selectPage({ title: "S", outline: [], text: short }, "/x402/", undefined) as Record<string, unknown>;

    expect(result.content).toBe(short);
    expect(result.truncated).toBe(false);
    expect(result).not.toHaveProperty("totalChars");
  });

  it("says so when a page is a client-rendered listing rather than returning empty prose", () => {
    // /blog, /quantum/amo and /analytics build their entries from data in the browser.
    const result = selectPage({ title: "Blog", outline: [], text: "Loading." }, "/blog/", undefined) as Record<
      string,
      unknown
    >;

    expect(result.status).toBe("no_prose");
    expect(result.hint).toMatch(/index page/i);
  });

  /** `tools/webFetch.ts` reuses this function for a stranger's page, where "no prose" means
   *  something else entirely — a JS shell or a paywall, not one of our listing pages. */
  it("uses a caller-supplied no-prose hint when given one", () => {
    const result = selectPage({ title: "Shell", outline: [], text: "Loading." }, "https://example.com/", undefined, {
      noProseHint: "Rendered by JavaScript, most likely.",
    }) as Record<string, unknown>;

    expect(result.hint).toBe("Rendered by JavaScript, most likely.");
  });

  it("answers a missing section with the headings that do exist, so the model can retry", () => {
    const result = selectPage(long, "/blog/1/", "Nope") as Record<string, unknown>;

    expect(result.status).toBe("not_found");
    expect(result.hint).toContain("A | B");
  });

  /** `content` was always capped; `outline` and `title` were not, which only stops mattering once
   *  a *fetched* page can supply them. All three are re-billed on every later hop. */
  describe("bounds the fields that are not content", () => {
    const many = {
      title: "T".repeat(500),
      outline: Array.from({ length: 60 }, (_, i) => `Heading ${i}`),
      text: "x".repeat(1000),
    };

    it("caps the number of headings and the length of each", () => {
      const wordy = { ...many, outline: ["H".repeat(300), ...many.outline] };
      const result = selectPage(wordy, "https://example.com/", undefined) as Record<string, unknown>;

      const outline = result.outline as string[];
      expect(outline).toHaveLength(50);
      expect(outline[0]).toHaveLength(121); // 120 characters plus the ellipsis
      expect(outline[0].endsWith("…")).toBe(true);
    });

    it("caps the title", () => {
      const result = selectPage(many, "https://example.com/", undefined) as Record<string, unknown>;

      expect(result.title).toHaveLength(201);
    });

    it("still slices a section whose heading is past the cap", () => {
      // The cap is only what the model is shown — `sliceSection` reads the whole outline, so a
      // model that saw a heading before a page grew is not told its own section does not exist.
      const page = {
        title: "T",
        outline: many.outline,
        text: many.outline.map((h) => `${h}\nSome prose about ${h}.`).join("\n"),
      };

      const result = selectPage(page, "https://example.com/", "Heading 55") as Record<string, unknown>;

      expect(result.status).toBe("ok");
      expect(result.content).toContain("Some prose about Heading 55.");
    });
  });

  /** A stranger's page is short, not broken — see FETCH_MIN_PROSE_CHARS in tools/webFetch.ts. */
  it("honours a caller-supplied prose floor", () => {
    const short = { title: "Answer", outline: [], text: "42." };

    const result = selectPage(short, "https://example.com/", undefined, {
      minProseChars: 1,
    }) as Record<string, unknown>;

    expect(result.status).toBe("ok");
    expect(result.content).toBe("42.");
  });
});

describe("selectIndex", () => {
  it("passes a well-formed index through", () => {
    const result = selectIndex([{ url: "/blog/1/", title: "One" }]) as Record<string, unknown>;

    expect(result.status).toBe("ok");
    expect(result.pages).toHaveLength(1);
  });

  it.each([
    ["a 404 page served as 200", "<!doctype html>"],
    ["entries of the wrong shape", [{ url: "/blog/1/" }]],
  ])("refuses %s rather than inventing a page list", (_label, raw) => {
    expect(selectIndex(raw).status).toBe("index_unavailable");
  });
});

describe("pagePath", () => {
  it.each([
    ["/blog/36", "/blog/36/"],
    ["/blog/36/", "/blog/36/"],
    ["  /x402/  ", "/x402/"],
    ["/blog/36/?utm=x#top", "/blog/36/"],
    // Models produce absolute urls constantly; same-origin ones reduce to their path.
    ["https://www.fretchen.eu/blog/36/", "/blog/36/"],
    // `..` cannot leave the origin, so the parser normalises it rather than it being refused.
    ["/blog/../x402/", "/x402/"],
  ])("normalises %s", (input, expected) => {
    expect(pagePath(input, "https://www.fretchen.eu")).toBe(expected);
  });

  /**
   * The three spellings below all passed the original string-matching guard and fetched
   * `https://evil.example/`: the WHATWG URL parser folds `\` into `/` for http(s) and strips tab,
   * CR and LF outright, so `startsWith("//")` never saw them. Resolving with the same parser the
   * fetch uses is what closes the class rather than these three cases.
   */
  it.each([
    ["an absolute url", "https://evil.example/"],
    ["a protocol-relative url", "//evil.example/"],
    ["a backslash standing in for a slash", "/\\evil.example/"],
    ["an embedded tab", "/\t/evil.example/"],
    ["an embedded newline", "/\n/evil.example/"],
    ["an embedded carriage return", "/\r/evil.example/"],
    ["a non-string", 36],
    ["an empty string", "   "],
  ])("refuses %s, because the fetch runs in the visitor's browser", (_label, input) => {
    expect(pagePath(input, "https://www.fretchen.eu")).toBeNull();
  });

  it("resolves a relative path against the origin rather than escaping it", () => {
    expect(pagePath("../foo", "https://www.fretchen.eu")).toBe("/foo/");
  });
});

describe("fetchers", () => {
  it("throws on a non-ok page response so the runner can report it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(fetchPageHtml("/blog/999/")).rejects.toThrow("HTTP 404");
  });

  it("throws when the content index is missing, as it is under `vike dev`", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(fetchContentIndex()).rejects.toThrow("HTTP 404");
  });
});

describe("tool budget", () => {
  /**
   * `sc_llm_x402.ts` validates both caps server-side and answers a clean 400 — which the user
   * sees only as a chat message that failed. Nothing else in the suite measures the array.
   */
  it("keeps the offered tools inside the endpoint's caps", () => {
    const tools = TOOL_REGISTRY.map((entry) => entry.tool);

    expect(tools.length).toBeLessThanOrEqual(MAX_TOOLS);
    expect(JSON.stringify(tools).length).toBeLessThanOrEqual(MAX_TOOLS_BYTES);
  });

  it("offers get_page", () => {
    expect(TOOL_REGISTRY.map((entry) => entry.tool.function.name)).toContain(getPageTool.function.name);
  });
});
