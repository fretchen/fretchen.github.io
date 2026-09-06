import React, { useMemo, useState } from "react";
import { css } from "../../styled-system/css";

// ============================================================
// One season of the two-island fishery, as a function of the squeezing parameter gamma.
// ------------------------------------------------------------
// The Li-Du-Massar clearing rule is equivalent to each island maximising its own profit plus a
// share lambda = tanh(gamma) of its neighbour's. For the fishery of common_pool.ipynb
// (catchability q = 0.01, cost c = 0.125, stock s = 100, so q*s/c = 8 -- the post writes these
// as q and c, the notebooks as y0 and c0) the symmetric equilibrium total fleet has a closed
// form:
//
//     B(lambda) = (y0*s/c0)^2 * ((3 - lambda)/4)^2 = 64 * ((3 - lambda)/4)^2
//     rent      = sqrt(B) - c0*B                      (total, at y0*s = 1)
//
// So no simulation is needed here -- it is two lines of arithmetic. Deliberately ONE season
// with the stock held fixed: that is the clean interpolation LDM actually proves, and the
// dynamics belong in the prose that follows, not in a slider.
// ============================================================

const GAMMA_MAX = 2.5;
const STEP = 0.05;

const ISLAND_1 = "#2563eb";
const ISLAND_2 = "#7c3aed";

function fishery(gamma: number) {
  const lambda = Math.tanh(gamma);
  const boats = 64 * Math.pow((3 - lambda) / 4, 2);
  const rent = Math.sqrt(boats) - 0.125 * boats;
  return { lambda, boats, incomeEach: rent / 2 };
}

const NASH = fishery(0);
const BEST = fishery(50); // gamma -> infinity

export default function FisheryDial() {
  const [gamma, setGamma] = useState(0);
  const { lambda, boats, incomeEach } = useMemo(() => fishery(gamma), [gamma]);

  // fleet bar, scaled so the tragedy fills the track
  const fleetPct = (boats / NASH.boats) * 100;
  const incomePct = ((incomeEach - NASH.incomeEach) / (BEST.incomeEach - NASH.incomeEach)) * 100;

  const verdict =
    gamma < 0.1
      ? "No coupling. Each island ignores what its boats cost the other — the tragedy."
      : lambda > 0.95
        ? "Almost full coupling. The two islands behave exactly as the planner would have told them to."
        : `Each island is paid on ${Math.round(lambda * 100)}% of its neighbour's catch, so it feels most of the crowding it causes.`;

  return (
    <figure
      className={css({
        margin: "32px 0",
        padding: "6",
        backgroundColor: "rgba(123, 63, 160, 0.04)",
        borderRadius: "lg",
        border: "1px solid rgba(123, 63, 160, 0.15)",
      })}
    >
      <p className={css({ fontSize: "md", fontWeight: "bold", marginBottom: "1.5", color: "gray.700" })}>
        One season, as you turn up the squeezing
      </p>
      <p className={css({ fontSize: "sm", color: "gray.500", marginBottom: "5" })}>
        Two islands, one fishing ground, both purely selfish. Drag &gamma; and watch the fleet shrink while the money
        goes <em>up</em>.
      </p>

      {/* the dial */}
      <div className={css({ display: "flex", alignItems: "center", gap: "3", marginBottom: "2" })}>
        <span className={css({ fontSize: "xs", color: "gray.500", whiteSpace: "nowrap" })}>&gamma; = 0</span>
        <input
          type="range"
          min={0}
          max={GAMMA_MAX}
          step={STEP}
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
          aria-label="Squeezing parameter gamma"
          className={css({ flex: 1, accentColor: "purple.500", height: "6px" })}
        />
        <span className={css({ fontSize: "xs", color: "gray.500", whiteSpace: "nowrap" })}>&gamma; = {GAMMA_MAX}</span>
      </div>
      <div className={css({ textAlign: "center", fontSize: "sm", color: "gray.700", marginBottom: "5" })}>
        <strong>&gamma; = {gamma.toFixed(2)}</strong>
        <span className={css({ color: "gray.500" })}>
          {" "}
          &rarr; each island is paid on <strong>{Math.round(lambda * 100)}%</strong> of the other&rsquo;s catch
        </span>
      </div>

      {/* readouts */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "4",
          marginBottom: "4",
        })}
      >
        <div>
          <div className={css({ fontSize: "xs", color: "gray.500", marginBottom: "1" })}>Boats on the water</div>
          <div className={css({ fontSize: "2xl", fontWeight: "bold", color: "gray.700" })}>{boats.toFixed(1)}</div>
          <div className={css({ height: "8px", backgroundColor: "gray.200", borderRadius: "sm", marginTop: "2" })}>
            <div
              className={css({ height: "8px", borderRadius: "sm", transition: "width {durations.normal} ease" })}
              style={{ width: `${fleetPct}%`, backgroundColor: ISLAND_1 }}
            />
          </div>
        </div>
        <div>
          <div className={css({ fontSize: "xs", color: "gray.500", marginBottom: "1" })}>Income per island</div>
          <div className={css({ fontSize: "2xl", fontWeight: "bold", color: "gray.700" })}>{incomeEach.toFixed(2)}</div>
          <div className={css({ height: "8px", backgroundColor: "gray.200", borderRadius: "sm", marginTop: "2" })}>
            <div
              className={css({ height: "8px", borderRadius: "sm", transition: "width {durations.normal} ease" })}
              style={{ width: `${Math.max(0, incomePct)}%`, backgroundColor: ISLAND_2 }}
            />
          </div>
        </div>
      </div>

      <p aria-live="polite" className={css({ fontSize: "sm", color: "gray.700", textAlign: "center" })}>
        {verdict}
      </p>

      <figcaption className={css({ fontSize: "xs", color: "gray.500", textAlign: "center", marginTop: "4" })}>
        At &gamma; = 0 the islands send {NASH.boats.toFixed(0)} boats and earn {NASH.incomeEach.toFixed(2)} each. As
        &gamma; grows they settle at {BEST.boats.toFixed(0)} boats for {BEST.incomeEach.toFixed(2)} each &mdash; fewer
        boats, more money, and nobody agreed to anything.
      </figcaption>
    </figure>
  );
}
