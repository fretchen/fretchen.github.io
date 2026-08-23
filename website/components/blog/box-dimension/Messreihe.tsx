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
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "2",
  fontSize: "xs",
  color: "gray.500",
  mb: "1",
});

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

const conclusion = css({
  mt: "3",
  p: "3",
  bg: "gray.50",
  borderRadius: "md",
  fontSize: "sm",
  color: "gray.800",
});

/**
 * Geometric-mean growth factor across all halving steps taken (same math the
 * removed DimensionSkala used internally) — used only to pick which of three
 * explanatory sentences to show, never printed as a raw "dimension" decimal.
 */
function averageFactor(samples: HalvingSample[]): number | null {
  if (samples.length < 2) return null;
  const sorted = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const coarsest = sorted[0];
  const finest = sorted[sorted.length - 1];
  if (coarsest.count <= 0 || finest.count <= 0) return null;
  const numHalvings = Math.log2(coarsest.cellSize / finest.cellSize);
  if (!isFinite(numHalvings) || numHalvings <= 0) return null;
  return Math.pow(finest.count / coarsest.count, 1 / numHalvings);
}

/**
 * Explains the ×2/×4 ⇔ Dimension-1/2 connection in words instead of a silent
 * gauge position. The two edge cases are deliberately narrow (2.05/3.95) —
 * tight enough that only genuine point-landings (the exact-2.0 line/circle and
 * exact-4.0 square from widget 1, see boxCounting.test.ts) get "das ist genau
 * eine Linie/Fläche". Everything else, including every real coastline and any
 * hand-drawn curve, is always called a fractal — never "fast keine Linie
 * mehr", which previously contradicted the post's "Küsten sind Fraktale"
 * claim once a real measurement (e.g. Normandie) drifted under a wider
 * threshold. The position hint's boundary (2.83 = 2^1.5) is the *multiplicative*
 * midpoint between dimension 1 and 2, not the arithmetic ×3.
 */
function explainFactor(factor: number): string {
  if (factor <= 2.05) {
    return "Deine Zahlen werden bei jeder Halbierung genau doppelt so groß (×2) — wie bei einer reinen Linie. Ihre Dimension ist 1.";
  }
  if (factor >= 3.95) {
    return "Deine Zahlen werden bei jeder Halbierung genau viermal so groß (×4) — wie bei einer vollen Fläche. Ihre Dimension ist 2.";
  }
  const positionHint = factor < 2.83 ? "näher an der Linie als an der Fläche" : "näher an der Fläche als an der Linie";
  return `Deine Zahlen werden bei jeder Halbierung im Schnitt etwa ×${formatFactor(
    factor,
  )} so groß — mehr als bei einer Linie (×2, Dimension 1), aber weniger als bei einer vollen Fläche (×4, Dimension 2), ${positionHint}. Das ist ein Fraktal: Seine Dimension liegt irgendwo zwischen 1 und 2.`;
}

/**
 * Renders the halving steps taken so far as growing bars, each with a shrinking
 * square icon standing in for "wie klein die Kästchen gerade sind" — no raw
 * cellSize or "N pro Kante" number is ever shown, since neither means anything
 * to a child without translation. The ×-factor next to each count does that one
 * division for them so the growth is visible without mental arithmetic.
 */
export interface MessreiheProps {
  samples: HalvingSample[];
  worldSize: number;
  /** Total halving steps the widget offers — the conclusion only shows once all are measured. */
  totalSteps: number;
}

export function Messreihe({ samples, worldSize, totalSteps }: MessreiheProps) {
  if (samples.length === 0) return null;

  const rows = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const maxCount = Math.max(...rows.map((r) => r.count));
  const factor = rows.length >= totalSteps ? averageFactor(rows) : null;

  return (
    <div className={wrapper}>
      <p className={caption}>Deine Messungen:</p>
      <div className={headerRow}>
        <span>Größe der Kästchen</span>
        <span>Anzahl der Kästchen</span>
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
      {factor !== null && <p className={conclusion}>{explainFactor(factor)}</p>}
    </div>
  );
}

export default Messreihe;
