import { defineConfig, defineRecipe } from "@pandacss/dev";

/**
 * The site's one button. Every button style lives here as a variant — there is no
 * second place to define one.
 *
 * `visual` is the button's role, not its colour: pick by what the button *does*.
 * States (hover / active / disabled) are handled by the base, so there is never a
 * separate "…Disabled" class.
 */
const button = defineRecipe({
  className: "btn",
  jsx: [],
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "xs",
    borderRadius: "md",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "all {durations.normal} ease",
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.6,
      transform: "none",
      boxShadow: "none",
      _hover: { transform: "none", boxShadow: "none" },
    },
  },
  variants: {
    visual: {
      // Brand-filled call to action: submit, send, collect, save.
      primary: {
        backgroundColor: "brand",
        color: "light",
        border: "none",
        boxShadow: "sm",
        _hover: {
          backgroundColor: "brandHover",
          transform: "translateY(-1px)",
          boxShadow: "md",
        },
        _active: {
          transform: "translateY(0)",
          boxShadow: "sm",
        },
        _disabled: { backgroundColor: "gray.300", color: "gray.500" },
      },
      // Bordered and unfilled: the lower-emphasis choice next to a primary.
      secondary: {
        backgroundColor: "transparent",
        color: "gray.700",
        border: "1px solid",
        borderColor: "gray.300",
        _hover: { backgroundColor: "gray.100", borderColor: "gray.400" },
        _active: { backgroundColor: "gray.200" },
      },
      // Text only — inline actions that must not compete with body copy.
      ghost: {
        background: "none",
        border: "none",
        color: "brand",
        boxShadow: "none",
        padding: 0,
        _hover: { opacity: 0.7, textDecoration: "underline", textUnderlineOffset: "3px" },
      },
      // Destructive: reject, delete.
      danger: {
        backgroundColor: "red.600",
        color: "light",
        border: "none",
        _hover: { backgroundColor: "red.700" },
      },
      // Confirming: approve, or a completed support action.
      success: {
        // `success` (green.700), not green.600: white on .600 is 3.30:1 and fails AA.
        // Same fill the toast uses, so a confirmed state looks the same wherever it appears.
        backgroundColor: "success",
        color: "light",
        border: "none",
        // green.800, since `success` already *is* green.700 — the old hover would have
        // matched the base and given no feedback at all.
        _hover: { backgroundColor: "green.800" },
      },
      // The orange tip/collect CTA — deliberately warm and distinct from brand blue.
      support: {
        background: "linear-gradient(135deg, {colors.support} 0%, {colors.supportLight} 100%)",
        // Dark ink, not white: white on this fill is 2.84:1 and fails AA.
        color: "onSupport",
        border: "none",
        borderRadius: "full",
        fontWeight: "semibold",
        lineHeight: 1,
        boxShadow: "sm",
        _hover: { transform: "scale(1.05)", boxShadow: "md" },
        _disabled: {
          background: "linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%)",
          color: "textMuted",
        },
      },
      // Sits on top of an image or a dark code block: translucent, blurred backdrop.
      overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        color: "light",
        border: "1px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(4px)",
        _hover: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
        _active: { transform: "scale(0.95)" },
      },
    },
    size: {
      sm: { paddingY: "xs", paddingX: "md", fontSize: "xs" },
      md: { paddingY: "sm", paddingX: "lg", fontSize: "sm" },
    },
    // Round icon button (44px, 48px on touch) — used over NFT images.
    shape: {
      circle: {
        width: "44px",
        height: "44px",
        padding: 0,
        borderRadius: "full",
        fontSize: "lg",
        _hover: { transform: "scale(1.1)" },
        "@media (max-width: 768px)": { width: "48px", height: "48px", fontSize: "xl" },
      },
    },
    // Currently-selected state for filter chips, tabs and network pickers.
    active: {
      true: {},
    },
    // Spans its container — stacked modal actions, mobile CTAs.
    fullWidth: {
      true: { width: "100%", justifyContent: "center" },
    },
  },
  compoundVariants: [
    {
      visual: "secondary",
      active: true,
      css: {
        backgroundColor: "gray.200",
        borderColor: "gray.600",
        color: "gray.900",
        _hover: { backgroundColor: "gray.300" },
      },
    },
    {
      visual: "primary",
      active: true,
      css: { backgroundColor: "brandHover", borderColor: "brandHover" },
    },
  ],
  defaultVariants: { visual: "primary", size: "md" },
});

/**
 * The territory accent: a short rule beneath a section's title, in the hue that section owns.
 *
 * This is the whole visible expression of the colour system — no tinted surfaces, no coloured
 * body text. The rule is short on purpose; a full-width border reads as a divider, a 48px stub
 * reads as a mark. Route -> territory lives in `utils/territory.ts`.
 */
const sectionRule = defineRecipe({
  className: "sectionRule",
  jsx: [],
  base: {
    display: "block",
    width: "48px",
    height: "3px",
    borderRadius: "xs",
    // Sits under the h1, which already carries its own bottom margin.
    marginBottom: "6",
  },
  variants: {
    territory: {
      voice: { backgroundColor: "brand" },
      explore: { backgroundColor: "explore" },
    },
  },
  defaultVariants: { territory: "voice" },
});

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./layouts/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./blog/**/*.{js,jsx,ts,tsx}",
  ],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      // The reading surface, defined once. Applied with `textStyle: "prose"` — see
      // components/Post.styles.ts (article bodies) and the /x402 and /agent-onboarding
      // guides, which are documentation rather than tools and so read in the serif.
      //
      // No maxWidth here: the measure differs per surface (an article column vs a
      // full-width page), and Panda asks that layout properties stay out of a text style.
      textStyles: {
        prose: {
          description: "The reading surface — article bodies, guides and reference pages.",
          value: {
            fontFamily: "reading",
            fontSize: "lg", // 18px — prose reads larger than interface text
            lineHeight: "relaxed",
          },
        },
      },
      tokens: {
        colors: {
          brand: { value: "#0066cc" },
          brandHover: { value: "#0052a3" },
          border: { value: "#eeeeee" },
          text: { value: "#333333" },
          textMuted: { value: "#666666" },
          background: { value: "#ffffff" },
          light: { value: "#ffffff" },
          // Quiet background for message bubbles and inset panels
          surface: { value: "#f8f9fa" },
          // Inline code / spec-table background (was written as an undefined token with a
          // literal fallback at every call site; 6 of 7 used this value)
          codeBg: { value: "#f9fafb" },
          danger: { value: "#dc3545" },
          // Support/collect button gradient
          // ─── Identity hues ────────────────────────────────────────────────────
          // Three hues, one job each. Green and red are status only and never decorate;
          // that rule is what keeps this from reading as too many colours.
          //
          //   brand   — voice:          links, nav, primary actions (the default)
          //   support — value exchange: collect, support, tip, pay
          //   explore — exploration:    essays, simulations, quantum, lab

          // Value exchange. The gradient is a FILL only — at L 0.70 it is too light to
          // carry text, so ink on it uses `onSupport`, and orange-as-text uses `value`.
          support: { value: "#FF6B35" },
          supportLight: { value: "#FF8255" },
          // Ink on the orange fill. 5.52:1 — white was 2.84:1 and failed even the
          // large-text floor. Warm-dark on warm-light rather than pure black.
          onSupport: { value: "#431407" },

          // Exploration. Also carries the "mix" series through the interactive essays,
          // tying prose to chart. Read from JS via token("colors.explore") — see
          // components/blog/palette.ts.
          explore: { value: "#7b3fa0" },

          // ─── Status ───────────────────────────────────────────────────────────
          // Reserved. Never decorative, and never carried by colour alone.
          // `warning` is amber.700, not .600: .600 is only 3.19:1 on white and fails AA.
          // Each status is a triple: the colour itself (readable on white), a tinted
          // surface, and a border for that surface. One green, one red, one amber — the
          // whole point is that there is no second spelling of any of them.
          success: { value: "#15803d" }, // green.700 · 5.02 on white
          successSurface: { value: "#f0fdf4" }, // green.50
          successBorder: { value: "#bbf7d0" }, // green.200
          // `warning` is amber.700, not .600: .600 is only 3.19:1 on white and fails AA.
          warning: { value: "#b45309" },
          warningSurface: { value: "#fffbeb" },
          warningBorder: { value: "#fde68a" },
          dangerSurface: { value: "#fef2f2" }, // red.50
          dangerBorder: { value: "#fecaca" }, // red.200

          // Dark code block. The `codeBg` above is the *inline* code background (light);
          // these two are the fenced-block pair. 11.25:1.
          codeSurface: { value: "#1e1e1e" },
          codeText: { value: "#d4d4d4" },
        },

        // Three faces, one job each — see README.md "Typography".
        // The @font-face rules live in layouts/fonts.css; these are the only names.
        //
        // NOTE: Panda's preset still ships `sans` / `serif` / `mono`, pointing at the old
        // system stacks. They remain valid but wrong — a call site left on `"mono"` silently
        // keeps the system font. Rule 5 in test/styleConventions.test.ts rejects them.
        fonts: {
          reading: { value: '"Source Serif 4 Variable", Georgia, Cambria, serif' },
          ui: { value: '"Source Sans 3 Variable", system-ui, -apple-system, sans-serif' },
          code: { value: '"Source Code Pro Variable", ui-monospace, SFMono-Regular, Menlo, monospace' },
        },
      },
      semanticTokens: {
        colors: {
          // Alpha/Experimental banner colors
          // Scope/honesty banner on /agent-onboarding — not a warning, so no amber. Purple
          // because that page is part of the lab; this makes the banner read as belonging
          // to the section rather than raising an alarm. (Was indigo, a family in no part
          // of the system.) Text 8.13:1 on the surface.
          alphaBanner: {
            bg: { value: "{colors.purple.50}" },
            border: { value: "{colors.purple.300}" },
            text: { value: "{colors.purple.800}" },
            icon: { value: "{colors.purple.700}" },
          },
        },
        spacing: {
          "0": { value: "0px" },
          xs: { value: "5px" },
          sm: { value: "10px" },
          md: { value: "20px" },
          lg: { value: "40px" },
          xl: { value: "50px" },
          "2xl": { value: "60px" },
        },
        sizes: {
          container: { value: "900px" },
          // The index-page measure: page intros, cards and entry rows all bound to this, so
          // every block on a page shares one right edge.
          //
          // Deliberately NOT expressed in `ch`. These bounds sit on containers whose
          // inherited font differs from the text inside them — a card's <li> inherits the
          // sans body font while its title renders in serif at 20px — so `ch` there silently
          // means a different width per block, which is exactly the bug this replaced. rem is
          // font-independent. The one legitimate `ch` bound is Post.styles.ts's
          // contentContainer, where the rule sits on the prose element itself.
          measure: { value: "48rem" },
        },
        borders: {
          light: { value: "2px solid {colors.border}" },
        },
        radii: {
          sm: { value: "4px" },
        },
      },
      recipes: {
        button,
        sectionRule,
      },
    },
  },

  // Site-wide defaults. Sans is the default because most routes (/lab, /imagegen, /x402,
  // /growth) are surfaces you operate, not read. Serif is opted into by the article body
  // in components/Post.styles.ts — the single place the reading/operating line is drawn.
  globalCss: {
    // Panda's preflight sets `html { font-family: var(--global-font-body, <system stack>) }`.
    // Filling the hook keeps <html> and <body> agreeing instead of leaving a stale
    // system-ui declaration one level up.
    ":root": { "--global-font-body": "token(fonts.ui)" },
    body: { fontFamily: "ui" },
    "code, pre": { fontFamily: "code" },

    // Headings, for every bare <h1>–<h6> on the site — MDX prose above all, which emits
    // unclassed elements. Size steps are deliberately small: IDENTITY.md says hierarchy
    // comes from weight and whitespace, not from a size ratio, so the space above each
    // level is what actually separates them.
    //
    // Sizes are token names, never em multiples of the container. The previous rules lived
    // in layouts/panda.css as `h2 { font-size: 1.5em }`, which against 18px prose silently
    // produced a 27px h2 — larger than every page title on the site. Nobody chose 27px; it
    // fell out of a multiplication.
    "h1, h2, h3, h4, h5, h6": { marginBottom: "0.5em", lineHeight: "1.2" },

    h1: { fontSize: "2xl", fontWeight: "bold", marginTop: "2.5em" },
    h2: { fontSize: "xl", fontWeight: "bold", marginTop: "2.5em" },
    // semibold, not bold: h2 and h3 are only 2px apart, so weight carries the distinction
    // that size cannot.
    h3: { fontSize: "lg", fontWeight: "semibold", marginTop: "1.75em" },
    // h4–h6 are all but unused (six occurrences in the whole corpus) — one quiet level.
    "h4, h5, h6": { fontSize: "lg", fontWeight: "semibold", marginTop: "1.25em" },

    // margins stay in em on purpose: they resolve against the heading's OWN size, so the
    // space scales with the level. A spacing token would be wrong here.
    // A heading that opens its container already has the space above it.
    ":is(h1, h2, h3, h4, h5, h6):first-child": { marginTop: 0 },
  },

  // The output directory for your css system
  outdir: "styled-system",
});
