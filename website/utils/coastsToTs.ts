#!/usr/bin/env tsx
/**
 * Converts the JSON produced by `notebooks/box_dimension_coastlines.py` into the
 * committed `coasts.ts` module the box-dimension blog widgets import.
 *
 * All the actual geo-processing (downloading GSHHG, clipping, simplifying,
 * projecting) lives in the Python script — this step only reshapes its JSON
 * output into a typed, generated TypeScript file, so re-running the whole
 * pipeline after a tolerance/bbox tweak is two commands:
 *
 *   cd notebooks && uv run python box_dimension_coastlines.py
 *   cd website && npm run build-coasts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, "../../notebooks/output/box_dimension_coasts.json");
const OUTPUT_PATH = path.resolve(__dirname, "../components/blog/box-dimension/coasts.ts");

interface RawRegion {
  name: string;
  points: [number, number][];
  landRings: [number, number][][];
  worldSize: number;
  meta: {
    sourceLengthKm: number;
    simplificationToleranceDeg: number;
    minCellSizeWorld: number;
    minCellSizeRealKm: number;
    boundingBox: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  };
}

function regionConst(id: string, region: RawRegion): string {
  const constName = id.toUpperCase();
  return `export const ${constName}: CoastRegion = {
  name: ${JSON.stringify(region.name)},
  worldSize: ${region.worldSize},
  points: ${JSON.stringify(region.points)},
  landRings: ${JSON.stringify(region.landRings)},
  meta: ${JSON.stringify(region.meta, null, 2).replace(/\n/g, "\n  ")},
};
`;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Missing ${INPUT_PATH}.`);
    console.error("Run: cd notebooks && uv run python box_dimension_coastlines.py");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8")) as Record<string, RawRegion>;
  const ids = Object.keys(raw);

  const header = `// GENERATED FILE — do not hand-edit.
// Source: notebooks/output/box_dimension_coasts.json
// Regenerate: cd notebooks && uv run python box_dimension_coastlines.py
//             cd website && npm run build-coasts

export interface CoastRegion {
  name: string;
  worldSize: number;
  points: [number, number][];
  landRings: [number, number][][];
  meta: {
    sourceLengthKm: number;
    simplificationToleranceDeg: number;
    minCellSizeWorld: number;
    minCellSizeRealKm: number;
    boundingBox: { lonMin: number; lonMax: number; latMin: number; latMax: number };
  };
}

`;

  const constants = ids.map((id) => regionConst(id, raw[id])).join("\n");

  const registry = `export const COAST_REGIONS = {
${ids.map((id) => `  ${id}: ${id.toUpperCase()},`).join("\n")}
} as const;
`;

  fs.writeFileSync(OUTPUT_PATH, header + constants + "\n" + registry);

  const bytes = fs.statSync(OUTPUT_PATH).size;
  console.log(`Wrote ${OUTPUT_PATH} (${(bytes / 1024).toFixed(1)} KB)`);
}

main();
