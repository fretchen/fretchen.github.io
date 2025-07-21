import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Types für Moana's Choice Game - Updated to boats-based system

const otherChiefs = ["Chief Kai", "Chief Tala", "Chief Sina"];

type ScenarioType = "random" | "sustainable" | "aggressive";
type CommunityScenarioType = "democratic" | "hierarchical";

type RoundHistory = {
  round: number;
  moanaBoats: number | null;
  moanaFish: number | null;
  otherBoats: number[] | null;
  otherFish: number[] | null;
  totalBoats: number | null;
  totalCatch: number | null;
  fishAfter: number | null;
  regeneration: number | null;
};

type IslandRoundHistory = RoundHistory & {
  // Cost-related attributes for island efficiency analysis
  moanaCost: number | null;
  moanaCostPerFish: number | null;
  otherCosts: number[] | null;
  otherCostPerFish: number[] | null;
  totalCost: number | null;
  avgCostPerFish: number | null;
};

type CommunityRoundHistory = RoundHistory & {
  // Community governance specific attributes
  leader: number; // Who was leader this round (0=Moana, 1=Kai, 2=Tala, 3=Sina)
  leaderStrategy: string; // "conservative" | "moderate" | "aggressive"
  leaderDistributionMethod: string; // "equal" | "hybrid" | "efficiency"
  leaderRedistributionPolicy: string; // "conservative" | "moderate" | "progressive"
  redistributionAmount: number; // How much fish was redistributed
  moanaNetTransfer: number; // Moana's gain/loss through redistribution
  activeOstromPrinciples: string[]; // Which principles were active this round
  moanaOriginalCatch: number; // Before redistribution
  otherOriginalCatch: number[]; // Before redistribution
  // Cost-related attributes (Option 1: minimal cost extension)
  moanaCost: number; // Moana's total cost for this round
  otherCosts: number[]; // Other chiefs' total costs for this round
};

// Mathematical parameters from the notebook
const MODEL_PARAMS = {
  // Regeneration parameters
  g0: 0.03, // Linear growth factor
  g1: 0.001, // Quadratic growth factor

  // Catch efficiency parameter
  y0: 0.01, // Catch efficiency

  // Cost parameter
  c0: 0.125, // Cost per boat

  // cost for the inidividual islands
  // important for the second game
  c_islands: [0.125, 0.25, 0.75, 1],

  // Initial stock
  s_init: 100,

  // Number of players (4 total: Moana + 3 chiefs)
  nplayers: 4,
};

const calculateEfficientBoats = (s_t: number, c_t: number): number => {
  /**
   * What is the number of boats that gives us maximum catch with no losses?
   * If we were really smart, we could calculate it from the condition y_t = c_t
   *
   * Args:
   *     s_t: stock at time t
   *     c_t: cost of fishing per boat
   */
  return Math.pow((MODEL_PARAMS.y0 * s_t) / c_t, 2) / MODEL_PARAMS.nplayers;
};

// Calculate sustainable boat numbers
// based on the assumption the y_t = g_t
const calculateSustainableBoats = (stock: number): number => {
  // Sustainable boats: b_sust = (g0/y0 * (1 - g1 * s_init))^2
  const b_sust = Math.pow((MODEL_PARAMS.g0 / MODEL_PARAMS.y0) * (1 - MODEL_PARAMS.g1 * stock), 2);
  return b_sust / MODEL_PARAMS.nplayers;
};

// Calculate sustainable and competitive boat numbers based on the notebook
const calculateOptimalBoats = () => {
  // Boats per player (divide total by number of players)
  const low_fishing = Math.floor(calculateSustainableBoats(MODEL_PARAMS.s_init));
  const intensive_fishing = Math.floor(calculateEfficientBoats(MODEL_PARAMS.s_init, MODEL_PARAMS.c0));
  console.log("Low fishing boats:", low_fishing);
  console.log("Intensive fishing boats:", intensive_fishing);
  return { low_fishing, intensive_fishing };
};

// Get the calculated optimal values
const OPTIMAL_BOATS = calculateOptimalBoats();

// Mathematical functions from the notebook - exact implementation
const calculateTotalCatch = (stock: number, totalBoats: number): number => {
  // y_t = y0 * s_t * sqrt(b_t)
  return MODEL_PARAMS.y0 * stock * Math.sqrt(totalBoats);
};

const calculateRegeneration = (stock: number): number => {
  // g_t = g0 * (s_t - g1 * s_t^2)
  return MODEL_PARAMS.g0 * (stock - MODEL_PARAMS.g1 * stock * stock);
};

type ConservationStrategy = "aggressive" | "moderate" | "conservative";

interface ConservationResult {
  adjustedSustainableBoats: number;
  strategy: ConservationStrategy;
  conservationFactor: number;
}

/**
 * Simulates the decision of a leader on the appropriate conservation level
 * based on current stock level and their island efficiency
 */
const leaderConservationLevel = (
  leader: number,
  sustainableBoats: number,
  currentStock: number,
  initialStock: number,
  previousStock?: number,
): ConservationResult => {
  // Define conservation strategies with slightly more aggressive factor
  const conFactor = 2.5; // Increased from 2 to 2.5 for stronger effects
  const conservationStrategies: Record<ConservationStrategy, number> = {
    aggressive: conFactor, // 150% above sustainable (risky)
    moderate: 1.0, // Exactly sustainable (safe)
    conservative: 1 / conFactor, // 60% of sustainable (very safe)
  };

  // Simulate leader's decision based on stock level, their island efficiency, and trend
  let strategy: ConservationStrategy;

  // Calculate stock trend if previous stock is available
  let stockTrend = 0;
  if (previousStock !== undefined) {
    stockTrend = (currentStock - previousStock) / previousStock;
  }

  // Enhanced decision logic: consider both absolute stock and trend
  if (currentStock < 0.85 * initialStock || stockTrend < -0.08) {
    // Low stock OR strong negative trend - be conservative
    if (leader === 0) {
      // Efficient player (Moana) might take more risk
      strategy = "moderate";
    } else {
      strategy = "conservative";
    }
  } else if (currentStock > 0.98 * initialStock && stockTrend > -0.02) {
    // Very high stock AND no negative trend - can be more aggressive
    strategy = "aggressive";
  } else {
    strategy = "moderate";
  }

  const conservationFactor = conservationStrategies[strategy];
  const adjustedSustainableBoats = sustainableBoats * conservationFactor;

  console.log(`  Leader ${leader} chooses '${strategy}' strategy (factor: ${conservationFactor})`);
  if (previousStock !== undefined) {
    console.log(`  Stock trend: ${(stockTrend * 100).toFixed(1)}% (${currentStock} from ${previousStock})`);
  }
  console.log(`  Adjusted sustainable boats: ${adjustedSustainableBoats.toFixed(2)}`);

  return {
    adjustedSustainableBoats,
    strategy,
    conservationFactor,
  };
};

/**
 * Simulates the leader's choice of distribution method for quotas
 */
const leaderDistribution = (
  leader: number,
  nplayers: number,
  cooperationBonus: number,
  efficiencyBonus: number = 0.1,
  baseQuota: number = 0.25,
): { quotaWeights: number[]; method: string } => {
  // Simulate leader's choice based on their own efficiency
  let method: string;
  if (leader <= 1) {
    // Efficient leaders prefer efficiency-based
    method = "efficiency";
  } else if (leader >= 2) {
    // Less efficient leaders prefer more equality
    method = "hybrid";
  } else {
    method = "equal";
  }

  console.log(`  Leader chooses '${method}' distribution method`);

  // Calculate quotas based on leader's chosen method
  const quotaWeights: number[] = [];

  if (method === "equal") {
    // Equal quotas for all
    for (let jj = 0; jj < nplayers; jj++) {
      quotaWeights.push(1 / nplayers);
    }
  } else if (method === "efficiency") {
    // Pure efficiency-based quotas
    let totalQuotaWeight = 0;
    for (let jj = 0; jj < nplayers; jj++) {
      const efficiencyLevel = nplayers - jj - 1; // Island 0 is most efficient
      const quotaWeight = baseQuota + efficiencyLevel * efficiencyBonus * 1.5; // More extreme
      quotaWeights.push(quotaWeight);
      totalQuotaWeight += quotaWeight;
    }
    // Normalize
    for (let i = 0; i < quotaWeights.length; i++) {
      quotaWeights[i] = quotaWeights[i] / totalQuotaWeight;
    }
  } else {
    // hybrid - Mix of efficiency and equality
    let totalQuotaWeight = 0;
    for (let jj = 0; jj < nplayers; jj++) {
      const efficiencyLevel = nplayers - jj - 1;
      let quotaWeight = baseQuota + efficiencyLevel * efficiencyBonus * 0.7; // Less extreme
      if (jj === leader) {
        quotaWeight += cooperationBonus;
      }
      quotaWeights.push(quotaWeight);
      totalQuotaWeight += quotaWeight;
    }
    // Normalize
    for (let i = 0; i < quotaWeights.length; i++) {
      quotaWeights[i] = quotaWeights[i] / totalQuotaWeight;
    }
  }

  return { quotaWeights, method };
};

/**
 * Simulates the leader's choice of redistribution policy based on their position.
 */
const leaderRedistribution = (leader: number): { redistributionRate: number; policy: string } => {
  // LEADER DECISION 3: Choose redistribution policy
  const redistributionPolicies = {
    progressive: 0.2, // Higher redistribution
    moderate: 0.15, // Standard redistribution
    conservative: 0.1, // Lower redistribution
  };

  // Leader's redistribution choice depends on their position
  let redistributionPolicy: keyof typeof redistributionPolicies;

  if (leader >= 2) {
    // Less efficient leaders prefer more redistribution
    redistributionPolicy = "progressive";
  } else if (leader === 0) {
    // Most efficient leader prefers less
    redistributionPolicy = "conservative";
  } else {
    redistributionPolicy = "moderate";
  }

  const currentRedistributionRate = redistributionPolicies[redistributionPolicy];

  console.log(
    `  Leader chooses '${redistributionPolicy}' redistribution policy (${(currentRedistributionRate * 100).toFixed(0)}%)`,
  );

  return { redistributionRate: currentRedistributionRate, policy: redistributionPolicy };
};

const FishingGameSimulator: React.FC = () => {
  const [round, setRound] = useState(1); // 1, 2, 3
  const [fishStock, setFishStock] = useState(MODEL_PARAMS.s_init); // Start with notebook value
  const [moanaTotal, setMoanaTotal] = useState(0);
  const [scenario, setScenario] = useState<ScenarioType>("random");
  const [history, setHistory] = useState<RoundHistory[]>([
    {
      round: 1,
      moanaBoats: null,
      moanaFish: null,
      otherBoats: null,
      otherFish: null,
      totalBoats: null,
      totalCatch: null,
      fishAfter: null,
      regeneration: null,
    },
    {
      round: 2,
      moanaBoats: null,
      moanaFish: null,
      otherBoats: null,
      otherFish: null,
      totalBoats: null,
      totalCatch: null,
      fishAfter: null,
      regeneration: null,
    },
    {
      round: 3,
      moanaBoats: null,
      moanaFish: null,
      otherBoats: null,
      otherFish: null,
      totalBoats: null,
      totalCatch: null,
      fishAfter: null,
      regeneration: null,
    },
  ]);
  const [gameOver, setGameOver] = useState(false);

  function handleBoatChoice(moanaBoats: number) {
    if (gameOver || history[round - 1].moanaBoats !== null) return;

    // Other chiefs choose boats based on selected scenario
    let otherBoats: number[];

    switch (scenario) {
      case "sustainable":
        // Harmony Islands: Chiefs value long-term thinking (use calculated sustainable boats)
        otherBoats = otherChiefs.map(() => Math.floor(Math.random() * 2) + Math.max(1, OPTIMAL_BOATS.low_fishing - 1));
        break;
      case "aggressive":
        // Competition Islands: Every chief fights for maximum catch (use calculated competitive boats)
        otherBoats = otherChiefs.map(
          () => Math.floor(Math.random() * 4) + Math.max(8, OPTIMAL_BOATS.intensive_fishing - 2),
        );
        break;
      case "random":
      default:
        // Mixed Islands: Some sustainable, some aggressive (mix of both strategies)
        otherBoats = otherChiefs.map(() =>
          Math.random() < 0.5
            ? Math.max(1, OPTIMAL_BOATS.low_fishing + Math.floor(Math.random() * 3))
            : Math.max(8, OPTIMAL_BOATS.intensive_fishing - Math.floor(Math.random() * 4)),
        );
        break;
    }

    const totalBoats = moanaBoats + otherBoats.reduce((a, b) => a + b, 0);

    // Get current stock
    const currentStock = round === 1 ? MODEL_PARAMS.s_init : (history[round - 2].fishAfter ?? MODEL_PARAMS.s_init);
    console.log("Current stock:", currentStock);
    // Calculate regeneration first (like in notebook: gt = g_t(st, g0, g1))
    const regeneration = calculateRegeneration(currentStock);

    // Calculate total catch using mathematical model (like in notebook: yt = y_t(st, b_t, y0))
    const totalCatch = calculateTotalCatch(currentStock, totalBoats);

    // Each chief gets proportional share based on boats sent
    const moanaFish = Math.round((moanaBoats / totalBoats) * totalCatch);
    const otherFish = otherBoats.map((boats) => Math.round((boats / totalBoats) * totalCatch));

    // Update stock exactly like in notebook: st = st - yt + gt
    const nextStock = currentStock - totalCatch + regeneration;
    console.log("Next stock after catch and regeneration:", nextStock);

    // Update history
    const newHistory = history.map((h, idx) =>
      idx === round - 1
        ? {
            round,
            moanaBoats,
            moanaFish,
            otherBoats,
            otherFish,
            totalBoats,
            totalCatch: Math.round(totalCatch),
            fishAfter: Math.round(nextStock),
            regeneration: Math.round(regeneration),
          }
        : h,
    );

    setHistory(newHistory);
    setMoanaTotal(moanaTotal + moanaFish);
    setFishStock(Math.round(nextStock));

    if (round === 3) {
      setGameOver(true);
    } else {
      setRound(round + 1);
    }
  }

  function reset() {
    setRound(1);
    setFishStock(MODEL_PARAMS.s_init);
    setMoanaTotal(0);
    setHistory([
      {
        round: 1,
        moanaBoats: null,
        moanaFish: null,
        otherBoats: null,
        otherFish: null,
        totalBoats: null,
        totalCatch: null,
        fishAfter: null,
        regeneration: null,
      },
      {
        round: 2,
        moanaBoats: null,
        moanaFish: null,
        otherBoats: null,
        otherFish: null,
        totalBoats: null,
        totalCatch: null,
        fishAfter: null,
        regeneration: null,
      },
      {
        round: 3,
        moanaBoats: null,
        moanaFish: null,
        otherBoats: null,
        otherFish: null,
        totalBoats: null,
        totalCatch: null,
        fishAfter: null,
        regeneration: null,
      },
    ]);
    setGameOver(false);
    setScenario("random");
  }

  // Scenario Selector Component
  function ScenarioSelector() {
    const scenarios = {
      random: {
        name: "🏝️ Mixed Islands",
        description: `Some chiefs sustainable (~${OPTIMAL_BOATS.low_fishing} boats), others competitive (~${OPTIMAL_BOATS.intensive_fishing} boats)`,
      },
      sustainable: {
        name: "🌊 Harmony Islands",
        description: `Chiefs here value long-term thinking (~${OPTIMAL_BOATS.low_fishing} boats each)`,
      },
      aggressive: {
        name: "⚔️ Competition Islands",
        description: `Every chief fights for maximum catch (~${OPTIMAL_BOATS.intensive_fishing} boats each)`,
      },
    };

    // Check if any round has started (any boat choice has been made)
    const gameStarted = history.some((h) => h.moanaBoats !== null);

    return (
      <div
        style={{
          marginBottom: 20,
          textAlign: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>🌏 Neighboring Islands Culture</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(scenarios).map(([key, info]) => {
            const isSelected = scenario === key;
            const isDisabled = gameStarted;

            return (
              <button
                key={key}
                onClick={() => {
                  if (!isDisabled) {
                    setScenario(key as ScenarioType);
                  }
                }}
                disabled={isDisabled}
                style={{
                  padding: "12px 16px",
                  border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  borderRadius: 8,
                  background: isDisabled ? "#f3f4f6" : isSelected ? "#eff6ff" : "#fff",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  textAlign: "left",
                  maxWidth: 200,
                  fontSize: 14,
                  opacity: isDisabled ? 0.6 : 1,
                  position: "relative",
                }}
                title={isDisabled ? "Scenario locked during active game" : ""}
              >
                {isDisabled && isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 6,
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    🔒
                  </div>
                )}
                <div style={{ fontWeight: 600, marginBottom: 4, color: isDisabled ? "#9ca3af" : "#111827" }}>
                  {info.name}
                </div>
                <div
                  style={{
                    color: isDisabled ? "#9ca3af" : "#64748b",
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
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, fontWeight: 500 }}>
            Active Scenario: {scenarios[scenario].name}
          </div>
          {gameStarted ? (
            <div style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
              Scenario is locked during the game. Use &quot;Play again&quot; to change scenarios.
            </div>
          ) : (
            <div style={{ fontSize: 14, color: "#64748b" }}>
              As Moana, you can choose to send {OPTIMAL_BOATS.low_fishing},{" "}
              {Math.floor((OPTIMAL_BOATS.low_fishing + OPTIMAL_BOATS.intensive_fishing) / 2)}, or{" "}
              {OPTIMAL_BOATS.intensive_fishing} boats. What&apos;s your strategy?
            </div>
          )}
        </div>
      </div>
    );
  }

  // Action-Bereich mit Boats-basierten Entscheidungen
  function ActionBar() {
    const currentRoundHistory = history[round - 1];
    const hasChosenBoats = currentRoundHistory.moanaBoats !== null;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Progress Indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {[1, 2, 3].map((roundNum) => (
            <div
              key={roundNum}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                background: roundNum < round ? "#10b981" : roundNum === round ? "#3b82f6" : "#e5e7eb",
                color: roundNum < round || roundNum === round ? "#fff" : "#9ca3af",
              }}
            >
              {roundNum < round ? "✓" : roundNum}
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{ fontSize: 16, textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Round {round} of 3 • Fish Stock: {round === 1 ? MODEL_PARAMS.s_init : history[round - 2].fishAfter} 🐟
          </div>
          <div style={{ color: "#64748b", fontSize: 14 }}>How many boats should Moana send out today?</div>
        </div>

        {/* Boat Choice Buttons */}
        {!gameOver && !hasChosenBoats && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => handleBoatChoice(OPTIMAL_BOATS.low_fishing)}
              style={{
                padding: "10px 16px",
                border: "1px solid #10b981",
                borderRadius: 6,
                background: "#fff",
                color: "#222",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              🌊 {OPTIMAL_BOATS.low_fishing} Boats (Sustainable)
            </button>
            <button
              onClick={() =>
                handleBoatChoice(Math.floor((OPTIMAL_BOATS.low_fishing + OPTIMAL_BOATS.intensive_fishing) / 2))
              }
              style={{
                padding: "10px 16px",
                border: "1px solid #f59e0b",
                borderRadius: 6,
                background: "#fff",
                color: "#222",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              ⚖️ {Math.floor((OPTIMAL_BOATS.low_fishing + OPTIMAL_BOATS.intensive_fishing) / 2)} Boats (Moderate)
            </button>
            <button
              onClick={() => handleBoatChoice(OPTIMAL_BOATS.intensive_fishing)}
              style={{
                padding: "10px 16px",
                border: "1px solid #ef4444",
                borderRadius: 6,
                background: "#fff",
                color: "#222",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              ⚡ {OPTIMAL_BOATS.intensive_fishing} Boats (Intensive)
            </button>
          </div>
        )}

        {/* Round Feedback */}
        {!gameOver && hasChosenBoats && (
          <div style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 4 }}>
            <div style={{ marginBottom: 4 }}>
              <strong>Moana:</strong> {currentRoundHistory.moanaBoats} boats → {currentRoundHistory.moanaFish} fish
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>Other Chiefs:</strong>{" "}
              {currentRoundHistory.otherBoats
                ?.map((boats, i) => `${otherChiefs[i]}: ${boats} boats (${currentRoundHistory.otherFish?.[i]} fish)`)
                .join(", ")}
            </div>
            <div style={{ marginBottom: 4 }}>
              <strong>Total:</strong> {currentRoundHistory.totalBoats} boats caught {currentRoundHistory.totalCatch}{" "}
              fish
            </div>
            {currentRoundHistory.regeneration && currentRoundHistory.regeneration > 0 && (
              <div style={{ color: "#10b981" }}>🌱 Ocean regenerated: +{currentRoundHistory.regeneration} fish</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Results table showing boats and fish caught
  function ResultsTable() {
    // Calculate totals
    const moanaSum = history.reduce((sum, h) => sum + (h.moanaFish ?? 0), 0);
    const chiefsSums = otherChiefs.map((_, i) =>
      history.reduce((sum, h) => sum + (h.otherFish && h.otherFish[i] !== undefined ? h.otherFish[i] : 0), 0),
    );

    // Helper function for boat display
    function boatCell(boats: number | null, fish: number | null) {
      if (boats === null || fish === null) return <span>-</span>;
      const isConservative = boats <= OPTIMAL_BOATS.low_fishing + 1; // Around sustainable level
      const isAggressive = boats >= OPTIMAL_BOATS.intensive_fishing - 2; // Around competitive level

      return (
        <span
          style={{
            background: isConservative ? "#d1fae5" : isAggressive ? "#fef2f2" : "#fef9c3",
            color: isConservative ? "#047857" : isAggressive ? "#dc2626" : "#b45309",
            borderRadius: 4,
            padding: "2px 6px",
            fontWeight: 500,
            display: "inline-block",
            minWidth: 40,
          }}
          title={`${boats} boats → ${fish} fish`}
        >
          {boats}🛥️ → {fish}🐟
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
                <th style={{ padding: "6px 8px" }}>Moana</th>
                {otherChiefs.map((chief) => (
                  <th key={chief} style={{ padding: "6px 8px", fontSize: 12 }}>
                    {chief.replace("Chief ", "")}
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
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>{boatCell(h.moanaBoats, h.moanaFish)}</td>
                  {/* Other Chiefs */}
                  {otherChiefs.map((_, i) => (
                    <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>
                      {h.otherBoats && h.otherFish && h.otherBoats[i] !== undefined && h.otherFish[i] !== undefined
                        ? boatCell(h.otherBoats[i], h.otherFish[i])
                        : "-"}
                    </td>
                  ))}
                  {/* Fish Stock */}
                  <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: 500 }}>
                    {h.fishAfter !== null ? `${h.fishAfter}🐟` : "-"}
                  </td>
                </tr>
              ))}
              {/* Summary Row */}
              <tr style={{ background: "#e0e7ef", fontWeight: 600, borderTop: "2px solid #bae6fd" }}>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>Total</td>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>{moanaSum}🐟</td>
                {chiefsSums.map((sum, i) => (
                  <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>
                    {sum}🐟
                  </td>
                ))}
                <td style={{ padding: "4px 8px", textAlign: "center", color: "#64748b" }}>–</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Nach 3 Runden: Zusammenfassung
  function EndSummary() {
    const scenarios = {
      random: { name: "🏝️ Mixed Islands", color: "#f59e0b" },
      sustainable: { name: "🌊 Harmony Islands", color: "#10b981" },
      aggressive: { name: "⚔️ Competition Islands", color: "#ef4444" },
    };

    const getSustainabilityMessage = () => {
      if (fishStock >= 80) return { text: "Excellent! The ocean thrives.", color: "#10b981" };
      if (fishStock >= 60) return { text: "Good sustainability achieved.", color: "#f59e0b" };
      if (fishStock >= 40) return { text: "The ocean is stressed but surviving.", color: "#f59e0b" };
      return { text: "Critical! The ocean ecosystem is collapsing.", color: "#ef4444" };
    };

    const sustainabilityMessage = getSustainabilityMessage();

    return (
      <div style={{ textAlign: "center", margin: "18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>Game Complete!</div>

        <div
          style={{
            background: "#f0f9ff",
            border: "1px solid #c7d2fe",
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            <strong>Scenario:</strong>{" "}
            <span style={{ color: scenarios[scenario].color }}>{scenarios[scenario].name}</span>
          </div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>
            🐟 <strong>{fishStock}</strong> fish remaining in the ocean
          </div>
          <div style={{ fontSize: 15, marginBottom: 8 }}>
            🌺 <strong>{moanaTotal}</strong> fish caught by Moana
          </div>
          <div
            style={{
              fontSize: 14,
              color: sustainabilityMessage.color,
              fontWeight: 500,
              marginTop: 8,
            }}
          >
            {sustainabilityMessage.text}
          </div>
        </div>

        <button
          onClick={reset}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: 8,
            background: "#0891b2",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          🔄 Try Different Scenario
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #bae6fd", borderRadius: 8, padding: 18, margin: "18px 0", background: "#f8fafc" }}>
      <ScenarioSelector />
      <ActionBar />
      <ResultsTable />
      {gameOver && <EndSummary />}
    </div>
  );
};

const IslandEfficiencyDemonstratorWithRounds: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioType>("sustainable");
  const [history, setHistory] = useState<IslandRoundHistory[]>([]);

  const [fishStock, setFishStock] = useState(MODEL_PARAMS.s_init);

  // Auto-simulate all rounds when scenario changes
  useEffect(() => {
    simulateAllRounds();
  }, [scenario]);

  const simulateAllRounds = () => {
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
      console.log(`Round ${round} - All chiefs boats:`, allChiefBoats);
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

    setHistory(newHistory);
    setFishStock(currentStock);
  };

  // Scenario Selector Component
  function ScenarioSelector() {
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
        style={{
          marginBottom: 20,
          textAlign: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>🌏 Fishing Management System</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
  }

  // Results table showing costs and fish caught
  function ResultsTable() {
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
    function costCell(
      fish: number | null,
      cost: number | null,
      costPerFish: number | null,
      roundAvgCost: number | null,
    ) {
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
  }

  // Nach 3 Runden: Zusammenfassung
  function EndSummary() {
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
  }

  return (
    <div style={{ border: "1px solid #bae6fd", borderRadius: 8, padding: 18, margin: "18px 0", background: "#f8fafc" }}>
      <ScenarioSelector />
      <ResultsTable />
      <EndSummary />
    </div>
  );
};

const CommunityGovernanceSimulator: React.FC = () => {
  const [scenario, setScenario] = useState<CommunityScenarioType>("democratic");
  const [history, setHistory] = useState<CommunityRoundHistory[]>([]);
  const [fishStock, setFishStock] = useState(MODEL_PARAMS.s_init);

  // Auto-simulate all rounds when scenario changes
  useEffect(() => {
    simulateAllRounds();
  }, [scenario]);

  // Community governance parameters
  const COMMUNITY_PARAMS = {
    base_quota: 0.2, // Base quota for least efficient
    efficiency_bonus: 0.1, // Additional quota per efficiency level
    cooperation_bonus: 0.05, // Bonus for community participation
  };

  const applyRedistribution = (originalCatches: number[], leader: number) => {
    const redistributionResult = leaderRedistribution(leader);
    const redistributionRate = redistributionResult.redistributionRate;

    // Calculate sustainable catch per player (like in Python)
    const sustainableCatchPerPlayer =
      calculateTotalCatch(fishStock, calculateSustainableBoats(fishStock)) / MODEL_PARAMS.nplayers;

    // Initialize arrays
    const redistributionTax = new Array(MODEL_PARAMS.nplayers).fill(0);
    const underfished = new Array(MODEL_PARAMS.nplayers).fill(0);
    const finalCatches = [...originalCatches];

    // Step 1: Calculate redistribution tax for players above sustainable catch
    for (let jj = 0; jj < MODEL_PARAMS.nplayers; jj++) {
      if (originalCatches[jj] > sustainableCatchPerPlayer) {
        // Calculate tax for excess catch
        const excessCatch = originalCatches[jj] - sustainableCatchPerPlayer;
        redistributionTax[jj] = excessCatch * redistributionRate;
        finalCatches[jj] -= redistributionTax[jj];
      } else {
        redistributionTax[jj] = 0.0;
      }
    }

    // Step 2: Calculate underfished amounts for players below sustainable catch
    for (let jj = 0; jj < MODEL_PARAMS.nplayers; jj++) {
      if (finalCatches[jj] < sustainableCatchPerPlayer) {
        underfished[jj] = sustainableCatchPerPlayer - finalCatches[jj];
      } else {
        underfished[jj] = 0;
      }
    }

    // Step 3: Redistribute the collected tax to underfished players
    const totalRedistributionAmount = redistributionTax.reduce((sum, tax) => sum + tax, 0);
    const totalUnderfished = underfished.reduce((sum, amount) => sum + amount, 0);

    const redistributionReceived = new Array(MODEL_PARAMS.nplayers).fill(0);

    if (totalUnderfished > 0) {
      for (let jj = 0; jj < MODEL_PARAMS.nplayers; jj++) {
        if (underfished[jj] > 0) {
          // Calculate redistribution share based on underfished amount
          const share = underfished[jj] / totalUnderfished;
          const redistributionShare = totalRedistributionAmount * share;
          finalCatches[jj] += redistributionShare;
          redistributionReceived[jj] = redistributionShare;
        }
      }
    }

    return {
      finalCatches,
      redistributionAmount: totalRedistributionAmount,
      netTransfers: redistributionReceived.map((received, i) => received - redistributionTax[i]),
    };
  };

  const getActiveOstromPrinciples = (leader: number, scenario: CommunityScenarioType): string[] => {
    const principles = [];

    if (scenario === "democratic") {
      // Democratic governance implements most of Ostrom's principles
      principles.push("1. Clearly defined boundaries");
      principles.push("2. Collective choice arrangements");
      principles.push("3. Community monitoring");
      principles.push("4. Graduated sanctions");
      principles.push("5. Conflict resolution mechanisms");
      principles.push("7. Nested enterprises");
      if (leader !== 0) principles.push("6. Recognition of rights to organize"); // When others lead, shows external respect
      // Principle 8 (Local congruence) is inherently present as rules adapt to local conditions
    } else {
      // Hierarchical governance implements fewer principles
      principles.push("1. Clearly defined boundaries");
      principles.push("8. Congruence with local conditions");
      if (leader === 0) principles.push("3. Monitoring by authorities"); // Moana-led monitoring
    }

    return principles;
  };

  const simulateAllRounds = () => {
    const nRounds = 5; // Increased from 3 to 5 for better strategy progression
    let currentStock = MODEL_PARAMS.s_init;
    const newHistory: CommunityRoundHistory[] = [];
    let previousStock: number | undefined;

    for (let round = 1; round <= nRounds; round++) {
      // Leadership rotation: democratic rotates, hierarchical stays with Moana
      const leader = scenario === "democratic" ? (round - 1) % MODEL_PARAMS.nplayers : 0;

      // Calculate sustainable boats first
      const totalSustainableBoats = calculateSustainableBoats(currentStock) * MODEL_PARAMS.nplayers;

      // Use the leader conservation level function to determine strategy (with trend awareness)
      const conservationDecision = leaderConservationLevel(
        leader,
        totalSustainableBoats,
        currentStock,
        MODEL_PARAMS.s_init,
        previousStock,
      );
      const adjustedSustainableBoats = conservationDecision.adjustedSustainableBoats;
      const leaderStrategy = conservationDecision.strategy;

      // Declare allChiefBoats outside the if-statement so it's accessible later
      let allChiefBoats: number[];

      // in the case of the hierarchical scenario use the standard sustainable boats
      if (scenario === "hierarchical") {
        allChiefBoats = [0, 1, 2, 3].map(() => calculateSustainableBoats(currentStock));
        console.log(`Round ${round} - All chiefs boats (hierarchical):`, allChiefBoats);
      } else {
        // LEADER DECISION 2: Choose quota distribution method
        const distributionResult = leaderDistribution(
          leader,
          MODEL_PARAMS.nplayers,
          COMMUNITY_PARAMS.cooperation_bonus,
          COMMUNITY_PARAMS.efficiency_bonus,
          COMMUNITY_PARAMS.base_quota,
        );

        allChiefBoats = distributionResult.quotaWeights.map((weight, jj) => {
          // Calculate economically viable boats for this chief
          const econBoats = calculateEfficientBoats(currentStock, MODEL_PARAMS.c_islands[jj]);

          if (econBoats > adjustedSustainableBoats * weight) {
            // If the economic boats exceed the adjusted sustainable level, use the quota weights
            return adjustedSustainableBoats * weight;
          } else {
            // Otherwise, use the economic boats (more restrictive)
            return econBoats;
          }
        });
      }

      const moanaBoats = allChiefBoats[0];
      const otherBoats = allChiefBoats.slice(1);
      const totalBoats = allChiefBoats.reduce((a, b) => a + b, 0);

      // Calculate regeneration and catch
      const regeneration = calculateRegeneration(currentStock);
      const totalCatch = calculateTotalCatch(currentStock, totalBoats);

      // Calculate original catches (proportional to boats)
      const originalCatches = allChiefBoats.map((boats) => (boats / totalBoats) * totalCatch);
      const moanaOriginalCatch = originalCatches[0];
      const otherOriginalCatch = originalCatches.slice(1);

      // Declare variables outside the if-else blocks so they're accessible later
      let moanaFish: number;
      let otherFish: number[];
      let moanaNetTransfer: number;
      let redistributionAmount: number;
      let leaderDistributionMethod: string = "equal"; // Default for hierarchical
      let leaderRedistributionPolicy: string = "conservative"; // Default for hierarchical

      // Calculate the latest choice of the chief if we are in the democratic scenario
      if (scenario === "democratic") {
        // Get the distribution method from the distributionResult we calculated earlier
        const distributionResult = leaderDistribution(
          leader,
          MODEL_PARAMS.nplayers,
          COMMUNITY_PARAMS.cooperation_bonus,
          COMMUNITY_PARAMS.efficiency_bonus,
          COMMUNITY_PARAMS.base_quota,
        );
        leaderDistributionMethod = distributionResult.method;

        // Apply community redistribution
        const redistribution = applyRedistribution(originalCatches, leader);
        const redistributionResult = leaderRedistribution(leader);
        leaderRedistributionPolicy = redistributionResult.policy;

        moanaFish = redistribution.finalCatches[0];
        otherFish = redistribution.finalCatches.slice(1);
        moanaNetTransfer = redistribution.netTransfers[0];
        redistributionAmount = redistribution.redistributionAmount;
      } else {
        // Hierarchical scenario: no redistribution
        moanaFish = moanaOriginalCatch;
        otherFish = otherOriginalCatch;
        moanaNetTransfer = 0;
        redistributionAmount = 0;
      }

      // Get active Ostrom principles
      const activeOstromPrinciples = getActiveOstromPrinciples(leader, scenario);

      // Calculate costs for each chief (Option 1: minimal cost extension)
      const allChiefCosts = allChiefBoats.map((boats, index) => boats * MODEL_PARAMS.c_islands[index]);
      const moanaCost = allChiefCosts[0];
      const otherCosts = allChiefCosts.slice(1);

      // Update stock
      const nextStock = currentStock - totalCatch + regeneration;

      // Store round result
      newHistory.push({
        round,
        moanaBoats,
        moanaFish,
        otherBoats,
        otherFish,
        totalBoats,
        totalCatch,
        fishAfter: nextStock,
        regeneration,
        leader,
        leaderStrategy,
        leaderDistributionMethod,
        leaderRedistributionPolicy,
        redistributionAmount,
        moanaNetTransfer,
        activeOstromPrinciples,
        moanaOriginalCatch,
        otherOriginalCatch,
        moanaCost,
        otherCosts,
      });

      // Update for next round
      currentStock = Math.max(0, nextStock);
      previousStock = currentStock; // Store for trend calculation in next round
    }

    setHistory(newHistory);
    setFishStock(currentStock);
  };

  // Scenario Selector Component
  function ScenarioSelector() {
    const scenarios = {
      democratic: {
        name: "🤝 Democratic Fishing Council",
        description: "Rotating leadership, graduated quotas, wealth redistribution based on Ostrom's principles",
      },
      hierarchical: {
        name: "👑 Moana-Led Governance",
        description: "Fixed leadership by Moana, efficiency focus, minimal redistribution",
      },
    };

    return (
      <div
        style={{
          marginBottom: 20,
          textAlign: "center",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          background: "#fafafa",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>🏛️ Community Governance System</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {Object.entries(scenarios).map(([key, info]) => {
            const isSelected = scenario === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setScenario(key as CommunityScenarioType);
                }}
                style={{
                  padding: "12px 16px",
                  border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  borderRadius: 8,
                  background: isSelected ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  maxWidth: 220,
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
  }

  // Results table showing community governance in action
  function ResultsTable() {
    // Calculate totals
    const moanaSum = history.reduce((sum, h) => sum + (h.moanaFish ?? 0), 0);
    const chiefsSums = otherChiefs.map((_, i) =>
      history.reduce((sum, h) => sum + (h.otherFish && h.otherFish[i] !== undefined ? h.otherFish[i] : 0), 0),
    );
    const totalRedistribution = history.reduce((sum, h) => sum + h.redistributionAmount, 0);
    // Calculate cost totals (Option 1: minimal cost extension)
    const moanaCostSum = history.reduce((sum, h) => sum + (h.moanaCost ?? 0), 0);
    const chiefsCostSums = otherChiefs.map((_, i) =>
      history.reduce((sum, h) => sum + (h.otherCosts && h.otherCosts[i] !== undefined ? h.otherCosts[i] : 0), 0),
    );

    // Helper function for redistribution display with costs
    function redistributionCell(
      originalCatch: number | null,
      finalCatch: number | null,
      netTransfer: number | null,
      cost: number | null,
    ) {
      if (originalCatch === null || finalCatch === null || netTransfer === null || cost === null) {
        return <span>-</span>;
      }

      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12 }}>
            {originalCatch.toFixed(1)}🐟 → {finalCatch.toFixed(1)}🐟
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>${cost.toFixed(2)}</div>
        </div>
      );
    }

    // Helper function for leader display
    function leaderCell(leader: number, strategy: string, distributionMethod?: string, redistributionPolicy?: string) {
      const leaderNames = ["Moana", "Kai", "Tala", "Sina"];

      // Icon mappings for each decision type
      const conservationIcons = {
        conservative: "🛡️",
        moderate: "⚖️",
        aggressive: "⚔️",
      };

      const distributionIcons = {
        equal: "🟰",
        hybrid: "🔄",
        efficiency: "📈",
      };

      const redistributionIcons = {
        conservative: "🔐",
        moderate: "🔄",
        progressive: "🔓",
      };

      return (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: "2px" }}>{leaderNames[leader]}</div>

          {/* Decision Icons Row */}
          <div style={{ display: "flex", justifyContent: "center", gap: "2px", fontSize: "10px", marginBottom: "2px" }}>
            <span title={`Conservation Strategy: ${strategy}`}>
              {conservationIcons[strategy as keyof typeof conservationIcons] || "❓"}
            </span>
            <span title={`Distribution Method: ${distributionMethod || "unknown"}`}>
              {distributionMethod
                ? distributionIcons[distributionMethod as keyof typeof distributionIcons] || "❓"
                : "❓"}
            </span>
            <span title={`Redistribution Policy: ${redistributionPolicy || "unknown"}`}>
              {redistributionPolicy
                ? redistributionIcons[redistributionPolicy as keyof typeof redistributionIcons] || "❓"
                : "❓"}
            </span>
          </div>

          {/* Strategy text for reference */}
        </div>
      );
    }

    return (
      <div style={{ margin: "18px 0" }}>
        {/* Legend for Leadership Decision Icons */}
        <div
          style={{
            marginBottom: "12px",
            padding: "8px 12px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            fontSize: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "6px" }}>Leadership Decision Icons Guide:</div>

          {/* Conservation Strategy Icons */}
          <div style={{ marginBottom: "4px" }}>
            <strong>Conservation Strategy:</strong>
            <span style={{ marginLeft: "8px" }}>🛡️ conservative (protect stocks)</span>
            <span style={{ marginLeft: "8px" }}>⚖️ moderate (balanced approach)</span>
            <span style={{ marginLeft: "8px" }}>⚔️ aggressive (maximize current catch)</span>
          </div>

          {/* Distribution Method Icons */}
          <div style={{ marginBottom: "4px" }}>
            <strong>Distribution Method:</strong>
            <span style={{ marginLeft: "8px" }}>🟰 equal (same quotas for all)</span>
            <span style={{ marginLeft: "8px" }}>🔄 hybrid (balanced allocation)</span>
            <span style={{ marginLeft: "8px" }}>📈 efficiency (quota based on capability)</span>
          </div>

          {/* Redistribution Policy Icons */}
          <div>
            <strong>Redistribution Policy:</strong>
            <span style={{ marginLeft: "8px" }}>🔐 conservative (minimal sharing)</span>
            <span style={{ marginLeft: "8px" }}>🔄 moderate (balanced redistribution)</span>
            <span style={{ marginLeft: "8px" }}>🔓 progressive (significant wealth sharing)</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#bae6fd" }}>
                <th style={{ padding: "6px 8px" }}>Round</th>
                <th style={{ padding: "6px 8px" }}>Leader</th>
                <th style={{ padding: "6px 8px" }}>
                  Moana
                  <br />
                  Original → Final • Cost
                </th>
                {otherChiefs.map((chief) => (
                  <th key={chief} style={{ padding: "6px 8px", fontSize: 12 }}>
                    {chief.replace("Chief ", "")}
                    <br />
                    Original → Final • Cost
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
                  {/* Leader */}
                  <td style={{ padding: "4px 8px" }}>
                    {leaderCell(h.leader, h.leaderStrategy, h.leaderDistributionMethod, h.leaderRedistributionPolicy)}
                  </td>
                  {/* Moana */}
                  <td style={{ padding: "4px 8px" }}>
                    {redistributionCell(h.moanaOriginalCatch, h.moanaFish, h.moanaNetTransfer, h.moanaCost)}
                  </td>
                  {/* Other Chiefs */}
                  {otherChiefs.map((_, i) => (
                    <td key={i} style={{ padding: "4px 8px" }}>
                      {h.otherFish && h.otherOriginalCatch && h.otherFish[i] !== undefined && h.otherCosts
                        ? redistributionCell(
                            h.otherOriginalCatch[i],
                            h.otherFish[i],
                            h.otherFish[i] - h.otherOriginalCatch[i],
                            h.otherCosts[i],
                          )
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
                <td style={{ padding: "4px 8px", textAlign: "center" }} colSpan={2}>
                  Total
                </td>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  {Math.round(moanaSum)}🐟
                  <br />
                  <span style={{ fontSize: 10, color: "#64748b" }}>${moanaCostSum.toFixed(2)}</span>
                </td>
                {chiefsSums.map((sum, i) => (
                  <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>
                    {Math.round(sum)}🐟
                    <br />
                    <span style={{ fontSize: 10, color: "#64748b" }}>${chiefsCostSums[i].toFixed(2)}</span>
                  </td>
                ))}
                <td style={{ padding: "4px 8px", textAlign: "center", fontSize: 11 }}>
                  Redistributed: {totalRedistribution.toFixed(1)}🐟
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Summary showing community governance effectiveness
  function EndSummary() {
    const totalRedistribution = history.reduce((sum, h) => sum + h.redistributionAmount, 0);
    const allPrinciples = [...new Set(history.flatMap((h) => h.activeOstromPrinciples))];

    // Calculate economic metrics
    const totalFishCaught = history.reduce((sum, h) => sum + (h.totalCatch ?? 0), 0);
    const moanaCostSum = history.reduce((sum, h) => sum + (h.moanaCost ?? 0), 0);
    const chiefsCostSums = otherChiefs.map((_, i) =>
      history.reduce((sum, h) => sum + (h.otherCosts && h.otherCosts[i] !== undefined ? h.otherCosts[i] : 0), 0),
    );
    const totalCost = moanaCostSum + chiefsCostSums.reduce((sum, cost) => sum + cost, 0);
    const avgCostPerFish = totalFishCaught > 0 ? totalCost / totalFishCaught : 0;

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
            🏛️ <strong>{scenario === "democratic" ? "Democratic Council" : "Moana-Led Governance"}</strong> Results
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            🐟 <strong>{Math.round(totalFishCaught)}</strong> fish caught {"·"} 💰{" "}
            <strong>${avgCostPerFish.toFixed(2)}</strong> average cost per fish
          </div>
          {scenario === "democratic" && (
            <div style={{ fontSize: 12, marginBottom: 8, color: "#10b981", fontStyle: "italic" }}>
              ✨ Community Benefit: Lower costs through coordinated fishing
            </div>
          )}
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            ↔️ Fish Redistributed: <strong>{totalRedistribution.toFixed(1)}🐟</strong>
          </div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            🌊 <strong>{Math.round(fishStock)}</strong> fish remaining in ocean
          </div>
        </div>

        {/* Ostrom Principles Active */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>🎯 Active Ostrom Principles:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {allPrinciples.map((principle, i) => (
              <span
                key={i}
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                }}
              >
                {principle}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #bae6fd", borderRadius: 8, padding: 18, margin: "18px 0", background: "#f8fafc" }}>
      <ScenarioSelector />
      <ResultsTable />
      <EndSummary />
    </div>
  );
};

// My Blog Post Component

const TragedyOfCommonsFishing: React.FC = () => {
  return (
    <article>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

Every day, we make seemingly rational decisions that, collectively, destroy the very resources we depend on. From not buying electric cars because they might be inconvenient to depleting groundwater aquifers, we face a paradox that has puzzled scientists for a long time.

This raises a fundamental question: **How should we govern common pool resources?**

In unrestrained scenarios, these resources deplete and collapse. This led to the widespread belief that only the state or the market can effectively govern common resources. However, Elinor Ostrom demonstrated that communities can self-organize to govern common resources successfully. This earned her the economics [Nobel Prize in 2009](https://www.nobelprize.org/prizes/economic-sciences/2009/ostrom/facts/) as the first woman to receive the award in that category. She explored this through carefully designed social experiments and real-world case studies, which I will examine here through interactive simulations.

Throughout the blog post, we look into the topic through the lens of Moana's journey. we'll explore three approaches to solving this dilemma:

💰 **The Market Solution:** Tradeable fishing quotas that reward efficiency - but what about equity?

🏛️ **The State Solution:** An Island Fishing Authority with centralized control - effective but costly?

🤝 **The Community Solution:** The chiefs create their own rules together - can self-governance work?

## From Theory to Reality: A Chief's Dilemma

But how do these abstract governance theories play out in practice? To understand this, let's step into the sandals of someone facing exactly these choices every single day.

Meet Moana - no longer the adventurous teenager from Disney's story, but now a seasoned chief responsible for her island's survival. Each morning, she faces a decision that will determine whether her people can eat well or go hungry: how many fishing boats should she send out to the shared waters that sustain 
not just her community, but three neighboring islands as well?

The neighboring islands' chiefs have called a meeting. The fish that have sustained these communities for generations are becoming scarcer. 
The great tuna schools that once appeared predictably now show up only occasionally. A decision must be made about how to manage their shared waters.

This isn't just a thought experiment. Fishing provides the perfect lens to examine common pool resource governance because it's visual, well-documented in research, 
and demonstrates the key tensions between individual incentives and collective welfare. This scenario captures the essential elements of any common pool resource dilemma - whether it's fisheries, groundwater, grazing lands, or even digital commons like open-source software.

### The fundamental dynamics of common pool resources

The situation Moana faces demonstrates the core elements present in all common pool resource scenarios:
            
- Multiple decision-makers (Moana and the three other chiefs) choose resource extraction levels
- Individual decisions aggregate to affect the shared resource (fish stock)
- Each participant's catch depends on both their effort and the total pressure on the resource
- Resource regeneration occurs, but extraction can exceed sustainable levels


To understand how these dynamics play out, let&rsquo;s experience Moana&rsquo;s dilemma firsthand. As she sits 
with the other three chiefs overlooking the shared fishing grounds, each faces identical incentives, but their
collective choices will determine everyone&rsquo;s fate:
            `}</ReactMarkdown>

      <FishingGameSimulator />
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
How did the simulation go? Most likely, you found it challenging to maintain fish stock stability.
It's difficult to resist the temptation to fish intensively, especially when other chiefs do the same.

The dilemma Moana faces illustrates the classic **Tragedy of the Commons**. This concept, popularized by [Garrett Hardin in 1968](https://math.uchicago.edu/~shmuel/Modeling/Hardin,%20Tragedy%20of%20the%20Commons.pdf), describes how rational individual choices can lead to irrational collective outcomes - depleting shared resources that everyone depends on.

But this raises the central question: **If individual rationality leads to collective irrationality, what governance mechanisms can solve this dilemma?**

## State solutions: The centralized authority approach

Back on her island, Moana stares at the empty nets from yesterday&rsquo;s failed cooperation. The other chiefs are equally frustrated. &ldquo;This can&rsquo;t continue,&rdquo; Chief Kai declares. &ldquo;We need rules - someone above all of us who sets limits and enforces them fairly.&rdquo;

Within days, they contact the Regional Maritime Authority. The solution feels natural: surrender their fishing decisions to an Island Fishing Authority with centralized control. For Moana, this means no more daily choices about boat deployments - that responsibility now belongs to others.

**The centralized approach:** An Island Council sets fishing limits, monitors compliance, and enforces penalties. However, the Authority quickly discovers that equal treatment isn't necessarily fair treatment - the islands have vastly different fishing costs:

- **Moana's Island**: $0.125 per boat (modern harbor, efficient boats)
- **Kai's Island**: $0.25 per boat (decent infrastructure)  
- **Tala's Island**: $0.75 per boat (remote location, older equipment)
- **Sina's Island**: $1.00 per boat (very remote, harsh conditions)

This creates the central policy dilemma: equal quotas or economic efficiency? Try both approaches below:

      `}</ReactMarkdown>
      <IslandEfficiencyDemonstratorWithRounds />
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

**What the Results Show:**

The cost differences create significant fairness challenges. In the "🌍 Equal Responsibility Policy", everyone fishes sustainably at the same level - but Sina's island pays 8 times more per fish than Moana's island! In the "💰 Market-Driven Approach", each island fishes at their economically optimal level - but this means efficient islands like Moana's catch much more fish.

Neither approach is perfect: equal fishing quotas seem fair in principle but create economic hardship for less efficient islands. Market-driven approaches seem economically efficient but can lead to inequality in outcomes. This is why real-world commons governance often needs more sophisticated solutions that balance both equity and efficiency concerns.


As you can see from the simulation, centralized regulation successfully prevents the tragedy of the commons. The fish stocks remain stable, and systematic management replaces chaotic individual decisions.

After months under this system, Moana observes both the benefits and costs: *"No more sleepless nights wondering about boat deployments - the Authority decides everything. The fish are recovering, but the bureaucracy is expensive and my crews have lost their drive to innovate when quotas are fixed."*

The simulation reveals the core tension: equal access ensures fairness but sacrifices efficiency, while efficiency-based allocation maximizes output but creates inequality.

### A market refinement: Individual Transferable Quotas (ITQs)

Recognizing the efficiency problems, the Authority proposes a refinement: **Individual Transferable Quotas (ITQs)**. The government still sets total sustainable fishing limits, but now chiefs can buy and sell their fishing rights to each other. 

This allows efficient fishers like Moana to expand while maintaining overall sustainability. However, as quota prices rise, wealthy chiefs can monopolize access, excluding traditional fishing families. As Moana reflects: *"This system rewards skill and saves fish, but I&rsquo;ve watched smaller islands get priced out entirely."*

This sets the stage for Ostrom's breakthrough insight: communities can govern themselves.

## Ostrom's Community Solution: Learning from Failure

After months of failed cooperation and bureaucratic frustration, Moana realizes something crucial: **"We keep trying solutions that worked elsewhere, but we never asked what makes solutions work at all."**

**The Missing Piece:** Elinor Ostrom asked the same question. Her research revealed that successful community resource management isn't about finding the "right" rules—it's about building the right **institutions** for making and adapting rules.

**From Tragedy to Success:** What transforms a failing commons into a thriving one? Through studying [thousands of cases worldwide](https://www.actu-environnement.com/media/pdf/ostrom_1990.pdf) Ostrom identified eight institutional design principles that separate successful commons from failures:

**Ostrom's Eight Design Principles:**

1. **Clearly defined boundaries** - Everyone knows who belongs to the fishing community and what waters they govern
2. **Collective choice arrangements** - The chiefs affected by fishing rules participate in making and changing them  
3. **Monitoring** - Community members keep watch over each other's compliance, not outside enforcers
4. **Graduated sanctions** - Violations start with warnings, escalate fairly—building trust, not resentment
5. **Conflict resolution mechanisms** - Chiefs have ways to resolve disputes locally and quickly
6. **Recognition of rights to organize** - External authorities (like the Regional Maritime Authority) respect their self-governance
7. **Nested enterprises** - Rules work at multiple levels—daily fishing decisions, seasonal planning, long-term stock management
8. **Congruence with local conditions** - Rules match the unique conditions of their specific waters and communities

**Moana's Leadership Challenge:** Real community leadership isn't about making one perfect decision—it's about balancing multiple competing concerns simultaneously. Watch how each rotating leader faces three interconnected choices that affect different aspects of community welfare:

1. **Resource Conservation Strategy**: How aggressive should we be in protecting fish stocks for future generations?
2. **Fair Distribution Method**: Should fishing quotas be allocated equally, based on efficiency, or through a balanced approach?
3. **Community Redistribution Policy**: How much should successful fishers share with struggling islands to maintain social cohesion?

Each decision activates different Ostrom principles and creates different community outcomes. Experience how these institutional elements play out in practice:

            `}</ReactMarkdown>

      <CommunityGovernanceSimulator />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

**Understanding Multi-Dimensional Leadership:** The simulation demonstrates that effective community governance requires leaders to simultaneously balance:

- **Sustainability vs. Immediate Needs**: Conservation strategies determine long-term resource health
- **Equality vs. Efficiency**: Distribution methods affect fairness and economic optimization  
- **Individual Success vs. Community Cohesion**: Redistribution policies maintain social stability

**The Deeper Lesson:** Notice how the *process* of governance—who decides, how monitoring works, how conflicts are resolved—matters more than the specific fishing quotas chosen. Democratic rotation implements 6-7 of Ostrom's principles simultaneously, while hierarchical governance implements only 2-3.

**What makes community solutions different?** Unlike markets that rely on prices or states that impose rules, communities create governance systems where the people affected by decisions are the ones making them. Moana's council demonstrates this: the chiefs who depend on the fish are the same people setting fishing limits and monitoring compliance.

## Personal Reflections: Why This Matters

This exploration through Moana's world has been more revealing than I expected. It's forced me to recognize that a lot of meaningful work happens not in markets or under government regulation, but in community spaces - research collaborations, open-source projects, innovation networks where informal governance determines whether we succeed or fail.

The tragedy of the commons isn't just an abstract economic concept. It's the daily reality of every shared Slack channel that becomes chaotic, every open-source project that fragments, every research community that loses focus. But Ostrom's work suggests these failures aren't inevitable.

**It makes you wonder how to apply commons governance to knowledge work:**
- **Clearly defined boundaries:** Who belongs to this research community? What counts as contribution?
- **Collective choice:** Do the people doing the work have a voice in setting priorities?  
- **Monitoring:** How do we track contributions without destroying intrinsic motivation?
- **Graduated sanctions:** How do we handle free-riders without creating surveillance culture?

Writing this has convinced me that there is a lot to learn in the context of innovation management. It depends less on perfecting market mechanisms and more on learning to govern knowledge commons well. TBC.
            `}</ReactMarkdown>
    </article>
  );
};

export default TragedyOfCommonsFishing;

// Post metadata
export const meta = {
  title: "Tale of Four Islands: Solutions to the Tragedy of the Commons",
  publishing_date: "2025-07-21",
};
