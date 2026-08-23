import React, { useMemo, useState } from "react";
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
const hint = css({ fontSize: "sm", color: "gray.600", fontStyle: "italic", mt: "2" });

export function KuestenSpiel() {
  const [regionId, setRegionId] = useState<RegionId>(REGION_IDS[0]);
  // Widget 1 already taught the halving trick — clicking "Kästchen halbieren"
  // still drives the progression here (that stays a deliberate action), but
  // there's no separate "Jetzt zählen" step anymore: the count for whichever
  // step you're on shows immediately, no extra click to reveal it.
  const [stepIndex, setStepIndex] = useState(0);

  // Reset progress when the region changes — adjusting state during render
  // (rather than in an effect) avoids an extra cascading render, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const [prevRegionId, setPrevRegionId] = useState(regionId);
  if (regionId !== prevRegionId) {
    setPrevRegionId(regionId);
    setStepIndex(0);
  }

  const region = COAST_REGIONS[regionId];
  const points: Point[] = region.points.map(([x, y]) => ({ x, y }));
  const landRings: Point[][] = region.landRings.map((ring) => ring.map(([x, y]) => ({ x, y })));

  const samples: HalvingSample[] = useMemo(
    () =>
      CELL_SIZE_STEPS.slice(0, stepIndex + 1).map((cellSize) => ({
        cellSize,
        count: countLineCells(points, cellSize, false).count,
      })),
    [points, stepIndex],
  );

  const isLastStep = stepIndex === CELL_SIZE_STEPS.length - 1;

  return (
    <div className={wrapper}>
      <div className={regionRow}>
        {REGION_IDS.map((id) => (
          <button key={id} className={regionButtonStyle(regionId === id)} onClick={() => setRegionId(id)}>
            {REGION_LABELS[id]}
          </button>
        ))}
      </div>

      <BoxCanvas
        mode="line"
        points={points}
        worldSize={region.worldSize}
        cellSize={CELL_SIZE_STEPS[stepIndex]}
        closed={false}
        highlightHits
        landRings={landRings}
      />

      <div className={controlsRow}>
        {!isLastStep && (
          <button className={actionButtonStyle(false)} onClick={() => setStepIndex((i) => i + 1)}>
            Kästchen halbieren
          </button>
        )}
        {isLastStep && <span className={hint}>Kleinste Kästchengröße erreicht.</span>}
      </div>

      <Messreihe samples={samples} worldSize={region.worldSize} totalSteps={CELL_SIZE_STEPS.length} />
    </div>
  );
}

export default KuestenSpiel;
