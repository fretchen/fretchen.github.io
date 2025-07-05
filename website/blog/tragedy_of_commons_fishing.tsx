import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
import { css } from "../styled-system/css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Types
type GovernanceType = "none" | "quotas" | "ostrom";

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

  // Initial stock
  s_init: 100,

  // Number of players (4 total: Moana + 3 chiefs)
  nplayers: 4,
};

// Calculate sustainable and competitive boat numbers based on the notebook
const calculateOptimalBoats = () => {
  // Sustainable boats: b_sust = (g0/y0 * (1 - g1 * s_init))^2
  const b_sust = Math.pow((MODEL_PARAMS.g0 / MODEL_PARAMS.y0) * (1 - MODEL_PARAMS.g1 * MODEL_PARAMS.s_init), 2);

  // Competitive boats: b_c = (y0 * s_init / c0)^2
  const b_c = Math.pow((MODEL_PARAMS.y0 * MODEL_PARAMS.s_init) / MODEL_PARAMS.c0, 2);

  // Boats per player (divide total by number of players)
  const low_fishing = Math.floor(b_sust / MODEL_PARAMS.nplayers);
  const intensive_fishing = Math.floor(b_c / MODEL_PARAMS.nplayers);

  return { low_fishing, intensive_fishing, b_sust, b_c };
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
    let nextStock = currentStock - totalCatch + regeneration;
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
              Scenario is locked during the game. Use "Play again" to change scenarios.
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

    const scenarios = {
      random: { name: "🏝️ Mixed", color: "#f59e0b" },
      sustainable: { name: "🌊 Harmony", color: "#10b981" },
      aggressive: { name: "⚔️ Competition", color: "#ef4444" },
    };

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
        <div
          style={{
            textAlign: "center",
            marginBottom: 12,
            fontSize: 13,
            color: "#64748b",
          }}
        >
          Active Scenario:{" "}
          <span
            style={{
              color: scenarios[scenario].color,
              fontWeight: 600,
            }}
          >
            {scenarios[scenario].name}
          </span>
        </div>

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

// Governance Designer Component
const GovernanceDesigner: React.FC = () => {
  const [selectedGovernance, setSelectedGovernance] = useState<GovernanceType>("none");
  const [simulationResult, setSimulationResult] = useState<{
    sustainability: number;
    efficiency: number;
    fairness: number;
    cost: number;
  } | null>(null);

  const governanceOptions = {
    none: {
      name: "Keine Regulierung",
      description: "Jeder fischt so viel er will",
      sustainability: 20,
      efficiency: 70,
      fairness: 30,
      cost: 0,
    },
    quotas: {
      name: "Staatliche Quoten",
      description: "Feste Fangmengen pro Boot",
      sustainability: 80,
      efficiency: 60,
      fairness: 70,
      cost: 40,
    },
    ostrom: {
      name: "Ostrom'sche Selbstverwaltung",
      description: "8 Erfolgsprinzipien für Commons",
      sustainability: 88,
      efficiency: 78,
      fairness: 92,
      cost: 25,
    },
  };

  const testGovernance = (type: GovernanceType) => {
    setSelectedGovernance(type);
    setSimulationResult(governanceOptions[type]);
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#fefce8",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>⚖️ Governance-Designer</h3>

      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        })}
      >
        {Object.entries(governanceOptions).map(([key, option]) => (
          <button
            key={key}
            onClick={() => testGovernance(key as GovernanceType)}
            className={css({
              padding: "12px",
              backgroundColor: selectedGovernance === key ? "#fbbf24" : "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              "&:hover": { backgroundColor: "#fef3c7" },
            })}
          >
            <div className={css({ fontWeight: "bold", marginBottom: "4px" })}>{option.name}</div>
            <div className={css({ fontSize: "12px", color: "#6b7280" })}>{option.description}</div>
          </button>
        ))}
      </div>

      {simulationResult && (
        <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "6px" })}>
          <h4 className={css({ marginBottom: "12px", fontWeight: "bold" })}>
            Ergebnis: {governanceOptions[selectedGovernance].name}
          </h4>

          {selectedGovernance === "ostrom" && (
            <div
              className={css({
                backgroundColor: "#f0f9ff",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
                border: "1px solid #c7d2fe",
              })}
            >
              <h5 className={css({ fontWeight: "bold", marginBottom: "8px" })}>Elinor Ostroms 8 Erfolgsprinzipien:</h5>
              <div className={css({ fontSize: "14px", lineHeight: "1.5" })}>
                <div>
                  1. 🎯 <strong>Klare Grenzen:</strong> Wer gehört zur Gemeinschaft?
                </div>
                <div>
                  2. 📋 <strong>Lokale Regeln:</strong> An lokale Bedingungen angepasst
                </div>
                <div>
                  3. 🗳️ <strong>Partizipation:</strong> Betroffene gestalten Regeln mit
                </div>
                <div>
                  4. 👀 <strong>Monitoring:</strong> Gemeinschaft überwacht sich selbst
                </div>
                <div>
                  5. ⚖️ <strong>Graduierte Sanktionen:</strong> Faire, stufenweise Strafen
                </div>
                <div>
                  6. 🤝 <strong>Konfliktlösung:</strong> Schnelle, lokale Streitbeilegung
                </div>
                <div>
                  7. 🛡️ <strong>Anerkennung:</strong> Externe Autorität respektiert Autonomie
                </div>
                <div>
                  8. 🌐 <strong>Verschachtelte Systeme:</strong> Multi-Level Governance
                </div>
              </div>
            </div>
          )}

          <div className={css({ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" })}>
            {[
              { label: "Nachhaltigkeit", value: simulationResult.sustainability, color: "#10b981" },
              { label: "Effizienz", value: simulationResult.efficiency, color: "#3b82f6" },
              { label: "Fairness", value: simulationResult.fairness, color: "#8b5cf6" },
              { label: "Kosten", value: simulationResult.cost, color: "#ef4444" },
            ].map((metric) => (
              <div key={metric.label} className={css({ marginBottom: "8px" })}>
                <div className={css({ display: "flex", justifyContent: "space-between", marginBottom: "4px" })}>
                  <span className={css({ fontSize: "14px" })}>{metric.label}</span>
                  <span className={css({ fontSize: "14px", fontWeight: "bold" })}>{metric.value}%</span>
                </div>
                <div className={css({ width: "100%", backgroundColor: "#e5e7eb", borderRadius: "4px", height: "8px" })}>
                  <div
                    className={css({
                      height: "100%",
                      borderRadius: "4px",
                      backgroundColor: metric.color,
                      width: `${metric.value}%`,
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// My Blog Post Component

const TragedyOfCommonsFishing: React.FC = () => {
  return (
    <article>
      <h1>Games on the common pool ressources</h1>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

I recently wrote about the prisoners dilemma. However, it feels overly gloomy and the not that realistic.
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

So is there a rational choice? And what are options to govern the common pool resources such that
we protect the fish stock and ensure the well-being of the community in the long term ?
            `}</ReactMarkdown>
      <section className={css({ marginBottom: "32px" })}>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Was ist passiert?</strong> Wahrscheinlich haben Sie erlebt, was Millionen von Menschen vor Ihnen
          erlebt haben: Selbst mit den besten Absichten ist es schwer, nachhaltig zu handeln, wenn andere es nicht tun.
        </p>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Herzlichen Glückwunsch!</strong> Sie haben gerade eine der grundlegendsten mathematischen Fallen der
          menschlichen Zivilisation erlebt. Das Nash-Gleichgewicht zeigt:{" "}
          <em>Defektieren ist immer die rational beste Wahl</em> - egal was die anderen tun.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Ostrom's Durchbruch: Es gibt einen dritten Weg
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Jahrzehntelang glaubten Ökonomen, es gäbe nur zwei Lösungen für Commons-Probleme:
        </p>
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          <div
            className={css({
              backgroundColor: "#fef2f2",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            })}
          >
            <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>🏛️ Lösung 1: Der Staat</h4>
            <p className={css({ fontSize: "14px", lineHeight: "1.5" })}>
              Zentrale Kontrolle, Quoten, Strafen. Funktioniert, aber teuer und oft ineffizient.
            </p>
          </div>
          <div
            className={css({
              backgroundColor: "#fef2f2",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            })}
          >
            <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>💰 Lösung 2: Der Markt</h4>
            <p className={css({ fontSize: "14px", lineHeight: "1.5" })}>
              Privatisierung der Ressource. Kein Commons-Problem mehr, aber sozialer Ausschluss.
            </p>
          </div>
        </div>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Aber Elinor Ostrom verbrachte ihr Leben damit, <strong>erfolgreiche Gemeinschaften</strong> zu studieren, die
          Commons verwalten - ohne Staat, ohne Privatisierung. Von Fischerdörfern in der Türkei bis zu
          Bewässerungssystemen in Spanien.
        </p>
        <div
          className={css({
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            🌟 Ostrom's 8 Design-Prinzipien für Commons:
          </h4>
          <div className={css({ fontSize: "14px", lineHeight: "1.6" })}>
            <div className={css({ marginBottom: "8px" })}>
              1. <strong>Klare Grenzen:</strong> Wer gehört dazu, was ist die Ressource?
            </div>
            <div className={css({ marginBottom: "8px" })}>
              2. <strong>Lokale Regeln:</strong> An lokale Bedingungen angepasst
            </div>
            <div className={css({ marginBottom: "8px" })}>
              3. <strong>Partizipation:</strong> Betroffene können Regeln mitbestimmen
            </div>
            <div className={css({ marginBottom: "8px" })}>
              4. <strong>Monitoring:</strong> Überwachung durch die Gemeinschaft
            </div>
            <div className={css({ marginBottom: "8px" })}>
              5. <strong>Sanktionen:</strong> Graduierte Strafen bei Regelbruch
            </div>
            <div className={css({ marginBottom: "8px" })}>
              6. <strong>Konfliktlösung:</strong> Schnelle, günstige Mechanismen
            </div>
            <div className={css({ marginBottom: "8px" })}>
              7. <strong>Anerkennung:</strong> Externe Behörden akzeptieren das System
            </div>
            <div>
              8. <strong>Verschachtelte Institutionen:</strong> Mehrebenen-Governance
            </div>
          </div>
        </div>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Das Revolutionäre daran:</strong> Diese Prinzipien funktionieren nicht nur in Fischerdörfern. Sie
          erklären, warum Open-Source-Software funktioniert, warum manche Teams effektiver Wissen teilen, und warum
          bestimmte Online-Communities gedeihen.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Das Neufundland-Beispiel: Wenn Commons kollabieren
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Was Sie gerade im Spiel erlebt haben, passierte vor Neufundland über 40 Jahre hinweg. 1992 brach der
          Kabeljau-Bestand vollständig zusammen - <strong>40.000 Fischer verloren über Nacht ihre Jobs.</strong>
        </p>
        <div
          className={css({
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <p className={css({ fontWeight: "bold", marginBottom: "8px" })}>Die fatale Logik:</p>
          <div className={css({ fontSize: "14px", lineHeight: "1.6" })}>
            <em>&ldquo;Wenn ich heute nicht fische, fischt es jemand anders. Lieber ich als die Konkurrenz.&rdquo;</em>
          </div>
        </div>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Das Nash-Gleichgewicht in Aktion: Jeder handelt rational, das Ergebnis ist irrational.{" "}
          <strong>Ein Musterbeispiel der Tragedy of Commons.</strong>
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Lösungsansätze: Was hätte funktionieren können?
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Die gute Nachricht: Es gibt bewährte Lösungen für Commons-Probleme. Testen Sie verschiedene
          Governance-Systeme:
        </p>

        <GovernanceDesigner />

        <div
          className={css({
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>Erfolgreiche Beispiele:</h4>
          <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
            <li>
              <strong>Island:</strong> Handelbare Quoten (ITQ) retteten die Fischerei
            </li>
            <li>
              <strong>Maine Lobster:</strong> Community-Management durch Fischer-Kooperativen
            </li>
            <li>
              <strong>Neuseeland:</strong> Kombination aus Quoten und Technologie-Monitoring
            </li>
            <li>
              <strong>🏆 Ostrom-Beispiele:</strong> Spanische Huertas, Schweizer Alpweiden, philippinische Bewässerung
            </li>
          </ul>
        </div>

        <div
          className={css({
            backgroundColor: "#f0f9ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            🎓 Elinor Ostrom: Nobelpreis für Commons-Forschung
          </h4>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            2009 erhielt Elinor Ostrom als erste Frau den Wirtschaftsnobelpreis für ihre Forschung zu Commons. Sie
            bewies: Weder reine Privatisierung noch staatliche Kontrolle sind die einzigen Lösungen.
          </p>
          <p className={css({ lineHeight: "1.6", fontStyle: "italic" })}>
            &ldquo;Selbst-organisierte Institutionen können Commons nachhaltig verwalten, wenn sie bestimmte
            Design-Prinzipien befolgen.&rdquo;
          </p>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Ostrom's Vermächtnis: Von Fischerdörfern zu Silicon Valley
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Ostrom's Prinzipien funktionieren nicht nur in traditionellen Commons. Sie erklären, warum manche moderne
          Organisationen gedeihen:
        </p>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          {[
            {
              title: "🔗 Open Source",
              desc: "Linux, Wikipedia: Klare Regeln, Community-Governance, graduierte Sanktionen",
            },
            {
              title: "💡 Wissens-Commons",
              desc: "Erfolgreiche Teams teilen Wissen durch formelle und informelle Institutionen",
            },
            {
              title: "🌐 Online-Communities",
              desc: "Reddit, Stack Overflow: Reputation, Moderation, Community-Standards",
            },
            {
              title: "🏢 Agile Teams",
              desc: "Scrum, Cross-functional Teams: Selbstorganisation mit klaren Grenzen",
            },
          ].map((example) => (
            <div
              key={example.title}
              className={css({
                padding: "16px",
                backgroundColor: "#f0fdf4",
                borderRadius: "6px",
                border: "1px solid #bbf7d0",
              })}
            >
              <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>{example.title}</h4>
              <p className={css({ fontSize: "14px", color: "#374151", lineHeight: "1.5" })}>{example.desc}</p>
            </div>
          ))}
        </div>

        <div
          className={css({
            backgroundColor: "#f0f9ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            💡 Die drei Wege zum Umgang mit Commons-Dilemmas:
          </h4>
          <div className={css({ fontSize: "15px", lineHeight: "1.6" })}>
            <div className={css({ marginBottom: "8px" })}>
              <strong>🏛️ Staatliche Regulierung:</strong> Quoten, Überwachung, Strafen (funktioniert, aber teuer)
            </div>
            <div className={css({ marginBottom: "8px" })}>
              <strong>💰 Marktlösungen:</strong> Privatisierung, handelbare Rechte (effizient, aber exklusiv)
            </div>
            <div className={css({ marginBottom: "8px" })}>
              <strong>🤝 Ostrom's Weg:</strong> Community-Governance mit Design-Prinzipien (nachhaltig und inklusiv)
            </div>
          </div>
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          <strong>Die nächste Commons-Krise?</strong> Künstliche Intelligenz. Wie teilen wir die Vorteile von AI, ohne
          dass wenige alle Ressourcen monopolisieren? Wie verhindern wir, dass das &ldquo;KI-Commons&rdquo; durch
          kurzsichtige Konkurrenz zerstört wird?
        </p>
        <p className={css({ lineHeight: "1.6", marginTop: "16px" })}>
          Elinor Ostrom hätte gewusst, wo sie anfangen würde: Bei den Menschen, die das Problem lösen müssen.
          <strong> Denn am Ende sind Commons-Probleme Menschen-Probleme.</strong>
        </p>
      </section>
    </article>
  );
};
export default TragedyOfCommonsFishing;

// Post metadata
export const meta = {
  title: "Tragedy of the Commons: Moana's Choice",
  description: "Ein narratives, interaktives Blogspiel zur Tragedy of the Commons und Ostroms Theorien.",
};
