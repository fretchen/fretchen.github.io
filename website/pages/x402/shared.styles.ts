import { css } from "../../styled-system/css";

// Shared between the hub, /x402/sellers and /x402/buyers, so the reading surface and the
// one generic data-table shape can't drift between the three pages. Anything used by only
// one page stays local to that page's own file — see IDENTITY.md on why headings, links
// and paragraphs otherwise carry no local styles at all.

// The reading surface. These pages are documentation, not tools, so they read in the serif
// like an article body — see IDENTITY.md on prose vs things you operate.
export const prose = css({ textStyle: "prose", maxWidth: "measure" });

export const table = css({
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "6",
  fontSize: "sm",
  "& th, & td": {
    padding: "8px 12px",
    borderBottom: "1px solid token(colors.border, #e5e7eb)",
    textAlign: "left",
  },
  "& th": {
    fontWeight: "semibold",
    backgroundColor: "codeBg",
  },
  "& tr:last-child td": {
    borderBottom: "none",
  },
});
