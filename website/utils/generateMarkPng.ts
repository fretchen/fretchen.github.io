/**
 * Renders public/fretchen.png from public/fretchen-logo.svg before every dev and build run, so the
 * one raster (browser tab, iOS home screen, OG image, h-card photo) can never drift from the logo.
 * Gitignored, like public/content-index.json. README → Mark.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const PUBLIC = join(import.meta.dirname, "..", "public");
// The `brand` token in panda.config.ts; the SVG says currentColor, which a raster can't inherit.
const BRAND = "#0066cc";

const svg = readFileSync(join(PUBLIC, "fretchen-logo.svg"), "utf-8").replaceAll("currentColor", BRAND);
const png = new Resvg(svg, { fitTo: { mode: "width", value: 512 }, background: "white" }).render().asPng();
writeFileSync(join(PUBLIC, "fretchen.png"), png);
