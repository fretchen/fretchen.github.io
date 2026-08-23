import React from "react";
import { css } from "../../../styled-system/css";
import { formatFactor } from "./texts";

export interface HalvingSample {
  cellSize: number;
  count: number;
}

const wrapper = css({ mt: "3" });

const caption = css({ fontSize: "sm", color: "gray.600", mb: "1" });
/** Extra air when the Fazit sits above the table, so the two blocks don't run together. */
const captionBelowFazit = css({ mt: "4" });

/** Same three-column geometry as `row`, so every label sits over the column it names. */
const headerRow = css({
  display: "flex",
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

// 56px, not 40px: wide enough for the "Größe" label to sit over this column without
// wrapping, which is what lets the count label move left onto the bar (see headerRow).
const sizeCell = css({
  width: "56px",
  flexShrink: 0,
  display: "flex",
  justifyContent: "center",
});

// Everything in the table is grey. It is the record, not the headline: the count is already
// encoded twice here (bar length and the number itself), and colour as a third encoding of
// the same quantity only adds noise — it made the log louder than the map above it. The
// accent is reserved for the number in focus: the guidance line and the Fazit.
const swatch = css({
  border: "2px solid token(colors.gray.400, #9ca3af)",
  borderRadius: "xs",
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
  bg: "gray.300",
});

const countCell = css({
  fontSize: "sm",
  width: "80px",
  textAlign: "right",
  flexShrink: 0,
});

const sizeHeader = css({ width: "56px", flexShrink: 0, textAlign: "center" });
// The count label starts at the bar, not at the number: the bar *is* the count, and
// left-aligning the label is what says so.
const countHeader = css({ flex: "1" });
const headerSpacer = css({ width: "80px", flexShrink: 0 });

const countNumber = css({ fontWeight: "bold", color: "text" });

const factorTag = css({ color: "gray.500", fontSize: "xs", ml: "1" });

/**
 * The payoff of the whole widget, so it is the largest thing in it — not the smallest.
 * It used to be 14px inside a grey box, i.e. the form vocabulary of an aside, below a
 * five-row table and therefore off-screen on a phone. Now: a hairline rule (the system
 * has no tinted surfaces), the ×-number as a headline, and the sentences at prose size in
 * the reading face — the one part of the widget that speaks in the post's voice rather
 * than being operated. Rendered *above* the table, so it lands next to the button the
 * child just pressed instead of below the evidence it summarises.
 *
 * No small label above the number: the sentence below explains it, so a 12px caption was
 * one element (and one type size) too many.
 */
const fazit = css({
  mt: "3",
  pt: "3",
  borderTop: "1px solid token(colors.border, #eeeeee)",
});

const fazitNumber = css({ fontSize: "2xl", fontWeight: "bold", color: "explore", lineHeight: "tight" });

const fazitText = css({
  fontFamily: "reading",
  fontSize: "lg",
  lineHeight: "relaxed",
  color: "text",
  mt: "1",
});

/**
 * Geometric-mean growth factor across all halving steps taken (same math the
 * removed DimensionSkala used internally) — used only to pick which of three
 * explanatory sentences to show, never printed as a raw "dimension" decimal.
 *
 * Exported for `KuestenSpiel`, which compares the finished factors of two coastlines.
 */
export function averageFactor(samples: HalvingSample[]): number | null {
  if (samples.length < 2) return null;
  const sorted = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const coarsest = sorted[0];
  const finest = sorted[sorted.length - 1];
  if (coarsest.count <= 0 || finest.count <= 0) return null;
  const numHalvings = Math.log2(coarsest.cellSize / finest.cellSize);
  if (!isFinite(numHalvings) || numHalvings <= 0) return null;
  return Math.pow(finest.count / coarsest.count, 1 / numHalvings);
}

interface FazitText {
  /** The result itself, set as a headline — e.g. "×2,3". */
  headline: string;
  /** Two short sentences explaining it. Never one long one; the post's own rule. */
  sentence: string;
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
function explainFactor(factor: number): FazitText {
  // All three cases open with the same clause, so the big number always means the same
  // thing no matter which shape produced it.
  const opening = "So viel mehr Kästchen brauchst du bei jeder Halbierung";
  if (factor <= 2.05) {
    return {
      headline: "×2",
      sentence: `${opening} — genau doppelt so viele, wie bei einer reinen Linie. Ihre Dimension ist 1.`,
    };
  }
  if (factor >= 3.95) {
    return {
      headline: "×4",
      sentence: `${opening} — genau viermal so viele, wie bei einer vollen Fläche. Ihre Dimension ist 2.`,
    };
  }
  const positionHint = factor < 2.83 ? "näher an der Linie" : "näher an der Fläche";
  return {
    headline: `×${formatFactor(factor)}`,
    sentence: `${opening}. Mehr als bei einer Linie (×2), weniger als bei einer vollen Fläche (×4) — ${positionHint}. Das ist ein Fraktal: Seine Dimension liegt zwischen 1 und 2.`,
  };
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
  /**
   * One more Fazit sentence, set in the same style as the others. KuestenSpiel puts its
   * cross-coast comparison here rather than in a smaller line of its own.
   */
  fazitExtra?: React.ReactNode;
}

export function Messreihe({ samples, worldSize, totalSteps, fazitExtra }: MessreiheProps) {
  if (samples.length === 0) return null;

  const rows = [...samples].sort((a, b) => b.cellSize - a.cellSize);
  const maxCount = Math.max(...rows.map((r) => r.count));
  const factor = rows.length >= totalSteps ? averageFactor(rows) : null;
  const text = factor !== null ? explainFactor(factor) : null;

  return (
    <div className={wrapper}>
      {text && (
        <div className={fazit}>
          <p className={fazitNumber}>{text.headline}</p>
          <p className={fazitText}>{text.sentence}</p>
          {fazitExtra && <p className={fazitText}>{fazitExtra}</p>}
        </div>
      )}

      <p className={`${caption} ${text ? captionBelowFazit : ""}`}>Deine Messungen:</p>
      <div className={headerRow}>
        <span className={sizeHeader}>Größe</span>
        <span className={countHeader}>Anzahl der Kästchen</span>
        <span className={headerSpacer} />
      </div>
      {rows.map((r, i) => {
        const perEdge = Math.round(worldSize / r.cellSize);
        // Floor at 10px, not 6: the finest row landed at 7px, which reads as a dot
        // rather than as a square and stops carrying "the boxes got smaller".
        const sizePx = Math.max(10, Math.round(28 / Math.sqrt(perEdge / 4)));
        // Floor at 6%: the bars are normalised to the largest count, so after five halvings
        // the first row lands near 7% and reads as an empty track — the child's very first
        // measurement would be the one they cannot see.
        const percent = maxCount > 0 ? Math.max(6, (r.count / maxCount) * 100) : 0;
        const factor = i > 0 ? r.count / rows[i - 1].count : null;

        return (
          <div key={r.cellSize} className={row}>
            <div className={sizeCell}>
              <span className={swatch} style={{ width: sizePx, height: sizePx }} />
            </div>
            <div className={barTrack}>
              <div className={barFill} style={{ width: `${percent}%` }} />
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
