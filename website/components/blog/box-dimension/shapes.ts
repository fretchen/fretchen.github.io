import type { Point } from "./boxCounting";

/** Shared world-unit coordinate box every shape/coastline is normalized into. */
export const WORLD_SIZE = 100;

export interface ShapeDefinition {
  id: "line" | "circle" | "square";
  label: string;
  points: Point[];
  mode: "line" | "filled";
  closed: boolean;
}

function circlePoints(cx: number, cy: number, radius: number, segments: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  }
  return points;
}

// y=53 / center (53,51), not y=50 / center (50,50): 50 is a multiple of every
// CELL_SIZE_STEPS value down to the finest (1.5625), so a shape passing through it
// sits exactly on a grid line at every halving step — visually ambiguous ("which
// cell is this in?") even though boxCounting.ts resolves it consistently under the
// hood. Nudging off any multiple of 1.5625 keeps the shape clearly inside a row/
// column of cells at every zoom level.
// The x-span is the full world, not 10→90: 80 units is not a multiple of the cell sizes, so
// both ends fell mid-cell and every step picked up a partial box the previous one had not.
// That made the line measure 4 · 8 · 14 · 26 · 52 — ×1,75 and ×1,86 in the middle — while the
// post promises "genau doppelt, egal wie oft du halbierst". Spanning 0→100 lands both ends on
// a grid corner at every step and measures 4 · 8 · 16 · 32 · 64, exactly ×2 throughout.
// Pinned by test/kuestenZahlen.test.ts, which is what makes the claim in the post safe.
export const LINE_SHAPE: ShapeDefinition = {
  id: "line",
  label: "Linie",
  points: [
    { x: 0, y: 53 },
    { x: 100, y: 53 },
  ],
  mode: "line",
  closed: false,
};

export const CIRCLE_SHAPE: ShapeDefinition = {
  id: "circle",
  label: "Kreis",
  points: circlePoints(53, 51, 40, 128),
  mode: "line",
  closed: true,
};

// Corners at multiples of 25 (the coarsest CELL_SIZE_STEPS value), not 10/90:
// every multiple of 25 is automatically a multiple of every finer step too
// (25 = 2×12.5 = 4×6.25 = 8×3.125 = 16×1.5625), so the square's edges sit
// exactly on a grid line at every halving step — no boundary rounding, so the
// count is exactly ×4 per step instead of drifting (misaligned edges were
// producing a measured factor closer to a fractal's than a real area's).
export const SQUARE_SHAPE: ShapeDefinition = {
  id: "square",
  // "Quadrat", not "Volles Quadrat": at 390px the three toggles only fit on one line at
  // this length, and the canvas already shows the fill.
  label: "Quadrat",
  points: [
    { x: 25, y: 25 },
    { x: 75, y: 25 },
    { x: 75, y: 75 },
    { x: 25, y: 75 },
  ],
  mode: "filled",
  closed: true,
};

export const DEMO_SHAPES: ShapeDefinition[] = [LINE_SHAPE, CIRCLE_SHAPE, SQUARE_SHAPE];
