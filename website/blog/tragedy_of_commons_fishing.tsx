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

## A market solution: Individual Transferable Quotas (ITQs)

Back on her island, Moana stares at the empty nets from yesterday's failed cooperation. Chief Tala arrives with news from the outer islands: "I've heard of something called 'fishing rights' - like owning pieces of the ocean itself. What if we could buy and sell the right to fish?"

The idea sounds strange at first, but as Moana learns more, it begins to make sense:

**How Individual Transferable Quotas work:**
- The island council sets a **total sustainable limit** for the entire fishing ground (say, 60 fish total)
- Each chief receives **tradeable fishing rights** (quotas) - initially 15 rights each
- Before fishing, chiefs can **buy and sell** these rights at market prices
- You can only send as many boats as you have quota rights
- The total catch is **automatically limited** to sustainable levels

**The key insight:** If you're a skilled fisher, you can buy more rights and profit. If you prefer other activities, you can sell your rights and earn money without fishing.
      `}</ReactMarkdown>
      <ITQMarketSimulator />
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`


**Real-world success stories:**
- **🇮🇸 Iceland:** ITQs saved their fishing industry after near-collapse in the 1980s
- **🇳🇿 New Zealand:** One of the world's most successful quota systems since 1986
- **🇺🇸 Alaska:** Combines ITQs with community protections for indigenous fishers
- **🇨🇱 Chile:** ITQs helped recover several fish species from overfishing

As Moana experiments with the trading system, she realizes both the **power and the problems** of market solutions:

**✅ The good:**
- **Automatic sustainability:** Total catch can never exceed the quota limit
- **Economic efficiency:** The best fishers get more access, maximizing total catch value
- **Flexibility:** Chiefs can adapt their fishing based on their skills and preferences
- **Innovation incentives:** Efficient fishing techniques become more valuable

**⚠️ The concerns:**
- **Wealth concentration:** Rich chiefs can buy up all the rights, excluding smaller fishers
- **Community disruption:** Traditional fishing families might lose access to their livelihood
- **Price volatility:** Sudden changes in quota prices can destabilize island economies
- **Social inequality:** The market rewards efficiency over need or tradition

Moana reflects: *"This could work... the fish would be safe, and we'd fish more efficiently. But what happens to Chief Sina's family, who've fished these waters for generations but can't afford the rising quota prices? Is economic efficiency worth losing our island's social fabric?"*

**The fundamental trade-off:** Market solutions excel at efficiency and sustainability, but they can sacrifice equity and community values. ITQs prevent the tragedy of the commons, but they might create a different kind of tragedy - the tragedy of the market.

## State solutions: The Island Authority approach

Disturbed by the social tensions from the quota trading system, Moana considers a different path. "What if we create an Island Fishing Authority?" she proposes. "Someone above all of us who sets the rules and enforces them fairly."

**How government regulation would work:**
- **Central Authority:** The Island Council sets strict fishing limits for each chief
- **Fixed Quotas:** Each chief gets exactly the same amount - no trading allowed
- **Monitoring:** Government boats patrol the waters to prevent cheating
- **Penalties:** Violators face escalating fines: warning → fishing ban → exile from fishing grounds
- **Scientific Management:** Marine biologists determine sustainable catch levels based on data

[SIMULATOR PLACEHOLDER: State Regulation Game]

*This simulator would demonstrate:*
- **Compliance Tracking:** Each chief decides whether to follow or break the rules
- **Enforcement Costs:** Shows the expensive infrastructure needed for monitoring
- **Bureaucratic Delays:** Quotas adjust slowly to changing fish populations
- **Equal Distribution:** All chiefs get the same quotas regardless of skill
- **Social Stability:** No wealth concentration, but potentially lower total efficiency

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

As Moana watches the government system in action, she observes: *"This is fairer than the market - no one gets left behind. But it's so slow and expensive! And some chiefs are already finding ways around the rules when the patrol boats aren't watching. Plus, talented fishers like Chief Kai have no incentive to innovate since they can't benefit from their skills."*

**The state solution trade-off:** Government regulation prioritizes equity and democratic control, but often at the cost of efficiency and innovation. It can prevent both market failures and the tragedy of the commons, but it creates new challenges around enforcement, bureaucracy, and adaptability.

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

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Ostrom&apos;s Durchbruch: Es gibt einen dritten Weg
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Jahrzehntelang glaubten Ökonomen, es gäbe nur zwei Lösungen für Commons-Probleme:
        </p>

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
            🌟 Ostrom&apos;s 8 Design-Prinzipien für Commons:
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
    </article>
  );
};

// ITQ Market Simulator Component
function ITQMarketSimulator() {
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<"trading" | "fishing" | "results">("trading");
  const [quotaPrice, setQuotaPrice] = useState(5);
  const [history, setHistory] = useState<
    Array<{
      round: number;
      chiefs: Array<{ name: string; quotas: number; fish: number; money: number }>;
      totalCatch: number;
      sustainability: string;
    }>
  >([]);

  const [chiefs, setChiefs] = useState([
    { name: "Tui (Trading Expert)", quotas: 15, money: 50, fish: 0, personality: "trader" },
    { name: "Sina (Efficient Fisher)", quotas: 15, money: 50, fish: 0, personality: "efficient" },
    { name: "Tamatoa (Risk Taker)", quotas: 15, money: 50, fish: 0, personality: "aggressive" },
    { name: "Te Fiti (Conservationist)", quotas: 15, money: 50, fish: 0, personality: "conservative" },
  ]);

  const sustainableLimit = 60;
  const totalQuotas = chiefs.reduce((sum, chief) => sum + chief.quotas, 0);

  const handleTrade = (buyerIndex: number, sellerIndex: number, amount: number) => {
    if (amount <= 0) return;

    const newChiefs = [...chiefs];
    const cost = amount * quotaPrice;

    if (newChiefs[buyerIndex].money >= cost && newChiefs[sellerIndex].quotas >= amount) {
      newChiefs[buyerIndex].money -= cost;
      newChiefs[buyerIndex].quotas += amount;
      newChiefs[sellerIndex].money += cost;
      newChiefs[sellerIndex].quotas -= amount;
      setChiefs(newChiefs);

      // Dynamic pricing: price increases with demand
      setQuotaPrice((prev) => Math.min(15, prev + 0.5));
    }
  };

  const handleFishing = () => {
    const newChiefs = chiefs.map((chief) => {
      let efficiency = 1.0;
      if (chief.personality === "efficient") efficiency = 1.3;
      else if (chief.personality === "aggressive") efficiency = 1.1;
      else if (chief.personality === "conservative") efficiency = 0.9;

      const fishCaught = Math.round(chief.quotas * efficiency);
      return {
        ...chief,
        fish: chief.fish + fishCaught,
      };
    });

    setChiefs(newChiefs);
    setPhase("results");
  };

  const nextRound = () => {
    const totalCatch = chiefs.reduce((sum, chief) => sum + chief.fish, 0);
    const sustainability = totalCatch <= sustainableLimit ? "Sustainable ✅" : "Overfishing ⚠️";

    setHistory((prev) => [
      ...prev,
      {
        round,
        chiefs: chiefs.map((c) => ({ ...c })),
        totalCatch,
        sustainability,
      },
    ]);

    if (round < 3) {
      setRound(round + 1);
      setPhase("trading");
      setQuotaPrice(Math.max(3, quotaPrice - 1)); // Prices adjust between rounds
    }
  };

  const reset = () => {
    setRound(1);
    setPhase("trading");
    setQuotaPrice(5);
    setHistory([]);
    setChiefs([
      { name: "Tui (Trading Expert)", quotas: 15, money: 50, fish: 0, personality: "trader" },
      { name: "Sina (Efficient Fisher)", quotas: 15, money: 50, fish: 0, personality: "efficient" },
      { name: "Tamatoa (Risk Taker)", quotas: 15, money: 50, fish: 0, personality: "aggressive" },
      { name: "Te Fiti (Conservationist)", quotas: 15, money: 50, fish: 0, personality: "conservative" },
    ]);
  };

  return (
    <div 
      className={css({
        border: "2px solid #0284c7",
        borderRadius: "12px",
        padding: "24px",
        margin: "24px 0",
        backgroundColor: "#f0f9ff",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      })}
    >
      <h3 
        className={css({
          fontSize: "24px",
          fontWeight: "bold",
          color: "#0c4a6e",
          marginBottom: "20px",
          textAlign: "center",
        })}
      >
        🐟 ITQ Market Simulator
      </h3>

      <div 
        className={css({
          backgroundColor: "#ffffff",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "16px",
          border: "1px solid #e0e7ff",
        })}
      >
        <div 
          className={css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          })}
        >
          <h4 
            className={css({
              fontSize: "18px",
              fontWeight: "600",
              color: "#1e293b",
            })}
          >
            Round {round} - {phase === "trading" ? "Trading Phase" : phase === "fishing" ? "Fishing Phase" : "Results"}
          </h4>
          <div 
            className={css({
              fontSize: "14px",
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #bbf7d0",
            })}
          >
            Sustainable Limit: {sustainableLimit} fish | Total Quotas: {totalQuotas}
          </div>
        </div>

        {/* Current Status */}
        <div 
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          {chiefs.map((chief, index) => (
            <div 
              key={index} 
              className={css({
                backgroundColor: "#f8fafc",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              })}
            >
              <div 
                className={css({
                  fontWeight: "600",
                  fontSize: "14px",
                  marginBottom: "8px",
                  color: "#1e293b",
                })}
              >
                {chief.name}
              </div>
              <div 
                className={css({
                  fontSize: "12px",
                  "& > div": {
                    marginBottom: "4px",
                  },
                })}
              >
                <div>
                  Quotas: <span className={css({ fontWeight: "bold", color: "#2563eb" })}>{chief.quotas}</span>
                </div>
                <div>
                  Money: <span className={css({ fontWeight: "bold", color: "#059669" })}>${chief.money}</span>
                </div>
                <div>
                  Fish: <span className={css({ fontWeight: "bold", color: "#ea580c" })}>{chief.fish}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trading Phase */}
        {phase === "trading" && (
          <div className={css({ "& > div": { marginBottom: "16px" } })}>
            <div 
              className={css({
                backgroundColor: "#fefce8",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #facc15",
                textAlign: "center",
              })}
            >
              <strong>Current Quota Price: ${quotaPrice}</strong> per quota
            </div>

            <div 
              className={css({
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
              })}
            >
              {/* Quick Trade Options */}
              <div>
                <h5 
                  className={css({
                    fontWeight: "600",
                    marginBottom: "8px",
                    fontSize: "16px",
                  })}
                >
                  Quick Trades:
                </h5>
                <div className={css({ "& > button": { marginBottom: "8px" } })}>
                  <button
                    onClick={() => handleTrade(1, 0, 3)}
                    disabled={chiefs[1].money < quotaPrice * 3 || chiefs[0].quotas < 3}
                    className={css({
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px",
                      backgroundColor: "#dbeafe",
                      border: "1px solid #93c5fd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      _hover: { backgroundColor: "#bfdbfe" },
                      _disabled: { backgroundColor: "#f1f5f9", cursor: "not-allowed", opacity: 0.6 },
                    })}
                  >
                    Sina buys 3 quotas from Tui (${quotaPrice * 3})
                  </button>
                  <button
                    onClick={() => handleTrade(2, 3, 5)}
                    disabled={chiefs[2].money < quotaPrice * 5 || chiefs[3].quotas < 5}
                    className={css({
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px",
                      backgroundColor: "#dbeafe",
                      border: "1px solid #93c5fd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      _hover: { backgroundColor: "#bfdbfe" },
                      _disabled: { backgroundColor: "#f1f5f9", cursor: "not-allowed", opacity: 0.6 },
                    })}
                  >
                    Tamatoa buys 5 quotas from Te Fiti (${quotaPrice * 5})
                  </button>
                  <button
                    onClick={() => handleTrade(0, 2, 2)}
                    disabled={chiefs[0].money < quotaPrice * 2 || chiefs[2].quotas < 2}
                    className={css({
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px",
                      backgroundColor: "#dbeafe",
                      border: "1px solid #93c5fd",
                      borderRadius: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                      _hover: { backgroundColor: "#bfdbfe" },
                      _disabled: { backgroundColor: "#f1f5f9", cursor: "not-allowed", opacity: 0.6 },
                    })}
                  >
                    Tui buys 2 quotas from Tamatoa (${quotaPrice * 2})
                  </button>
                </div>
              </div>

              <div>
                <h5 
                  className={css({
                    fontWeight: "600",
                    marginBottom: "8px",
                    fontSize: "16px",
                  })}
                >
                  Market Info:
                </h5>
                <div 
                  className={css({
                    fontSize: "14px",
                    backgroundColor: "#f8fafc",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    "& > div": {
                      marginBottom: "4px",
                    },
                  })}
                >
                  <div>• Higher demand → Higher prices</div>
                  <div>• Sina is most efficient (30% bonus)</div>
                  <div>• Te Fiti prefers conservation</div>
                  <div>• Total quotas = sustainable limit</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPhase("fishing")}
              className={css({
                width: "100%",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                _hover: { backgroundColor: "#1d4ed8" },
              })}
            >
              End Trading → Start Fishing
            </button>
          </div>
        )}

        {/* Fishing Phase */}
        {phase === "fishing" && (
          <div className={css({ textAlign: "center" })}>
            <div 
              className={css({
                backgroundColor: "#f0f9ff",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #bae6fd",
              })}
            >
              <p className={css({ marginBottom: "16px", lineHeight: "1.5" })}>
                Each chief sends boats equal to their quotas and catches fish based on their efficiency...
              </p>
              <button 
                onClick={handleFishing} 
                className={css({
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  _hover: { backgroundColor: "#047857" },
                })}
              >
                🎣 Go Fishing!
              </button>
            </div>
          </div>
        )}

        {/* Results Phase */}
        {phase === "results" && (
          <div className={css({ "& > div": { marginBottom: "16px" } })}>
            <div 
              className={css({
                backgroundColor: "#f0fdf4",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
              })}
            >
              <h5 
                className={css({
                  fontWeight: "600",
                  marginBottom: "8px",
                  fontSize: "16px",
                })}
              >
                Round {round} Results:
              </h5>
              <div 
                className={css({
                  fontSize: "14px",
                  "& > div": {
                    marginBottom: "4px",
                  },
                })}
              >
                <div>
                  Total Catch: <strong>{chiefs.reduce((sum, chief) => sum + chief.fish, 0)} fish</strong>
                </div>
                <div>Limit: {sustainableLimit} fish</div>
                <div
                  className={css({
                    fontWeight: "bold",
                    color: chiefs.reduce((sum, chief) => sum + chief.fish, 0) <= sustainableLimit
                      ? "#059669"
                      : "#dc2626"
                  })}
                >
                  {chiefs.reduce((sum, chief) => sum + chief.fish, 0) <= sustainableLimit
                    ? "Sustainable ✅"
                    : "Overfishing ⚠️"}
                </div>
              </div>
            </div>

            {round < 3 ? (
              <button 
                onClick={nextRound} 
                className={css({
                  width: "100%",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  _hover: { backgroundColor: "#1d4ed8" },
                })}
              >
                Next Round →
              </button>
            ) : (
              <button
                onClick={reset}
                className={css({
                  width: "100%",
                  backgroundColor: "#4b5563",
                  color: "#ffffff",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  _hover: { backgroundColor: "#374151" },
                })}
              >
                🔄 Start New Simulation
              </button>
            )}
          </div>
        )}
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div className={css({ marginTop: "24px" })}>
          <h4 
            className={css({
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
              color: "#1e293b",
            })}
          >
            Results History:
          </h4>
          <div className={css({ overflowX: "auto" })}>
            <table 
              className={css({
                width: "100%",
                fontSize: "14px",
                border: "1px solid #d1d5db",
                borderCollapse: "collapse",
                backgroundColor: "#ffffff",
              })}
            >
              <thead 
                className={css({
                  backgroundColor: "#f3f4f6",
                })}
              >
                <tr>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Round</th>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Tui</th>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Sina</th>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Tamatoa</th>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Te Fiti</th>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Total Catch</th>
                  <th className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr 
                    key={i} 
                    className={css({
                      _hover: { backgroundColor: "#f9fafb" },
                    })}
                  >
                    <td className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "center" })}>{h.round}</td>
                    {h.chiefs.map((chief, j) => (
                      <td key={j} className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "center" })}>
                        {chief.fish} fish
                        <br />
                        <span className={css({ fontSize: "12px", color: "#6b7280" })}>({chief.quotas} quotas)</span>
                      </td>
                    ))}
                    <td className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "center", fontWeight: "bold" })}>{h.totalCatch}</td>
                    <td className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "center" })}>{h.sustainability}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div 
        className={css({
          marginTop: "16px",
          fontSize: "14px",
          color: "#4b5563",
          backgroundColor: "#f8fafc",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          lineHeight: "1.5",
        })}
      >
        <strong>How to use:</strong> In the trading phase, try different quota trades to see how market dynamics work.
        Notice how efficient fishers (Sina) benefit from buying more quotas, while others might prefer to sell and earn
        money instead of fishing. The total catch is always limited by total quotas = sustainable limit!
      </div>
    </div>
  );
}

export default TragedyOfCommonsFishing;

// Post metadata
export const meta = {
  title: "Tragedy of the Commons: Moana's Choice",
  description: "Ein narratives, interaktives Blogspiel zur Tragedy of the Commons und Ostroms Theorien.",
};
