/**
 * Box-counting for the coast-dimension widgets.
 *
 * All geometry here lives in abstract world units (see each widget's `worldSize`),
 * decoupled from CSS pixels and devicePixelRatio — DPR only enters when BoxCanvas
 * draws to the screen, never in this counting math. That keeps the measured count
 * independent of window size or screen density.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CellCountResult {
  count: number;
  /** Cell keys as "col,row", for highlight rendering. */
  cells: string[];
}

interface CellIndex {
  col: number;
  row: number;
}

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function parseCellKey(key: string): [col: number, row: number] {
  const [col, row] = key.split(",").map(Number);
  return [col, row];
}

// Termination is driven by the segment's own parametric position (t in [0,1]),
// not by comparing against a separately-floored target cell index. That sidesteps
// the classic off-by-one ambiguity when an endpoint sits exactly on a grid line
// (e.g. a 40-unit square at cellSize=10) — floor(40/10) would otherwise claim a
// phantom extra column/row that the shape never actually reaches.
const EPS_T = 1e-9;

/**
 * Every grid cell a line segment passes through, via a 2D supercover/voxel
 * traversal (Amanatides–Woo). Used instead of "round each sample point" because at
 * small cell sizes a fixed sampling density can under-sample relative to cellSize,
 * silently skipping cells the true segment crosses.
 *
 * `carried` lets consecutive segments of a polyline share one running cell index
 * across their common vertex, instead of each independently re-flooring that
 * vertex's raw coordinates — which is what actually resolves the boundary
 * ambiguity for shapes like a closed square whose corners sit on grid lines.
 */
function traverseSegment(a: Point, b: Point, cellSize: number, into: Set<string>, carried?: CellIndex): CellIndex {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  let col = carried?.col ?? Math.floor(a.x / cellSize);
  let row = carried?.row ?? Math.floor(a.y / cellSize);
  into.add(cellKey(col, row));

  if (dx === 0 && dy === 0) {
    return { col, row };
  }

  const stepCol = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepRow = dy > 0 ? 1 : dy < 0 ? -1 : 0;

  const tDeltaX = dx !== 0 ? cellSize / Math.abs(dx) : Infinity;
  const tDeltaY = dy !== 0 ? cellSize / Math.abs(dy) : Infinity;

  let tMaxX = dx !== 0 ? ((stepCol > 0 ? (col + 1) * cellSize : col * cellSize) - a.x) / dx : Infinity;
  let tMaxY = dy !== 0 ? ((stepRow > 0 ? (row + 1) * cellSize : row * cellSize) - a.y) / dy : Infinity;

  const maxSteps = 100_000; // guard against pathological input
  let steps = 0;

  while (Math.min(tMaxX, tMaxY) < 1 - EPS_T && steps < maxSteps) {
    if (tMaxX < tMaxY) {
      col += stepCol;
      tMaxX += tDeltaX;
    } else {
      row += stepRow;
      tMaxY += tDeltaY;
    }
    into.add(cellKey(col, row));
    steps += 1;
  }

  return { col, row };
}

/**
 * Cells intersected by an open or closed polyline (straight line, circle outline,
 * coastline, hand-drawn curve — one code path for all of them).
 */
export function countLineCells(points: Point[], cellSize: number, closed = false): CellCountResult {
  const hits = new Set<string>();

  if (points.length === 0 || cellSize <= 0) {
    return { count: 0, cells: [] };
  }

  if (points.length === 1) {
    const p = points[0];
    hits.add(cellKey(Math.floor(p.x / cellSize), Math.floor(p.y / cellSize)));
    return { count: hits.size, cells: [...hits] };
  }

  let state: CellIndex | undefined;
  for (let i = 0; i < points.length - 1; i++) {
    state = traverseSegment(points[i], points[i + 1], cellSize, hits, state);
  }
  if (closed) {
    traverseSegment(points[points.length - 1], points[0], cellSize, hits, state);
  }

  return { count: hits.size, cells: [...hits] };
}

/**
 * Cells covered by a filled polygon (only the square demo, to contrast the 4x
 * growth of a dimension-2 shape against the 2x growth of a dimension-1 curve).
 * Boundary cells come from countLineCells (handles partial edge coverage); the
 * interior comes from a scanline pass per grid row using the even-odd rule.
 *
 * A far/upper bound (the last row, or the right end of a scanline span) that lands
 * exactly on a grid line is nudged down by a tiny epsilon before flooring — such a
 * boundary is the edge of the last cell the shape actually occupies, not the near
 * edge of one beyond it. A near/lower bound needs no such nudge: floor() already
 * assigns it to the correct cell.
 */
export function countFilledCells(polygon: Point[], cellSize: number): CellCountResult {
  if (polygon.length < 3 || cellSize <= 0) {
    return { count: 0, cells: [] };
  }

  const eps = cellSize * 1e-9;
  const hits = new Set<string>(countLineCells(polygon, cellSize, true).cells);

  const ys = polygon.map((p) => p.y);
  const minRow = Math.floor(Math.min(...ys) / cellSize);
  const maxRow = Math.floor((Math.max(...ys) - eps) / cellSize);

  for (let row = minRow; row <= maxRow; row++) {
    const y = (row + 0.5) * cellSize;
    const xs: number[] = [];

    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const crosses = a.y <= y !== b.y <= y;
      if (crosses) {
        const t = (y - a.y) / (b.y - a.y);
        xs.push(a.x + t * (b.x - a.x));
      }
    }

    xs.sort((a, b) => a - b);

    for (let i = 0; i + 1 < xs.length; i += 2) {
      const colStart = Math.floor(xs[i] / cellSize);
      const colEnd = Math.floor((xs[i + 1] - eps) / cellSize);
      for (let col = colStart; col <= colEnd; col++) {
        hits.add(cellKey(col, row));
      }
    }
  }

  return { count: hits.size, cells: [...hits] };
}
