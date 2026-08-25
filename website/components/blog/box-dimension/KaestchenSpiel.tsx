import React, { useState } from "react";
import { css } from "../../../styled-system/css";
import { button } from "../../../styled-system/recipes";
import { BoxCanvas } from "./BoxCanvas";
import { Messreihe, type HalvingSample } from "./Messreihe";
import { countLineCells, countFilledCells, type Point } from "./boxCounting";
import { DEMO_SHAPES, WORLD_SIZE, type ShapeDefinition } from "./shapes";
import { countSentence } from "./texts";
import { touchTarget, guidanceLine, guidanceCount } from "./styles";

const CELL_SIZE_STEPS = [25, 12.5, 6.25, 3.125, 1.5625];
const MIN_DRAW_POINT_DISTANCE = 1.5; // world units — throttles pointermove sampling

type ShapeId = ShapeDefinition["id"] | "draw";

// `fontFamily: "ui"` opts the widget out of the article's reading serif: buttons, column
// headers and numeric readouts are operated, not read (IDENTITY.md → "serif reads, sans
// operates"). Two things opt back in — the guidance line and the Fazit — because those are
// sentences the child reads, in the post's voice.
const wrapper = css({
  my: "6",
  p: "4",
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "md",
  fontFamily: "ui",
});

const shapeRow = css({ display: "flex", flexWrap: "wrap", gap: "2", mb: "3" });

// Toggles use size "sm", actions size "md". Not cosmetic: the article column is only 294px
// wide on a phone, and size "md" carries 80px of horizontal padding — three "md" toggles
// wrap onto three stacked rows and push the canvas off the screen. `touchTarget` keeps them
// 44px tall regardless, so the finger target does not shrink with the label.
const toggleClass = (active: boolean) => `${button({ visual: "secondary", size: "sm", active })} ${touchTarget}`;
const actionClass = `${button({ visual: "primary", size: "md" })} ${touchTarget}`;
const restartClass = `${button({ visual: "secondary", size: "md" })} ${touchTarget}`;
const clearClass = `${button({ visual: "ghost", size: "sm" })} ${touchTarget}`;

const controlsRow = css({ display: "flex", gap: "2", alignItems: "center", flexWrap: "wrap", mt: "2" });

export interface KaestchenSpielProps {
  /** "shapes" (default): Linie/Kreis/Quadrat, kein Mal-Button. "draw": nur der Mal-Canvas. */
  variant?: "shapes" | "draw";
}

export function KaestchenSpiel({ variant = "shapes" }: KaestchenSpielProps) {
  const isDraw = variant === "draw";
  const [shapeId, setShapeId] = useState<ShapeId>(isDraw ? "draw" : "line");
  // stepIndex/revealed/samples drive the manual guess-then-reveal flow for
  // variant="shapes" only — that pacing is the point there (see Runde 1).
  // variant="draw" ignores them and measures all steps eagerly below, since by
  // this point in the post the reader already knows the trick from widget 1.
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [samples, setSamples] = useState<HalvingSample[]>([]);
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  // variant="draw" step counter: still a manual "Kästchen halbieren" click,
  // like variant="shapes" — only the separate "Jetzt zählen" step is gone,
  // since the count for whichever step you're on just shows immediately.
  const [animStep, setAnimStep] = useState(0);

  const activeShape = shapeId === "draw" ? null : DEMO_SHAPES.find((s) => s.id === shapeId)!;
  const points = shapeId === "draw" ? drawnPoints : activeShape!.points;
  const mode = shapeId === "draw" ? "line" : activeShape!.mode;
  const closed = shapeId === "draw" ? false : activeShape!.closed;
  const cellSize = CELL_SIZE_STEPS[stepIndex];

  function resetProgress() {
    setStepIndex(0);
    setRevealed(false);
    setSamples([]);
  }

  function handleSelectShape(id: ShapeId) {
    setShapeId(id);
    resetProgress();
  }

  function handleClearDrawing() {
    setDrawnPoints([]);
    setAnimStep(0);
  }

  function handlePointerDraw(p: Point) {
    // Only rewind to the coarsest grid when a genuinely new drawing starts. Resetting on
    // every sampled point made the Messreihe collapse to a single row and re-render on
    // every finger movement.
    if (drawnPoints.length === 0) setAnimStep(0);
    setDrawnPoints((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = Math.hypot(p.x - last.x, p.y - last.y);
        if (dist < MIN_DRAW_POINT_DISTANCE) return prev;
      }
      return [...prev, p];
    });
  }

  function handleHalveDraw() {
    setAnimStep((i) => Math.min(i + 1, CELL_SIZE_STEPS.length - 1));
  }

  const canCount = points.length >= 2;
  const currentCount = canCount
    ? (mode === "filled" ? countFilledCells(points, cellSize) : countLineCells(points, cellSize, closed)).count
    : 0;

  function handleReveal() {
    setRevealed(true);
    setSamples((prev) =>
      prev.some((s) => s.cellSize === cellSize) ? prev : [...prev, { cellSize, count: currentCount }],
    );
  }

  function handleHalve() {
    setStepIndex((i) => Math.min(i + 1, CELL_SIZE_STEPS.length - 1));
    setRevealed(false);
  }

  const isLastStep = stepIndex === CELL_SIZE_STEPS.length - 1;
  const isLastAnimStep = animStep === CELL_SIZE_STEPS.length - 1;

  // Plain computation, no useMemo: the React Compiler memoizes this itself, and a manual
  // useMemo here trips `react-hooks/preserve-manual-memoization` — it cannot prove the
  // derived `points`/`mode`/`closed` stay unmutated, so it would skip optimising the whole
  // component. Counting five grid resolutions is cheap; BoxCanvas redraws on every render anyway.
  const autoSamples: HalvingSample[] =
    isDraw && canCount
      ? CELL_SIZE_STEPS.slice(0, animStep + 1).map((cs) => ({
          cellSize: cs,
          count: (mode === "filled" ? countFilledCells(points, cs) : countLineCells(points, cs, closed)).count,
        }))
      : [];

  const displayCellSize = isDraw ? CELL_SIZE_STEPS[animStep] : cellSize;
  const displayHighlight = isDraw ? canCount : revealed;

  /**
   * One slot, always exactly one sentence: the question to guess, or the count just made.
   * It goes quiet at the end, where the Fazit takes over as the thing to read — two prose
   * blocks at once would be one too many.
   */
  function renderGuidance(): React.ReactNode {
    if (isDraw) {
      if (!canCount) return "Mal mit dem Finger eine Linie auf das Feld.";
      if (isLastAnimStep) return null;
      const rows = autoSamples;
      const last = rows[rows.length - 1];
      const prev = rows.length > 1 ? rows[rows.length - 2].count : null;
      const s = countSentence(last.count, prev, "deine Linie");
      return (
        <>
          {s.before}
          <span className={guidanceCount}>{s.count}</span>
          {s.after}
        </>
      );
    }

    if (!revealed) {
      return stepIndex === 0
        ? "Schätz zuerst: Wie viele Kästchen berührt die Form?"
        : "Schätz wieder: Doppelt so viele? Oder viermal so viele?";
    }
    if (isLastStep) return null;
    const prev = samples.length > 1 ? samples[samples.length - 2].count : null;
    const s = countSentence(currentCount, prev, "die Form");
    return (
      <>
        {s.before}
        <span className={guidanceCount}>{s.count}</span>
        {s.after}
      </>
    );
  }

  const guidance = renderGuidance();

  return (
    <div className={wrapper}>
      {variant === "shapes" && (
        <div className={shapeRow}>
          {DEMO_SHAPES.map((s) => (
            <button key={s.id} className={toggleClass(shapeId === s.id)} onClick={() => handleSelectShape(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      <BoxCanvas
        mode={mode}
        points={points}
        worldSize={WORLD_SIZE}
        cellSize={displayCellSize}
        closed={closed}
        highlightHits={displayHighlight}
        drawEnabled={shapeId === "draw"}
        onPointerDraw={handlePointerDraw}
        label={
          isDraw
            ? "Leeres Feld mit einem Gitter aus Kästchen, auf das du mit dem Finger malen kannst"
            : `${activeShape!.label} auf einem Gitter aus Kästchen, die berührten Kästchen sind hervorgehoben`
        }
      />

      {/* aria-live: the count changes on every click and is otherwise announced nowhere —
          without it the whole measuring loop is silent to a screen reader. */}
      {guidance && (
        <p className={guidanceLine} aria-live="polite">
          {guidance}
        </p>
      )}

      {/* One filled button, always in the same place — its label says what happens next.
          "Nochmal von vorn" lands in the slot the child has been hitting all along, instead
          of appearing beside a grey "you are done" sentence where it went unnoticed.

          The keys matter: without them React re-styles one node in place, and the recipe's
          `transition: all` crossfades the blue action button into the grey restart button
          while the label has already swapped. */}
      {isDraw
        ? canCount && (
            <div className={controlsRow}>
              {isLastAnimStep ? (
                <button key="restart" className={restartClass} onClick={() => setAnimStep(0)}>
                  Nochmal von vorn
                </button>
              ) : (
                <button key="halve" className={actionClass} onClick={handleHalveDraw}>
                  Kästchen halbieren
                </button>
              )}
              <button className={clearClass} onClick={handleClearDrawing}>
                🗑️ Löschen
              </button>
            </div>
          )
        : canCount && (
            <div className={controlsRow}>
              {!revealed && (
                <button key="count" className={actionClass} onClick={handleReveal}>
                  Jetzt zählen
                </button>
              )}
              {revealed && !isLastStep && (
                <button key="halve" className={actionClass} onClick={handleHalve}>
                  Kästchen halbieren
                </button>
              )}
              {revealed && isLastStep && (
                <button key="restart" className={restartClass} onClick={resetProgress}>
                  Nochmal von vorn
                </button>
              )}
            </div>
          )}

      <Messreihe samples={isDraw ? autoSamples : samples} worldSize={WORLD_SIZE} totalSteps={CELL_SIZE_STEPS.length} />
    </div>
  );
}

export default KaestchenSpiel;
