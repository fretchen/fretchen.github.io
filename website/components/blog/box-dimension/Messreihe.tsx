import React from "react";
import { css } from "../../../styled-system/css";
import { ESSAY_ACCENT } from "../palette";

export interface HalvingSample {
  cellSize: number;
  count: number;
}

const wrapper = css({ mt: "3" });

const caption = css({ fontSize: "sm", color: "gray.600", mb: "1" });

const headerRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontSize: "xs",
  color: "gray.500",
  mb: "1",
});

const headerSize = css({ width: "40px", flexShrink: 0 });
const headerCount = css({ flex: "1" });

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mt: "1",
});

const sizeCell = css({
  width: "40px",
  flexShrink: 0,
  display: "flex",
  justifyContent: "center",
});

const swatch = css({
  border: "2px solid token(colors.explore, #7c3aed)",
  borderRadius: "2px",
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

const countCell = css({
  fontSize: "sm",
  width: "80px",
  textAlign: "right",
  flexShrink: 0,
});

const countNumber = css({ fontWeight: "bold", color: "explore" });

const factorTag = css({ color: "gray.500", fontSize: "xs", ml: "1" });

function formatFactor(factor: number): string {
  return factor.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Renders the halving steps taken so far as growing bars, each with a shrinking
 * square icon standing in for "wie klein die Kästchen gerade sind" — no raw
 * cellSize or "N pro Kante" number is ever shown, since neither means anything
 * to a child without translation. The ×-factor next to each count does that one
 * division for them so the growth is visible without mental arithmetic.
 */
export function Messreihe({ samples, worldSize }: { samples: HalvingSample[]; worldSize: number }) {
  if (samples.length === 0) return null;

  const rows = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const maxCount = Math.max(...rows.map((r) => r.count));

  return (
    <div className={wrapper}>
      <p className={caption}>Deine Messungen:</p>
      <div className={headerRow}>
        <span className={headerSize}>Größe der Kästchen</span>
        <span className={headerCount}>Anzahl der Kästchen</span>
      </div>
      {rows.map((r, i) => {
        const perEdge = Math.round(worldSize / r.cellSize);
        const sizePx = Math.max(6, Math.round(28 / Math.sqrt(perEdge / 4)));
        const percent = maxCount > 0 ? (r.count / maxCount) * 100 : 0;
        const factor = i > 0 ? r.count / rows[i - 1].count : null;

        return (
          <div key={r.cellSize} className={row}>
            <div className={sizeCell}>
              <span className={swatch} style={{ width: sizePx, height: sizePx }} />
            </div>
            <div className={barTrack}>
              <div className={barFill} style={{ width: `${percent}%`, background: ESSAY_ACCENT }} />
            </div>
            <span className={countCell}>
              <span className={countNumber}>{r.count}</span>
              {factor !== null && <span className={factorTag}>×{formatFactor(factor)}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default Messreihe;
