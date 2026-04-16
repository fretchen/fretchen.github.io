import React, { useState, useMemo } from "react";
import { css } from "../../styled-system/css";

const JOB_LOSS_OPTIONS = [3, 6, 12] as const;
const REPAIR_MIN = 2000;
const REPAIR_MAX = 20000;
const REPAIR_STEP = 1000;

function barColor(monthsLeft: number): string {
  if (monthsLeft >= 6) return "#22c55e"; // green
  if (monthsLeft >= 3) return "#eab308"; // yellow
  if (monthsLeft >= 0) return "#ef4444"; // red
  return "#991b1b"; // deep red
}

function statusText(remaining: number, monthlyPayment: number): string {
  if (remaining <= 0) {
    return `€${Math.abs(Math.round(remaining)).toLocaleString()} in the red — you need outside help.`;
  }
  const months = remaining / monthlyPayment;
  if (months >= 6) return `${months.toFixed(1)} months of payments left. You'd survive this.`;
  if (months >= 3) return `${months.toFixed(1)} months of payments left. Tight.`;
  return `${months.toFixed(1)} months of payments left. One more shock and you're in trouble.`;
}

function statusEmoji(remaining: number, monthlyPayment: number): string {
  if (remaining <= 0) return "🔴";
  const months = remaining / monthlyPayment;
  if (months >= 6) return "🟢";
  if (months >= 3) return "🟡";
  return "🔴";
}

export default function ShockCalculator() {
  const [monthlyPayment, setMonthlyPayment] = useState(1200);
  const [savings, setSavings] = useState(8000);
  const [jobLossEnabled, setJobLossEnabled] = useState(false);
  const [jobLossMonths, setJobLossMonths] = useState<(typeof JOB_LOSS_OPTIONS)[number]>(6);
  const [repairEnabled, setRepairEnabled] = useState(false);
  const [repairCost, setRepairCost] = useState(5000);

  const result = useMemo(() => {
    let totalShock = 0;
    if (jobLossEnabled) totalShock += jobLossMonths * monthlyPayment;
    if (repairEnabled) totalShock += repairCost;
    const remaining = savings - totalShock;
    return { totalShock, remaining };
  }, [monthlyPayment, savings, jobLossEnabled, jobLossMonths, repairEnabled, repairCost]);

  const barPct = Math.max(0, Math.min(100, (result.remaining / savings) * 100));
  const isNegative = result.remaining < 0;
  const anyShock = jobLossEnabled || repairEnabled;

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
        How many shocks can you absorb?
      </p>
      <p
        className={css({
          fontSize: "0.85rem",
          color: "#6b7280",
          marginBottom: "1.25rem",
          marginTop: 0,
        })}
      >
        Enter your numbers, then activate shocks to see what happens to your reserves.
      </p>

      {/* Inputs */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1.25rem",
          "@media (max-width: 480px)": {
            gridTemplateColumns: "1fr",
          },
        })}
      >
        <div>
          <label
            className={css({
              display: "block",
              fontSize: "0.8rem",
              color: "#374151",
              fontWeight: "600",
              marginBottom: "0.3rem",
            })}
          >
            Monthly mortgage payment
          </label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>€</span>
            <input
              type="number"
              min={200}
              max={5000}
              step={50}
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(Math.max(200, Math.min(5000, Number(e.target.value))))}
              className={css({
                width: "100%",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
                _focus: { outline: "none", borderColor: "#7b3fa0" },
              })}
            />
          </div>
        </div>
        <div>
          <label
            className={css({
              display: "block",
              fontSize: "0.8rem",
              color: "#374151",
              fontWeight: "600",
              marginBottom: "0.3rem",
            })}
          >
            Liquid savings
          </label>
          <div className={css({ display: "flex", alignItems: "center", gap: "0.3rem" })}>
            <span className={css({ fontSize: "0.85rem", color: "#6b7280" })}>€</span>
            <input
              type="number"
              min={0}
              max={200000}
              step={500}
              value={savings}
              onChange={(e) => setSavings(Math.max(0, Math.min(200000, Number(e.target.value))))}
              className={css({
                width: "100%",
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "0.9rem",
                _focus: { outline: "none", borderColor: "#7b3fa0" },
              })}
            />
          </div>
        </div>
      </div>

      {/* Shock toggles */}
      <div className={css({ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" })}>
        {/* Job loss */}
        <div
          className={css({
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid",
            transition: "all 0.15s",
          })}
          style={{
            borderColor: jobLossEnabled ? "#ef4444" : "#d1d5db",
            backgroundColor: jobLossEnabled ? "rgba(239, 68, 68, 0.04)" : "white",
          }}
        >
          <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" })}>
            <input
              type="checkbox"
              checked={jobLossEnabled}
              onChange={(e) => setJobLossEnabled(e.target.checked)}
              className={css({ width: "16px", height: "16px", accentColor: "#ef4444" })}
            />
            <span className={css({ fontSize: "0.9rem", fontWeight: "600", color: "#374151" })}>Job loss</span>
            {jobLossEnabled && (
              <span className={css({ fontSize: "0.8rem", color: "#ef4444", fontWeight: "600" })}>
                −€{(jobLossMonths * monthlyPayment).toLocaleString()}
              </span>
            )}
          </label>
          {jobLossEnabled && (
            <div className={css({ marginTop: "0.5rem", paddingLeft: "1.75rem" })}>
              <div className={css({ display: "flex", gap: "0.5rem", flexWrap: "wrap" })}>
                {JOB_LOSS_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setJobLossMonths(m)}
                    className={css({
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.8rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                      border: "1px solid",
                      fontWeight: "600",
                      transition: "all 0.15s",
                    })}
                    style={{
                      borderColor: jobLossMonths === m ? "#ef4444" : "#d1d5db",
                      backgroundColor: jobLossMonths === m ? "rgba(239, 68, 68, 0.1)" : "white",
                      color: jobLossMonths === m ? "#ef4444" : "#374151",
                    }}
                  >
                    {m} months
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emergency repair */}
        <div
          className={css({
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid",
            transition: "all 0.15s",
          })}
          style={{
            borderColor: repairEnabled ? "#ef4444" : "#d1d5db",
            backgroundColor: repairEnabled ? "rgba(239, 68, 68, 0.04)" : "white",
          }}
        >
          <label className={css({ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" })}>
            <input
              type="checkbox"
              checked={repairEnabled}
              onChange={(e) => setRepairEnabled(e.target.checked)}
              className={css({ width: "16px", height: "16px", accentColor: "#ef4444" })}
            />
            <span className={css({ fontSize: "0.9rem", fontWeight: "600", color: "#374151" })}>Emergency repair</span>
            {repairEnabled && (
              <span className={css({ fontSize: "0.8rem", color: "#ef4444", fontWeight: "600" })}>
                −€{repairCost.toLocaleString()}
              </span>
            )}
          </label>
          {repairEnabled && (
            <div className={css({ marginTop: "0.5rem", paddingLeft: "1.75rem" })}>
              <div className={css({ display: "flex", alignItems: "center", gap: "0.5rem" })}>
                <span className={css({ fontSize: "0.75rem", color: "#6b7280" })}>€{REPAIR_MIN.toLocaleString()}</span>
                <input
                  type="range"
                  min={REPAIR_MIN}
                  max={REPAIR_MAX}
                  step={REPAIR_STEP}
                  value={repairCost}
                  onChange={(e) => setRepairCost(Number(e.target.value))}
                  aria-label="Emergency repair cost"
                  className={css({
                    flex: 1,
                    accentColor: "#ef4444",
                    height: "6px",
                  })}
                />
                <span className={css({ fontSize: "0.75rem", color: "#6b7280" })}>€{REPAIR_MAX.toLocaleString()}</span>
              </div>
              <div className={css({ textAlign: "center", fontSize: "0.8rem", color: "#374151", fontWeight: "600" })}>
                €{repairCost.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result bar */}
      <div
        className={css({
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
        })}
      >
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
          })}
        >
          <span className={css({ fontSize: "0.8rem", color: "#374151", fontWeight: "600" })}>Savings after shocks</span>
          <span
            className={css({ fontSize: "1.2rem", fontWeight: "bold" })}
            style={{ color: isNegative ? "#991b1b" : barColor(result.remaining / monthlyPayment) }}
          >
            {isNegative ? "−" : ""}€{Math.abs(Math.round(result.remaining)).toLocaleString()}
          </span>
        </div>

        {/* Bar */}
        <div
          className={css({
            position: "relative",
            height: "28px",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
          })}
        >
          {isNegative ? (
            // Full red bar when negative
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#991b1b",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className={css({ fontSize: "0.75rem", color: "white", fontWeight: "bold" })}>in the red</span>
            </div>
          ) : (
            <div
              style={{
                width: `${anyShock ? barPct : 100}%`,
                height: "100%",
                backgroundColor: anyShock ? barColor(result.remaining / monthlyPayment) : "#22c55e",
                borderRadius: "6px",
                transition: "width 0.3s, background-color 0.3s",
              }}
            />
          )}
        </div>

        {/* Scale labels */}
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.65rem",
            color: "#9ca3af",
            marginTop: "0.2rem",
          })}
        >
          <span>€0</span>
          <span>€{savings.toLocaleString()}</span>
        </div>

        {/* Status text */}
        <p
          className={css({
            fontSize: "0.85rem",
            marginTop: "0.5rem",
            marginBottom: 0,
            fontWeight: "500",
          })}
          style={{ color: isNegative ? "#991b1b" : barColor(result.remaining / monthlyPayment) }}
        >
          {statusEmoji(result.remaining, monthlyPayment)}{" "}
          {anyShock ? statusText(result.remaining, monthlyPayment) : "No shocks activated. Try adding one."}
        </p>

        {/* Breakdown */}
        {anyShock && (
          <div className={css({ marginTop: "0.75rem", borderTop: "1px solid #f3f4f6", paddingTop: "0.5rem" })}>
            <div className={css({ fontSize: "0.75rem", color: "#6b7280" })}>
              <div className={css({ display: "flex", justifyContent: "space-between" })}>
                <span>Starting savings</span>
                <span>€{savings.toLocaleString()}</span>
              </div>
              {jobLossEnabled && (
                <div className={css({ display: "flex", justifyContent: "space-between", color: "#ef4444" })}>
                  <span>
                    Job loss ({jobLossMonths} months × €{monthlyPayment.toLocaleString()})
                  </span>
                  <span>−€{(jobLossMonths * monthlyPayment).toLocaleString()}</span>
                </div>
              )}
              {repairEnabled && (
                <div className={css({ display: "flex", justifyContent: "space-between", color: "#ef4444" })}>
                  <span>Emergency repair</span>
                  <span>−€{repairCost.toLocaleString()}</span>
                </div>
              )}
              <div
                className={css({
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "0.25rem",
                  marginTop: "0.25rem",
                })}
                style={{ color: isNegative ? "#991b1b" : "#374151" }}
              >
                <span>Remaining</span>
                <span>
                  {isNegative ? "−" : ""}€{Math.abs(Math.round(result.remaining)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
