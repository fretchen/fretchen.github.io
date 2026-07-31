import { token } from "../../styled-system/tokens";

/**
 * Colours shared by the interactive essay widgets.
 *
 * The value lives once, in `panda.config.ts`. Inside a `css({})` call use the token name
 * directly (`color: "essayAccent"`) so Panda can extract it at build time — a JS constant
 * there would silently produce no CSS. Use the export below only where the colour is *data*
 * rather than a style declaration: Chart.js datasets, SVG `fill`/`stroke` attributes.
 */
export const ESSAY_ACCENT = token("colors.essayAccent");
