import React, { useState } from "react";
import { css } from "../../../styled-system/css";
import { BoxCanvas } from "./BoxCanvas";
import { Messreihe, type HalvingSample } from "./Messreihe";
import { countLineCells, countFilledCells, type Point } from "./boxCounting";
import { DEMO_SHAPES, WORLD_SIZE, type ShapeDefinition } from "./shapes";

const CELL_SIZE_STEPS = [25, 12.5, 6.25, 3.125, 1.5625];
const MIN_DRAW_POINT_DISTANCE = 1.5; // world units — throttles pointermove sampling

type ShapeId = ShapeDefinition["id"] | "draw";

const wrapper = css({ my: "6", p: "4", border: "1px solid token(colors.border, #e5e7eb)", borderRadius: "md" });

const shapeRow = css({ display: "flex", flexWrap: "wrap", gap: "2", mb: "3" });

function shapeButtonStyle(active: boolean) {
  return css({
    padding: "6px 12px",
    borderRadius: "sm",
    border: "1px solid token(colors.border, #e5e7eb)",
    backgroundColor: active ? "explore" : "white",
    color: active ? "white" : "gray.700",
    fontSize: "sm",
    fontWeight: active ? "bold" : "normal",
    cursor: "pointer",
  });
}

function actionButtonStyle(disabled: boolean) {
  return css({
    padding: "8px 16px",
    borderRadius: "sm",
    border: "none",
    backgroundColor: disabled ? "gray.300" : "explore",
    color: "white",
    fontSize: "sm",
    fontWeight: "bold",
    cursor: disabled ? "not-allowed" : "pointer",
  });
}

const controlsRow = css({ display: "flex", gap: "2", alignItems: "center", flexWrap: "wrap", mt: "3" });

const bigNumber = css({ fontSize: "2xl", fontWeight: "bold", color: "explore", mt: "3" });

const hint = css({ fontSize: "sm", color: "gray.600", fontStyle: "italic", mt: "2" });

export interface KaestchenSpielProps {
  /** "shapes" (default): Linie/Kreis/Quadrat, kein Mal-Button. "draw": nur der Mal-Canvas. */
  variant?: "shapes" | "draw";
}

export function KaestchenSpiel({ variant = "shapes" }: KaestchenSpielProps) {
  const [shapeId, setShapeId] = useState<ShapeId>(variant === "draw" ? "draw" : "line");
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [samples, setSamples] = useState<HalvingSample[]>([]);
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);

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
    resetProgress();
  }

  function handlePointerDraw(p: Point) {
    setDrawnPoints((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = Math.hypot(p.x - last.x, p.y - last.y);
        if (dist < MIN_DRAW_POINT_DISTANCE) return prev;
      }
      return [...prev, p];
    });
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

  return (
    <div className={wrapper}>
      {variant === "shapes" && (
        <div className={shapeRow}>
          {DEMO_SHAPES.map((s) => (
            <button key={s.id} className={shapeButtonStyle(shapeId === s.id)} onClick={() => handleSelectShape(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      <BoxCanvas
        mode={mode}
        points={points}
        worldSize={WORLD_SIZE}
        cellSize={cellSize}
        closed={closed}
        highlightHits={revealed}
        drawEnabled={shapeId === "draw"}
        onPointerDraw={handlePointerDraw}
      />

      {shapeId === "draw" && (
        <div className={controlsRow}>
          <button className={actionButtonStyle(false)} onClick={handleClearDrawing}>
            🗑️ Löschen
          </button>
          {points.length < 2 && <span className={hint}>Mal mit dem Finger eine Linie auf das Feld.</span>}
        </div>
      )}

      {canCount && (
        <>
          {stepIndex === 0 && !revealed && (
            <p className={hint}>Schätz zuerst: Wie viele Kästchen berührt die Form wohl?</p>
          )}

          <div className={controlsRow}>
            {!revealed && (
              <button className={actionButtonStyle(false)} onClick={handleReveal}>
                Jetzt zählen
              </button>
            )}
            {revealed && !isLastStep && (
              <button className={actionButtonStyle(false)} onClick={handleHalve}>
                Kästchen halbieren
              </button>
            )}
            {revealed && isLastStep && <span className={hint}>Kleinste Kästchengröße erreicht.</span>}
          </div>

          {revealed && <p className={bigNumber}>{currentCount} Kästchen</p>}

          <Messreihe samples={samples} worldSize={WORLD_SIZE} />
        </>
      )}
    </div>
  );
}

export default KaestchenSpiel;
