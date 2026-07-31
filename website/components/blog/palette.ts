import { token } from "../../styled-system/tokens";

/**
 * Colours shared by the interactive essay widgets.
 *
 * The value lives once, in `panda.config.ts`. Inside a `css({})` call use the token name
 * directly (`color: "explore"`) so Panda can extract it at build time — a JS constant
 * there would silently produce no CSS. Use the export below only where the colour is *data*
 * rather than a style declaration: Chart.js datasets, SVG `fill`/`stroke` attributes.
 */
export const ESSAY_ACCENT = token("colors.explore");

/**
 * ─── Essay series colours: the convention ──────────────────────────────────────
 *
 * The essays use Tailwind family steps directly (`color: "violet.600"`) rather than
 * design tokens, and that is correct: they encode **series identity** — which actor,
 * which strategy, which asset class — not brand. They are the same kind of thing as the
 * Tableau-10 palette in `etfData.ts`, and must never be snapped onto the brand ramp.
 * A colour audit will flag them as "stray families"; they are not. Leave them.
 *
 * They stay as literal step names, not constants, because Panda extracts `css({})`
 * statically — a JS constant in a style block emits no CSS at all.
 *
 * The convention, so new essays stay consistent:
 *
 *   prisoners_dilemma   Walter  blue.600 / blue.700 / indigo.800   fill blue.100
 *                       Jesse   violet.600 / purple.800           fill purple.50
 *
 *   diversification     bonds   #4e79a7   ┐ Tableau-10, defined in etfData.ts;
 *                       stocks  #e15759   ┤ chosen for colour-vision separation
 *                       extra   #f28e2b   ┘
 *                       mix     ESSAY_ACCENT (the site's `explore` purple)
 *
 * When adding a series: pick from an existing family above if the role matches, and keep
 * one family per actor across its whole essay. Two actors must differ by more than a step.
 */
