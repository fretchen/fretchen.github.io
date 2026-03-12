import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { css } from "../styled-system/css";
import { MarkdownWithLatex } from "../components/MarkdownWithLatex";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ============================================================
// DATA PAYLOAD — extracted from NB02 & NB07
// 12 ETFs across 3 clusters (Ward-Linkage, k=3)
// All prices converted to EUR, annualized (252 trading days)
// ============================================================
const DATA = {
  clusters: [
    { name: "Bonds", etfs: ["IBCS", "EUNH", "3SUD"], color: "#4e79a7" },
    {
      name: "Stocks: US & Canada",
      etfs: ["SXR8", "CSCA"],
      color: "#e15759",
    },
    {
      name: "Stocks: EU, Asia & Australia",
      etfs: ["SXRT", "NDIA", "SAUS", "CSJP"],
      color: "#f28e2b",
    },
  ],
  // 3×3 annualized covariance matrix (cluster-level equal-weighted returns)
  cov_cluster_ann: [
    [0.00223955, 0.00109166, 0.00127042],
    [0.00109166, 0.03516473, 0.01496456],
    [0.00127042, 0.01496456, 0.01637447],
  ],
  vol_cluster_ann: [0.047324, 0.187523, 0.127963],
  corr_cluster: [
    [1.0, 0.123, 0.2098],
    [0.123, 1.0, 0.6236],
    [0.2098, 0.6236, 1.0],
  ],
  crises: {
    "Corona 2020": { drawdowns: [-0.0663, -0.3836, -0.3355] },
    "Ukraine 2022": { drawdowns: [-0.1681, -0.1192, -0.1299] },
  },
  return_uncertainty: {
    premium_ann: [-0.017068, 0.082034, 0.054618],
    se_ann: [0.018455, 0.07313, 0.049903],
  },
  part1_example: {
    vol_100_bonds: 0.0473,
    vol_80_20: 0.0565,
    vol_50_50: 0.0995,
    vol_100_stocks: 0.1875,
    corr_bonds_stocks: 0.123,
  },

  // 9×9 Ledoit-Wolf annualized covariance matrix (9-ETF subset, removing EXXY, IQQ6, 4BRZ)
  // Order: IBCS, EUNH, SXR8, SXRT, 3SUD, NDIA, SAUS, CSJP, CSCA
  etf_names: ["IBCS", "EUNH", "SXR8", "SXRT", "3SUD", "NDIA", "SAUS", "CSJP", "CSCA"],
  etf_cluster: [0, 0, 1, 2, 0, 2, 2, 2, 1], // index into clusters[]
  etf_labels: [
    "EU Corporate Bonds",
    "EU Government Bonds",
    "S&P 500",
    "Euro Stoxx 50",
    "EM Bonds",
    "India",
    "Australia",
    "Japan",
    "Canada",
  ],
  cov_etf_ann: [
    [0.00235705, 0.00188179, 0.00101898, 0.00116085, 0.00153483, 0.0012564, 0.00201358, 0.00177889, 0.00117574],
    [0.00188179, 0.00414109, 0.00102919, 0.00027942, 0.00172953, 0.0003092, 0.00087098, 0.00145604, 0.00091051],
    [0.00101898, 0.00102919, 0.05870897, 0.01795636, 0.01371741, 0.01500817, 0.0169256, 0.00912919, 0.04577796],
    [0.00116085, 0.00027942, 0.01795636, 0.03857897, 0.00564821, 0.01384506, 0.0194126, 0.00793152, 0.02163545],
    [0.00153483, 0.00172953, 0.01371741, 0.00564821, 0.00944084, 0.0080297, 0.00815381, 0.00644341, 0.01361257],
    [0.0012564, 0.0003092, 0.01500817, 0.01384506, 0.0080297, 0.03787152, 0.01661183, 0.01099622, 0.01826119],
    [0.00201358, 0.00087098, 0.0169256, 0.0194126, 0.00815381, 0.01661183, 0.04185897, 0.02076469, 0.02349577],
    [0.00177889, 0.00145604, 0.00912919, 0.00793152, 0.00644341, 0.01099622, 0.02076469, 0.0396158, 0.01126801],
    [0.00117574, 0.00091051, 0.04577796, 0.02163545, 0.01361257, 0.01826119, 0.02349577, 0.01126801, 0.05142616],
  ],
};

// (Placeholder component removed — replaced by PortfolioRiskAllocator)

// ============================================================
// Random Walk helpers
// ============================================================
const gaussianRandom = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const STEPS = 504; // 2 trading years — more points for smoother histogram
const ANIM_BATCH = 8; // steps drawn per frame
const ANIM_INTERVAL = 25; // ms between frames

interface Paths {
  bondReturns: number[];
  stockReturns: number[];
}

/** Generate correlated daily returns for bonds and stocks.
 *  Uses Cholesky decomposition for the 2×2 case. */
function generatePaths(sigBond: number, sigStock: number, rho: number): Paths {
  const dailySigBond = sigBond / Math.sqrt(STEPS);
  const dailySigStock = sigStock / Math.sqrt(STEPS);
  const bondReturns: number[] = [];
  const stockReturns: number[] = [];
  for (let i = 0; i < STEPS; i++) {
    const z1 = gaussianRandom();
    const z2 = gaussianRandom();
    bondReturns.push(dailySigBond * z1);
    stockReturns.push(dailySigStock * (rho * z1 + Math.sqrt(1 - rho * rho) * z2));
  }
  return { bondReturns, stockReturns };
}

/** Compute cumulative price path starting at 100. */
function cumulativePath(dailyReturns: number[], steps: number): number[] {
  const path = [100];
  for (let i = 0; i < steps; i++) {
    path.push(path[i] * (1 + dailyReturns[i]));
  }
  return path;
}

/** Annualized volatility measured from daily returns. */
function measuredVol(dailyReturns: number[], steps: number): number {
  const slice = dailyReturns.slice(0, steps);
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((s, r) => s + (r - mean) ** 2, 0) / slice.length;
  return Math.sqrt(variance * STEPS) * 100; // percent, annualized
}

// ============================================================
// Live-filling SVG Histogram (vertical / rotated — sits beside the line chart)
// ============================================================
const HIST_BINS = 25;
const HIST_RANGE = 0.025; // ±2.5% daily return range

interface HistogramProps {
  bondReturns: number[];
  stockReturns: number[];
  mixReturns: number[];
  visibleSteps: number;
}

function ReturnHistogram({ bondReturns, stockReturns, mixReturns, visibleSteps }: HistogramProps) {
  const width = 120;
  const height = 300; // matches the line-chart height
  const margin = { top: 6, right: 4, bottom: 6, left: 4 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const binHeight = plotH / HIST_BINS;
  const binSize = (2 * HIST_RANGE) / HIST_BINS;

  const toBins = (returns: number[], steps: number): number[] => {
    const bins = new Array(HIST_BINS).fill(0);
    for (let i = 0; i < steps; i++) {
      const idx = Math.floor((returns[i] + HIST_RANGE) / binSize);
      if (idx >= 0 && idx < HIST_BINS) bins[idx]++;
    }
    return bins;
  };

  const bondBins = toBins(bondReturns, visibleSteps);
  const stockBins = toBins(stockReturns, visibleSteps);
  const mixBins = toBins(mixReturns, visibleSteps);
  const maxCount = Math.max(1, ...bondBins, ...stockBins, ...mixBins);

  // Render order: stocks (back), bonds, mix (front)
  const series = [
    { bins: stockBins, color: DATA.clusters[1].color, opacity: 0.35, label: "Stocks" },
    { bins: bondBins, color: DATA.clusters[0].color, opacity: 0.45, label: "Bonds" },
    { bins: mixBins, color: "#7b3fa0", opacity: 0.6, label: "Mix" },
  ];

  // Y-axis ticks (return percentages — bottom=negative, top=positive to match price chart)
  const ticks = [-2, -1, 0, 1, 2].map((pct) => ({
    pct,
    // bin 0 = most negative, bin N-1 = most positive
    // invert so positive is at top
    y: margin.top + plotH - ((pct / 100 + HIST_RANGE) / (2 * HIST_RANGE)) * plotH,
  }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={css({ width: "100%", height: "100%", display: "block" })}>
      {/* Bars grow leftward from right edge */}
      {series.map((s) =>
        s.bins.map((count, i) => {
          const barW = (count / maxCount) * plotW;
          // Invert: bin 0 (most negative) at bottom, bin N-1 (most positive) at top
          const y = margin.top + plotH - (i + 1) * binHeight;
          return (
            <rect
              key={`${s.label}-${i}`}
              x={margin.left + plotW - barW}
              y={y + 0.5}
              width={barW}
              height={Math.max(0, binHeight - 1)}
              fill={s.color}
              opacity={s.opacity}
            />
          );
        }),
      )}

      {/* Zero line */}
      {ticks
        .filter((t) => t.pct === 0)
        .map((t) => (
          <line
            key="zero"
            x1={margin.left}
            y1={t.y}
            x2={margin.left + plotW}
            y2={t.y}
            stroke="#9ca3af"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ))}

      {/* Y-axis tick labels (return %) */}
      {ticks.map((t) => (
        <text key={t.pct} x={margin.left + plotW + 2} y={t.y + 3} fontSize={8} fill="#9ca3af" textAnchor="start">
          {t.pct > 0 ? "+" : ""}
          {t.pct}%
        </text>
      ))}
    </svg>
  );
}

// ============================================================
// DiversificationRandomWalk component
// ============================================================
// Pedagogical parameters — strongly exaggerated for visual clarity
// (real data: σ_bond=4.6%, σ_stock=20.1%, ρ=+0.17)
// With these values, σ_mix ≈ 6% at 50/50 — clearly less than either alone
const PEDAGOGY = {
  sigBond: 0.15, // 15% — inflated so bonds are clearly visible
  sigStock: 0.2, // 20%
  rho: -0.8, // strongly anti-correlated — mix cancels most fluctuation
};

function DiversificationRandomWalk() {
  const [stockPct, setStockPct] = useState(50);
  const [hasMovedSlider, setHasMovedSlider] = useState(false);
  const [paths, setPaths] = useState<Paths | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sigBond = PEDAGOGY.sigBond;
  const sigStock = PEDAGOGY.sigStock;
  const rho = PEDAGOGY.rho;

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => stopAnimation, [stopAnimation]);

  // Auto-start animation on mount
  useEffect(() => {
    const fresh = generatePaths(sigBond, sigStock, rho);
    setPaths(fresh);
    setVisibleSteps(0);
    setIsAnimating(true);
    let step = 0;
    animRef.current = setInterval(() => {
      step = Math.min(step + ANIM_BATCH, STEPS);
      setVisibleSteps(step);
      if (step >= STEPS) {
        clearInterval(animRef.current!);
        animRef.current = null;
        setIsAnimating(false);
      }
    }, ANIM_INTERVAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAnimation = useCallback(
    (newPaths?: Paths) => {
      stopAnimation();
      const p = newPaths ?? paths;
      if (!p) {
        const fresh = generatePaths(sigBond, sigStock, rho);
        setPaths(fresh);
        setVisibleSteps(0);
        setIsAnimating(true);
        // defer interval to next tick so state is set
        setTimeout(() => {
          let step = 0;
          animRef.current = setInterval(() => {
            step = Math.min(step + ANIM_BATCH, STEPS);
            setVisibleSteps(step);
            if (step >= STEPS) {
              clearInterval(animRef.current!);
              animRef.current = null;
              setIsAnimating(false);
            }
          }, ANIM_INTERVAL);
        }, 0);
        return;
      }
      setVisibleSteps(0);
      setIsAnimating(true);
      let step = 0;
      animRef.current = setInterval(() => {
        step = Math.min(step + ANIM_BATCH, STEPS);
        setVisibleSteps(step);
        if (step >= STEPS) {
          clearInterval(animRef.current!);
          animRef.current = null;
          setIsAnimating(false);
        }
      }, ANIM_INTERVAL);
    },
    [paths, sigBond, sigStock, rho, stopAnimation],
  );

  const handleNewPaths = useCallback(() => {
    const fresh = generatePaths(sigBond, sigStock, rho);
    setPaths(fresh);
    startAnimation(fresh);
  }, [sigBond, sigStock, rho, startAnimation]);

  // Derived data for chart
  const w = stockPct / 100;
  const stepsToShow = paths ? visibleSteps : 0;
  const labels = Array.from({ length: stepsToShow + 1 }, (_, i) => {
    if (i === 0) return "Start";
    if (i === STEPS) return "24 months";
    const month = Math.floor((i / STEPS) * 24);
    return month > 0 && i % Math.round(STEPS / 24) === 0 ? `${month} mo` : "";
  });

  const bondPath = paths ? cumulativePath(paths.bondReturns, stepsToShow) : [];
  const stockPath = paths ? cumulativePath(paths.stockReturns, stepsToShow) : [];
  const mixReturns = paths ? paths.bondReturns.map((br, i) => (1 - w) * br + w * paths.stockReturns[i]) : [];
  const mixPath = paths ? cumulativePath(mixReturns, stepsToShow) : [];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Bonds only",
        data: bondPath,
        borderColor: DATA.clusters[0].color,
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        pointStyle: "line" as const,
        tension: 0.1,
      },
      {
        label: "Stocks only",
        data: stockPath,
        borderColor: DATA.clusters[1].color,
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        pointStyle: "line" as const,
        tension: 0.1,
      },
      {
        label: `Mix (${100 - stockPct}/${stockPct})`,
        data: mixPath,
        borderColor: "#7b3fa0",
        backgroundColor: "transparent",
        borderWidth: 3,
        pointRadius: 0,
        pointStyle: "line" as const,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { position: "top" as const, labels: { font: { size: 12 }, usePointStyle: true, pointStyleWidth: 20 } },
      title: { display: false },
    },
    scales: {
      x: {
        title: { display: true, text: "Months", font: { size: 11 } },
        ticks: {
          maxTicksLimit: 13,
          font: { size: 10 },
          callback: function (_: unknown, index: number) {
            return labels[index] || null;
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Portfolio value (€)",
          font: { size: 11 },
        },
        ticks: { font: { size: 10 } },
        suggestedMin: 70,
        suggestedMax: 130,
      },
    },
  };

  // Measured volatilities (only meaningful when animation finished)
  const showVol = stepsToShow >= STEPS && paths;
  const bondVol = showVol ? measuredVol(paths.bondReturns, STEPS) : null;
  const stockVol = showVol ? measuredVol(paths.stockReturns, STEPS) : null;
  const mixVol = showVol ? measuredVol(mixReturns, STEPS) : null;

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(123, 63, 160, 0.04)",
        borderRadius: "8px",
        border: "1px solid rgba(123, 63, 160, 0.15)",
      })}
    >
      <p
        className={css({
          fontSize: "0.95rem",
          fontWeight: "bold",
          marginBottom: "0.75rem",
          color: "#374151",
        })}
      >
        How does mixing bonds and stocks look in practice?
      </p>
      <p
        className={css({
          fontSize: "0.8rem",
          color: "#6b7280",
          marginBottom: "1rem",
        })}
      >
        Each line shows a possible two-year journey of €100. Parameters are exaggerated for clarity (bonds and stocks
        move in opposite directions here). Watch how the mix (purple) is smoother than either alone.
      </p>

      {/* Slider */}
      <div className={css({ marginBottom: "1rem" })}>
        <label
          className={css({
            display: "block",
            fontSize: "0.85rem",
            color: "#374151",
            marginBottom: "0.4rem",
          })}
        >
          <strong>Stock allocation: {stockPct}%</strong>{" "}
          <span className={css({ color: "#9ca3af", fontWeight: "normal" })}>(Bonds: {100 - stockPct}%)</span>
        </label>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.7rem",
            color: "#6b7280",
            marginBottom: "0.2rem",
          })}
        >
          <span>100% Bonds</span>
          <span>100% Stocks</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={stockPct}
          onChange={(e) => {
            setStockPct(parseInt(e.target.value, 10));
            setHasMovedSlider(true);
          }}
          className={css({ width: "100%" })}
        />
      </div>

      {/* Button */}
      <div className={css({ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" })}>
        <button
          onClick={handleNewPaths}
          disabled={isAnimating}
          className={css({
            padding: "0.4rem 1rem",
            backgroundColor: isAnimating ? "#9ca3af" : "#7b3fa0",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isAnimating ? "not-allowed" : "pointer",
            fontSize: "0.8rem",
            fontWeight: "bold",
          })}
        >
          {isAnimating ? "Running…" : "🔄 New random scenario"}
        </button>
        {showVol && !hasMovedSlider && (
          <span className={css({ fontSize: "0.8rem", color: "#7b3fa0", fontStyle: "italic" })}>
            👆 Move the slider to see how the mix changes
          </span>
        )}
      </div>

      {/* Chart + side histogram */}
      <div className={css({ display: "flex", gap: "0.25rem", marginBottom: "1rem" })}>
        {/* Line chart */}
        <div className={css({ flex: "1 1 0%", height: "300px", minWidth: 0 })}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* Rotated histogram on the right */}
        {paths && stepsToShow > 0 && (
          <div
            className={css({
              width: "90px",
              flexShrink: 0,
              height: "300px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <span className={css({ fontSize: "0.6rem", color: "#9ca3af", textAlign: "center", marginBottom: "2px" })}>
              Daily return spread
            </span>
            <div className={css({ flex: 1 })}>
              <ReturnHistogram
                bondReturns={paths.bondReturns}
                stockReturns={paths.stockReturns}
                mixReturns={mixReturns}
                visibleSteps={stepsToShow}
              />
            </div>
          </div>
        )}
      </div>

      {/* Annotation */}
      {paths && stepsToShow > 0 && (
        <p
          className={css({
            fontSize: "0.75rem",
            color: "#6b7280",
            marginBottom: "1rem",
            fontStyle: "italic",
          })}
        >
          Left: cumulative portfolio value over time. Right: distribution of daily returns — narrower means less
          fluctuation. Notice how the purple mix is narrower than both bonds and stocks individually.
        </p>
      )}

      {/* Volatility badges */}
      {showVol && (
        <div>
          <p
            className={css({
              fontSize: "0.75rem",
              color: "#6b7280",
              marginBottom: "0.5rem",
            })}
          >
            How bumpy was this ride? (lower = smoother)
          </p>
          <div className={css({ display: "flex", gap: "0.75rem", flexWrap: "wrap" })}>
            {[
              {
                label: "Bonds",
                vol: bondVol!,
                color: DATA.clusters[0].color,
              },
              {
                label: "Stocks",
                vol: stockVol!,
                color: DATA.clusters[1].color,
              },
              { label: "Mix", vol: mixVol!, color: "#7b3fa0" },
            ].map((item) => (
              <span
                key={item.label}
                className={css({
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  border: "1px solid",
                  borderColor: item.color,
                  color: item.color,
                })}
              >
                <span
                  className={css({
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: item.color,
                  })}
                />
                {item.label}: {item.vol.toFixed(1)}%
              </span>
            ))}
          </div>
          {mixVol! < bondVol! && (
            <p
              className={css({
                fontSize: "0.8rem",
                color: "#7b3fa0",
                fontWeight: "600",
                marginTop: "0.5rem",
              })}
            >
              👉 The mix fluctuates {((1 - mixVol! / bondVol!) * 100).toFixed(0)}% less than bonds alone — adding stocks
              actually reduced risk!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Portfolio Risk Allocator — interactive component
// ============================================================
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

/** Solve risk-budget allocation via Roncalli (2013) multiplicative update. */
function solveRiskBudget(cov: number[][], clusterOf: number[], budgets: number[]): number[] {
  const n = cov.length;
  const nC = budgets.length;
  const active = new Array(n).fill(true);
  for (let i = 0; i < n; i++) if (budgets[clusterOf[i]] < 1e-10) active[i] = false;
  const activeCount = active.filter(Boolean).length;
  if (activeCount === 0) return new Array(n).fill(1 / n);

  let w = new Array(n).fill(0);
  for (let i = 0; i < n; i++) w[i] = active[i] ? 1 / activeCount : 0;

  for (let iter = 0; iter < 5000; iter++) {
    const sw = matVec(cov, w);
    const rc = w.map((wi, i) => wi * sw[i]);
    const totalRc = rc.reduce((a, b) => a + b, 0);
    if (totalRc < 1e-15) break;
    const clusterRc = new Array(nC).fill(0);
    for (let i = 0; i < n; i++) clusterRc[clusterOf[i]] += rc[i];

    let maxErr = 0;
    for (let c = 0; c < nC; c++)
      if (budgets[c] > 1e-10) maxErr = Math.max(maxErr, Math.abs(clusterRc[c] / totalRc - budgets[c]));
    if (maxErr < 1e-8) break;

    for (let i = 0; i < n; i++) {
      if (!active[i]) continue;
      const c = clusterOf[i];
      const frac = clusterRc[c] / totalRc;
      if (frac < 1e-15) continue;
      w[i] *= Math.pow(budgets[c] / frac, 0.5);
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

function PortfolioRiskAllocator() {
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
                                {DATA.etf_labels[idx]} <span className={css({ color: "#9ca3af" })}>{etf}</span>
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

// ============================================================
// Metadata
// ============================================================
export const meta = {
  title: "Why is diversification of savings important?",
  publishing_date: "2026-03-08",
  tokenID: 200,
  category: "others",
  description:
    "A blog post that makes the case for diversification of savings instead of putting all your money into a single asset class.",
};

// ============================================================
// Blog Post
// ============================================================
export default function ETFDiversification() {
  return (
    <article>
      {/* ============================== */}
      {/* THE PARADOX                     */}
      {/* ============================== */}
      <section>
        <MarkdownWithLatex>
          {`
## A Systematic Approach to Saving

Most people keep their savings in a bank account, invest in a single asset class, or avoid the topic altogether. This post outlines a systematic approach to diversifying savings — one that doesn't require predicting markets or paying expensive advisors. It's close to what I actually do.

## The Diversification Paradox

You have savings you'd like to grow, but you don't want to gamble. The savings account barely keeps up with inflation. So what are your options?

- Bonds feel safe: steady, boring, predictable.
- Stocks feel risky: volatile, unpredictable, scary.

The safe choice seems obvious — put everything into bonds. But try the simulator below first: drag the slider to mix bonds and stocks. Can you find the mix that fluctuates least?
`}
        </MarkdownWithLatex>

        <DiversificationRandomWalk />

        <MarkdownWithLatex>
          {`

If you played with the slider, you probably noticed something surprising: a 50/50 mix (purple) fluctuates much less than 100% stocks (red) — but also less than 100% bonds (blue). When you combine assets that move independently, their random ups and downs partially cancel. The mix fluctuates less than any single part.

Think of it like packing for unpredictable weather: an umbrella alone covers rain but not sunshine. Adding sunscreen doesn't make the bag heavier — it makes it useful for more situations. This principle is called **diversification**, and it's the closest thing to a free lunch in investing.

## Why Chasing Returns Fails

Once you accept that diversification helps, the next instinct is to find the *optimal* mix — the one that maximizes return for a given level of risk.

This kind of optimization earned [Harry Markowitz a Nobel Prize in 1990](https://www.nobelprize.org/prizes/economic-sciences/1990/summary/). Banks and fund
managers have tried his "mean-variance optimization" ever since. And if you tried it too, you would unfortunately discover
that this optimization **doesn't work in practice.**

The reason is simple. To find the optimal mix, you need two ingredients:
1. How much each asset *fluctuates* (risk) — this we can measure reasonably well.
2. How much each asset will *earn in the future* (expected return) — this we **cannot**.

Estimating future returns from past data is like predicting next year's
weather from last year's diary. The mathematician Robert Merton showed in 1980 that you'd need
**80 to 100 years** of data to estimate stock returns with any confidence.

> "Optimizing" with unreliable inputs doesn't give you the best portfolio —
> it gives you the portfolio most sensitive to estimation errors.

The good news? We *can* measure risk (volatility, correlations) much more
reliably. So instead of chasing the "best return", we focus on
the thing we *can* control: **risk**.

## Allocating Risk Across Asset Classes

Since we can measure risk reliably, we can use it as a building block: decide how much risk each asset group should contribute, and let the math determine the capital allocation.

The tool below uses 9 European-listed ETFs grouped into three clusters based on how they move together:

- 🟦 Bonds: Corporate bonds, government bonds, and emerging market bonds.
- 🟥 Stocks: US & Canada — US stocks and the closely correlated Canadian market.
- 🟧 Stocks: EU, Asia & Australia — Euro Stoxx, India, Australia, and Japan.

Set how much risk each group should bear — the tool computes the matching capital split.

`}
        </MarkdownWithLatex>

        <PortfolioRiskAllocator />

        <MarkdownWithLatex>
          {`
### What to notice

- **Bonds are your shock absorber.** Even a small risk budget for bonds translates into a large capital allocation — bonds fluctuate much less than stocks, so they need more capital to "earn" their share of risk.
- **A little stock goes a long way.** Even a small stock allocation can dominate portfolio risk. That's why the risk budget view matters more than the capital split.
`}
        </MarkdownWithLatex>
      </section>

      {/* ============================== */}
      {/* TAKEAWAYS                       */}
      {/* ============================== */}
      <section>
        <MarkdownWithLatex>
          {`
## Turning This Into a Monthly Savings Plan

The tool above gives you a capital allocation — but this isn't about a single purchase. The idea is to set up an automatic monthly savings plan:

1. **Pick a risk budget** that lets you sleep at night. "Equal risk" is a reasonable starting point.
2. **Split your monthly savings** according to the capital allocation the tool computes. Most European brokers offer free ETF savings plans that execute automatically.
3. **Rebalance once a year.** Check whether your actual allocation still matches the target. If one group has drifted more than 5 percentage points, sell some of the overweight and buy more of the underweight.
4. **Don't tinker.** The biggest risk is yourself — panic-selling during a crash or chasing last year's winner. A systematic plan removes that temptation.

This is close to what I do with my own savings. It doesn't require predicting markets, paying for advice, or watching charts. It just requires patience.

---

*The analysis is based on 9 European-listed ETFs tracked from 2018 to 2026. Cluster assignments use Ward-linkage hierarchical clustering on bootstrapped correlation matrices. Risk metrics use 252-day annualization. Full methodology: [analysis notebooks](https://github.com/fretchen/EuropeSmallCapAnalysis).*
`}
        </MarkdownWithLatex>
      </section>
    </article>
  );
}
