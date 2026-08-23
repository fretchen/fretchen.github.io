import { describe, expect, it } from "vitest";
import { factorToDimension, aggregateFactor } from "../components/blog/box-dimension/DimensionSkala";

describe("factorToDimension", () => {
  it("maps factor 2 (a curve) to dimension 1", () => {
    expect(factorToDimension(2)).toBeCloseTo(1, 10);
  });

  it("maps factor 4 (a filled area) to dimension 2", () => {
    expect(factorToDimension(4)).toBeCloseTo(2, 10);
  });

  it("maps factor 1 to dimension 1 (clamped)", () => {
    expect(factorToDimension(1)).toBeCloseTo(1, 10);
  });

  it("clamps factors below 1", () => {
    expect(factorToDimension(0.5)).toBeCloseTo(1, 10);
  });

  it("clamps factors above 4", () => {
    expect(factorToDimension(10)).toBeCloseTo(2, 10);
  });

  it("is monotonically increasing between 1 and 4", () => {
    expect(factorToDimension(2)).toBeLessThan(factorToDimension(2.5));
    expect(factorToDimension(2.5)).toBeLessThan(factorToDimension(3));
  });
});

describe("aggregateFactor", () => {
  it("returns null with fewer than 2 samples", () => {
    expect(aggregateFactor([])).toBeNull();
    expect(aggregateFactor([{ cellSize: 10, count: 4 }])).toBeNull();
  });

  it("recovers a clean 2x-per-halving factor across 3 steps", () => {
    const samples = [
      { cellSize: 40, count: 4 },
      { cellSize: 20, count: 8 },
      { cellSize: 10, count: 16 },
    ];
    expect(aggregateFactor(samples)).toBeCloseTo(2, 10);
  });

  it("recovers a clean 4x-per-halving factor (filled area)", () => {
    const samples = [
      { cellSize: 40, count: 4 },
      { cellSize: 20, count: 16 },
      { cellSize: 10, count: 64 },
    ];
    expect(aggregateFactor(samples)).toBeCloseTo(4, 10);
  });

  it("ignores sample order", () => {
    const forward = aggregateFactor([
      { cellSize: 40, count: 4 },
      { cellSize: 10, count: 16 },
    ]);
    const reversed = aggregateFactor([
      { cellSize: 10, count: 16 },
      { cellSize: 40, count: 4 },
    ]);
    expect(forward).toBeCloseTo(reversed!, 10);
  });

  it("returns null when all samples share the same cell size", () => {
    expect(
      aggregateFactor([
        { cellSize: 10, count: 4 },
        { cellSize: 10, count: 4 },
      ]),
    ).toBeNull();
  });
});
