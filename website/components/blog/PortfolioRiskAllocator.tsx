import React, { useState, useMemo, useRef, useEffect } from "react";
import { css } from "../../styled-system/css";
import { DATA } from "./etfData";

const N_ETF = DATA.etf_names.length;

/** Matrix-vector product: Σw */
function matVec(cov: number[][], w: number[]): number[] {
  const n = w.length;
  const result = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[i] += cov[i][j] * w[j];
    }
  }
  return result;
}

/** Solve risk-budget allocation via Roncalli (2013) multiplicative update.
 *  Per-asset ERC within each cluster: b_i = B_c / n_c (matching Python NB07). */
function solveRiskBudget(cov: number[][], clusterOf: number[], budgets: number[]): number[] {
  const n = cov.length;
  const nC = budgets.length;
  const active = new Array(n).fill(true);
  for (let i = 0; i < n; i++) if (budgets[clusterOf[i]] < 1e-10) active[i] = false;
  const activeCount = active.filter(Boolean).length;
  if (activeCount === 0) return new Array(n).fill(1 / n);

  // Per-asset risk budgets: b_i = B_c / clusterSize_c
  const clusterSize = new Array(nC).fill(0);
  for (let i = 0; i < n; i++) if (active[i]) clusterSize[clusterOf[i]]++;
  const targetRc = new Array(n).fill(0);
  for (let i = 0; i < n; i++) if (active[i]) targetRc[i] = budgets[clusterOf[i]] / clusterSize[clusterOf[i]];

  // Initialize: w_i ∝ b_i / σ_i (inverse-vol scaled by budget)
  let w = new Array(n).fill(0);
  for (let i = 0; i < n; i++) if (active[i]) w[i] = targetRc[i] / Math.sqrt(cov[i][i]);
  const wInit = w.reduce((a, b) => a + b, 0);
  if (wInit > 0) w = w.map((wi) => wi / wInit);

  for (let iter = 0; iter < 5000; iter++) {
    const sw = matVec(cov, w);
    const rc = w.map((wi, i) => wi * sw[i]);
    const totalRc = rc.reduce((a, b) => a + b, 0);
    if (totalRc < 1e-15) break;

    // Convergence: per-asset risk contribution vs target
    let maxErr = 0;
    for (let i = 0; i < n; i++)
      if (active[i]) maxErr = Math.max(maxErr, Math.abs(rc[i] / totalRc - targetRc[i]));
    if (maxErr < 1e-8) break;

    // Multiplicative update per asset
    for (let i = 0; i < n; i++) {
      if (!active[i]) continue;
      const rcFrac = rc[i] / totalRc;
      if (rcFrac < 1e-15) continue;
      w[i] *= Math.pow(targetRc[i] / rcFrac, 0.5);
    }
    const wSum = w.reduce((a, b) => a + b, 0);
    if (wSum > 0) w = w.map((wi) => wi / wSum);
  }
  return w;
}

/** Solve long-only minimum variance: min w'Σw s.t. Σw=1, w≥0. */
function solveMinVariance(cov: number[][]): number[] {
  const n = cov.length;
  let w = new Array(n).fill(1 / n);
  for (let iter = 0; iter < 5000; iter++) {
    const grad = matVec(cov, w).map((g) => 2 * g);
    const raw = w.map((wi, i) => wi - 0.5 * grad[i]);
    const sorted = [...raw].sort((a, b) => b - a);
    let cumSum = 0;
    let rho = 0;
    for (let j = 0; j < n; j++) {
      cumSum += sorted[j];
      if (sorted[j] - (cumSum - 1) / (j + 1) > 0) rho = j;
    }
    const theta = (sorted.slice(0, rho + 1).reduce((a, b) => a + b, 0) - 1) / (rho + 1);
    w = raw.map((r) => Math.max(0, r - theta));
  }
  return w;
}

const N_CLUSTERS = DATA.clusters.length;

/** Compute portfolio risk metrics from fractional weights */
function computeRisk(w: number[]) {
  const sigmaW = matVec(DATA.cov_etf_ann, w);
  const portVar = w.reduce((s, wi, i) => s + wi * sigmaW[i], 0);
  const portVol = Math.sqrt(Math.max(0, portVar)) * 100; // annualized %

  // Risk contributions (% of total variance)
  const rc = w.map((wi, i) => (portVar > 0 ? ((wi * sigmaW[i]) / portVar) * 100 : 0));

  // Cluster-level aggregation
  const clusterWeight = new Array(N_CLUSTERS).fill(0);
  const clusterRc = new Array(N_CLUSTERS).fill(0);
  for (let i = 0; i < N_ETF; i++) {
    const ci = DATA.etf_cluster[i];
    clusterWeight[ci] += w[i] * 100;
    clusterRc[ci] += rc[i];
  }

  return { w, portVol, rc, clusterWeight, clusterRc };
}

// Precompute minimum-variance risk budgets for preset
const _mvW = solveMinVariance(DATA.cov_etf_ann);
const _mvRisk0 = computeRisk(_mvW);
const MIN_VOL = _mvRisk0.portVol;
const MAX_VOL = Math.max(...DATA.vol_cluster_ann) * 100;

/** Interpolate color from calm blue to warm red based on position in [MIN_VOL, MAX_VOL]. */
function bumpinessColor(vol: number): string {
  const t = Math.max(0, Math.min(1, (vol - MIN_VOL) / (MAX_VOL - MIN_VOL)));
  // #4e79a7 (blue) → #e15759 (red)
  const r = Math.round(78 + t * (225 - 78));
  const g = Math.round(121 + t * (87 - 121));
  const b = Math.round(167 + t * (89 - 167));
  return `rgb(${r},${g},${b})`;
}
const _mvRisk = _mvRisk0.clusterRc.map((v) => Math.round(v));
_mvRisk[_mvRisk.indexOf(Math.max(..._mvRisk))] += 100 - _mvRisk.reduce((a, b) => a + b, 0);

const PRESETS: { label: string; description: string; budgets: number[] }[] = [
  {
    label: "Just two",
    description: "Only bonds and US stocks contribute risk",
    budgets: [50, 50, 0],
  },
  {
    label: "Equal risk",
    description: "Each group contributes equally — a balanced starting point",
    budgets: [33, 33, 34],
  },
  {
    label: "Minimum risk",
    description: "The lowest-risk portfolio — heavily bond-dominated",
    budgets: _mvRisk,
  },
  {
    label: "Growth",
    description: "Most risk from stocks, small bond cushion",
    budgets: [10, 45, 45],
  },
];

export default function PortfolioRiskAllocator() {
  const [budgets, setBudgets] = useState<number[]>([...PRESETS[1].budgets]);
  const [activePreset, setActivePreset] = useState(1);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const { weights, risk } = useMemo(() => {
    const w = solveRiskBudget(
      DATA.cov_etf_ann,
      DATA.etf_cluster,
      budgets.map((b) => b / 100),
    );
    return { weights: w, risk: computeRisk(w) };
  }, [budgets]);

  const applyPreset = (i: number) => {
    setBudgets([...PRESETS[i].budgets]);
    setActivePreset(i);
  };

  useEffect(() => {
    if (dragging === null) return;
    const onMove = (e: PointerEvent) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const pos = Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100);
      setBudgets((prev) => {
        const next = [...prev];
        if (dragging === 0) {
          const b2 = next[0] + next[1];
          next[0] = Math.max(0, Math.min(b2, pos));
          next[1] = b2 - next[0];
        } else {
          const clamped = Math.max(next[0], Math.min(100, pos));
          next[1] = clamped - next[0];
          next[2] = 100 - clamped;
        }
        return next;
      });
      setActivePreset(-1);
    };
    const onUp = () => setDragging(null);
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(78, 121, 167, 0.04)",
        borderRadius: "8px",
        border: "1px solid rgba(78, 121, 167, 0.15)",
      })}
    >
      {/* ── Header ── */}
      <h3
        className={css({
          fontSize: "1.1rem",
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: "0.25rem",
          marginTop: 0,
        })}
      >
        Build your portfolio by risk budget
      </h3>
      <p
        className={css({
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: "1.25rem",
          marginTop: 0,
        })}
      >
        Set how much risk each group should contribute — the math finds the capital allocation.
      </p>

      {/* ── Preset buttons ── */}
      <div className={css({ marginBottom: "1rem" })}>
        <div className={css({ display: "flex", gap: "0.5rem", flexWrap: "wrap" })}>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => applyPreset(i)}
              className={css({
                padding: "0.4rem 0.75rem",
                fontSize: "0.8rem",
                borderRadius: "6px",
                cursor: "pointer",
                border: "2px solid",
                fontWeight: "600",
                transition: "all 0.15s",
              })}
              style={{
                borderColor: activePreset === i ? "#7b3fa0" : "#d1d5db",
                backgroundColor: activePreset === i ? "rgba(123,63,160,0.08)" : "white",
                color: activePreset === i ? "#7b3fa0" : "#374151",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {activePreset >= 0 && (
          <p className={css({ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.3rem", fontStyle: "italic" })}>
            {PRESETS[activePreset].description}
          </p>
        )}
      </div>

      {/* ── Draggable risk-budget bar ── */}
      <div className={css({ marginBottom: "1.25rem" })}>
        <div className={css({ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.2rem" })}>
          Risk budget — drag the handles or pick a preset
        </div>
        <div
          ref={barRef}
          className={css({
            position: "relative",
            display: "flex",
            height: "32px",
            borderRadius: "6px",
            overflow: "visible",
            border: "1px solid #e5e7eb",
            userSelect: "none",
            touchAction: "none",
          })}
          style={{ cursor: dragging !== null ? "col-resize" : "default" }}
        >
          {DATA.clusters.map((cluster, ci) => (
            <div
              key={cluster.name}
              style={{
                width: `${budgets[ci]}%`,
                backgroundColor: cluster.color,
                transition: dragging !== null ? "none" : "width 0.2s",
              }}
              className={css({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: "bold",
                color: "white",
                overflow: "hidden",
                whiteSpace: "nowrap",
                borderRadius: ci === 0 ? "5px 0 0 5px" : ci === N_CLUSTERS - 1 ? "0 5px 5px 0" : "0",
              })}
            >
              {budgets[ci] >= 8 ? `${budgets[ci]}%` : ""}
            </div>
          ))}
          {[0, 1].map((hi) => {
            const leftPct = budgets.slice(0, hi + 1).reduce((a, b) => a + b, 0);
            if (leftPct <= 0 || leftPct >= 100) return null;
            return (
              <div
                key={hi}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setDragging(hi);
                }}
                className={css({
                  position: "absolute",
                  top: "-2px",
                  width: "16px",
                  height: "calc(100% + 4px)",
                  cursor: "col-resize",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                })}
                style={{ left: `calc(${leftPct}% - 8px)` }}
              >
                <div
                  className={css({
                    width: "4px",
                    height: "60%",
                    backgroundColor: "white",
                    borderRadius: "2px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                  })}
                />
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className={css({ display: "flex", gap: "0.75rem", marginTop: "0.3rem", flexWrap: "wrap" })}>
          {DATA.clusters.map((cluster) => (
            <div key={cluster.name} className={css({ display: "flex", alignItems: "center", gap: "0.25rem" })}>
              <span
                className={css({ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 })}
                style={{ backgroundColor: cluster.color }}
              />
              <span className={css({ fontSize: "0.65rem", color: "#6b7280" })}>{cluster.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bumpiness gauge (between drag bar and results) ── */}
      <div className={css({ marginBottom: "1.25rem" })}>
        <div className={css({ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.3rem" })}>
          <span className={css({ fontSize: "0.8rem", color: "#374151" })}>How bumpy is this portfolio?</span>
          <span
            className={css({ fontSize: "1.1rem", fontWeight: "bold" })}
            style={{ color: bumpinessColor(risk.portVol) }}
          >
            {risk.portVol.toFixed(1)}%
          </span>
          <span className={css({ fontSize: "0.65rem", color: "#9ca3af" })}>per year</span>
        </div>
        <div
          className={css({
            position: "relative",
            height: "10px",
            borderRadius: "5px",
            backgroundColor: "#f3f4f6",
            overflow: "hidden",
          })}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, ((risk.portVol - MIN_VOL) / (MAX_VOL - MIN_VOL)) * 100))}%`,
              height: "100%",
              backgroundColor: bumpinessColor(risk.portVol),
              borderRadius: "5px",
              transition: "width 0.2s, background-color 0.2s",
            }}
          />
        </div>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.6rem",
            color: "#9ca3af",
            marginTop: "0.15rem",
          })}
        >
          <span>smoothest mix ({MIN_VOL.toFixed(1)}%)</span>
          <span>single stock group ({MAX_VOL.toFixed(1)}%)</span>
        </div>
      </div>

      {/* ── Portfolio summary ── */}
      <div
        className={css({
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
        })}
      >
        {/* Capital allocation bar */}
        <div className={css({ marginBottom: "0.75rem" })}>
          <div className={css({ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.2rem" })}>
            Capital allocation (computed)
          </div>
          <div
            className={css({
              display: "flex",
              height: "26px",
              borderRadius: "4px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            })}
          >
            {DATA.clusters.map((cluster, ci) => {
              const pct = risk.clusterWeight[ci];
              return pct > 0 ? (
                <div
                  key={cluster.name}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: cluster.color,
                    transition: "width 0.2s",
                  }}
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: "bold",
                    color: "white",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  })}
                  title={`${cluster.name}: ${pct.toFixed(1)}%`}
                >
                  {pct >= 8 ? `${pct.toFixed(0)}%` : ""}
                </div>
              ) : null;
            })}
          </div>
        </div>

        {/* ── Cluster detail cards ── */}
        <div className={css({ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" })}>
          {DATA.clusters.map((cluster, ci) => {
            const isOpen = expandedCluster === ci;
            return (
              <div
                key={cluster.name}
                className={css({
                  borderLeft: "4px solid",
                  borderRadius: "6px",
                  backgroundColor: isOpen ? "#f9fafb" : "white",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  transition: "background-color 0.15s",
                  _hover: { backgroundColor: "#f9fafb" },
                })}
                style={{ borderLeftColor: cluster.color, borderLeftWidth: "4px", borderLeftStyle: "solid" }}
              >
                <button
                  onClick={() => setExpandedCluster(isOpen ? null : ci)}
                  className={css({
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.75rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  })}
                >
                  <div className={css({ display: "flex", alignItems: "center", gap: "0.5rem" })}>
                    <span className={css({ fontSize: "0.85rem", fontWeight: "bold" })} style={{ color: cluster.color }}>
                      {cluster.name}
                    </span>
                    <span className={css({ fontSize: "0.8rem", color: "#374151", fontWeight: "600" })}>
                      {risk.clusterWeight[ci].toFixed(0)}% capital
                    </span>
                  </div>
                  <span className={css({ fontSize: "0.75rem", color: "#6b7280" })}>
                    {isOpen ? "▾ Hide ETFs" : "▸ Show ETFs"}
                  </span>
                </button>

                {isOpen && (
                  <div className={css({ padding: "0 0.75rem 0.6rem" })}>
                    <table className={css({ width: "100%", fontSize: "0.7rem", borderCollapse: "collapse" })}>
                      <thead>
                        <tr className={css({ borderBottom: "1px solid #e5e7eb" })}>
                          <th className={css({ textAlign: "left", padding: "0.2rem 0.3rem", color: "#6b7280" })}>
                            ETF
                          </th>
                          <th className={css({ textAlign: "right", padding: "0.2rem 0.3rem", color: "#6b7280" })}>
                            Weight
                          </th>
                          <th className={css({ textAlign: "right", padding: "0.2rem 0.3rem", color: "#6b7280" })}>
                            Vol (ann.)
                          </th>
                          <th className={css({ textAlign: "right", padding: "0.2rem 0.3rem", color: "#6b7280" })}>
                            Risk contrib.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cluster.etfs.map((etf) => {
                          const idx = DATA.etf_names.indexOf(etf);
                          const etfVol = Math.sqrt(DATA.cov_etf_ann[idx][idx]) * 100;
                          return (
                            <tr key={etf} className={css({ borderBottom: "1px solid #f3f4f6" })}>
                              <td className={css({ padding: "0.2rem 0.3rem", color: "#374151" })}>
                                {DATA.etf_labels[idx]}{" "}
                                <a
                                  href={DATA.etf_urls[idx]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={css({ color: "#6b7280", textDecoration: "underline", _hover: { color: "#374151" } })}
                                >
                                  {etf}
                                </a>
                              </td>
                              <td className={css({ textAlign: "right", padding: "0.2rem 0.3rem" })}>
                                {(weights[idx] * 100).toFixed(1)}%
                              </td>
                              <td className={css({ textAlign: "right", padding: "0.2rem 0.3rem" })}>
                                {etfVol.toFixed(1)}%
                              </td>
                              <td
                                className={css({
                                  textAlign: "right",
                                  padding: "0.2rem 0.3rem",
                                  fontWeight: "600",
                                })}
                              >
                                {risk.rc[idx].toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
