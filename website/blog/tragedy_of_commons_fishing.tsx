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
        name: "⚖️ Equal Access Policy",
        description: "All islands fish at the same sustainable level regardless of their individual costs",
      },
      aggressive: {
        name: "📈 Efficiency-Based Fishing",
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
                  Fish • Cost
                </th>
                {otherChiefs.map((chief) => (
                  <th key={chief} style={{ padding: "6px 8px", fontSize: 12 }}>
                    {chief.replace("Chief ", "")}
                    <br />
                    Fish • Cost
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
      principles.push("Clearly defined boundaries");
      principles.push("Collective choice arrangements");
      if (leader !== 0) principles.push("Graduated sanctions"); // When others lead
      principles.push("Monitoring by community members");
      principles.push("Conflict resolution mechanisms");
    } else {
      principles.push("Clearly defined boundaries");
      if (leader === 0) principles.push("Monitoring by authorities"); // Moana-led monitoring
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
      const strategyColors = {
        conservative: "#10b981",
        moderate: "#f59e0b",
        aggressive: "#dc2626",
      };

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
            <span title={`Konservierung: ${strategy}`}>
              {conservationIcons[strategy as keyof typeof conservationIcons] || "❓"}
            </span>
            <span title={`Verteilung: ${distributionMethod || "unbekannt"}`}>
              {distributionMethod
                ? distributionIcons[distributionMethod as keyof typeof distributionIcons] || "❓"
                : "❓"}
            </span>
            <span title={`Umverteilung: ${redistributionPolicy || "unbekannt"}`}>
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
          <div style={{ fontWeight: "600", marginBottom: "6px" }}>Leadership Decisions (3 Icons per Decision):</div>

          {/* Conservation Strategy Icons */}
          <div style={{ marginBottom: "4px" }}>
            <strong>Conservation:</strong>
            <span style={{ marginLeft: "8px" }}>🛡️ conservative</span>
            <span style={{ marginLeft: "8px" }}>⚖️ moderate</span>
            <span style={{ marginLeft: "8px" }}>⚔️ aggressive</span>
          </div>

          {/* Distribution Method Icons */}
          <div style={{ marginBottom: "4px" }}>
            <strong>Distribution:</strong>
            <span style={{ marginLeft: "8px" }}>🟰 equal</span>
            <span style={{ marginLeft: "8px" }}>🔄 hybrid</span>
            <span style={{ marginLeft: "8px" }}>⚡ efficiency</span>
          </div>

          {/* Redistribution Policy Icons */}
          <div>
            <strong>Redistribution:</strong>
            <span style={{ marginLeft: "8px" }}>🔐 conservative</span>
            <span style={{ marginLeft: "8px" }}>🔄 moderate</span>
            <span style={{ marginLeft: "8px" }}>🔓 progressive</span>
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
      <h1>Games on the common pool ressources</h1>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

I recently wrote about the prisoners dilemma. However, while it is instructive, it is quite clear that it misses out
on major parts of our daily experiences, where it is quite obvious that cooperation is vital. In this I really like
the deeper look into the **Tragedy of the Commons**. This is a social dilemma that occurs when individuals, acting independently 
according to their own self-interest, deplete or spoil shared resources, leading to long-term collective harm.
In this context I kept coming back to the question of how can we govern common pools?

In the a completely unrestrained version it depletes and collapses. This led to the wide belief that only the state or the market can govern common resources.
However, Elinor Ostrom showed that communities can self-organize to govern common resources. And she did this again around beautiful social 
games, which I will explore here.
`}</ReactMarkdown>
      <p className={css({ lineHeight: "1.6", fontStyle: "italic", textAlign: "center" })}>
        &ldquo;Weder Staat noch Markt sind die einzigen Lösungen. Menschen können lernen, gemeinsame Ressourcen selbst
        zu verwalten.&rdquo; — Elinor Ostrom
      </p>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
## Setting up the scene
            

Given that we are talking about a social game, I really like the idea to look into the 
problem from the perspective of a specific person and its community. For the common pool the field 
of fishing is a great example that is visual and keeps coming back in the literature. So, we will set
up the scene around the famous Disney character Moana. 
            
She has now become the young chief of here island and therefore has to decide how many ships she has to send out every morning. The neighboring islands' chiefs have called an urgent meeting. The fish that have sustained your communities
          for generations are becoming scarce. The great tuna schools that once darkened the waters now appear only
          occasionally. **Something must be done, but what?**

### The dilemma of the island chiefs

We can now use this setting to sketch out the rule of the game.
            
- Each morning, Moana and the other three chief of the neighboring islands have to decide how many ships they send out to fish.
- In the evening they count the fish they caught and share it on the beach of each island.

            `}</ReactMarkdown>

      <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
        As Moana sits with the other three chiefs in the sacred meeting place overlooking the shared fishing grounds,
        the dilemma becomes crystal clear. Each chief faces the same choice:
      </p>

      <FishingGameSimulator />
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
How did the game go? Most likely, you also had a hard time to keep the fish stock stable.
It is just hard to resist the temptation to fish intensively, especially when you see the other chiefs doing it.
The dilemma Moana faces is a classic example of the **Tragedy of the Commons**. This concept, popularized by Garrett Hardin in 1968, describes how individuals acting in their 
own self-interest can deplete shared resources, leading to long-term collective harm. 

## State solutions: The Island Authority approach

Back on her island, Moana stares at the empty nets from yesterday's failed cooperation. The other chiefs are equally frustrated. "This can't continue," Chief Kai declares. "We need rules - someone above all of us who sets limits and enforces them fairly."

The idea feels natural and straightforward: create an Island Fishing Authority.

**How government regulation works:**
- **Central Authority:** The Island Council sets strict fishing limits for each chief
- **Fixed Quotas:** Each chief gets exactly the same amount - no trading allowed  
- **Monitoring:** Government boats patrol the waters to prevent cheating
- **Penalties:** Violators face escalating fines: warning → fishing ban → exile from fishing grounds
- **Scientific Management:** Marine biologists determine sustainable catch levels based on data

      `}</ReactMarkdown>
      <IslandEfficiencyDemonstratorWithRounds />
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

Government regulation successfully prevents the tragedy of the commons and ensures fair access for all chiefs. However, this approach comes at a high price: expensive bureaucracy, slow adaptation to changes, and reduced innovation incentives. As Moana observes: *"This saves the fish and keeps things fair, but the costs are enormous and chiefs have no reason to improve their methods."*

## A market refinement: Individual Transferable Quotas (ITQs)

Another approach combines market mechanisms with government limits: **Individual Transferable Quotas (ITQs)**. The government sets total sustainable fishing limits, but chiefs can buy and sell their fishing rights to each other. This allows efficient fishers to expand while maintaining overall sustainability. However, wealthy chiefs can monopolize access, excluding traditional fishing families. As Moana reflects: *"This rewards skill and saves fish, but creates new inequalities when some can't afford rising quota prices."*

This sets the stage for Ostrom's breakthrough insight: communities can govern themselves.

## Ostrom's Community Solution: The Fishing Council

Frustrated with both market inequality and government bureaucracy, Moana calls for a traditional "Fishing Council" meeting. "Our ancestors managed these waters for centuries without markets or bureaucrats," she reflects. "What if we can find our own way?"

**The Community Approach:**
- **Self-governance:** The four chiefs create their own rules together
- **Peer monitoring:** Chiefs keep an eye on each other voluntarily
- **Graduated sanctions:** Fair consequences that escalate only if needed
- **Adaptive management:** Rules can change when conditions change

            `}</ReactMarkdown>

      <CommunityGovernanceSimulator />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

**What makes community governance work?** Moana's experiment demonstrates Ostrom's key insight: **neither markets nor governments are necessary if communities can organize themselves effectively.** But this requires careful attention to institutional design.

**The Community Solution Trade-offs:**

**✅ Advantages:**
- **High legitimacy:** Rules created by those who must follow them
- **Cultural fit:** Solutions match local values and knowledge
- **Low costs:** No expensive enforcement infrastructure needed
- **Flexibility:** Can adapt quickly to changing conditions
- **Social cohesion:** Builds trust and cooperation within the community

**⚠️ Challenges:**
- **Setup complexity:** Requires time and skill to design good institutions
- **Scale limits:** Works best with small, tight-knit communities
- **External threats:** Vulnerable to outside interference or competition
- **Free-rider risk:** Success depends on widespread participation
- **Conflict management:** Disputes can escalate without proper mechanisms

**Moana's reflection:** *"This feels right - we're solving our problem together, not having solutions imposed on us. But it requires all of us to really commit to making it work. And we need to be smart about how we design our rules, or it could fall apart like the free-for-all did."*

            `}</ReactMarkdown>
    </article>
  );
};

export default TragedyOfCommonsFishing;

// Post metadata
export const meta = {
  title: "Tragedy of the Commons: Moana's Choice",
  description: "Ein narratives, interaktives Blogspiel zur Tragedy of the Commons und Ostroms Theorien.",
};
