import React from "react";
import { css } from "../../../styled-system/css";
import { ESSAY_ACCENT } from "../palette";
import type { HalvingSample } from "./DimensionSkala";

const wrapper = css({ mt: "3" });

const caption = css({ fontSize: "sm", color: "gray.600", mb: "1" });

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mt: "1",
});

const rowLabel = css({
  fontSize: "sm",
  color: "gray.700",
  whiteSpace: "nowrap",
  width: "90px",
  flexShrink: 0,
});

const barTrack = css({
  flex: "1",
  height: "18px",
  bg: "gray.100",
  borderRadius: "sm",
  overflow: "hidden",
});

const barFill = css({
  height: "100%",
  borderRadius: "sm",
});

const rowCount = css({
  fontSize: "sm",
  fontWeight: "bold",
  color: "explore",
  width: "36px",
  textAlign: "right",
  flexShrink: 0,
});

export interface MessreiheProps {
  /** Halving steps revealed so far, in any order — rendered coarsest-first. */
  samples: HalvingSample[];
  worldSize: number;
}

/**
 * Renders the halving steps taken so far as growing bars instead of a computed
 * ratio sentence. "Kästchen pro Kante" (worldSize / cellSize) is always a clean
 * integer for the widgets' own CELL_SIZE_STEPS, so no world-unit decimal ever
 * reaches the child — they compare two whole numbers per row themselves.
 */
export function Messreihe({ samples, worldSize }: MessreiheProps) {
  if (samples.length === 0) return null;

  const rows = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const maxCount = Math.max(...rows.map((r) => r.count));

  return (
    <div className={wrapper}>
      <p className={caption}>Deine Messungen:</p>
      {rows.map((r) => {
        const perEdge = Math.round(worldSize / r.cellSize);
        const percent = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
        return (
          <div key={r.cellSize} className={row}>
            <span className={rowLabel}>{perEdge} pro Kante</span>
            <div className={barTrack}>
              <div className={barFill} style={{ width: `${percent}%`, background: ESSAY_ACCENT }} />
            </div>
            <span className={rowCount}>{r.count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default Messreihe;
