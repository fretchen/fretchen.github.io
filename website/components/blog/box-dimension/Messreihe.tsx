import React from "react";
import { css } from "../../../styled-system/css";
import { formatFactor, formatDimension } from "./texts";

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
// Filled, not outlined: an outline of 20px reads much like an outline of 28px, so the one
// thing this column exists to show — the boxes shrinking — was barely legible. A solid
// square makes the same size step obvious. (Area is a weak encoding either way, which is
// why the count gets the bar and this column only has to convey an ordering.)
const swatch = css({
  bg: "gray.400",
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
  bg: "gray.400",
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

// `verticalAlign` must be set explicitly: Panda's preflight resets `sup` to
// `vertical-align: baseline`, so a bare <sup> would sit on the line like any other digit —
// and the whole point is that this number is the exponent.
const fazitExponent = css({ fontSize: "md", verticalAlign: "super", lineHeight: "none" });

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
  /** The measured growth, e.g. "×2,3". */
  factor: string;
  /** The same number as a power of two, e.g. "1,19" in ×2,3 = 2^1,19 — which *is* the dimension. */
  exponent: string;
  /** Short sentences explaining it. Never one long one; the post's own rule. */
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
 * threshold.
 *
 * Writing the factor as a power of two is what finally puts the *dimension* on screen. The
 * gap between "×2,3" and "1,19" is a logarithm, which this post deliberately never teaches;
 * as an exponent it needs no new idea, only the powers a sixth-grader already has. That also
 * made the old position hint ("näher an der Linie", boundary 2.83 = 2^1.5) redundant — it
 * was a verbal stand-in for the number now shown outright.
 *
 * The two edge cases print a whole-number exponent rather than a computed one: a line
 * measuring ×1,9 shows 2¹, the same rounding the accompanying "genau doppelt so viele"
 * already makes.
 */
function explainFactor(factor: number): FazitText {
  // All three cases open with the same clause, so the big number always means the same
  // thing no matter which shape produced it.
  const opening = "So viel mehr Kästchen brauchst du bei jeder Halbierung";
  if (factor <= 2.05) {
    return {
      factor: "×2",
      exponent: "1",
      sentence: `${opening} — genau doppelt so viele, wie bei einer reinen Linie. Die Hochzahl ist ihre Dimension: 1.`,
    };
  }
  if (factor >= 3.95) {
    return {
      factor: "×4",
      exponent: "2",
      sentence: `${opening} — genau viermal so viele, wie bei einer vollen Fläche. Die Hochzahl ist ihre Dimension: 2.`,
    };
  }
  // The exponent comes from the raw factor, the headline shows the factor rounded to one
  // decimal — so 2^1,19 = 2,28 appears next to "×2,3". That is rounding, not an error.
  const dimension = formatDimension(Math.log2(factor));
  return {
    factor: `×${formatFactor(factor)}`,
    exponent: dimension,
    sentence: `${opening} — mehr als bei einer Linie (×2), weniger als bei einer vollen Fläche (×4). Die Hochzahl ist die Dimension: hier ${dimension}, also keine ganze Zahl. Genau das ist ein Fraktal.`,
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
          <p className={fazitNumber}>
            {text.factor} = 2<sup className={fazitExponent}>{text.exponent}</sup>
          </p>
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
        // 28 · 20 · 14 · 10 · 7 across the five steps. The floor stays at 7 so the last two
        // rows differ: flooring at 10 made them identical, which is simply wrong — those
        // boxes really are half the size.
        const sizePx = Math.max(7, Math.round(28 / Math.sqrt(perEdge / 4)));
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
