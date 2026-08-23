import React from "react";
import { css } from "../../../styled-system/css";
import { ESSAY_ACCENT } from "../palette";

/**
 * Maps a halving-factor (how many times more cells you need when you halve the
 * cell size — 2x for a curve, 4x for a filled area) onto a dimension between 1
 * and 2. This is exactly log2(factor) + 1, but that never appears in the UI —
 * the widgets only ever show the gauge position, never the exponent.
 */
export function factorToDimension(factor: number): number {
  const clamped = Math.max(2, Math.min(factor, 4));
  return Math.log2(clamped);
}

export interface HalvingSample {
  cellSize: number;
  count: number;
}

/**
 * Combines two or more halving steps into one stabilized factor, via the
 * geometric mean per step between the coarsest and finest sample. Ratios
 * telescope, so this is the same thing as an average log-log slope — computed
 * without ever naming a logarithm.
 */
export function aggregateFactor(samples: HalvingSample[]): number | null {
  if (samples.length < 2) return null;

  const sorted = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const coarsest = sorted[0];
  const finest = sorted[sorted.length - 1];

  if (coarsest.count <= 0 || finest.count <= 0) return null;

  const numHalvings = Math.log2(coarsest.cellSize / finest.cellSize);
  if (!isFinite(numHalvings) || numHalvings <= 0) return null;

  return Math.pow(finest.count / coarsest.count, 1 / numHalvings);
}

const wrapper = css({ mt: "3" });

const track = css({
  position: "relative",
  height: "8px",
  bg: "gray.200",
  borderRadius: "full",
});

const marker = css({
  position: "absolute",
  top: "-4px",
  width: "4px",
  height: "16px",
  borderRadius: "sm",
});

const labels = css({
  display: "flex",
  justifyContent: "space-between",
  fontSize: "xs",
  color: "gray.600",
  mt: "1",
});

export interface DimensionSkalaProps {
  /** Measured halving-factor, or null before enough samples exist. */
  factor: number | null;
}

export function DimensionSkala({ factor }: DimensionSkalaProps) {
  const dimension = factor !== null ? factorToDimension(factor) : null;
  const percent = dimension !== null ? Math.max(0, Math.min(1, dimension - 1)) * 100 : null;

  return (
    <div className={wrapper}>
      <div className={track}>
        {percent !== null && (
          <div className={marker} style={{ left: `calc(${percent}% - 2px)`, background: ESSAY_ACCENT }} />
        )}
      </div>
      <div className={labels}>
        <span>Linie (1)</span>
        <span>Fläche (2)</span>
      </div>
    </div>
  );
}

export default DimensionSkala;
