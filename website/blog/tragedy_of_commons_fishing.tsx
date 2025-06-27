import React, { useState } from "react";
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
type FishingStrategy = "sustainable" | "moderate" | "aggressive" | "greedy";
type GovernanceType = "none" | "quotas" | "ostrom";

// Historical data for Newfoundland cod fishery
const historicalData = [
  { year: 1950, catch: 800, stock: 100, employment: 40000 },
  { year: 1960, catch: 850, stock: 95, employment: 42000 },
  { year: 1970, catch: 900, stock: 85, employment: 45000 },
  { year: 1975, catch: 750, stock: 70, employment: 38000 },
  { year: 1980, catch: 600, stock: 50, employment: 32000 },
  { year: 1985, catch: 400, stock: 30, employment: 25000 },
  { year: 1990, catch: 200, stock: 15, employment: 15000 },
  { year: 1992, catch: 0, stock: 5, employment: 0 },
];

// Types
type PlayerChoice = "cooperate" | "defect";
type GamePhase = "intro" | "deciding" | "reveal" | "finished";

// Simplified Commons Game Component
const FishingGameSimulator: React.FC = () => {
  const [currentRound, setCurrentRound] = useState(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>("intro");
  const [playerChoice, setPlayerChoice] = useState<PlayerChoice | null>(null);
  const [commonPool, setCommonPool] = useState(100);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [roundHistory, setRoundHistory] = useState<
    Array<{
      round: number;
      playerChoice: PlayerChoice;
      aiChoices: PlayerChoice[];
      playerGain: number;
      poolAfter: number;
    }>
  >([]);

  // AI players with personalities
  const aiPlayers = [
    { name: "🌱 Grüner", strategy: "mostly_cooperate", description: "Kooperiert fast immer" },
    { name: "⚖️ Tit-for-Tat", strategy: "adaptive", description: "Beginnt kooperativ, passt sich an" },
    { name: "� Gieriger", strategy: "mostly_defect", description: "Defektiert fast immer" },
  ];

  const makeAIChoice = (aiIndex: number, round: number, history: any[]): PlayerChoice => {
    const ai = aiPlayers[aiIndex];
    
    if (ai.strategy === "mostly_cooperate") {
      return Math.random() < 0.8 ? "cooperate" : "defect";
    } else if (ai.strategy === "mostly_defect") {
      return Math.random() < 0.2 ? "cooperate" : "defect";
    } else { // adaptive/tit-for-tat
      if (round === 1) return "cooperate";
      const lastRound = history[history.length - 1];
      if (!lastRound) return "cooperate";
      // Copy what the majority did last round
      const defectors = lastRound.aiChoices.filter((c: PlayerChoice) => c === "defect").length;
      if (lastRound.playerChoice === "defect") defectors++;
      return defectors >= 2 ? "defect" : "cooperate";
    }
  };

  const calculateRoundOutcome = (playerChoice: PlayerChoice) => {
    const aiChoices = aiPlayers.map((_, index) => makeAIChoice(index, currentRound, roundHistory));
    
    // Count cooperators and defectors
    const allChoices = [playerChoice, ...aiChoices];
    const cooperators = allChoices.filter(c => c === "cooperate").length;
    const defectors = allChoices.filter(c => c === "defect").length;
    
    // Calculate gains (cooperate = 10, defect = 20)
    const playerGain = playerChoice === "cooperate" ? 10 : 20;
    const totalExtracted = cooperators * 10 + defectors * 20;
    
    // Update pool with growth (10% per round) minus extraction
    const poolWithGrowth = Math.round(commonPool * 1.1);
    const newPool = Math.max(0, poolWithGrowth - totalExtracted);
    
    return {
      aiChoices,
      playerGain,
      poolAfter: newPool,
      totalExtracted,
      cooperators,
      defectors,
    };
  };

  const handlePlayerChoice = (choice: PlayerChoice) => {
    setPlayerChoice(choice);
    const outcome = calculateRoundOutcome(choice);
    
    setRoundHistory(prev => [...prev, {
      round: currentRound,
      playerChoice: choice,
      aiChoices: outcome.aiChoices,
      playerGain: outcome.playerGain,
      poolAfter: outcome.poolAfter,
    }]);
    
    setPlayerTotal(prev => prev + outcome.playerGain);
    setCommonPool(outcome.poolAfter);
    setGamePhase("reveal");
  };

  const nextRound = () => {
    if (currentRound >= 3 || commonPool <= 10) {
      setGamePhase("finished");
    } else {
      setCurrentRound((prev) => prev + 1);
      setGamePhase("deciding");
    }
  };

  const resetGame = () => {
    setCurrentRound(1);
    setGamePhase("intro");
    setCommonPool(100);
    setPlayerTotal(0);
    setRoundHistory([]);
  };

  const startGame = () => {
    setGamePhase("deciding");
  };

  if (gamePhase === "intro") {
    return (
      <div
        className={css({
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          margin: "20px 0",
          backgroundColor: "#f0f9ff",
        })}
      >
        <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
          🎣 Commons-Dilemma: Das 3-Runden-Experiment
        </h3>
        
        <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px" })}>
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>📋 Die Spielregeln:</h4>
          <div className={css({ fontSize: "14px", lineHeight: "1.6", marginBottom: "12px" })}>
            <div>
              🏊‍♂️ <strong>Gemeinsamer Pool:</strong> Startet mit 100 Einheiten, wächst um 10% pro Runde
            </div>
            <div>
              👥 <strong>4 Spieler:</strong> Sie + 3 AI-Spieler
            </div>
            <div>
              ⏰ <strong>3 Runden:</strong> Alle entscheiden gleichzeitig
            </div>
          </div>
          
          <div className={css({ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "12px" })}>
            <h5 className={css({ fontWeight: "bold", marginBottom: "8px" })}>💡 Ihre Entscheidungen:</h5>
            <div className={css({ fontSize: "14px", lineHeight: "1.5" })}>
              <div>🤝 <strong>Kooperieren:</strong> Nehmen Sie 10 Einheiten (nachhaltig)</div>
              <div>⚡ <strong>Defektieren:</strong> Nehmen Sie 20 Einheiten (gierig)</div>
            </div>
          </div>
          
          <div className={css({ backgroundColor: "#fef2f2", padding: "12px", borderRadius: "6px" })}>            <div className={css({ fontSize: "14px", color: "#dc2626" })}>
              <strong>⚠️ Das Dilemma:</strong> Defektieren bringt mehr Gewinn, aber wenn alle defektieren, kollabiert
              der Pool und alle verlieren!
            </div>
          </div>
        </div>

        <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px" })}>
          <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>🤖 Ihre AI-Mitspieler:</h4>
          <div className={css({ display: "grid", gridTemplateColumns: "1fr", gap: "8px", fontSize: "14px" })}>
            {aiPlayers.map((ai, index) => (
              <div key={index} className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
                <span>{ai.name}</span>
                <span className={css({ color: "#6b7280" })}>- {ai.description}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={startGame}
          className={css({
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#2563eb" },
          })}
        >
          🚀 Experiment starten
        </button>
      </div>
    );
  }

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f0f9ff",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        🎣 Commons-Dilemma: Runde {currentRound}/3
      </h3>

      <div className={css({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "20px" })}>
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Gemeinsamer Pool</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: commonPool < 30 ? "#ef4444" : "#10b981" })}>
            {commonPool}
          </div>
        </div>
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Ihr Gewinn</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold" })}>{playerTotal}</div>
        </div>
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Runde</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold" })}>{currentRound}/3</div>
        </div>
      </div>

      {gamePhase === "deciding" && (
        <div className={css({ marginBottom: "20px" })}>
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            🤔 Runde {currentRound}: Treffen Sie Ihre Entscheidung
          </h4>
          <div className={css({ fontSize: "14px", color: "#6b7280", marginBottom: "16px" })}>
            Aktueller Pool: {Math.round(commonPool * 1.1)} (nach 10% Wachstum)
          </div>
          
          <div className={css({ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" })}>
            <button
              onClick={() => handlePlayerChoice("cooperate")}
              className={css({
                padding: "16px",
                backgroundColor: "#f0fdf4",
                border: "2px solid #bbf7d0",
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "left",
                "&:hover": { backgroundColor: "#dcfce7" },
              })}
            >
              <div className={css({ fontSize: "16px", fontWeight: "bold", color: "#16a34a", marginBottom: "4px" })}>
                🤝 Kooperieren
              </div>
              <div className={css({ fontSize: "14px", color: "#6b7280" })}>
                10 Einheiten nehmen
              </div>
              <div className={css({ fontSize: "12px", color: "#059669", marginTop: "4px" })}>
                Nachhaltig für alle
              </div>
            </button>
            
            <button
              onClick={() => handlePlayerChoice("defect")}
              className={css({
                padding: "16px",
                backgroundColor: "#fefce8",
                border: "2px solid #fbbf24",
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "left",
                "&:hover": { backgroundColor: "#fef3c7" },
              })}
            >
              <div className={css({ fontSize: "16px", fontWeight: "bold", color: "#d97706", marginBottom: "4px" })}>
                ⚡ Defektieren
              </div>
              <div className={css({ fontSize: "14px", color: "#6b7280" })}>
                20 Einheiten nehmen
              </div>
              <div className={css({ fontSize: "12px", color: "#d97706", marginTop: "4px" })}>
                Mehr Gewinn, aber riskant
              </div>
            </button>
          </div>

          <div className={css({ fontSize: "12px", color: "#6b7280" })}>
            💡 <strong>Tipp:</strong> Was werden die anderen wohl tun? Denken Sie strategisch!
          </div>
        </div>
      )}

      {gamePhase === "reveal" && roundHistory.length > 0 && (
        <div className={css({ marginBottom: "20px" })}>
          {(() => {
            const lastRound = roundHistory[roundHistory.length - 1];
            return (
              <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px" })}>
                <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
                  📊 Runde {lastRound.round} - Alle Entscheidungen:
                </h4>
                
                <div className={css({ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" })}>
                  <div className={css({ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px" })}>
                    <div className={css({ fontWeight: "bold", color: lastRound.playerChoice === "cooperate" ? "#16a34a" : "#d97706" })}>
                      🎯 Sie: {lastRound.playerChoice === "cooperate" ? "🤝 Kooperiert" : "⚡ Defektiert"}
                    </div>
                    <div className={css({ fontSize: "14px", color: "#6b7280" })}>
                      Gewinn: +{lastRound.playerGain}
                    </div>
                  </div>
                  
                  {aiPlayers.map((ai, index) => (
                    <div key={index} className={css({ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px" })}>
                      <div className={css({ fontWeight: "bold", color: lastRound.aiChoices[index] === "cooperate" ? "#16a34a" : "#d97706" })}>
                        {ai.name}: {lastRound.aiChoices[index] === "cooperate" ? "🤝" : "⚡"}
                      </div>
                      <div className={css({ fontSize: "14px", color: "#6b7280" })}>
                        {lastRound.aiChoices[index] === "cooperate" ? "Kooperiert" : "Defektiert"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={css({ backgroundColor: "#f3f4f6", padding: "12px", borderRadius: "6px", marginBottom: "16px" })}>
                  <div className={css({ fontSize: "14px" })}>
                    <div><strong>Gesamt extrahiert:</strong> {
                      10 * ([lastRound.playerChoice, ...lastRound.aiChoices].filter(c => c === "cooperate").length) +
                      20 * ([lastRound.playerChoice, ...lastRound.aiChoices].filter(c => c === "defect").length)
                    } Einheiten</div>
                    <div><strong>Pool danach:</strong> {lastRound.poolAfter} Einheiten</div>
                  </div>
                </div>

                {currentRound < 3 && commonPool > 10 ? (
                  <button
                    onClick={nextRound}
                    className={css({
                      padding: "10px 20px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#2563eb" },
                    })}
                  >
                    ➡️ Nächste Runde
                  </button>
                ) : (
                  <button
                    onClick={nextRound}
                    className={css({
                      padding: "10px 20px",
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "#15803d" },
                    })}
                  >
                    📈 Endergebnis anzeigen
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {gamePhase === "finished" && (
        <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", marginBottom: "16px" })}>
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px", color: commonPool <= 10 ? "#dc2626" : "#16a34a" })}>
            {commonPool <= 10 ? "🚨 Commons kollabiert!" : "✅ Experiment beendet!"}
          </h4>
          
          <div className={css({ marginBottom: "16px" })}>
            <div><strong>Ihr Gesamtgewinn:</strong> {playerTotal} Einheiten</div>
            <div><strong>Finaler Pool:</strong> {commonPool} Einheiten</div>
            <div><strong>Kooperationen:</strong> {roundHistory.filter(r => r.playerChoice === "cooperate").length}/3</div>
          </div>

          <div className={css({ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", marginBottom: "16px" })}>
            <h5 className={css({ fontWeight: "bold", marginBottom: "8px" })}>🧠 Was haben Sie gelernt?</h5>
            <div className={css({ fontSize: "14px", lineHeight: "1.5" })}>
              {commonPool <= 10 ? (
                <div>Der Pool ist kollabiert! Das passiert, wenn zu viele Spieler defektieren. 
                Auch wenn Sie kooperiert haben - die Commons sind für alle verloren.</div>
              ) : (
                <div>Glückwunsch! Durch strategische Kooperation haben Sie und die anderen 
                den gemeinsamen Pool erhalten.</div>
              )}
            </div>
          </div>

          <button
            onClick={resetGame}
            className={css({
              padding: "10px 20px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#5338f5" },
            })}
          >
            🔄 Nochmal spielen
          </button>
        </div>
      )}
    </div>
  );
};

// Historical Timeline Component
const HistoricalTimeline: React.FC = () => {
  const data = {
    labels: historicalData.map((d) => d.year.toString()),
    datasets: [
      {
        label: "Fischbestand (%)",
        data: historicalData.map((d) => d.stock),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        yAxisID: "y",
      },
      {
        label: "Fang (1000 Tonnen)",
        data: historicalData.map((d) => d.catch),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Neufundland Kabeljau-Fischerei 1950-1992",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Jahr",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Fischbestand (%)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Fang (1000 Tonnen)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <div className={css({ height: "300px" })}>
        <Line data={data} options={options} />
      </div>
      <div className={css({ fontSize: "14px", color: "#6b7280", marginTop: "12px" })}>
        <strong>1992:</strong> Kompletter Fangstopp. 40.000 Fischer verlieren ihre Jobs über Nacht.
      </div>
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

// Main Blog Post Component
export default function TragedyOfCommonsFishing() {
  return (
    <article className={css({ maxWidth: "800px", margin: "0 auto", padding: "20px" })}>
      <header className={css({ marginBottom: "32px" })}>
        <h1
          className={css({
            fontSize: "32px",
            fontWeight: "bold",
            lineHeight: "1.2",
            marginBottom: "16px",
          })}
        >
          Die Kabeljau-Katastrophe: Eine interaktive Lektion über die Tragedy of Commons
        </h1>
        <div
          className={css({
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "24px",
          })}
        >
          Veröffentlicht am 27. Juni 2025
        </div>
      </header>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Die größte Umweltkatastrophe Kanadas
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Am 2. Juli 1992 verkündete die kanadische Regierung ein komplettes Moratorium für die Kabeljau-Fischerei vor
          Neufundland. Über Nacht verloren <strong>40.000 Fischer</strong> ihre Jobs. Ein Fischbestand, der 500 Jahre
          lang nachhaltig befischt worden war, brach vollständig zusammen.
        </p>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Wie konnte das passieren? Die Antwort liegt in einem einfachen, aber tödlichen Spiel, das jeder von uns
          täglich spielt - oft ohne es zu merken.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>Das Fischerdorf-Spiel</h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Stellen Sie sich vor, Sie sind Kapitän eines Fischerboots in einem kleinen Dorf. Sie teilen sich einen See mit
          4 anderen Fischern. Jeden Tag müssen Sie entscheiden: Wie viele Stunden sollen Sie fischen?
        </p>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Die Regeln sind einfach:</strong> Mehr Stunden bedeuten mehr Fang heute - aber weniger Fische für alle
          morgen.
        </p>

        <FishingGameSimulator />

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Was ist passiert?</strong> Wahrscheinlich haben Sie erlebt, was Millionen von Menschen vor Ihnen
          erlebt haben: Selbst mit den besten Absichten ist es schwer, nachhaltig zu handeln, wenn andere es nicht tun.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Die historische Realität: 40 Jahre Überfischung
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Was in unserem Spiel in 10 Wochen passiert, spielte sich vor Neufundland über 40 Jahre ab. Die moderne
          Fischerei-Industrie steigerte ihre Kapazitäten dramatisch, aber der Fischbestand hielt nicht mit.
        </p>

        <HistoricalTimeline />

        <div
          className={css({
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>Die Warnsignale wurden ignoriert:</h4>
          <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
            <li>
              <strong>1970er:</strong> Wissenschaftler warnen vor Überfischung
            </li>
            <li>
              <strong>1980er:</strong> &ldquo;Nur ein schlechtes Jahr&rdquo; - Politik ignoriert Daten
            </li>
            <li>
              <strong>1990er:</strong> Zu spät - der Bestand ist unter kritische Masse gefallen
            </li>
          </ul>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Warum rationale Menschen irrationale Entscheidungen treffen
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Das Kabeljau-Dilemma ist ein perfektes Beispiel für die <strong>&ldquo;Tragedy of the Commons&rdquo;</strong>.
          Jeder einzelne Fischer handelt rational aus seiner Sicht:
        </p>

        <div
          className={css({
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
          })}
        >
          <div>
            <strong>Wenn alle anderen nachhaltig fischen:</strong>
          </div>
          <div>• Du fischst nachhaltig: Alle profitieren langfristig</div>
          <div>• Du fischst mehr: Du bekommst kurzfristig mehr Gewinn</div>
          <br />
          <div>
            <strong>Wenn alle anderen überfischen:</strong>
          </div>
          <div>• Du fischst nachhaltig: Du bekommst fast nichts</div>
          <div>• Du fischst auch mehr: Wenigstens gleiche Verluste</div>
        </div>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Das Nash-Gleichgewicht:</strong> Jeder fischt zu viel, der Bestand kollabiert, alle verlieren.
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
          Was lernen wir für heute?
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Die Tragedy of Commons ist überall um uns herum:
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
            { title: "Klimawandel", desc: "Jedes Land 'fischt' CO2 aus der Atmosphäre" },
            { title: "Antibiotika", desc: "Übernutzung führt zu Resistenz für alle" },
            { title: "Internet", desc: "Bandbreiten-Überlastung bei hoher Nutzung" },
            { title: "Open Source", desc: "Nutzen ohne Beitragen schadet allen" },
          ].map((example) => (
            <div
              key={example.title}
              className={css({
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>{example.title}</h4>
              <p className={css({ fontSize: "14px", color: "#6b7280" })}>{example.desc}</p>
            </div>
          ))}
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          Das nächste Mal, wenn Sie sehen, wie Teams in Ihrem Unternehmen Wissen horten statt teilen, oder wenn Länder
          bei Klimaverhandlungen blockieren - denken Sie an die Fischer von Neufundland.
          <strong> Die Mathematik ist dieselbe. Aber jetzt kennen Sie auch die Lösungen.</strong>
        </p>
      </section>

      <footer
        className={css({
          borderTop: "1px solid #e5e7eb",
          paddingTop: "16px",
          fontSize: "14px",
          color: "#6b7280",
        })}
      >
        <p>
          <em>
            Interessiert, wie das in der Innovation aussieht? Der nächste Post untersucht, wie Unternehmen ihre
            &ldquo;Wissens-Commons&rdquo; verwalten können.
          </em>
        </p>
      </footer>
    </article>
  );
}

// Post metadata
export const meta = {
  title: "Die Kabeljau-Katastrophe: Tragedy of Commons",
  description: "Eine interaktive Lektion über die Tragedy of Commons am Beispiel der Neufundland-Fischerei",
  publishing_date: "2025-06-27",
  tags: ["Spieltheorie", "Commons", "Nachhaltigkeit", "Geschichte", "Umwelt"],
  readTime: 10,
};
