import React, { useState } from "react";
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
  c_islands: [0.125, 0.25, 0.375, 0.5],

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
  return Math.sqrt((MODEL_PARAMS.y0 * s_t) / c_t) / MODEL_PARAMS.nplayers;
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
                    background: idx === round - 1 && !gameOver ? "#f0fdf4" : idx % 2 === 0 ? "#f8fafc" : "#fff",
                  }}
                >
                  <td
                    style={{
                      padding: "4px 8px",
                      textAlign: "center",
                      fontWeight: idx === round - 1 && !gameOver ? 600 : 400,
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
      default:
        // Competition Islands: Every chief fights for maximum catch (use calculated competitive boats)
        otherBoats = otherChiefs.map(
          () => Math.floor(Math.random() * 4) + Math.max(8, OPTIMAL_BOATS.intensive_fishing - 2),
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
    setScenario("sustainable");
  }

  // Scenario Selector Component
  function ScenarioSelector() {
    const scenarios = {
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
                    background: idx === round - 1 && !gameOver ? "#f0fdf4" : idx % 2 === 0 ? "#f8fafc" : "#fff",
                  }}
                >
                  <td
                    style={{
                      padding: "4px 8px",
                      textAlign: "center",
                      fontWeight: idx === round - 1 && !gameOver ? 600 : 400,
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

// Island Efficiency Demonstrator Component - Three-Button Scenario Switcher
const IslandEfficiencyDemonstrator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<"none" | "regulation" | "efficient">("none");

  // Island parameters: different fishing costs per boat (from notebook)
  const islands = [
    { name: "Motunui (Moana)", cost: 0.125, maxBoats: 20, emoji: "🌺" },
    { name: "Te Fiti Island", cost: 0.25, maxBoats: 15, emoji: "🌿" },
    { name: "Lalotai Island", cost: 0.375, maxBoats: 12, emoji: "🦀" },
    { name: "Tamatoa Island", cost: 0.5, maxBoats: 10, emoji: "💎" },
  ];

  // Fishing parameters (from notebook)
  const FISH_STOCK = 100;
  const CATCH_EFFICIENCY = 0.01; // y0
  const GROWTH_RATE = 0.03; // g0
  const GROWTH_DECLINE = 0.001; // g1

  // Calculate sustainable boats: b_sust = (g0/y0 * (1 - g1*s))^2
  const SUSTAINABLE_LIMIT = Math.pow((GROWTH_RATE / CATCH_EFFICIENCY) * (1 - GROWTH_DECLINE * FISH_STOCK), 2);

  const calculateResults = (scenarioType: "regulation" | "efficient") => {
    const nRounds = 3;
    const islandResults: {
      name: string;
      boats: number;
      cost: number;
      revenue: number;
      profit: number;
      status: string;
      emoji: string;
    }[] = [];

    // Initialize islands with zero totals
    islands.forEach((island) => {
      islandResults.push({
        name: island.name,
        boats: 0,
        cost: 0,
        revenue: 0,
        profit: 0,
        status: scenarioType === "regulation" ? "Fixed quota" : "Competitive fishing",
        emoji: island.emoji,
      });
    });

    // Track stock evolution and totals over multiple rounds
    let currentStock = FISH_STOCK;
    const stockEvolution = [currentStock];
    let totalBoatsAllRounds = 0;
    let totalCatchAllRounds = 0;
    let totalCostAllRounds = 0;

    // Simulate multiple rounds
    for (let round = 0; round < nRounds; round++) {
      const roundBoats: number[] = [];
      const roundCosts: number[] = [];

      if (scenarioType === "regulation") {
        // Government sets sustainable limit: each island gets equal quota
        const quotaPerIsland = Math.floor(SUSTAINABLE_LIMIT / islands.length);

        islands.forEach((island, idx) => {
          const boats = quotaPerIsland;
          const cost = boats * island.cost;

          roundBoats.push(boats);
          roundCosts.push(cost);

          // Add to cumulative totals
          islandResults[idx].boats += boats;
          islandResults[idx].cost += cost;
        });
      } else {
        // Market competition: each island fishes until marginal profit = 0
        islands.forEach((island, idx) => {
          // Calculate competitive boats based on current stock: b_c = (y0 * s_t / c_t)^2
          const competitiveBoats = Math.pow((CATCH_EFFICIENCY * currentStock) / island.cost, 2);
          const boats = Math.min(competitiveBoats, island.maxBoats);
          const cost = boats * island.cost;

          roundBoats.push(boats);
          roundCosts.push(cost);

          // Add to cumulative totals
          islandResults[idx].boats += boats;
          islandResults[idx].cost += cost;
        });
      }

      // Calculate round totals
      const totalBoatsThisRound = roundBoats.reduce((sum, boats) => sum + boats, 0);
      const totalCatchThisRound = calculateTotalCatch(currentStock, totalBoatsThisRound);
      const totalCostThisRound = roundCosts.reduce((sum, cost) => sum + cost, 0);

      // Distribute catch proportionally and add to cumulative revenue/profit
      roundBoats.forEach((boats, idx) => {
        const catchShare = totalBoatsThisRound > 0 ? (boats / totalBoatsThisRound) * totalCatchThisRound : 0;
        islandResults[idx].revenue += catchShare;
        islandResults[idx].profit += catchShare - roundCosts[idx];
      });

      // Update stock using the same logic as FishingGameSimulator
      const regeneration = calculateRegeneration(currentStock);
      currentStock = Math.max(0, currentStock - totalCatchThisRound + regeneration);
      stockEvolution.push(currentStock);

      // Add to grand totals
      totalBoatsAllRounds += totalBoatsThisRound;
      totalCatchAllRounds += totalCatchThisRound;
      totalCostAllRounds += totalCostThisRound;
    }

    // Calculate sustainability based on final stock
    const finalStock = stockEvolution[stockEvolution.length - 1];
    const stockHealthy = finalStock >= FISH_STOCK * 0.8; // 80% of original stock
    const sustainability = stockHealthy ? "Sustainable ✅" : "Overfishing ⚠️";

    // Calculate average boats per round for description
    const avgBoatsPerRound = totalBoatsAllRounds / nRounds;
    const quotaPerIsland = Math.floor(SUSTAINABLE_LIMIT / islands.length);

    return {
      islandResults,
      totalBoats: Math.round(totalBoatsAllRounds),
      totalCatch: totalCatchAllRounds,
      totalCost: totalCostAllRounds,
      totalProfit: islandResults.reduce((sum, island) => sum + island.profit, 0),
      sustainability,
      stockEvolution,
      finalStock: Math.round(finalStock),
      description:
        scenarioType === "regulation"
          ? `🏛️ **State Regulation**: Fixed quotas (${quotaPerIsland} boats each per round). Final stock: ${Math.round(finalStock)} fish.`
          : `💰 **Market Competition**: Average ${Math.round(avgBoatsPerRound)} boats per round. Final stock: ${Math.round(finalStock)} fish.`,
      insight:
        scenarioType === "regulation"
          ? "State regulation maintains fish stocks but is expensive because it forces inefficient (high-cost) islands to fish alongside efficient ones."
          : "Market competition minimizes costs by prioritizing efficient (low-cost) islands, but total fishing effort exceeds sustainable limits.",
    };
  };

  const results = selectedScenario !== "none" ? calculateResults(selectedScenario as "regulation" | "efficient") : null;

  return (
    <div
      className={css({
        border: "2px solid #059669",
        borderRadius: "12px",
        padding: "24px",
        margin: "24px 0",
        backgroundColor: "#f0fdf4",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      })}
    >
      <h3
        className={css({
          fontSize: "24px",
          fontWeight: "bold",
          color: "#065f46",
          marginBottom: "16px",
          textAlign: "center",
        })}
      >
        🏝️ Island Efficiency Demonstrator
      </h3>

      <p
        className={css({
          fontSize: "16px",
          marginBottom: "20px",
          color: "#374151",
          lineHeight: "1.6",
          textAlign: "center",
        })}
      >
        The islands have different fishing costs. This creates a fundamental trade-off between **sustainability** and
        **economic efficiency**:
      </p>

      {/* Three Scenario Buttons */}
      <div
        className={css({
          display: "flex",
          gap: "16px",
          marginBottom: "24px",
          flexWrap: "wrap",
          justifyContent: "center",
        })}
      >
        <button
          onClick={() => setSelectedScenario("regulation")}
          className={css({
            backgroundColor: selectedScenario === "regulation" ? "#2563eb" : "#dbeafe",
            color: selectedScenario === "regulation" ? "#ffffff" : "#2563eb",
            padding: "16px 20px",
            borderRadius: "8px",
            border: "2px solid #2563eb",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            minWidth: "160px",
            "&:hover": {
              backgroundColor: "#2563eb",
              color: "#ffffff",
            },
          })}
        >
          🏛️ State Regulation
        </button>

        <button
          onClick={() => setSelectedScenario("efficient")}
          className={css({
            backgroundColor: selectedScenario === "efficient" ? "#dc2626" : "#fee2e2",
            color: selectedScenario === "efficient" ? "#ffffff" : "#dc2626",
            padding: "16px 20px",
            borderRadius: "8px",
            border: "2px solid #dc2626",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            minWidth: "160px",
            "&:hover": {
              backgroundColor: "#dc2626",
              color: "#ffffff",
            },
          })}
        >
          💰 Market Competition
        </button>
      </div>

      {/* Results Display */}
      {results && (
        <div
          className={css({
            backgroundColor: "#ffffff",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          })}
        >
          <div
            className={css({
              marginBottom: "20px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            })}
          >
            <p
              className={css({
                fontSize: "16px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              })}
            >
              {results.description}
            </p>
            <p
              className={css({
                fontSize: "14px",
                color: "#6b7280",
                fontStyle: "italic",
              })}
            >
              {results.insight}
            </p>
          </div>

          {/* Summary Stats */}
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            })}
          >
            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Total Boats</div>
              <div className={css({ fontSize: "18px", fontWeight: "bold", color: "#1f2937" })}>
                {results.totalBoats}
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Total Catch</div>
              <div className={css({ fontSize: "18px", fontWeight: "bold", color: "#1f2937" })}>
                {results.totalCatch.toFixed(1)}
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Total Cost</div>
              <div className={css({ fontSize: "18px", fontWeight: "bold", color: "#1f2937" })}>
                {results.totalCost.toFixed(2)}
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Net Profit</div>
              <div
                className={css({
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: results.totalProfit >= 0 ? "#059669" : "#dc2626",
                })}
              >
                {results.totalProfit.toFixed(2)}
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Sustainability</div>
              <div className={css({ fontSize: "16px", fontWeight: "bold", color: "#1f2937" })}>
                {results.sustainability}
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Fish Stock After</div>
              <div
                className={css({
                  fontSize: "18px",
                  fontWeight: "bold",
                  color:
                    results.finalStock >= FISH_STOCK * 0.8
                      ? "#059669"
                      : results.finalStock >= FISH_STOCK * 0.6
                        ? "#f59e0b"
                        : "#dc2626",
                })}
              >
                {results.finalStock} 🐟
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "4px" })}>Cost/Efficiency</div>
              <div
                className={css({
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: results.totalCost < 5 ? "#059669" : "#dc2626",
                })}
              >
                {results.totalCost < 5 ? "Efficient 💰" : "Expensive 💸"}
              </div>
            </div>
          </div>

          {/* Island Details */}
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            })}
          >
            {results.islandResults.map((island) => (
              <div
                key={island.name}
                className={css({
                  padding: "16px",
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  border: "2px solid #e5e7eb",
                  position: "relative",
                })}
              >
                <div
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "8px",
                  })}
                >
                  <span className={css({ fontSize: "20px", marginRight: "8px" })}>{island.emoji}</span>
                  <div className={css({ fontWeight: "600", fontSize: "16px", color: "#1f2937" })}>{island.name}</div>
                </div>

                <div className={css({ fontSize: "12px", color: "#6b7280", marginBottom: "8px" })}>
                  Cost per boat: ${island.cost.toFixed(3)}
                </div>

                <div className={css({ fontSize: "14px", color: "#374151", marginBottom: "8px" })}>
                  <strong>Boats:</strong> {island.boats} | <strong>Revenue:</strong> ${island.revenue.toFixed(2)}
                </div>

                <div className={css({ fontSize: "14px", color: "#374151", marginBottom: "12px" })}>
                  <strong>Cost:</strong> ${island.cost.toFixed(2)} | <strong>Profit:</strong>{" "}
                  <span
                    className={css({
                      color: island.profit >= 0 ? "#059669" : "#dc2626",
                      fontWeight: "600",
                    })}
                  >
                    ${island.profit.toFixed(2)}
                  </span>
                </div>

                <div
                  className={css({
                    fontSize: "12px",
                    fontWeight: "600",
                    color: island.status.includes("Excluded") ? "#dc2626" : "#059669",
                    backgroundColor: island.status.includes("Excluded") ? "#fee2e2" : "#d1fae5",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    textAlign: "center",
                  })}
                >
                  {island.status}
                </div>
              </div>
            ))}
          </div>

          {/* Stock Evolution Chart */}
          <div
            className={css({
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4
              className={css({
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#374151",
              })}
            >
              📊 Fish Stock Evolution ({results.stockEvolution.length - 1} rounds)
            </h4>
            <div
              className={css({
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                alignItems: "end",
                marginBottom: "12px",
              })}
            >
              {results.stockEvolution.map((stock, round) => (
                <div key={round} className={css({ textAlign: "center" })}>
                  <div
                    className={css({
                      width: "40px",
                      height: `${Math.max(20, (stock / FISH_STOCK) * 80)}px`,
                      backgroundColor:
                        stock >= FISH_STOCK * 0.8 ? "#059669" : stock >= FISH_STOCK * 0.6 ? "#f59e0b" : "#dc2626",
                      borderRadius: "4px",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "end",
                      justifyContent: "center",
                      paddingBottom: "4px",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "600",
                    })}
                  >
                    {Math.round(stock)}
                  </div>
                  <div className={css({ fontSize: "12px", color: "#6b7280" })}>
                    {round === 0 ? "Start" : `Round ${round}`}
                  </div>
                </div>
              ))}
            </div>
            <div
              className={css({
                textAlign: "center",
                fontSize: "14px",
                color:
                  results.finalStock >= FISH_STOCK * 0.8
                    ? "#059669"
                    : results.finalStock >= FISH_STOCK * 0.6
                      ? "#f59e0b"
                      : "#dc2626",
                fontWeight: "600",
              })}
            >
              Final Stock: {results.finalStock} fish ({((results.finalStock / FISH_STOCK) * 100).toFixed(0)}% of
              original)
            </div>
          </div>
        </div>
      )}

      {/* Initial instruction */}
      {selectedScenario === "none" && (
        <div
          className={css({
            textAlign: "center",
            padding: "32px",
            color: "#6b7280",
            fontSize: "16px",
            fontStyle: "italic",
          })}
        >
          Click a button above to explore the trade-off between sustainability and efficiency
        </div>
      )}

      {/* Key Insights */}
      <div
        className={css({
          marginTop: "20px",
          fontSize: "14px",
          color: "#6b7280",
          backgroundColor: "#f9fafb",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          lineHeight: "1.6",
        })}
      >
        <strong>Key Insights:</strong>
        <ul className={css({ marginLeft: "16px", marginTop: "8px" })}>
          <li>**State Regulation** maintains sustainability but forces inefficient (high-cost) islands to fish</li>
          <li>**Market Competition** minimizes costs by prioritizing efficient islands, but leads to overfishing</li>
          <li>This demonstrates the classic trade-off: environmental sustainability vs. economic efficiency</li>
        </ul>
      </div>
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
