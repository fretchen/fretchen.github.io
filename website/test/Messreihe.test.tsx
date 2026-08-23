/**
 * Messreihe tests — the component carries the one piece of pedagogy in the box-dimension
 * widgets that is neither pure geometry (boxCounting.test.ts) nor pure layout: the Fazit.
 * Two properties matter and both have broken before:
 *
 *  1. It appears only once the whole series is measured — a partial series must not be
 *     summarised, because the growth factor is meaningless after one halving.
 *  2. Its wording follows the measured factor. An earlier threshold called a real coastline
 *     "fast eine Linie" right after the post had declared coastlines to be fractals.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Messreihe, averageFactor, type HalvingSample } from "../components/blog/box-dimension/Messreihe";

const WORLD = 100;
const STEPS = [25, 12.5, 6.25, 3.125, 1.5625];

/**
 * The Fazit block, scoped so its headline can't be confused with a row's ×-tag. Anchored on
 * the opening clause every Fazit shares, whatever the measured factor.
 */
function fazitBlock(): HTMLElement {
  return screen.getByText(/^So viel mehr Kästchen brauchst du bei jeder Halbierung/).parentElement!;
}

/** A series whose count grows by exactly `factor` at every halving. */
function seriesWithFactor(factor: number, steps = STEPS.length): HalvingSample[] {
  return STEPS.slice(0, steps).map((cellSize, i) => ({
    cellSize,
    count: Math.round(10 * Math.pow(factor, i)),
  }));
}

describe("Messreihe", () => {
  it("renders nothing at all without samples", () => {
    const { container } = render(<Messreihe samples={[]} worldSize={WORLD} totalSteps={STEPS.length} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the rows but no Fazit while the series is incomplete", () => {
    render(<Messreihe samples={seriesWithFactor(2.3, 3)} worldSize={WORLD} totalSteps={STEPS.length} />);

    expect(screen.getByText("Deine Messungen:")).toBeTruthy();
    expect(screen.queryByText(/So viel mehr Kästchen/)).toBeNull();
    expect(screen.queryByText(/Fraktal/)).toBeNull();
  });

  it("shows the factor as a headline and calls a coastline-like series a fractal", () => {
    // ≈ the Bretagne's measured 2,28.
    render(<Messreihe samples={seriesWithFactor(2.28)} worldSize={WORLD} totalSteps={STEPS.length} />);

    const fazit = within(fazitBlock());
    expect(fazit.getByText(/^×2,[23]$/)).toBeTruthy();
    expect(fazit.getByText(/Das ist ein Fraktal/)).toBeTruthy();
    expect(fazit.getByText(/näher an der Linie/)).toBeTruthy();
  });

  it("calls an exact doubling a line of dimension 1", () => {
    render(<Messreihe samples={seriesWithFactor(2)} worldSize={WORLD} totalSteps={STEPS.length} />);

    const fazit = within(fazitBlock());
    expect(fazit.getByText("×2")).toBeTruthy();
    expect(fazit.getByText(/Ihre Dimension ist 1/)).toBeTruthy();
    expect(screen.queryByText(/Fraktal/)).toBeNull();
  });

  it("calls an exact quadrupling a surface of dimension 2", () => {
    render(<Messreihe samples={seriesWithFactor(4)} worldSize={WORLD} totalSteps={STEPS.length} />);

    const fazit = within(fazitBlock());
    expect(fazit.getByText("×4")).toBeTruthy();
    expect(fazit.getByText(/Ihre Dimension ist 2/)).toBeTruthy();
  });

  it("renders fazitExtra inside the Fazit, and only once it exists", () => {
    const extra = <span data-testid="extra">Vergleich</span>;

    const partial = render(
      <Messreihe samples={seriesWithFactor(2.3, 2)} worldSize={WORLD} totalSteps={STEPS.length} fazitExtra={extra} />,
    );
    expect(partial.queryByTestId("extra")).toBeNull();
    partial.unmount();

    render(
      <Messreihe samples={seriesWithFactor(2.3)} worldSize={WORLD} totalSteps={STEPS.length} fazitExtra={extra} />,
    );
    expect(screen.getByTestId("extra")).toBeTruthy();
  });
});

describe("averageFactor", () => {
  it("recovers the geometric growth factor of a series", () => {
    expect(averageFactor(seriesWithFactor(2))).toBeCloseTo(2, 5);
    expect(averageFactor(seriesWithFactor(4))).toBeCloseTo(4, 5);
  });

  it("is order-independent", () => {
    const series = seriesWithFactor(2.28);
    expect(averageFactor([...series].reverse())).toBeCloseTo(averageFactor(series)!, 10);
  });

  it("returns null when there is nothing to compare", () => {
    expect(averageFactor([])).toBeNull();
    expect(averageFactor([{ cellSize: 25, count: 10 }])).toBeNull();
    expect(
      averageFactor([
        { cellSize: 25, count: 0 },
        { cellSize: 12.5, count: 0 },
      ]),
    ).toBeNull();
  });
});
