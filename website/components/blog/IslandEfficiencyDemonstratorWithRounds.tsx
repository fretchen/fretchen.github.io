import React, { useState, useEffect } from "react";
import { css } from "../../styled-system/css";
import {
  otherChiefs,
  MODEL_PARAMS,
  calculateEfficientBoats,
  calculateSustainableBoats,
  calculateTotalCatch,
  calculateRegeneration,
  type ScenarioType,
  type IslandRoundHistory,
} from "./fishingCommonsModel";

const IslandEfficiencyScenarioSelector: React.FC<{
  scenario: ScenarioType;
  setScenario: (scenario: ScenarioType) => void;
}> = ({ scenario, setScenario }) => {
  const scenarios = {
    sustainable: {
      name: "🌍 Equal Responsibility Policy",
      description: "All islands fish at the same sustainable level regardless of their individual costs",
    },
    aggressive: {
      name: "💰 Market-Driven Approach",
      description: "Each island fishes at their cost-optimal level (islands with lower costs fish more)",
    },
  };

  return (
    <div
      className={css({
        marginBottom: "5",
        textAlign: "center",
        border: "1px solid #e5e7eb",
        borderRadius: "lg",
        padding: "4",
        background: "zinc.50",
      })}
    >
      <div className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "2" })}>
        🌏 Fishing Management System
      </div>
      <div className={css({ display: "flex", gap: "3", justifyContent: "center", flexWrap: "wrap" })}>
        {Object.entries(scenarios).map(([key, info]) => {
          const isSelected = scenario === key;

          return (
            <button
              key={key}
              onClick={() => {
                setScenario(key as ScenarioType);
              }}
              style={{
                padding: "12px 16px",
                border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                borderRadius: 8,
                background: isSelected ? "#eff6ff" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                maxWidth: 200,
                fontSize: 14,
                position: "relative",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, color: "#111827" }}>{info.name}</div>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  lineHeight: "1.3",
                }}
              >
                {info.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const IslandEfficiencyResultsTable: React.FC<{ history: IslandRoundHistory[] }> = ({ history }) => {
  // Calculate totals
  const moanaSum = history.reduce((sum, h) => sum + (h.moanaFish ?? 0), 0);
  const chiefsSums = otherChiefs.map((_, i) =>
    history.reduce((sum, h) => sum + (h.otherFish && h.otherFish[i] !== undefined ? h.otherFish[i] : 0), 0),
  );
  const moanaCostSum = history.reduce((sum, h) => sum + (h.moanaCost ?? 0), 0);
  const chiefsCostSums = otherChiefs.map((_, i) =>
    history.reduce((sum, h) => sum + (h.otherCosts && h.otherCosts[i] !== undefined ? h.otherCosts[i] : 0), 0),
  );

  // Helper function for cost display
  function costCell(fish: number | null, cost: number | null, costPerFish: number | null, roundAvgCost: number | null) {
    if (fish === null || cost === null || costPerFish === null || roundAvgCost === null) return <span>-</span>;

    return (
      <span title={`${Math.round(fish)} fish • $${cost.toFixed(2)} total cost • $${costPerFish.toFixed(2)} per fish`}>
        {Math.round(fish)}🐟
        <br />${cost.toFixed(2)}
      </span>
    );
  }

  return (
    <div style={{ margin: "18px 0" }}>
      {/* Scenario indicator above table */}

      <div style={{ display: "flex", justifyContent: "center" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 480 }}>
          <thead>
            <tr style={{ background: "#bae6fd" }}>
              <th style={{ padding: "6px 8px" }}>Round</th>
              <th style={{ padding: "6px 8px" }}>
                Moana
                <br />
                (${MODEL_PARAMS.c_islands[0]}/boat)
              </th>
              {otherChiefs.map((chief, i) => (
                <th key={chief} style={{ padding: "6px 8px", fontSize: 12 }}>
                  {chief.replace("Chief ", "")}
                  <br />
                  (${MODEL_PARAMS.c_islands[i + 1]}/boat)
                </th>
              ))}
              <th style={{ padding: "6px 8px" }}>Stock After</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr
                key={idx}
                style={{
                  background: idx % 2 === 0 ? "#f8fafc" : "#fff",
                }}
              >
                <td
                  style={{
                    padding: "4px 8px",
                    textAlign: "center",
                    fontWeight: 400,
                  }}
                >
                  {h.round}
                </td>
                {/* Moana */}
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  {costCell(h.moanaFish, h.moanaCost, h.moanaCostPerFish, h.avgCostPerFish)}
                </td>
                {/* Other Chiefs */}
                {otherChiefs.map((_, i) => (
                  <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>
                    {h.otherFish &&
                    h.otherCosts &&
                    h.otherCostPerFish &&
                    h.otherFish[i] !== undefined &&
                    h.otherCosts[i] !== undefined
                      ? costCell(h.otherFish[i], h.otherCosts[i], h.otherCostPerFish[i], h.avgCostPerFish)
                      : "-"}
                  </td>
                ))}
                {/* Fish Stock */}
                <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: 500 }}>
                  {h.fishAfter !== null ? `${Math.round(h.fishAfter)}🐟` : "-"}
                </td>
              </tr>
            ))}
            {/* Summary Row */}
            <tr style={{ background: "#e0e7ef", fontWeight: 600, borderTop: "2px solid #bae6fd" }}>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>Total</td>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>
                {Math.round(moanaSum)}🐟
                <br />${moanaCostSum.toFixed(2)}
              </td>
              {chiefsSums.map((sum, i) => (
                <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>
                  {Math.round(sum)}🐟
                  <br />${chiefsCostSums[i].toFixed(2)}
                </td>
              ))}
              <td style={{ padding: "4px 8px", textAlign: "center", color: "#64748b" }}>–</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const IslandEfficiencyEndSummary: React.FC<{
  fishStock: number;
  history: IslandRoundHistory[];
}> = ({ fishStock, history }) => {
  // Calculate totals for cost efficiency display
  const totalFishCaught = history.reduce((sum, h) => sum + (h.totalCatch ?? 0), 0);
  const totalCost = history.reduce((sum, h) => sum + (h.totalCost ?? 0), 0);
  const averagePrice = totalFishCaught > 0 ? totalCost / totalFishCaught : 0;

  return (
    <div style={{ textAlign: "center", margin: "18px 0" }}>
      <div
        style={{
          background: "#f0f9ff",
          border: "1px solid #c7d2fe",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          🐟 <strong>{Math.round(totalFishCaught)}</strong> fish caught • 💰 <strong>${totalCost.toFixed(2)}</strong>{" "}
          total cost
        </div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          📊 Average cost: <strong>${averagePrice.toFixed(2)}</strong> per fish
        </div>
        <div style={{ fontSize: 15, marginBottom: 8 }}>
          🌊 <strong>{Math.round(fishStock)}</strong> fish remaining in the ocean
        </div>
      </div>
    </div>
  );
};

export default function IslandEfficiencyDemonstratorWithRounds() {
  const [scenario, setScenario] = useState<ScenarioType>("sustainable");
  const [history, setHistory] = useState<IslandRoundHistory[]>([]);

  const [fishStock, setFishStock] = useState(MODEL_PARAMS.s_init);

  // Auto-simulate all rounds when scenario changes
  useEffect(() => {
    const nRounds = 3;
    let currentStock = MODEL_PARAMS.s_init;
    const newHistory: IslandRoundHistory[] = [];

    for (let round = 1; round <= nRounds; round++) {
      // All chiefs (including Moana) choose boats based on selected scenario
      let allChiefBoats: number[];

      switch (scenario) {
        case "sustainable":
          // Harmony Islands: All chiefs value long-term thinking (use calculated sustainable boats)
          allChiefBoats = [0, 1, 2, 3].map(() => calculateSustainableBoats(currentStock));
          break;
        case "aggressive":
        default:
          // Competition Islands: All chiefs fight for maximum catch (use calculated competitive boats)
          // Each chief has different cost structure based on their island's conditions
          allChiefBoats = [0, 1, 2, 3].map((chiefIndex) =>
            calculateEfficientBoats(currentStock, MODEL_PARAMS.c_islands[chiefIndex]),
          );
          break;
      }
      // Moana is first chief (index 0), others are indices 1, 2, 3
      const moanaBoats = allChiefBoats[0];
      const otherBoats = allChiefBoats.slice(1);

      const totalBoats = allChiefBoats.reduce((a, b) => a + b, 0);

      // Calculate regeneration first (like in notebook: gt = g_t(st, g0, g1))
      const regeneration = calculateRegeneration(currentStock);

      // Calculate total catch using mathematical model (like in notebook: yt = y_t(st, b_t, y0))
      const totalCatch = calculateTotalCatch(currentStock, totalBoats);

      // Each chief gets proportional share based on boats sent
      const allChiefFish = allChiefBoats.map((boats) => (boats / totalBoats) * totalCatch);
      const moanaFish = allChiefFish[0];
      const otherFish = allChiefFish.slice(1);

      // Calculate costs for each chief
      const allChiefCosts = allChiefBoats.map((boats, index) => boats * MODEL_PARAMS.c_islands[index]);
      const moanaCost = allChiefCosts[0];
      const otherCosts = allChiefCosts.slice(1);

      // Calculate cost per fish for each chief
      const allChiefCostPerFish = allChiefCosts.map((cost, index) =>
        allChiefFish[index] > 0 ? cost / allChiefFish[index] : 0,
      );
      const moanaCostPerFish = allChiefCostPerFish[0];
      const otherCostPerFish = allChiefCostPerFish.slice(1);

      // Calculate total cost and average cost per fish
      const totalCost = allChiefCosts.reduce((sum, cost) => sum + cost, 0);
      const avgCostPerFish = totalCatch > 0 ? totalCost / totalCatch : 0;

      // Update stock exactly like in notebook: st = st - yt + gt
      const nextStock = currentStock - totalCatch + regeneration;

      // Store round result
      newHistory.push({
        round,
        moanaBoats,
        moanaFish,
        moanaCost,
        moanaCostPerFish,
        otherBoats,
        otherFish,
        otherCosts,
        otherCostPerFish,
        totalBoats,
        totalCatch: totalCatch,
        totalCost,
        avgCostPerFish,
        fishAfter: nextStock,
        regeneration: regeneration,
      });

      // Update for next round
      currentStock = Math.max(0, nextStock);
    }

    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setHistory(newHistory);
      setFishStock(currentStock);
    }, 0);
  }, [scenario]);

  return (
    <div
      className={css({
        border: "1px solid #bae6fd",
        borderRadius: "lg",
        padding: "4.5",
        margin: "18px 0",
        background: "slate.50",
      })}
    >
      <IslandEfficiencyScenarioSelector scenario={scenario} setScenario={setScenario} />
      <IslandEfficiencyResultsTable history={history} />
      <IslandEfficiencyEndSummary fishStock={fishStock} history={history} />
    </div>
  );
}
