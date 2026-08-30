import React, { useMemo, useState } from "react";
import { css } from "../../../styled-system/css";
import { button } from "../../../styled-system/recipes";
import { BoxCanvas } from "./BoxCanvas";
import { Messreihe, averageFactor, type HalvingSample } from "./Messreihe";
import { countLineCells, type Point } from "./boxCounting";
import { COAST_REGIONS } from "./coasts";
import { countSentence, formatFactor } from "./texts";
import { touchTarget, guidanceLine, guidanceCount } from "./styles";

const CELL_SIZE_STEPS = [25, 12.5, 6.25, 3.125, 1.5625];

type RegionId = keyof typeof COAST_REGIONS;
const REGION_IDS = Object.keys(COAST_REGIONS) as RegionId[];
const REGION_LABELS: Record<RegionId, string> = {
  bretagne: "Bretagne",
  normandie: "Normandie",
};

// See KaestchenSpiel.tsx for why the widget chrome opts out of the reading serif.
const wrapper = css({
  my: "6",
  p: "4",
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "md",
  fontFamily: "ui",
});
const regionRow = css({ display: "flex", flexWrap: "wrap", gap: "2", mb: "3" });

// size "sm" for toggles, see KaestchenSpiel.tsx — "md" wraps them onto separate rows at 390px.
const toggleClass = (active: boolean) => `${button({ visual: "secondary", size: "sm", active })} ${touchTarget}`;
const actionClass = `${button({ visual: "primary", size: "md" })} ${touchTarget}`;
const restartClass = `${button({ visual: "secondary", size: "md" })} ${touchTarget}`;

const controlsRow = css({ display: "flex", gap: "2", alignItems: "center", flexWrap: "wrap", mt: "2" });

function seriesFor(regionId: RegionId): HalvingSample[] {
  const region = COAST_REGIONS[regionId];
  const points: Point[] = region.points.map(([x, y]) => ({ x, y }));
  return CELL_SIZE_STEPS.map((cellSize) => ({
    cellSize,
    count: countLineCells(points, cellSize, false).count,
  }));
}

export function KuestenSpiel() {
  const [regionId, setRegionId] = useState<RegionId>(REGION_IDS[0]);
  // Widget 1 already taught the halving trick — clicking "Kästchen halbieren"
  // still drives the progression here (that stays a deliberate action), but
  // there's no separate "Jetzt zählen" step anymore: the count for whichever
  // step you're on shows immediately, no extra click to reveal it. The guidance
  // line naming that count is what shows the changed rule, rather than a caption
  // announcing it.
  const [stepIndex, setStepIndex] = useState(0);
  // Which coastlines the reader has actually looked at. Only once both have been
  // visited does the comparison below appear — before that it would spoil the answer.
  const [visited, setVisited] = useState<RegionId[]>([REGION_IDS[0]]);

  // Switching region deliberately does NOT reset stepIndex: the post asks the reader to
  // switch and watch the ×-numbers change, which only works if both coasts are measured
  // on the same grid. Resetting to step 0 forced four re-clicks before anything could be
  // compared, and wiped the series they were meant to compare against.
  function handleSelectRegion(id: RegionId) {
    setRegionId(id);
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
  const bothMeasured = isLastStep && visited.length === REGION_IDS.length;

  /** One more Fazit sentence once both coasts have been measured, in the same style. */
  const comparison = useMemo(() => {
    if (!bothMeasured) return null;
    const measured = REGION_IDS.map((id) => ({ id, factor: averageFactor(seriesFor(id)) })).filter(
      (m): m is { id: RegionId; factor: number } => m.factor !== null,
    );
    if (measured.length < REGION_IDS.length) return null;
    const [rougher, smoother] = [...measured].sort((a, b) => b.factor - a.factor);
    return `Die ${REGION_LABELS[rougher.id]} (×${formatFactor(rougher.factor)}) ist zerklüfteter als die ${
      REGION_LABELS[smoother.id]
    } (×${formatFactor(smoother.factor)}).`;
  }, [bothMeasured]);

  // Goes quiet at the last step, where the Fazit takes over as the thing to read.
  const guidance = useMemo(() => {
    if (isLastStep) return null;
    const last = samples[samples.length - 1];
    const prev = samples.length > 1 ? samples[samples.length - 2].count : null;
    return countSentence(last.count, prev, "die Küste");
  }, [isLastStep, samples]);

  return (
    <div className={wrapper}>
      <div className={regionRow}>
        {REGION_IDS.map((id) => (
          <button key={id} className={toggleClass(regionId === id)} onClick={() => handleSelectRegion(id)}>
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
        label={`Küste der ${REGION_LABELS[regionId]} auf einem Gitter aus Kästchen, die berührten Kästchen sind hervorgehoben`}
      />

      {/* aria-live: the count changes on every click and is otherwise announced nowhere —
          without it the whole measuring loop is silent to a screen reader. */}
      {guidance && (
        <p className={guidanceLine} aria-live="polite">
          {guidance.before}
          <span className={guidanceCount}>{guidance.count}</span>
          {guidance.after}
        </p>
      )}

      {/* Distinct keys so React swaps the node instead of re-styling it in place — otherwise
          the recipe's `transition: all` crossfades the blue action button into the grey
          restart button while the label has already changed. */}
      <div className={controlsRow}>
        {isLastStep ? (
          <button key="restart" className={restartClass} onClick={() => setStepIndex(0)}>
            Nochmal von vorn
          </button>
        ) : (
          <button key="halve" className={actionClass} onClick={() => setStepIndex((i) => i + 1)}>
            Kästchen halbieren
          </button>
        )}
      </div>

      <Messreihe
        samples={samples}
        worldSize={region.worldSize}
        totalSteps={CELL_SIZE_STEPS.length}
        fazitExtra={comparison}
      />
    </div>
  );
}

export default KuestenSpiel;
