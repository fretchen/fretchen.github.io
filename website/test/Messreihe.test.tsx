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
import { formatDimension } from "../components/blog/box-dimension/texts";

const WORLD = 100;
const STEPS = [25, 12.5, 6.25, 3.125, 1.5625];

/**
 * The Fazit block, scoped so its headline can't be confused with a row's ×-tag. Anchored on
 * the opening clause every Fazit shares, whatever the measured factor.
 */
function fazitBlock(): HTMLElement {
  return screen.getByText(/^So viel mehr Kästchen brauchst du bei jeder Halbierung/).parentElement!;
}

/** The headline's text content, with the <sup> exponent inlined — e.g. "×2,3 = 21,19". */
function headline(): string {
  return fazitBlock().querySelector("p")!.textContent;
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

  it("writes a coastline-like series as a power of two and calls it a fractal", () => {
    // ≈ the Bretagne's measured 2,28 — log2(2.28) = 1.189, i.e. the ≈1,19 the appendix quotes.
    render(<Messreihe samples={seriesWithFactor(2.28)} worldSize={WORLD} totalSteps={STEPS.length} />);

    const fazit = within(fazitBlock());
    expect(headline()).toBe("×2,3 = 21,19"); // "21,19" = "2" + <sup>1,19</sup>
    expect(fazit.getByText("1,19").tagName).toBe("SUP");
    expect(fazit.getByText(/Die Hochzahl ist die Dimension: hier 1,19/)).toBeTruthy();
    expect(fazit.getByText(/Genau das ist ein Fraktal/)).toBeTruthy();
  });

  it("calls an exact doubling a line of dimension 1, with a whole-number exponent", () => {
    render(<Messreihe samples={seriesWithFactor(2)} worldSize={WORLD} totalSteps={STEPS.length} />);

    expect(headline()).toBe("×2 = 21");
    expect(within(fazitBlock()).getByText(/Die Hochzahl ist ihre Dimension: 1\./)).toBeTruthy();
    expect(screen.queryByText(/Fraktal/)).toBeNull();
  });

  it("calls an exact quadrupling a surface of dimension 2", () => {
    render(<Messreihe samples={seriesWithFactor(4)} worldSize={WORLD} totalSteps={STEPS.length} />);

    expect(headline()).toBe("×4 = 22");
    expect(within(fazitBlock()).getByText(/Die Hochzahl ist ihre Dimension: 2\./)).toBeTruthy();
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

  it("converts to the dimensions the appendix quotes", () => {
    // The appendix states ≈1,19 for the Bretagne and ≈1,08 for the Normandie; those are
    // log2 of the measured growth factors, so the two must not drift apart.
    expect(formatDimension(Math.log2(averageFactor(seriesWithFactor(2.28))!))).toBe("1,19");
    expect(formatDimension(Math.log2(averageFactor(seriesWithFactor(2.12))!))).toBe("1,08");
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
