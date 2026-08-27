import React, { useState } from "react";
import { css } from "../../styled-system/css";
import {
  otherChiefs,
  MODEL_PARAMS,
  OPTIMAL_BOATS,
  calculateTotalCatch,
  calculateRegeneration,
  type ScenarioType,
  type RoundHistory,
} from "./fishingCommonsModel";

// Fishing Game Simulator Sub-Components
const FishingScenarioSelector: React.FC<{
  scenario: ScenarioType;
  setScenario: (scenario: ScenarioType) => void;
  history: RoundHistory[];
}> = ({ scenario, setScenario, history }) => {
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
        🌏 Neighboring Islands Culture
      </div>
      <div className={css({ display: "flex", gap: "3", justifyContent: "center", flexWrap: "wrap" })}>
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
              className={css({
                padding: "12px 16px",
                border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                borderRadius: "lg",
                background: isDisabled ? "gray.100" : isSelected ? "blue.50" : "white",
                cursor: isDisabled ? "not-allowed" : "pointer",
                textAlign: "left",
                maxWidth: "200px",
                fontSize: "sm",
                opacity: isDisabled ? 0.6 : 1,
                position: "relative",
              })}
              title={isDisabled ? "Scenario locked during active game" : ""}
            >
              {isDisabled && isSelected && (
                <div
                  className={css({
                    position: "absolute",
                    top: "4px",
                    right: "6px",
                    fontSize: "xs",
                    color: "gray.500",
                  })}
                >
                  🔒
                </div>
              )}
              <div
                className={css({
                  fontWeight: "semibold",
                  marginBottom: "1",
                  color: isDisabled ? "gray.400" : "gray.900",
                })}
              >
                {info.name}
              </div>
              <div
                className={css({
                  color: isDisabled ? "gray.400" : "slate.500",
                  fontSize: "xs",
                  lineHeight: "tight",
                })}
              >
                {info.description}
              </div>
            </button>
          );
        })}
      </div>
      <div className={css({ marginTop: "4" })}>
        <div
          className={css({
            fontSize: "sm",
            color: "slate.500",
            marginBottom: "2",
            fontWeight: "semibold",
          })}
        >
          Active Scenario: {scenarios[scenario].name}
        </div>
        {gameStarted ? (
          <div
            className={css({
              fontSize: "sm",
              color: "gray.400",
              fontStyle: "italic",
            })}
          >
            Scenario is locked during the game. Use &quot;Play again&quot; to change scenarios.
          </div>
        ) : (
          <div className={css({ fontSize: "sm", color: "slate.500" })}>
            As Moana, you can choose to send {OPTIMAL_BOATS.low_fishing},{" "}
            {Math.floor((OPTIMAL_BOATS.low_fishing + OPTIMAL_BOATS.intensive_fishing) / 2)}, or{" "}
            {OPTIMAL_BOATS.intensive_fishing} boats. What&apos;s your strategy?
          </div>
        )}
      </div>
    </div>
  );
};

// Action-Bereich mit Boats-basierten Entscheidungen:
const FishingActionBar: React.FC<{
  round: number;
  gameOver: boolean;
  history: RoundHistory[];
  onBoatChoice: (boats: number) => void;
}> = ({ round, gameOver, history, onBoatChoice }) => {
  const currentRoundHistory = history[round - 1];
  const hasChosenBoats = currentRoundHistory.moanaBoats !== null;

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3",
        marginBottom: "4",
      })}
    >
      {/* Progress Indicator */}
      <div className={css({ display: "flex", gap: "2", marginBottom: "2" })}>
        {[1, 2, 3].map((roundNum) => (
          <div
            key={roundNum}
            className={css({
              width: "32px",
              height: "32px",
              borderRadius: "full",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "sm",
              fontWeight: "semibold",
              background: roundNum < round ? "emerald.500" : roundNum === round ? "blue.500" : "gray.200",
              color: roundNum < round || roundNum === round ? "white" : "gray.400",
            })}
          >
            {roundNum < round ? "✓" : roundNum}
          </div>
        ))}
      </div>

      {/* Status */}
      <div className={css({ fontSize: "md", textAlign: "center", marginBottom: "2" })}>
        <div className={css({ fontWeight: "semibold", marginBottom: "1" })}>
          Round {round} of 3 • Fish Stock: {round === 1 ? MODEL_PARAMS.s_init : history[round - 2].fishAfter} 🐟
        </div>
        <div className={css({ color: "slate.500", fontSize: "sm" })}>How many boats should Moana send out today?</div>
      </div>

      {/* Boat Choice Buttons */}
      {!gameOver && !hasChosenBoats && (
        <div className={css({ display: "flex", gap: "3", flexWrap: "wrap", justifyContent: "center" })}>
          <button
            onClick={() => onBoatChoice(OPTIMAL_BOATS.low_fishing)}
            className={css({
              padding: "10px 16px",
              border: "1px solid #10b981",
              borderRadius: "md",
              background: "white",
              color: "#222",
              cursor: "pointer",
              fontWeight: "semibold",
              fontSize: "sm",
            })}
          >
            🌊 {OPTIMAL_BOATS.low_fishing} Boats (Sustainable)
          </button>
          <button
            onClick={() => onBoatChoice(Math.floor((OPTIMAL_BOATS.low_fishing + OPTIMAL_BOATS.intensive_fishing) / 2))}
            className={css({
              padding: "10px 16px",
              border: "1px solid #f59e0b",
              borderRadius: "md",
              background: "white",
              color: "#222",
              cursor: "pointer",
              fontWeight: "semibold",
              fontSize: "sm",
            })}
          >
            ⚖️ {Math.floor((OPTIMAL_BOATS.low_fishing + OPTIMAL_BOATS.intensive_fishing) / 2)} Boats (Moderate)
          </button>
          <button
            onClick={() => onBoatChoice(OPTIMAL_BOATS.intensive_fishing)}
            className={css({
              padding: "10px 16px",
              border: "1px solid #ef4444",
              borderRadius: "md",
              background: "white",
              color: "#222",
              cursor: "pointer",
              fontWeight: "semibold",
              fontSize: "sm",
            })}
          >
            ⚡ {OPTIMAL_BOATS.intensive_fishing} Boats (Intensive)
          </button>
        </div>
      )}

      {/* Round Feedback */}
      {!gameOver && hasChosenBoats && (
        <div
          className={css({
            fontSize: "sm",
            color: "slate.500",
            textAlign: "center",
            marginTop: "1",
          })}
        >
          <div className={css({ marginBottom: "1" })}>
            <strong>Moana:</strong> {currentRoundHistory.moanaBoats} boats → {currentRoundHistory.moanaFish} fish
          </div>
          <div className={css({ marginBottom: "1" })}>
            <strong>Other Chiefs:</strong>{" "}
            {currentRoundHistory.otherBoats
              ?.map((boats, i) => `${otherChiefs[i]}: ${boats} boats (${currentRoundHistory.otherFish?.[i]} fish)`)
              .join(", ")}
          </div>
          <div className={css({ marginBottom: "1" })}>
            <strong>Total:</strong> {currentRoundHistory.totalBoats} boats caught {currentRoundHistory.totalCatch} fish
          </div>
          {currentRoundHistory.regeneration && currentRoundHistory.regeneration > 0 && (
            <div className={css({ color: "emerald.500" })}>
              🌱 Ocean regenerated: +{currentRoundHistory.regeneration} fish
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Results table showing boats and fish caught
const FishingResultsTable: React.FC<{ history: RoundHistory[] }> = ({ history }) => {
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
    <div className={css({ margin: "18px 0" })}>
      {/* Scenario indicator above table */}

      <div className={css({ display: "flex", justifyContent: "center" })}>
        <table
          className={css({
            borderCollapse: "collapse",
            fontSize: "sm",
            minWidth: "480px",
          })}
        >
          <thead>
            <tr className={css({ background: "sky.200" })}>
              <th className={css({ padding: "6px 8px" })}>Round</th>
              <th className={css({ padding: "6px 8px" })}>Moana</th>
              {otherChiefs.map((chief) => (
                <th key={chief} className={css({ padding: "6px 8px", fontSize: "xs" })}>
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
};

// Nach 3 Runden: Zusammenfassung
const FishingEndSummary: React.FC<{
  scenario: ScenarioType;
  fishStock: number;
  moanaTotal: number;
  onReset: () => void;
}> = ({ scenario, fishStock, moanaTotal, onReset }) => {
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
        onClick={onReset}
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
};

export default function FishingGameSimulator() {
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
    // Calculate regeneration first (like in notebook: gt = g_t(st, g0, g1))
    const regeneration = calculateRegeneration(currentStock);

    // Calculate total catch using mathematical model (like in notebook: yt = y_t(st, b_t, y0))
    const totalCatch = calculateTotalCatch(currentStock, totalBoats);

    // Each chief gets proportional share based on boats sent
    const moanaFish = Math.round((moanaBoats / totalBoats) * totalCatch);
    const otherFish = otherBoats.map((boats) => Math.round((boats / totalBoats) * totalCatch));

    // Update stock exactly like in notebook: st = st - yt + gt
    const nextStock = currentStock - totalCatch + regeneration;

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
      <FishingScenarioSelector scenario={scenario} setScenario={setScenario} history={history} />
      <FishingActionBar round={round} gameOver={gameOver} history={history} onBoatChoice={handleBoatChoice} />
      <FishingResultsTable history={history} />
      {gameOver && (
        <FishingEndSummary scenario={scenario} fishStock={fishStock} moanaTotal={moanaTotal} onReset={reset} />
      )}
    </div>
  );
}
