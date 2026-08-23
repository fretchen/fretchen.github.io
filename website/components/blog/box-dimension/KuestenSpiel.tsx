import React, { useState } from "react";
import { css } from "../../../styled-system/css";
import { BoxCanvas } from "./BoxCanvas";
import { Messreihe, type HalvingSample } from "./Messreihe";
import { countLineCells, type Point } from "./boxCounting";
import { COAST_REGIONS } from "./coasts";

const CELL_SIZE_STEPS = [25, 12.5, 6.25, 3.125, 1.5625];

type RegionId = keyof typeof COAST_REGIONS;
const REGION_IDS = Object.keys(COAST_REGIONS) as RegionId[];
const REGION_LABELS: Record<RegionId, string> = {
  bretagne: "Bretagne",
  normandie: "Normandie",
};

const wrapper = css({ my: "6", p: "4", border: "1px solid token(colors.border, #e5e7eb)", borderRadius: "md" });
const regionRow = css({ display: "flex", flexWrap: "wrap", gap: "2", mb: "3" });

function regionButtonStyle(active: boolean) {
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

export function KuestenSpiel() {
  const [regionId, setRegionId] = useState<RegionId>(REGION_IDS[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [samples, setSamples] = useState<HalvingSample[]>([]);

  const region = COAST_REGIONS[regionId];
  const points: Point[] = region.points.map(([x, y]) => ({ x, y }));
  const cellSize = CELL_SIZE_STEPS[stepIndex];

  function resetProgress() {
    setStepIndex(0);
    setRevealed(false);
    setSamples([]);
  }

  function handleSelectRegion(id: RegionId) {
    setRegionId(id);
    resetProgress();
  }

  const currentCount = countLineCells(points, cellSize, false).count;

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
      <div className={regionRow}>
        {REGION_IDS.map((id) => (
          <button key={id} className={regionButtonStyle(regionId === id)} onClick={() => handleSelectRegion(id)}>
            {REGION_LABELS[id]}
          </button>
        ))}
      </div>

      <BoxCanvas
        mode="line"
        points={points}
        worldSize={region.worldSize}
        cellSize={cellSize}
        closed={false}
        highlightHits={revealed}
      />

      {stepIndex === 0 && !revealed && (
        <p className={hint}>Schätz zuerst: Wie viele Kästchen berührt die Küste wohl?</p>
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

      <Messreihe samples={samples} worldSize={region.worldSize} />
    </div>
  );
}

export default KuestenSpiel;
