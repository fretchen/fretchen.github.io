import React, { useState, useMemo } from "react";
import { css } from "../../styled-system/css";

// Annualised volatilities from retail-portfolio-analysis NB05 + NB06b
const SIGMA_HOUSE_MTM = 0.075; // mark-to-market housing vol (7.5% p.a.)
const SIGMA_HOUSE_HEDGED = 0.042; // after rent hedge (4.2% p.a.)
const SIGMA_CASH = 0; // cash on savings account: safe, no risk
const SIGMA_INVESTMENTS = 0.12; // diversified equity/bond portfolio (~12% p.a.)
// Mortgage: fixed-rate → σ = 0 (perfectly predictable)

interface Segment {
  label: string;
  emoji: string;
  share: number;
  color: string;
  euroVol: number; // € annual volatility for breakdown table
}

interface WealthSegment {
  label: string;
  emoji: string;
  share: number;
  color: string;
  amount: number;
}

interface AssetBreakdown {
  euroVol: number;
  share: number;
}

interface ScenarioResult {
  segments: Segment[];
  totalEuroVol: number;
  wealthSegments: WealthSegment[];
  breakdown: { house: AssetBreakdown; cash: AssetBreakdown; investments: AssetBreakdown };
}

function computeScenario(
  property: number,
  mortgage: number,
  cash: number,
  investments: number,
  paidOff: boolean,
  staying: boolean,
): ScenarioResult {
  const totalAssets = property + cash + investments;
  if (totalAssets <= 0) {
    return {
      segments: [{ label: "Your home", emoji: "\u{1F3E0}", share: 1, color: "#f97316", euroVol: 0 }],
      totalEuroVol: 0,
      wealthSegments: [{ label: "Your home", emoji: "\u{1F3E0}", share: 1, color: "#f97316", amount: property }],
    };
  }

  // Wealth allocation bar (equity view: what you own vs what you owe)
  const wealthSegments: WealthSegment[] = [
    { label: "Your home", emoji: "\u{1F3E0}", share: property / totalAssets, color: "#f97316", amount: property },
  ];
  if (cash > 0) {
    wealthSegments.push({
      label: "Cash",
      emoji: "\u{1F4B5}",
      share: cash / totalAssets,
      color: "#22c55e",
      amount: cash,
    });
  }
  if (investments > 0) {
    wealthSegments.push({
      label: "Investments",
      emoji: "\u{1F4C8}",
      share: investments / totalAssets,
      color: "#3b82f6",
      amount: investments,
    });
  }
  if (!paidOff && mortgage > 0) {
    wealthSegments.push({
      label: "Mortgage",
      emoji: "\u{1F3E6}",
      share: mortgage / totalAssets,
      color: "#9ca3af",
      amount: -mortgage,
    });
  }

  // Risk calculation: variance contribution per asset
  // Use totalAssets as denominator (not netWorth) so that paying off
  // the mortgage does not change the weights — the mortgage has σ=0,
  // so it should not affect the risk picture at all.
  const wHouse = property / totalAssets;
  const wCash = cash / totalAssets;
  const wInv = investments / totalAssets;

  const sigHouse = staying ? SIGMA_HOUSE_HEDGED : SIGMA_HOUSE_MTM;
  const varHouse = (wHouse * sigHouse) ** 2;
  const varCash = (wCash * SIGMA_CASH) ** 2;
  const varInv = (wInv * SIGMA_INVESTMENTS) ** 2;
  const totalVar = varHouse + varCash + varInv;

  // Euro volatilities for breakdown table
  const euroVolHouse = property * sigHouse;
  const euroVolCash = cash * SIGMA_CASH;
  const euroVolInv = investments * SIGMA_INVESTMENTS;
  const totalEuroVol = Math.sqrt(euroVolHouse ** 2 + euroVolCash ** 2 + euroVolInv ** 2);

  const shareHouse = totalVar > 0 ? varHouse / totalVar : 1;
  const shareInv = totalVar > 0 ? varInv / totalVar : 0;

  // Risk bar: only house and investments carry risk (cash σ=0, mortgage σ=0)
  // Always show both — no conditional logic.
  const segments: Segment[] = [
    { label: "Your home", emoji: "\u{1F3E0}", share: shareHouse, color: "#f97316", euroVol: euroVolHouse },
    { label: "Investments", emoji: "\u{1F4C8}", share: shareInv, color: "#3b82f6", euroVol: euroVolInv },
  ];

  return {
    segments,
    totalEuroVol,
    wealthSegments,
    breakdown: {
      house: { euroVol: euroVolHouse, share: shareHouse },
      cash: { euroVol: euroVolCash, share: 0 },
      investments: { euroVol: euroVolInv, share: shareInv },
    },
  };
}

function getMessage(paidOff: boolean, staying: boolean, hasMortgage: boolean): string {
  if (!hasMortgage) {
    if (staying) {
      return "Your home dominates the risk. But because you live there and save rent, it\u2019s smaller than it looks.";
    }
    return "Your home dominates the risk. The mortgage was already at zero.";
  }
  if (paidOff && staying) {
    return "Even without the mortgage, your home dominates. But because you live there, the risk is noticeably smaller.";
  }
  if (paidOff) {
    return "The mortgage was the predictable part. Removing it barely changes" + " where the risk comes from.";
  }
  if (staying) {
    return (
      "You\u2019re not selling tomorrow. If prices drop, your mortgage payment stays the same." +
      " If rents rise, you don\u2019t pay them. That shrinks the risk."
    );
  }
  return (
    "Almost all your financial uncertainty comes from one thing:" +
    " what your home is worth. The mortgage? Predictable \u2014 fixed rate, fixed schedule."
  );
}

const inputCss = css({
  width: "100%",
  padding: "0.5rem",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.9rem",
  _focus: { outline: "none", borderColor: "#7b3fa0" },
});

const labelCss = css({
  display: "block",
  fontSize: "0.8rem",
  color: "#374151",
  fontWeight: "600",
  marginBottom: "0.3rem",
});

const fmtEuro = (n: number) =>
  n < 0 ? `\u2212\u20AC${Math.abs(Math.round(n)).toLocaleString()}` : `\u20AC${Math.round(n).toLocaleString()}`;

/* ── Reusable stacked bar renderer ── */
function StackedBar({
  segments,
  height,
}: {
  segments: { label: string; emoji: string; share: number; color: string }[];
  height: string;
}) {
  return (
    <div style={{ display: "flex", height, borderRadius: "6px", overflow: "hidden" }}>
      {segments.map((seg) => (
        <div
          key={seg.label}
          style={{
            width: `${seg.share * 100}%`,
            height: "100%",
            backgroundColor: seg.color,
            transition: "width 0.5s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
          title={`${seg.emoji} ${seg.label}: ${Math.round(seg.share * 100)}%`}
        >
          {seg.share > 0.1 && (
            <span
              className={css({
                fontSize: "0.7rem",
                color: "white",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              })}
            >
              {seg.emoji} {seg.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Legend row ── */
function Legend({ segments }: { segments: { label: string; emoji: string; share: number; color: string }[] }) {
  return (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.4rem" })}>
      {segments.map((seg) => (
        <div key={seg.label} className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: seg.color }} />
          <span className={css({ fontSize: "0.75rem", color: "#6b7280" })}>
            {seg.emoji} {seg.label} ({Math.round(seg.share * 100)}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RiskReality() {
  const [property, setProperty] = useState(380000);
  const [mortgage, setMortgage] = useState(290000);
  const [cash, setCash] = useState(8000);
  const [investments, setInvestments] = useState(0);
  const [mortgagePaidOff, setMortgagePaidOff] = useState(false);
  const [staying, setStaying] = useState(false);

  const hasMortgage = mortgage > 0;

  const scenario = useMemo(
    () => computeScenario(property, mortgage, cash, investments, mortgagePaidOff, staying),
    [property, mortgage, cash, investments, mortgagePaidOff, staying],
  );

  // Baseline scenario (no toggles) for before/after comparison
  const baseScenario = useMemo(
    () => computeScenario(property, mortgage, cash, investments, false, false),
    [property, mortgage, cash, investments],
  );

  const message = getMessage(mortgagePaidOff, staying, hasMortgage);

  const anyToggle = mortgagePaidOff || staying;
  const pctChange =
    baseScenario.totalEuroVol > 0 ? Math.round((1 - scenario.totalEuroVol / baseScenario.totalEuroVol) * 100) : 0;

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
      {/* Header */}
      <p
        className={css({
          fontSize: "1.1rem",
          fontWeight: "bold",
          color: "#1f2937",
          marginBottom: "0.25rem",
          marginTop: 0,
        })}
      >
        Where does the risk come from?
      </p>
      <p
        className={css({
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: "1.25rem",
          marginTop: 0,
        })}
      >
        Enter your numbers, then toggle the switches to see what changes &mdash; and what doesn&apos;t.
      </p>

      {/* Inputs — 2×2 grid */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          "@media (max-width: 480px)": { gridTemplateColumns: "1fr" },
        })}
      >
        <div>
          <label className={labelCss}>{"\u{1F3E0}"} Home value</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>&euro;</span>
            <input
              type="number"
              min={50000}
              max={2000000}
              step={10000}
              value={property}
              onChange={(e) => setProperty(Math.max(50000, Math.min(2000000, Number(e.target.value))))}
              className={inputCss}
            />
          </div>
        </div>
        <div>
          <label className={labelCss}>{"\u{1F3E6}"} Mortgage remaining</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>&euro;</span>
            <input
              type="number"
              min={0}
              max={2000000}
              step={10000}
              value={mortgage}
              onChange={(e) => setMortgage(Math.max(0, Math.min(2000000, Number(e.target.value))))}
              className={inputCss}
            />
          </div>
        </div>
        <div>
          <label className={labelCss}>{"\u{1F4B5}"} Cash savings</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>&euro;</span>
            <input
              type="number"
              min={0}
              max={500000}
              step={1000}
              value={cash}
              onChange={(e) => setCash(Math.max(0, Math.min(500000, Number(e.target.value))))}
              className={inputCss}
            />
          </div>
        </div>
        <div>
          <label className={labelCss}>{"\u{1F4C8}"} Investments (ETFs etc.)</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>&euro;</span>
            <input
              type="number"
              min={0}
              max={500000}
              step={1000}
              value={investments}
              onChange={(e) => setInvestments(Math.max(0, Math.min(500000, Number(e.target.value))))}
              className={inputCss}
            />
          </div>
        </div>
      </div>

      {/* Visualization card */}
      <div
        className={css({
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          marginBottom: "1rem",
        })}
      >
        {/* Bar 1: Wealth allocation */}
        <p
          className={css({
            fontSize: "0.8rem",
            fontWeight: "700",
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginTop: 0,
            marginBottom: "0.4rem",
          })}
        >
          How your wealth is split
        </p>
        <StackedBar segments={scenario.wealthSegments} height="28px" />
        <Legend segments={scenario.wealthSegments} />

        {/* Bar 2: Wobble (risk) — before/after when toggle active */}
        <p
          className={css({
            fontSize: "0.8rem",
            fontWeight: "700",
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginTop: "1.25rem",
            marginBottom: "0.4rem",
          })}
        >
          How the risk is split
          {anyToggle && pctChange !== 0 && (
            <span
              className={css({ fontWeight: "600", textTransform: "none", letterSpacing: "0" })}
              style={{ color: pctChange > 0 ? "#16a34a" : "#dc2626" }}
            >
              {" "}
              ({pctChange > 0 ? `${pctChange}% less` : `${Math.abs(pctChange)}% more`} risk)
            </span>
          )}
        </p>

        {/* Show baseline bar when toggles are active, for comparison */}
        {anyToggle && (
          <>
            <p
              className={css({
                fontSize: "0.7rem",
                color: "#9ca3af",
                marginTop: 0,
                marginBottom: "0.25rem",
              })}
            >
              Before
            </p>
            <div style={{ opacity: 0.4 }}>
              <StackedBar segments={baseScenario.segments} height="20px" />
            </div>
            <p
              className={css({
                fontSize: "0.7rem",
                color: "#374151",
                fontWeight: "600",
                marginTop: "0.4rem",
                marginBottom: "0.25rem",
              })}
            >
              After
            </p>
          </>
        )}

        <StackedBar segments={scenario.segments} height="36px" />
        <Legend segments={scenario.segments} />

        {/* Breakdown table: € amounts */}
        <table
          className={css({
            width: "100%",
            marginTop: "0.75rem",
            fontSize: "0.8rem",
            borderCollapse: "collapse",
          })}
        >
          <thead>
            <tr>
              <th
                className={css({
                  textAlign: "left",
                  color: "#6b7280",
                  fontWeight: "600",
                  paddingBottom: "0.3rem",
                  borderBottom: "1px solid #e5e7eb",
                })}
              >
                Asset
              </th>
              <th
                className={css({
                  textAlign: "right",
                  color: "#6b7280",
                  fontWeight: "600",
                  paddingBottom: "0.3rem",
                  borderBottom: "1px solid #e5e7eb",
                })}
              >
                Value
              </th>
              <th
                className={css({
                  textAlign: "right",
                  color: "#6b7280",
                  fontWeight: "600",
                  paddingBottom: "0.3rem",
                  borderBottom: "1px solid #e5e7eb",
                })}
              >
                Annual risk (±€)
              </th>
              <th
                className={css({
                  textAlign: "right",
                  color: "#6b7280",
                  fontWeight: "600",
                  paddingBottom: "0.3rem",
                  borderBottom: "1px solid #e5e7eb",
                })}
              >
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Your home", emoji: "\u{1F3E0}", color: "#f97316", value: property, ...scenario.breakdown.house },
              { label: "Cash", emoji: "\u{1F4B5}", color: "#22c55e", value: cash, ...scenario.breakdown.cash },
              { label: "Investments", emoji: "\u{1F4C8}", color: "#3b82f6", value: investments, ...scenario.breakdown.investments },
            ].map((row) => (
              <tr key={row.label}>
                <td className={css({ padding: "0.3rem 0", color: "#374151" })}>
                  <span style={{ color: row.color }}>{"\u25CF"}</span> {row.emoji} {row.label}
                </td>
                <td className={css({ textAlign: "right", color: "#374151", padding: "0.3rem 0" })}>
                  {fmtEuro(row.value)}
                </td>
                <td
                  className={css({ textAlign: "right", padding: "0.3rem 0" })}
                  style={{ color: row.euroVol > 1000 ? "#dc2626" : "#374151" }}
                >
                  &plusmn;{fmtEuro(row.euroVol)}
                </td>
                <td className={css({ textAlign: "right", color: "#374151", padding: "0.3rem 0" })}>
                  {row.euroVol > 0 ? `${Math.round(row.share * 100)}%` : "0%"}
                </td>
              </tr>
            ))}
            {/* Mortgage row */}
            {!mortgagePaidOff && mortgage > 0 && (
              <tr>
                <td className={css({ padding: "0.3rem 0", color: "#9ca3af" })}>
                  <span style={{ color: "#9ca3af" }}>{"\u25CF"}</span> {"\u{1F3E6}"} Mortgage
                </td>
                <td className={css({ textAlign: "right", color: "#9ca3af", padding: "0.3rem 0" })}>
                  {fmtEuro(-mortgage)}
                </td>
                <td className={css({ textAlign: "right", color: "#9ca3af", padding: "0.3rem 0" })}>&plusmn;&euro;0</td>
                <td className={css({ textAlign: "right", color: "#9ca3af", padding: "0.3rem 0" })}>0%</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={2}
                className={css({
                  padding: "0.4rem 0 0.2rem",
                  fontWeight: "700",
                  color: "#374151",
                  borderTop: "1px solid #e5e7eb",
                })}
              >
                Total annual risk
              </td>
              <td
                className={css({
                  textAlign: "right",
                  padding: "0.4rem 0 0.2rem",
                  fontWeight: "700",
                  borderTop: "1px solid #e5e7eb",
                })}
                style={{ color: "#dc2626" }}
              >
                &plusmn;{fmtEuro(scenario.totalEuroVol)}
              </td>
              <td
                className={css({
                  textAlign: "right",
                  padding: "0.4rem 0 0.2rem",
                  fontWeight: "700",
                  color: "#374151",
                  borderTop: "1px solid #e5e7eb",
                })}
              >
                100%
              </td>
            </tr>
          </tfoot>
        </table>
        <p
          className={css({
            fontSize: "0.7rem",
            color: "#9ca3af",
            marginTop: "0.25rem",
            marginBottom: "0.5rem",
            fontStyle: "italic",
          })}
        >
          Annual risk shows how much each asset&apos;s value could swing in a typical year.
        </p>

        {/* Message */}
        <p
          className={css({
            fontSize: "0.85rem",
            marginTop: "0.75rem",
            marginBottom: 0,
            color: "#374151",
            fontStyle: "italic",
            lineHeight: "1.5",
          })}
        >
          {message}
        </p>
      </div>

      {/* Toggles */}
      <div className={css({ display: "flex", flexDirection: "column", gap: "0.75rem" })}>
        {/* Toggle 1: Pay off mortgage */}
        <div
          className={css({
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid",
            transition: "all 0.15s",
          })}
          style={{
            borderColor: !hasMortgage ? "#e5e7eb" : mortgagePaidOff ? "#f97316" : "#d1d5db",
            backgroundColor: !hasMortgage ? "#f9fafb" : mortgagePaidOff ? "rgba(249, 115, 22, 0.04)" : "white",
            cursor: hasMortgage ? "pointer" : "default",
            opacity: hasMortgage ? 1 : 0.5,
          }}
          onClick={() => hasMortgage && setMortgagePaidOff((v) => !v)}
        >
          <label
            className={css({ display: "flex", alignItems: "center", gap: "0.5rem" })}
            style={{ cursor: hasMortgage ? "pointer" : "default" }}
          >
            <input
              type="checkbox"
              checked={mortgagePaidOff}
              disabled={!hasMortgage}
              onChange={(e) => setMortgagePaidOff(e.target.checked)}
              className={css({ width: "16px", height: "16px", accentColor: "#f97316" })}
            />
            <span className={css({ fontSize: "0.9rem", fontWeight: "600", color: "#374151" })}>
              What if I pay off the mortgage?
            </span>
          </label>
          {!hasMortgage && (
            <p
              className={css({
                fontSize: "0.8rem",
                color: "#9ca3af",
                marginTop: "0.4rem",
                marginBottom: 0,
                paddingLeft: "1.75rem",
              })}
            >
              Your mortgage is already at &euro;0.
            </p>
          )}
          {mortgagePaidOff && hasMortgage && (
            <p
              className={css({
                fontSize: "0.8rem",
                color: "#9a3412",
                marginTop: "0.4rem",
                marginBottom: 0,
                paddingLeft: "1.75rem",
              })}
            >
              Look at the &quot;before&quot; and &quot;after&quot; bars above. The grey mortgage sliver disappeared
              &mdash; but the overall risk barely changed. The mortgage was never the source of uncertainty.
            </p>
          )}
        </div>

        {/* Toggle 2: I'm staying */}
        <div
          className={css({
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid",
            transition: "all 0.15s",
            cursor: "pointer",
          })}
          style={{
            borderColor: staying ? "#22c55e" : "#d1d5db",
            backgroundColor: staying ? "rgba(34, 197, 94, 0.04)" : "white",
          }}
          onClick={() => setStaying((v) => !v)}
        >
          <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" })}>
            <input
              type="checkbox"
              checked={staying}
              onChange={(e) => setStaying(e.target.checked)}
              className={css({ width: "16px", height: "16px", accentColor: "#22c55e" })}
            />
            <span className={css({ fontSize: "0.9rem", fontWeight: "600", color: "#374151" })}>
              I&apos;m staying &mdash; price swings don&apos;t affect my costs
            </span>
          </label>
          {staying && (
            <p
              className={css({
                fontSize: "0.8rem",
                color: "#166534",
                marginTop: "0.4rem",
                marginBottom: 0,
                paddingLeft: "1.75rem",
              })}
            >
              Look at the &quot;after&quot; bar &mdash; it got shorter. If house prices drop 20%, your mortgage payment
              stays the same. If rents rise 30%, you don&apos;t pay them. As someone who lives in their home, these
              price swings matter much less than they look on paper.
            </p>
          )}
        </div>
      </div>

      {/* "So what?" conclusion */}
      {anyToggle && (
        <p
          className={css({
            fontSize: "0.85rem",
            color: "#374151",
            marginTop: "1rem",
            marginBottom: 0,
            padding: "0.75rem",
            backgroundColor: "rgba(34, 197, 94, 0.06)",
            borderRadius: "6px",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            lineHeight: "1.5",
          })}
        >
          <strong>So what does this mean?</strong> Your home will always dominate the risk &mdash; it&apos;s your
          biggest asset. The mortgage adds almost nothing. The real question is: when life throws a shock at you,{" "}
          <em>do you have money outside the walls?</em> That&apos;s what protects the house.
        </p>
      )}
    </div>
  );
}
