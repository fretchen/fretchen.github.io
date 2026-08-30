/**
 * Pins the numbers the post *claims* to the numbers the widgets *measure*.
 *
 * This coupling has broken silently three times: centring the regions, widening the Normandie
 * bounding box and re-cutting the coastline each shifted the measured growth factors
 * (2,54 → 2,28 → …) while the prose kept quoting the old values, and each time it was caught
 * rounds later by re-reading the post rather than by a failing test. Neither `tsc` nor the
 * component tests can see a stale decimal in an MDX file.
 *
 * Two claims are pinned:
 *
 *  1. "Bei der Linie brauchst du genau doppelt so viele Kästchen, bei jedem einzelnen Schritt"
 *     — true only because LINE_SHAPE spans the full world, so both ends land on a grid corner
 *     at every step. Nudging it back off the boundary silently makes the sentence false.
 *  2. Every dimension quoted in the post (1,19 for the Bretagne, 1,08 for the Normandie, and
 *     the ×2,3 that goes with 1,19) must follow from the data in `coasts.ts`.
 *
 * If this test fails after a data change, the fix is to update the post — not the test.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { countLineCells, countFilledCells, type Point } from "../components/blog/box-dimension/boxCounting";
import { COAST_REGIONS } from "../components/blog/box-dimension/coasts";
import { LINE_SHAPE, SQUARE_SHAPE } from "../components/blog/box-dimension/shapes";
import { averageFactor, type HalvingSample } from "../components/blog/box-dimension/Messreihe";
import { formatFactor, formatDimension } from "../components/blog/box-dimension/texts";

/** Must stay in step with CELL_SIZE_STEPS in the three widget files. */
const CELL_SIZE_STEPS = [25, 12.5, 6.25, 3.125, 1.5625];

const POST = readFileSync(join(__dirname, "..", "blog", "kuesten_dimension.mdx"), "utf8");

function lineSeries(points: Point[], closed: boolean): number[] {
  return CELL_SIZE_STEPS.map((s) => countLineCells(points, s, closed).count);
}

function samples(counts: number[]): HalvingSample[] {
  return counts.map((count, i) => ({ cellSize: CELL_SIZE_STEPS[i], count }));
}

describe("shapes the post makes exact claims about", () => {
  it("doubles the line's count at every single step, not just on average", () => {
    const counts = lineSeries(LINE_SHAPE.points, LINE_SHAPE.closed ?? false);

    expect(counts).toEqual([4, 8, 16, 32, 64]);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i] / counts[i - 1]).toBe(2);
    }
  });

  it("quadruples the square's count at every single step", () => {
    const counts = CELL_SIZE_STEPS.map((s) => countFilledCells(SQUARE_SHAPE.points, s).count);

    for (let i = 1; i < counts.length; i++) {
      expect(counts[i] / counts[i - 1]).toBe(4);
    }
  });

  it("keeps the post's claim that the line is exact and the circle only wobbles around ×2", () => {
    expect(POST).toContain(
      "Bei der Linie brauchst du **genau doppelt** so viele Kästchen, bei jedem einzelnen Schritt",
    );
    expect(POST).toContain("Beim Kreis fast genau doppelt");
  });
});

describe("coastline numbers quoted in the post", () => {
  const measured = Object.fromEntries(
    Object.keys(COAST_REGIONS).map((id) => {
      const region = COAST_REGIONS[id as keyof typeof COAST_REGIONS];
      const points: Point[] = region.points.map(([x, y]) => ({ x, y }));
      const factor = averageFactor(samples(lineSeries(points, false)))!;
      return [id, { factor, dimension: Math.log2(factor) }];
    }),
  );

  it("quotes the Bretagne's dimension and growth factor as measured", () => {
    const { factor, dimension } = measured.bretagne;

    // "Bei ×2,3 steht im Widget die Hochzahl 1,19." and the closing answer.
    expect(POST).toContain(`Bei ×${formatFactor(factor)} steht im Widget die Hochzahl ${formatDimension(dimension)}`);
    expect(POST).toContain(`hat die Dimension ${formatDimension(dimension)}`);
  });

  it("quotes both coastlines where it contrasts them", () => {
    const bretagne = formatDimension(measured.bretagne.dimension);
    const normandie = formatDimension(measured.normandie.dimension);

    expect(POST).toContain(`Die Bretagne kommt auf die Hochzahl ${bretagne}, die Normandie nur auf ${normandie}`);
    expect(POST).toContain(`für die Bretagne ≈ ${bretagne}, für die Normandie ≈ ${normandie}`);
  });

  it("keeps the Bretagne the rougher of the two, which the prose asserts", () => {
    expect(measured.bretagne.dimension).toBeGreaterThan(measured.normandie.dimension);
  });
});
