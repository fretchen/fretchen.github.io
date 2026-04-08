import React, { useState, useMemo } from "react";
import { css } from "../../styled-system/css";

// Annualised volatilities from retail-portfolio-analysis NB05 + NB06b
const SIGMA_HOUSE_MTM = 0.075; // mark-to-market housing vol (7.5% p.a.)
const SIGMA_HOUSE_HEDGED = 0.042; // after rent hedge (4.2% p.a.)
const SIGMA_SAVINGS = 0.005; // cash/savings account (~0.5% p.a.)
// Mortgage: fixed-rate → σ = 0 (perfectly predictable)

const MORTGAGE_MIN_VISUAL = 0.03; // minimum visual share so grey sliver stays visible

interface Segment {
  label: string;
  emoji: string;
  share: number;
  color: string;
}

function computeScenario(
  property: number,
  mortgage: number,
  savings: number,
  paidOff: boolean,
  staying: boolean,
): { segments: Segment[]; totalRelative: number; baseVariance: number; currentVariance: number } {
  const effectiveMortgage = paidOff ? 0 : mortgage;
  const netWorth = property + savings - effectiveMortgage;
  if (netWorth <= 0) {
    return {
      segments: [{ label: "Your home", emoji: "\u{1F3E0}", share: 1, color: "#f97316" }],
      totalRelative: 1,
      baseVariance: 1,
      currentVariance: 1,
    };
  }

  const wHouse = property / netWorth;
  const wSavings = savings / netWorth;

  const sigHouse = staying ? SIGMA_HOUSE_HEDGED : SIGMA_HOUSE_MTM;
  const varHouse = (wHouse * sigHouse) ** 2;
  const varSavings = (wSavings * SIGMA_SAVINGS) ** 2;
  const totalVar = varHouse + varSavings;

  // Base variance (no toggles) for totalRelative scaling
  const wHouseBase = property / (property + savings - mortgage);
  const wSavingsBase = savings / (property + savings - mortgage);
  const baseVar = (wHouseBase * SIGMA_HOUSE_MTM) ** 2 + (wSavingsBase * SIGMA_SAVINGS) ** 2;

  const shareHouse = totalVar > 0 ? varHouse / totalVar : 0.9;
  const shareSavings = totalVar > 0 ? varSavings / totalVar : 0.1;

  const segments: Segment[] = [{ label: "Your home", emoji: "\u{1F3E0}", share: shareHouse, color: "#f97316" }];

  if (!paidOff) {
    // Mortgage gets a minimum visual share (it contributes ~0% variance but needs to be visible)
    const mortgageVisual = MORTGAGE_MIN_VISUAL;
    const scaledHouse = shareHouse * (1 - mortgageVisual);
    const scaledSavings = shareSavings * (1 - mortgageVisual);
    segments[0] = { ...segments[0], share: scaledHouse };
    segments.push({ label: "Savings", emoji: "\u{1F4B0}", share: scaledSavings, color: "#22c55e" });
    segments.push({ label: "Mortgage", emoji: "\u{1F3E6}", share: mortgageVisual, color: "#9ca3af" });
  } else {
    segments.push({ label: "Savings", emoji: "\u{1F4B0}", share: shareSavings, color: "#22c55e" });
  }

  return {
    segments,
    totalRelative: baseVar > 0 ? Math.sqrt(totalVar / baseVar) : 1,
    baseVariance: baseVar,
    currentVariance: totalVar,
  };
}

function getMessage(paidOff: boolean, staying: boolean): string {
  if (paidOff && staying) {
    return "Even without the mortgage, your home dominates. But because you live there, the wobble is noticeably smaller.";
  }
  if (paidOff) {
    return "The mortgage was the predictable part. Removing it barely changes where the wobble comes from.";
  }
  if (staying) {
    return (
      "You\u2019re not selling tomorrow. If prices drop, your mortgage payment stays the same." +
      " If rents rise, you don\u2019t pay them. That shrinks the wobble."
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

export default function RiskReality() {
  const [property, setProperty] = useState(380000);
  const [mortgage, setMortgage] = useState(290000);
  const [savings, setSavings] = useState(8000);
  const [mortgagePaidOff, setMortgagePaidOff] = useState(false);
  const [staying, setStaying] = useState(false);

  const scenario = useMemo(
    () => computeScenario(property, mortgage, savings, mortgagePaidOff, staying),
    [property, mortgage, savings, mortgagePaidOff, staying],
  );
  const message = getMessage(mortgagePaidOff, staying);

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
        Where does the wobble come from?
      </p>
      <p
        className={css({
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: "1.25rem",
          marginTop: 0,
        })}
      >
        Enter your numbers, then toggle the switches to see what changes — and what doesn&apos;t.
      </p>

      {/* Inputs */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "1.25rem",
          "@media (max-width: 560px)": { gridTemplateColumns: "1fr" },
        })}
      >
        <div>
          <label className={labelCss}>Home value</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>€</span>
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
          <label className={labelCss}>Mortgage remaining</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>€</span>
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
          <label className={labelCss}>Liquid savings</label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>€</span>
            <input
              type="number"
              min={0}
              max={500000}
              step={1000}
              value={savings}
              onChange={(e) => setSavings(Math.max(0, Math.min(500000, Number(e.target.value))))}
              className={inputCss}
            />
          </div>
        </div>
      </div>

      {/* Stacked bar */}
      <div
        className={css({
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          marginBottom: "1rem",
        })}
      >
        <div
          className={css({
            position: "relative",
            height: "40px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
          })}
        >
          <div
            style={{
              display: "flex",
              height: "100%",
              width: `${Math.max(10, scenario.totalRelative * 100)}%`,
              transition: "width 0.5s ease",
            }}
          >
            {scenario.segments.map((seg) => (
              <div
                key={seg.label}
                style={{
                  width: `${seg.share * 100}%`,
                  height: "100%",
                  backgroundColor: seg.color,
                  transition: "width 0.5s ease, background-color 0.3s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  minWidth: seg.share > 0.05 ? "24px" : "8px",
                }}
                title={`${seg.emoji} ${seg.label}: ${Math.round(seg.share * 100)}%`}
              >
                {seg.share > 0.08 && (
                  <span
                    className={css({
                      fontSize: "0.75rem",
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
        </div>

        {/* Legend */}
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "0.5rem",
          })}
        >
          {scenario.segments.map((seg) => (
            <div key={seg.label} className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  backgroundColor: seg.color,
                }}
              />
              <span className={css({ fontSize: "0.75rem", color: "#6b7280" })}>
                {seg.emoji} {seg.label}
              </span>
            </div>
          ))}
        </div>

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
            cursor: "pointer",
          })}
          style={{
            borderColor: mortgagePaidOff ? "#f97316" : "#d1d5db",
            backgroundColor: mortgagePaidOff ? "rgba(249, 115, 22, 0.04)" : "white",
          }}
          onClick={() => setMortgagePaidOff((v) => !v)}
        >
          <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" })}>
            <input
              type="checkbox"
              checked={mortgagePaidOff}
              onChange={(e) => setMortgagePaidOff(e.target.checked)}
              className={css({ width: "16px", height: "16px", accentColor: "#f97316" })}
            />
            <span className={css({ fontSize: "0.9rem", fontWeight: "600", color: "#374151" })}>
              What if I pay off the mortgage?
            </span>
          </label>
          {mortgagePaidOff && (
            <p
              className={css({
                fontSize: "0.8rem",
                color: "#9a3412",
                marginTop: "0.4rem",
                marginBottom: 0,
                paddingLeft: "1.75rem",
              })}
            >
              The grey sliver disappeared — but the bar barely changed. The mortgage was never the source of
              uncertainty.
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
              I&apos;m staying — price swings don&apos;t affect my costs
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
              If house prices drop 20%, your mortgage payment stays the same. If rents rise 30%, you don&apos;t pay
              them. As someone who lives in their home, these price swings matter much less than they look on paper.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
