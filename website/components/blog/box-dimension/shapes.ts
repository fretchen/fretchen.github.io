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

export const LINE_SHAPE: ShapeDefinition = {
  id: "line",
  label: "Linie",
  points: [
    { x: 10, y: 50 },
    { x: 90, y: 50 },
  ],
  mode: "line",
  closed: false,
};

export const CIRCLE_SHAPE: ShapeDefinition = {
  id: "circle",
  label: "Kreis",
  points: circlePoints(50, 50, 40, 128),
  mode: "line",
  closed: true,
};

export const SQUARE_SHAPE: ShapeDefinition = {
  id: "square",
  label: "Volles Quadrat",
  points: [
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 90 },
    { x: 10, y: 90 },
  ],
  mode: "filled",
  closed: true,
};

export const DEMO_SHAPES: ShapeDefinition[] = [LINE_SHAPE, CIRCLE_SHAPE, SQUARE_SHAPE];
