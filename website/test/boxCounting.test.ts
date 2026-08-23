import { describe, expect, it } from "vitest";
import {
  countLineCells,
  countFilledCells,
  parseCellKey,
} from "../components/blog/box-dimension/boxCounting";
import type { Point } from "../components/blog/box-dimension/boxCounting";

function square(size: number): Point[] {
  return [
    { x: 0, y: 0 },
    { x: size, y: 0 },
    { x: size, y: size },
    { x: 0, y: size },
  ];
}

describe("countLineCells", () => {
  it("counts a horizontal line as ceil(length / cellSize) cells", () => {
    const line: Point[] = [
      { x: 0, y: 5 },
      { x: 97, y: 5 },
    ];
    expect(countLineCells(line, 10).count).toBe(10); // ceil(97/10)
  });

  it("counts a vertical line the same way", () => {
    const line: Point[] = [
      { x: 5, y: 0 },
      { x: 5, y: 33 },
    ];
    expect(countLineCells(line, 10).count).toBe(4); // ceil(33/10)
  });

  it("doubles the count when cell size halves, for a straight line", () => {
    const line: Point[] = [
      { x: 0, y: 5 },
      { x: 100, y: 5 },
    ];
    const coarse = countLineCells(line, 10).count;
    const fine = countLineCells(line, 5).count;
    expect(fine).toBe(coarse * 2);
  });

  it("returns empty for an empty point list", () => {
    expect(countLineCells([], 10)).toEqual({ count: 0, cells: [] });
  });

  it("handles a single point", () => {
    const result = countLineCells([{ x: 12, y: 34 }], 10);
    expect(result.count).toBe(1);
    expect(parseCellKey(result.cells[0])).toEqual([1, 3]);
  });

  it("closes the loop when closed=true", () => {
    const openCount = countLineCells(square(40), 10, false).count;
    const closedCount = countLineCells(square(40), 10, true).count;
    expect(closedCount).toBeGreaterThan(openCount);
  });
});

describe("countFilledCells", () => {
  it("counts a 40x40 square at cellSize=10 as exactly 16 cells", () => {
    expect(countFilledCells(square(40), 10).count).toBe(16);
  });

  it("quadruples when cell size halves — the dimension-2 signature", () => {
    const coarse = countFilledCells(square(40), 10).count;
    const fine = countFilledCells(square(40), 5).count;
    expect(coarse).toBe(16);
    expect(fine).toBe(64);
    expect(fine).toBe(coarse * 4);
  });

  it("returns empty for a degenerate polygon", () => {
    expect(countFilledCells([{ x: 0, y: 0 }], 10)).toEqual({ count: 0, cells: [] });
  });
});
