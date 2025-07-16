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
            🐟 <strong>{Math.round(totalFishCaught)}</strong> fish caught • 💰 <strong>${totalCost.toFixed(2)}</strong> total cost
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

// My Blog Post Component

const TragedyOfCommonsFishing: React.FC = () => {
  return (
    <article>
      <h1>Games on the common pool ressources</h1>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

I recently wrote about the prisoners dilemma. However, it feels really gloomy and not that realistic.
So I started to look around into more complex games that might apply more directly to my life experiences. In this
context I kept coming back to the question of how can we govern common pools ?

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

**Real-world examples:**
- **🇳🇴 Norway:** Combines government quotas with strong enforcement
- **🇨🇦 Canada:** Strict regulations, but enforcement challenges in remote areas
- **🇪🇺 European Union:** Common Fisheries Policy with complex quota negotiations
- **🇯🇵 Japan:** Traditional government-managed coastal fishing zones

**Moana's experience with state regulation:**

**✅ The benefits:**
- **Guaranteed fairness:** Every chief gets equal access regardless of wealth
- **Social stability:** No market-driven inequality or community disruption
- **Democratic control:** Fishing rules decided through island council votes
- **Long-term planning:** Government can consider environmental goals beyond profit

**⚠️ The challenges:**
- **High costs:** Patrol boats, inspectors, and bureaucracy are expensive
- **Inflexibility:** Quotas can't adjust quickly to changing conditions
- **Enforcement problems:** Difficult to monitor every fishing boat every day
- **Reduced innovation:** No incentive for chiefs to develop better fishing methods
- **Political capture:** Fishing regulations might favor politically connected chiefs

As Moana watches the government system in action, she observes: *"This is fairer than the free-for-all - no one gets left behind. But it's so slow and expensive! And some chiefs are already finding ways around the rules when the patrol boats aren't watching. Plus, talented fishers like Chief Kai have no incentive to innovate since they can't benefit from their skills."*

**The state solution trade-off:** Government regulation prioritizes equity and democratic control, but often at the cost of efficiency and innovation. It prevents the tragedy of the commons, but creates new challenges around enforcement, bureaucracy, and adaptability.

## A market refinement: Individual Transferable Quotas (ITQs)

Frustrated with the bureaucracy and inefficiencies of government control, Chief Tala arrives with news from the outer islands: "I've heard of something called 'fishing rights' - like owning pieces of the ocean itself. What if we could buy and sell the right to fish?"

The idea sounds strange at first, but as Moana learns more, it begins to make sense as a **hybrid solution** - combining government sustainability goals with market efficiency:

**How Individual Transferable Quotas work:**
- The island council still sets a **total sustainable limit** (say, 60 fish total)
- Each chief receives **tradeable fishing rights** (quotas) - initially 15 rights each
- Before fishing, chiefs can **buy and sell** these rights at market prices
- You can only send as many boats as you have quota rights
- The total catch is **automatically limited** to sustainable levels

**The key insight:** Government sets the environmental limit, but the market decides who gets to fish. If you're a skilled fisher, you can buy more rights and profit. If you prefer other activities, you can sell your rights and earn money without fishing.
      `}</ReactMarkdown>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

**Real-world success stories:**
- **🇮🇸 Iceland:** ITQs saved their fishing industry after near-collapse in the 1980s
- **🇳🇿 New Zealand:** One of the world's most successful quota systems since 1986
- **🇺🇸 Alaska:** Combines ITQs with community protections for indigenous fishers
- **🇨🇱 Chile:** ITQs helped recover several fish species from overfishing

As Moana experiments with the trading system, she realizes both the **power and the problems** of this market-state hybrid:

**✅ The good:**
- **Automatic sustainability:** Total catch can never exceed the quota limit
- **Economic efficiency:** The best fishers get more access, maximizing total catch value
- **Flexibility:** Chiefs can adapt their fishing based on their skills and preferences
- **Lower enforcement costs:** Market mechanisms reduce need for government monitoring
- **Innovation incentives:** Efficient fishing techniques become more valuable

**⚠️ The concerns:**
- **Wealth concentration:** Rich chiefs can buy up all the rights, excluding smaller fishers
- **Community disruption:** Traditional fishing families might lose access to their livelihood
- **Price volatility:** Sudden changes in quota prices can destabilize island economies
- **Social inequality:** The market rewards efficiency over need or tradition

Moana reflects: *"This is more efficient than pure government control, and still keeps the fish safe. But what happens to Chief Sina's family, who've fished these waters for generations but can't afford the rising quota prices? We've solved the efficiency problem, but created new inequality. There must be another way..."*

**The fundamental trade-off:** ITQs excel at combining sustainability with efficiency, but they can sacrifice equity and community values. They prevent both the tragedy of the commons and bureaucratic inefficiency, but might create a different kind of tragedy - the tragedy of the market.

**Moana's growing realization:** *"Both markets and government have their place, but both also have serious flaws. The market excluded the poor, and the state stifles innovation. There must be another way - something that combines the best of both while avoiding their worst problems..."*

This sets the stage for Ostrom's breakthrough insight: communities can govern themselves.

## Ostrom's Community Solution: The Fishing Council

Frustrated with both market inequality and government bureaucracy, Moana calls for a traditional "Fishing Council" meeting. "Our ancestors managed these waters for centuries without markets or bureaucrats," she reflects. "What if we can find our own way?"

**The Community Approach:**
- **Self-governance:** The four chiefs create their own rules together
- **Peer monitoring:** Chiefs keep an eye on each other voluntarily
- **Graduated sanctions:** Fair consequences that escalate only if needed
- **Adaptive management:** Rules can change when conditions change

[SIMULATOR: Community Rule Builder]

            `}</ReactMarkdown>

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
