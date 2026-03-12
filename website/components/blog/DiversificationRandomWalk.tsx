import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { css } from "../../styled-system/css";
import { DATA } from "./etfData";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

export default function DiversificationRandomWalk() {
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
