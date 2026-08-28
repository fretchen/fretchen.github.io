import React, { useState } from "react";
import { css } from "../../styled-system/css";
import { widgetCard } from "./widgetCard";
import { gaussianRandom, normalCDF } from "./mathUtils";

// Risk aversion parameter for utility function
const GAMMA = 0.8;

// Quadratic utility function: U(Y) = Y - 0.5 * γ * Y² - concave, risk-averse
const utility = (y: number): number => y - 0.5 * GAMMA * y * y;

// Budget Negotiation Strategy Widget
export default function BudgetNegotiationWidget() {
  // User-adjustable parameters
  const [delta, setDelta] = useState(0.7); // Patience / discount factor
  const [politicalSecurity, setPoliticalSecurity] = useState(0.5); // 0 = Ferreira (fragile), 1 = Lindqvist (secure)

  // Derived parameters from political security slider
  // s=0 (Ferreira): X₀=0.52, σ=0.20 → high volatility, near 50%
  // s=1 (Lindqvist): X₀=0.70, σ=0.08 → low volatility, comfortable majority
  const X0 = 0.52 + 0.18 * politicalSecurity;
  const sigma = 0.2 - 0.12 * politicalSecurity;

  // Fixed parameters
  const T = 10; // Number of periods to simulate
  const nSimulations = 200; // Number of Monte Carlo trajectories
  const COOP = 0.2; // Cooperation discount (how much is shared)

  // Trigger re-simulation
  const [simKey, setSimKey] = useState(0);

  // Calculate p: probability that X falls below 0.5 in next step
  const calculateP = (x: number, s: number): number => {
    return normalCDF((0.5 - x) / s);
  };

  const currentP = calculateP(X0, sigma);

  // Analytical δ_min: threshold where cooperation becomes rational
  // δ_min = (1 - γ) / (1 - p·γ)
  const pWin = 1 - currentP;
  const deltaMin = (1 - GAMMA) / (1 - pWin * GAMMA);

  // Run Monte Carlo simulation for payoff calculation
  const runSimulation = React.useMemo(() => {
    // Simulate one trajectory of X values (power/majority)
    const simulateTrajectory = (): number[] => {
      const trajectory: number[] = [X0];
      let x = X0;
      for (let t = 1; t < T; t++) {
        x = x + sigma * gaussianRandom();
        x = Math.max(0, Math.min(1, x)); // Clamp to [0, 1]
        trajectory.push(x);
      }
      return trajectory;
    };

    // Strategy functions: X (power) -> Y (budget allocation for party A)
    // WTA: If I have majority (X > 0.5), I take everything (Y = 1), otherwise get nothing (Y = 0)
    // Cooperate: If I have majority, I share (Y = 1 - COOP), otherwise I receive (Y = COOP)
    const strategies = {
      cooperate: (x: number) => (x > 0.5 ? 1 - COOP : COOP),
      wta: (x: number) => (x > 0.5 ? 1 : 0),
    };

    // Calculate discounted utility for a trajectory under a strategy
    const calculateDiscountedUtility = (trajectory: number[], strategyFn: (x: number) => number, d: number): number => {
      let total = 0;
      for (let t = 0; t < trajectory.length; t++) {
        const y = strategyFn(trajectory[t]);
        total += Math.pow(d, t) * utility(y);
      }
      return total;
    };

    const trajectories = Array.from({ length: nSimulations }, () => simulateTrajectory());

    // Calculate payoffs at current delta
    const results = {
      cooperate: { values: [] as number[], mean: 0, std: 0 },
      wta: { values: [] as number[], mean: 0, std: 0 },
    };

    for (const trajectory of trajectories) {
      results.cooperate.values.push(calculateDiscountedUtility(trajectory, strategies.cooperate, delta));
      results.wta.values.push(calculateDiscountedUtility(trajectory, strategies.wta, delta));
    }

    // Calculate means and standard deviations
    for (const key of ["cooperate", "wta"] as const) {
      const values = results[key].values;
      results[key].mean = values.reduce((a, b) => a + b, 0) / values.length;
      results[key].std = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - results[key].mean, 2), 0) / values.length,
      );
    }

    return { trajectories, results };
    // simKey is included to allow manual re-simulation via button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [X0, sigma, T, nSimulations, COOP, delta, simKey]);

  const { results } = runSimulation;

  // Determine which strategy has higher payoff (from MC simulation)
  const coopPayoffHigher = results.cooperate.mean > results.wta.mean;

  // Generate explanation text based on current settings
  const getExplanationText = () => {
    const securityLevel = politicalSecurity > 0.6 ? "high" : politicalSecurity < 0.4 ? "low" : "moderate";
    const patienceLevel = delta > 0.7 ? "high" : delta < 0.5 ? "low" : "moderate";

    if (coopPayoffHigher) {
      if (patienceLevel === "high") {
        return "With long-term thinking, cooperation pays off.";
      } else if (securityLevel === "low") {
        return "When power is fragile, sharing makes sense.";
      }
      return "Cooperation is the rational choice here.";
    } else {
      if (securityLevel === "high" && patienceLevel === "low") {
        return "With high security and low patience, refusing to compromise is rational.";
      } else if (securityLevel === "high") {
        return "Secure in power, there's no need to compromise.";
      } else if (patienceLevel === "low") {
        return "With elections looming, short-term wins matter more.";
      }
      return "Winner-takes-all is the rational choice here.";
    }
  };

  return (
    <div className={widgetCard()}>
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          textAlign: "center",
          marginBottom: "4",
          color: "gray.700",
        })}
      >
        When is cooperation rational?
      </h4>

      {/* Political Security slider */}
      <div className={css({ marginBottom: "6" })}>
        <label
          className={css({
            display: "block",
            fontSize: "sm",
            color: "gray.700",
            marginBottom: "2",
          })}
        >
          <strong>Political Security</strong>
        </label>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "xs",
            color: "gray.500",
            marginBottom: "1",
          })}
        >
          <span>🐦 Ferreira (fragile)</span>
          <span>🦉 Lindqvist (secure)</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={politicalSecurity}
          onChange={(e) => setPoliticalSecurity(parseFloat(e.target.value))}
          className={css({ width: "100%" })}
        />
      </div>

      {/* Patience slider */}
      <div className={css({ marginBottom: "6" })}>
        <label
          className={css({
            display: "block",
            fontSize: "sm",
            color: "gray.700",
            marginBottom: "2",
          })}
        >
          <strong>Patience</strong>
        </label>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "xs",
            color: "gray.500",
            marginBottom: "1",
          })}
        >
          <span>Short-term</span>
          <span>Long-term</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="0.99"
          step="0.01"
          value={delta}
          onChange={(e) => setDelta(parseFloat(e.target.value))}
          className={css({ width: "100%" })}
        />
      </div>

      {/* Expected payoff label */}
      <p
        className={css({
          fontSize: "sm",
          color: "gray.700",
          textAlign: "center",
          marginBottom: "3",
        })}
      >
        Expected payoff over 10 years:
      </p>

      {/* Payoff comparison */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4",
          marginBottom: "4",
        })}
      >
        <div
          className={css({
            backgroundColor: coopPayoffHigher ? "green.50" : "codeBg",
            border: coopPayoffHigher ? "2px solid #22c55e" : "1px solid #e5e7eb",
            borderRadius: "md",
            padding: "4",
            textAlign: "center",
          })}
        >
          <div
            className={css({
              color: coopPayoffHigher ? "green.500" : "gray.500",
              fontWeight: "bold",
              fontSize: "md",
            })}
          >
            🤝 Cooperate {coopPayoffHigher && "⬅"}
          </div>
          <div className={css({ fontSize: "xl", fontWeight: "bold", marginTop: "2" })}>
            {results.cooperate.mean.toFixed(1)}
          </div>
        </div>

        <div
          className={css({
            backgroundColor: !coopPayoffHigher ? "red.50" : "codeBg",
            border: !coopPayoffHigher ? "2px solid #ef4444" : "1px solid #e5e7eb",
            borderRadius: "md",
            padding: "4",
            textAlign: "center",
          })}
        >
          <div
            className={css({
              color: !coopPayoffHigher ? "red.500" : "gray.500",
              fontWeight: "bold",
              fontSize: "md",
            })}
          >
            👊 Winner-Takes-All {!coopPayoffHigher && "⬅"}
          </div>
          <div className={css({ fontSize: "xl", fontWeight: "bold", marginTop: "2" })}>
            {results.wta.mean.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Explanation text */}
      <p
        className={css({
          fontSize: "md",
          color: "gray.700",
          textAlign: "center",
          fontStyle: "italic",
          marginBottom: "4",
        })}
      >
        {getExplanationText()}
      </p>

      {/* Technical details - collapsed */}
      <details
        className={css({
          backgroundColor: "codeBg",
          padding: "3",
          borderRadius: "sm",
          fontSize: "xs",
          color: "gray.500",
        })}
      >
        <summary className={css({ cursor: "pointer", fontWeight: "semibold" })}>🔬 Technical details</summary>
        <div className={css({ marginTop: "2" })}>
          <strong>Model:</strong> Random walk X_{"{t+1}"} = X_t + ε, ε ~ N(0, σ²)
          <br />
          <strong>Parameters:</strong> X₀ = {X0.toFixed(2)}, σ = {sigma.toFixed(2)}, δ = {delta.toFixed(2)}
          <br />
          <strong>Threshold:</strong> δ_min = {deltaMin.toFixed(2)} (cooperation rational when δ {">"} δ_min)
          <br />
          <strong>Utility:</strong> U(Y) = Y − ½γY² with γ = {GAMMA}
          <br />
          <strong>Simulation:</strong> {nSimulations} trajectories, {T} periods
          <br />
          <button
            onClick={() => setSimKey((k) => k + 1)}
            className={css({
              marginTop: "2",
              padding: "4px 8px",
              backgroundColor: "blue.500",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: "pointer",
              fontSize: "xs",
            })}
          >
            🎲 Re-run simulation
          </button>
        </div>
      </details>
    </div>
  );
}
