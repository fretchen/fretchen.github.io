import React, { useState, useMemo } from "react";
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
import annotationPlugin from "chartjs-plugin-annotation";
import { css } from "../styled-system/css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

// Game types and functions
type Choice = "D" | "C";
type Strategy = "random" | "defect" | "cooperate" | "tit-for-tat";

// Expected Utility Plot Component
const ExpectedUtilityPlot: React.FC = () => {
  const [probabilityDefect, setProbabilityDefect] = useState(0.5);

  // Prisoner's Dilemma payoff matrix variables (in years of prison)
  // Fixed values from Breaking Bad example
  const R = 3; // Reward for mutual cooperation (both stay loyal)
  const T = 0; // Temptation to defect (betray while opponent stays loyal)

  // Adjustable parameters
  const [P, setP] = useState(5); // Punishment for mutual defection (both betray)
  const [S, setS] = useState(15); // Sucker's payoff (stay loyal while opponent betrays)

  // Calculate expected values
  const expectedCooperate = R * (1 - probabilityDefect) + S * probabilityDefect;
  const expectedDefect = T * (1 - probabilityDefect) + P * probabilityDefect;

  const probabilities = Array.from({ length: 101 }, (_, i) => i / 100);
  const cooperateValues = probabilities.map((p) => R * (1 - p) + S * p);
  const defectValues = probabilities.map((p) => T * (1 - p) + P * p);

  const data = {
    labels: probabilities.map((p) => (p * 100).toFixed(0) + "%"),
    datasets: [
      {
        label: "Stay loyal to Jesse",
        data: cooperateValues,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
      },
      {
        label: "Betray Jesse",
        data: defectValues,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: { size: 12 },
        },
      },
      title: {
        display: false,
      },
      annotation: {
        annotations: {
          line1: {
            type: "line" as const,
            xMin: probabilityDefect * 100,
            xMax: probabilityDefect * 100,
            borderColor: "rgba(0, 0, 0, 0.5)",
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: false,
            },
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "How likely Jesse is to betray (%)",
          font: { size: 11 },
        },
        ticks: {
          maxTicksLimit: 6,
          font: { size: 10 },
        },
      },
      y: {
        title: {
          display: true,
          text: "Walter's expected prison sentence (years)",
          font: { size: 11 },
        },
        ticks: {
          font: { size: 10 },
        },
      },
    },
  };

  // Calculate crossover point where strategies are equal
  const crossoverPoint = (R - T) / (P + R - T - S);
  const hasValidCrossover = crossoverPoint >= 0 && crossoverPoint <= 1;

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderRadius: "4px",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      })}
    >
      <h4
        className={css({
          fontSize: "1rem",
          fontWeight: "medium",
          textAlign: "center",
          marginBottom: "1rem",
          color: "#374151",
        })}
      >
        When should Walter stay loyal vs. betray Jesse?
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
          marginBottom: "1rem",
        })}
      >
        We know that if <strong>both stay loyal, each gets 3 years</strong>, and if{" "}
        <strong>Walter betrays while Jesse stays loyal, Walter goes free (0 years)</strong>. But what about the other
        scenarios? Adjust the sliders below to see when loyalty becomes Walter's best choice.
      </p>

      {/* Adjustable Prison Sentences */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
          fontSize: "0.8rem",
        })}
      >
        <div>
          <label>
            <strong>If both betray:</strong> {P} years each
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={P}
            onChange={(e) => setP(parseFloat(e.target.value))}
            className={css({ width: "100%" })}
          />
        </div>
        <div>
          <label>
            <strong>If Jesse betrays Walter:</strong> {S} years for Walter
          </label>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={S}
            onChange={(e) => setS(parseFloat(e.target.value))}
            className={css({ width: "100%" })}
          />
        </div>
      </div>

      {/* Probability Control */}
      <div
        className={css({
          marginBottom: "1rem",
        })}
      >
        <label
          className={css({
            display: "block",
            fontSize: "0.85rem",
            color: "#374151",
            marginBottom: "0.5rem",
            textAlign: "center",
          })}
        >
          How likely is Jesse to betray me: <strong>{(probabilityDefect * 100).toFixed(0)}%</strong>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={probabilityDefect}
          onChange={(e) => setProbabilityDefect(parseFloat(e.target.value))}
          className={css({
            width: "100%",
            height: "4px",
            backgroundColor: "#e5e7eb",
            borderRadius: "2px",
            outline: "none",
            cursor: "pointer",
          })}
        />
      </div>
      <div
        className={css({
          height: "250px",
          marginBottom: "1rem",
        })}
      >
        <Line data={data} options={options} />
      </div>

      {/* Decision Recommendation Section */}
      <div
        className={css({
          backgroundColor: expectedDefect < expectedCooperate ? "#fef2f2" : "#f0f9ff",
          border: expectedDefect < expectedCooperate ? "2px solid #dc2626" : "2px solid #0066cc",
          borderRadius: "6px",
          padding: "1rem",
          marginBottom: "1rem",
        })}
      >
        <div
          className={css({
            textAlign: "center",
            fontSize: "1rem",
            fontWeight: "bold",
            color: expectedDefect < expectedCooperate ? "#dc2626" : "#0066cc",
            marginBottom: "0.5rem",
          })}
        >
          🎯 Walter's Rational Choice: {expectedDefect < expectedCooperate ? "Betray Jesse" : "Stay Loyal"}
        </div>

        <div
          className={css({
            fontSize: "0.85rem",
            color: "#374151",
            textAlign: "center",
          })}
        >
          Expected outcome: <strong>{Math.min(expectedCooperate, expectedDefect).toFixed(1)} years in prison</strong>
        </div>
      </div>
    </div>
  );
};

function prisonersDilemma(choice1: Choice, choice2: Choice): [number, number] {
  // Breaking Bad scenario: prison sentences in years
  // C = Cooperate (stay loyal), D = Defect (betray)
  if (choice1 === "C" && choice2 === "C") return [3, 3]; // Both stay loyal: 3 years each
  if (choice1 === "C" && choice2 === "D") return [15, 0]; // Walter loyal, Jesse betrays: Walter 15 years, Jesse free
  if (choice1 === "D" && choice2 === "C") return [0, 15]; // Walter betrays, Jesse loyal: Walter free, Jesse 15 years
  return [5, 5]; // Both betray: 5 years each
}

function playRepeatedGame(
  numGames: number,
  strategy1: Strategy,
  strategy2: Strategy,
): { payoffs1: number[]; payoffs2: number[]; totalPayoffs1: number[]; totalPayoffs2: number[] } {
  const choices = ["D", "C"] as const;
  const history1: Choice[] = [];
  const history2: Choice[] = [];
  const payoffs1: number[] = [];
  const payoffs2: number[] = [];
  const totalPayoffs1: number[] = [];
  const totalPayoffs2: number[] = [];

  let total1 = 0;
  let total2 = 0;

  for (let i = 0; i < numGames; i++) {
    let choice1: Choice;
    let choice2: Choice;

    // Determine choices based on strategies
    switch (strategy1) {
      case "random":
        choice1 = choices[Math.floor(Math.random() * 2)];
        break;
      case "defect":
        choice1 = "D";
        break;
      case "cooperate":
        choice1 = "C";
        break;
      case "tit-for-tat":
        choice1 = i === 0 ? "C" : history2[i - 1];
        break;
    }

    switch (strategy2) {
      case "random":
        choice2 = choices[Math.floor(Math.random() * 2)];
        break;
      case "defect":
        choice2 = "D";
        break;
      case "cooperate":
        choice2 = "C";
        break;
      case "tit-for-tat":
        choice2 = i === 0 ? "C" : history1[i - 1];
        break;
    }

    const [payoff1, payoff2] = prisonersDilemma(choice1, choice2);

    history1.push(choice1);
    history2.push(choice2);
    payoffs1.push(payoff1);
    payoffs2.push(payoff2);

    total1 += payoff1;
    total2 += payoff2;

    totalPayoffs1.push(total1);
    totalPayoffs2.push(total2);
  }

  return { payoffs1, payoffs2, totalPayoffs1, totalPayoffs2 };
}

// Simplified Interactive Payoff Matrix Component
const PayoffMatrix: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [gameResult, setGameResult] = useState<{ walterSentence: number; jesseSentence: number } | null>(null);

  const makeDecision = (choice: Choice) => {
    setPlayerChoice(choice);
    // Jesse's decision is random
    const jesseChoice = Math.random() < 0.5 ? "C" : "D";
    setOpponentChoice(jesseChoice);

    const [walterSentence, jesseSentence] = prisonersDilemma(choice, jesseChoice);
    setGameResult({ walterSentence, jesseSentence });
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setGameResult(null);
  };

  const getOutcomeText = (walter: Choice, jesse: Choice) => {
    if (walter === "D" && jesse === "D") return "We both blame each other - 5 years each!";
    if (walter === "D" && jesse === "C") return "I betray Jesse - I walk free!";
    if (walter === "C" && jesse === "D") return "Jesse betrays me - I get 15 years!";
    return "We both stay loyal - 3 years each, best mutual outcome!";
  };

  const getOutcomeColor = (walter: Choice, jesse: Choice) => {
    if (walter === "D" && jesse === "D") return "#fff3cd"; // orange-ish
    if (walter === "D" && jesse === "C") return "#d4edda"; // green-ish
    if (walter === "C" && jesse === "D") return "#f8d7da"; // red-ish
    return "#cce5ff"; // blue-ish
  };

  const getOutcomeBorderColor = (walter: Choice, jesse: Choice) => {
    if (walter === "D" && jesse === "D") return "#856404"; // orange border
    if (walter === "D" && jesse === "C") return "#155724"; // green border
    if (walter === "C" && jesse === "D") return "#721c24"; // red border
    return "#004085"; // blue border
  };

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(59, 130, 246, 0.05)", // Very subtle blue background
        borderRadius: "4px",
        border: "1px solid rgba(59, 130, 246, 0.2)", // Subtle border
      })}
    >
      <h4
        className={css({
          fontSize: "1rem",
          fontWeight: "medium",
          textAlign: "center",
          marginBottom: "1rem",
          color: "#374151",
        })}
      >
        Interactive Scenario: What do you do?
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
        })}
      >
        Jesse's decision will be simulated randomly after you choose.
      </p>

      {!playerChoice ? (
        <div
          className={css({
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
          })}
        >
          <button
            onClick={() => makeDecision("D")}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: "#374151",
              color: "white",
              borderRadius: "4px",
              border: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
              _hover: {
                backgroundColor: "#1f2937",
              },
            })}
          >
            Blame Jesse
          </button>
          <button
            onClick={() => makeDecision("C")}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: "#0066cc",
              color: "white",
              borderRadius: "4px",
              border: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
              _hover: {
                backgroundColor: "#0052a3",
              },
            })}
          >
            Stay loyal
          </button>
        </div>
      ) : (
        <div>
          <div
            className={css({
              textAlign: "center",
              marginBottom: "1rem",
            })}
          >
            <p
              className={css({
                fontSize: "0.9rem",
                color: "#374151",
                marginBottom: "0.5rem",
              })}
            >
              <strong>My choice:</strong> {playerChoice === "D" ? "Blame Jesse" : "Stay loyal"}
            </p>
            <p
              className={css({
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              })}
            >
              <strong>Jesse&apos;s choice (simulated):</strong> {opponentChoice === "D" ? "Blame me" : "Stay loyal"}
            </p>
          </div>

          {gameResult && (
            <div
              className={css({
                padding: "0.75rem",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                backgroundColor: "#f9fafb",
                marginTop: "1rem",
              })}
            >
              <p
                className={css({
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#374151",
                  marginBottom: "0.5rem",
                })}
              >
                {getOutcomeText(playerChoice, opponentChoice!)}
              </p>
              <div
                className={css({
                  display: "flex",
                  justifyContent: "center",
                  gap: "2rem",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                })}
              >
                <div>
                  <strong>My sentence:</strong>{" "}
                  {gameResult.walterSentence === 0 ? "Free" : `${gameResult.walterSentence} years`}
                </div>
                <div>
                  <strong>Jesse&apos;s sentence:</strong>{" "}
                  {gameResult.jesseSentence === 0 ? "Free" : `${gameResult.jesseSentence} years`}
                </div>
              </div>
            </div>
          )}

          <div
            className={css({
              textAlign: "center",
              marginTop: "1rem",
            })}
          >
            <button
              onClick={resetGame}
              className={css({
                padding: "0.375rem 0.75rem",
                backgroundColor: "#f3f4f6",
                color: "#374151",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "background-color 0.2s",
                _hover: {
                  backgroundColor: "#e5e7eb",
                },
              })}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div
        className={css({
          marginTop: "1rem",
          fontSize: "0.7rem",
          color: "#9ca3af",
          textAlign: "center",
        })}
      >
        <p>
          Sentences: 0 years = immunity • 3 years = mutual cooperation • 5 years = mutual betrayal • 15 years = betrayed
          while loyal
        </p>
      </div>
    </div>
  );
};

// Game Simulation Component
const GameSimulation: React.FC = () => {
  const [walterStrategy, setWalterStrategy] = useState<Strategy>("tit-for-tat");
  const [numGames, setNumGames] = useState(50);
  const [isRunning, setIsRunning] = useState(false);
  const [gameData, setGameData] = useState<{
    payoffs1: number[];
    payoffs2: number[];
    totalPayoffs1: number[];
    totalPayoffs2: number[];
    jesseStrategy: Strategy;
  } | null>(null);

  const strategyDescriptions = {
    random: "Unpredictable - you make random decisions based on emotions and circumstances",
    cooperate: "Always loyal - you stick with Jesse no matter what (Season 1 approach)",
    defect: "Always selfish - you prioritize yourself and betray when convenient (Season 5 approach)",
    "tit-for-tat": "Reciprocal - you start loyal, then match whatever Jesse did last time",
  };

  const jesseStrategyDescriptions = {
    random: "Unpredictable Jesse - makes chaotic, emotion-driven decisions",
    cooperate: "Loyal Jesse - always tries to stick with you (Season 1 Jesse)",
    defect: "Betraying Jesse - prioritizes himself, always looks for an advantage",
    "tit-for-tat": "Reactive Jesse - mirrors your behavior from previous interactions",
  };

  const runSimulation = () => {
    setIsRunning(true);

    // Randomly select Jesse's strategy for this simulation
    const strategies: Strategy[] = ["random", "cooperate", "defect", "tit-for-tat"];
    const jesseStrategy = strategies[Math.floor(Math.random() * strategies.length)];

    const result = playRepeatedGame(numGames, walterStrategy, jesseStrategy);
    setGameData({
      ...result,
      jesseStrategy,
    });
    setIsRunning(false);
  };

  const getOutcomeAnalysis = () => {
    if (!gameData) return null;

    const walterTotal = gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1];
    const jesseTotal = gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1];
    const walterAvg = walterTotal / numGames;
    const jesseAvg = jesseTotal / numGames;

    let verdict = "";
    let color = "";

    if (walterAvg < 4) {
      verdict = "Excellent partnership! You're both doing well.";
      color = "#10b981"; // green
    } else if (walterAvg < 6) {
      verdict = "Decent cooperation with some conflicts.";
      color = "#f59e0b"; // yellow
    } else if (walterAvg < 10) {
      verdict = "Troubled relationship with frequent betrayals.";
      color = "#f97316"; // orange
    } else {
      verdict = "Toxic partnership - this relationship is falling apart.";
      color = "#ef4444"; // red
    }

    return { verdict, color, walterAvg, jesseAvg };
  };

  const analysis = getOutcomeAnalysis();

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderRadius: "4px",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      })}
    >
      <h4
        className={css({
          fontSize: "1rem",
          fontWeight: "medium",
          marginBottom: "1rem",
          textAlign: "center",
          color: "#374151",
        })}
      >
        🎭 Walter's Strategy Simulator: How Will Your Partnership Play Out?
      </h4>

      <p className={css({ textAlign: "center", color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" })}>
        Choose your approach as Walter. Jesse's strategy will be randomly selected to simulate the uncertainty of
        working with a partner. Each simulation runs for 50 episodes (two seasons).
      </p>

      <div className={css({ marginBottom: "1rem" })}>
        <div>
          <label
            className={css({
              display: "block",
              fontSize: "0.85rem",
              fontWeight: "medium",
              marginBottom: "0.5rem",
              color: "#374151",
              textAlign: "center",
            })}
          >
            Walter's Strategy (You):
          </label>
          <div className={css({ display: "flex", justifyContent: "center" })}>
            <select
              value={walterStrategy}
              onChange={(e) => setWalterStrategy(e.target.value as Strategy)}
              className={css({
                width: "60%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "0.85rem",
              })}
            >
              <option value="tit-for-tat">Reciprocal (Recommended)</option>
              <option value="cooperate">Always Loyal</option>
              <option value="defect">Always Selfish</option>
              <option value="random">Unpredictable</option>
            </select>
          </div>
          <p
            className={css({
              fontSize: "0.75rem",
              color: "#6b7280",
              marginTop: "0.5rem",
              lineHeight: "1.3",
              textAlign: "center",
            })}
          >
            {strategyDescriptions[walterStrategy]}
          </p>
        </div>
      </div>

      <div className={css({ textAlign: "center", marginBottom: "1rem" })}>
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className={css({
            padding: "0.75rem 1.5rem",
            backgroundColor: isRunning ? "#9ca3af" : "#0066cc",
            color: "white",
            borderRadius: "4px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: "medium",
            cursor: isRunning ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            _hover: {
              backgroundColor: isRunning ? "#9ca3af" : "#0052a3",
            },
          })}
        >
          {isRunning ? "🎬 Filming the season..." : "🎬 Start the Season"}
        </button>
      </div>

      {gameData && analysis && (
        <div className={css({ marginTop: "1rem" })}>
          <div
            className={css({
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "1rem",
              marginBottom: "1rem",
            })}
          >
            <div className={css({ textAlign: "center", marginBottom: "0.75rem" })}>
              <h5
                className={css({ fontSize: "0.9rem", fontWeight: "medium", color: "#374151", marginBottom: "0.5rem" })}
              >
                🎪 The Season Results
              </h5>
              <p className={css({ fontSize: "0.8rem", color: "#6b7280" })}>
                You played as <strong>{strategyDescriptions[walterStrategy].split(" - ")[0]}</strong> Walter against{" "}
                <strong>{jesseStrategyDescriptions[gameData.jesseStrategy].split(" - ")[0]}</strong>
              </p>
            </div>

            <div
              className={css({
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "0.75rem",
                fontSize: "0.85rem",
              })}
            >
              <div className={css({ textAlign: "center" })}>
                <div className={css({ color: "#2563eb", fontWeight: "bold", fontSize: "1.1rem" })}>
                  {analysis.walterAvg.toFixed(1)} years avg
                </div>
                <div className={css({ color: "#6b7280", fontSize: "0.75rem" })}>Walter's Average</div>
              </div>
              <div className={css({ textAlign: "center" })}>
                <div className={css({ color: "#7c3aed", fontWeight: "bold", fontSize: "1.1rem" })}>
                  {analysis.jesseAvg.toFixed(1)} years avg
                </div>
                <div className={css({ color: "#6b7280", fontSize: "0.75rem" })}>Jesse's Average</div>
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "0.5rem",
                borderRadius: "4px",
                backgroundColor: "white",
                border: `1px solid ${analysis.color}20`,
              })}
            >
              <div className={css({ color: analysis.color, fontWeight: "medium", fontSize: "0.85rem" })}>
                {analysis.verdict}
              </div>
            </div>
          </div>

          <div className={css({ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" })}>
            💡 Try different strategies to see how they affect your partnership with Jesse
          </div>
        </div>
      )}
    </div>
  );
};

// Strategy Analysis Component
const StrategyAnalysis: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const strategies: Strategy[] = ["random", "cooperate", "defect", "tit-for-tat"];
  const strategyNames = {
    random: "Random",
    cooperate: "Cooperate",
    defect: "Defect",
    "tit-for-tat": "Tit-for-Tat",
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const results: any = {};

      strategies.forEach((strat1) => {
        results[strat1] = {};
        strategies.forEach((strat2) => {
          // Run multiple simulations for statistical reliability
          const simulations = Array.from({ length: 50 }, () => {
            const { totalPayoffs1, totalPayoffs2 } = playRepeatedGame(100, strat1, strat2);
            return {
              score1: totalPayoffs1[totalPayoffs1.length - 1],
              score2: totalPayoffs2[totalPayoffs2.length - 1],
            };
          });

          const avgScore1 = simulations.reduce((sum, sim) => sum + sim.score1, 0) / simulations.length;
          const avgScore2 = simulations.reduce((sum, sim) => sum + sim.score2, 0) / simulations.length;

          results[strat1][strat2] = {
            avgScore1: avgScore1.toFixed(1),
            avgScore2: avgScore2.toFixed(1),
          };
        });
      });

      setAnalysisResults(results);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🧪 Breaking Bad Character Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        Analyzes how different character approaches fare against each other over a full season (100 episodes, 50
        simulations per character pairing).
      </p>

      <button
        onClick={runAnalysis}
        disabled={isAnalyzing}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isAnalyzing ? "Analyzing character arcs..." : "🎭 Analyze Breaking Bad Characters"}
      </button>

      {analysisResults && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-100">Player 1 \ Player 2</th>
                {strategies.map((strat) => (
                  <th key={strat} className="border p-2 bg-gray-100">
                    {strategyNames[strat]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strategies.map((strat1) => (
                <tr key={strat1}>
                  <td className="border p-2 bg-gray-100 font-medium">{strategyNames[strat1]}</td>
                  {strategies.map((strat2) => (
                    <td key={strat2} className="border p-2 text-center">
                      <div className="text-blue-600 font-bold">{analysisResults[strat1][strat2].avgScore1}</div>
                      <div className="text-red-600 text-xs">vs {analysisResults[strat1][strat2].avgScore2}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500">
            Blue numbers = Player 1 average, Red numbers = Player 2 average
          </div>
        </div>
      )}
    </div>
  );
};

// Main Blog Post Component
const PrisonersDilemmaPost: React.FC = () => {
  return (
    <article className="prose prose-lg max-w-none">
      <p>
        The Prisoner&apos;s Dilemma is one of the most famous examples from game theory and shows how conflict of
        interests can have deep effects on the rational decisions.
      </p>
      <p>
        I had already heard of it in the context of a single game. However, with the Nobel Prize in economics of 2024 I
        encountered the topic again, but this time in the contex of repeated games. The way I understood the lecture
        notes and some articles, repeated games can be helpful to understand the emergence and breakdown of cooperation
        in society. So, in this post I decided to simply collect it in a visual fashion to understand the basic example
        a bit better.
      </p>
      <h2> Setting the scene with Breaking Bad</h2>
      <p>
        The formal prisoner's dilemma is quite nicely visualized within the setting of Breaking Bad. The main characters
        are
        <ul>
          <li>
            <strong>Walter White</strong> - High school chemistry teacher turned meth cook to secure his family's
            financial future
          </li>
          <li>
            <strong>Jesse Pinkman</strong> - Walter's former student and drug dealing partner in the meth business
          </li>
          <li>
            <strong>Hank Schrader</strong> - DEA agent and Walter's brother-in-law, investigating the local drug trade
          </li>
        </ul>
        So, we will assume the following situation. Walter White and Jesse Pinkman have been arrested after a DEA raid
        on their meth lab. They're in separate interrogation rooms, unable to communicate. Agent Hank Schrader is
        offering each of them the same deal: testify against your partner and walk free, or stay silent and take
        whatever punishment comes.
      </p>

      <h3>The Breaking Bad scenario</h3>
      <p>
        This is the <strong>perfect</strong> Prisoner's Dilemma scenario. Walter and Jesse each have exactly two
        choices:
      </p>
      <ul>
        <li>
          <strong>Cooperate (C)</strong>: Stay loyal to your partner - "I don't know this person, we've never met."
        </li>
        <li>
          <strong>Defect (D)</strong>: Blame your partner - "He forced me into this, he's the real criminal."
        </li>
      </ul>
      <p>The sentences depend on what both choose:</p>
      <ul>
        <li>
          <strong>Both stay loyal (C, C)</strong>: Each gets 3 years. The DEA has some evidence but not enough for major
          charges without testimony.
        </li>
        <li>
          <strong>One blames the other (D, C)</strong>: The betrayer walks free with immunity, the loyal one gets 15
          years for "being the mastermind."
        </li>
        <li>
          <strong>Both blame each other (D, D)</strong>: Each gets 5 years. Their contradictory stories help neither
          case.
        </li>
      </ul>

      <h3> Taking a team approach</h3>
      <p>
        If both Walter and Jesse could somehow step back and ask "What's the best outcome for <em>us as a team</em>?"
        they'd immediately see that mutual loyalty (3 years each) beats mutual betrayal (5 years each). The total "team
        sentence" is only 6 years versus 10 years. It's like they're in this together against the DEA, not against each
        other. If they could make a pact and trust each other to stick to it, they'd both be better off. This is what
        economists call the &quot;Pareto optimal&quot; solution - you can't make one person better off without making
        the other worse off. The dilemma is that the team approach is not the only way to look at this and that a much
        more natural perspective for a criminal like Walter White might be &quot;What's the best outcome for{" "}
        <em>me as an individual</em>?&quot;.
      </p>

      <h3>Playing the role of Walter White</h3>
      <p>
        {" "}
        You can now put yourself into Walter White&apos;s shoes. You&apos;re in the DEA interrogation room. Hank is
        across the table, and you know Jesse is in the next room facing the same choice. What do you do?
      </p>

      <PayoffMatrix />

      <p>
        {" "}
        It is really interesting to play around with the game. I personally felt very motivated to blame Jesse at some
        point, as I could simply walk free and did not feel like I had much too loose. However, you can put feelings
        aside and simply look at the expected utility of the game for you personally.
      </p>
      <h3>A Rational Analysis</h3>

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`


Walter White is a chemistry teacher - and hence a fairly rational guy. So, If he can estimate how likely Jesse is to betray him, what should he do?
Here's how we calculate it:

**Expected Value = (Outcome if Jesse stays loyal) × (Probability Jesse stays loyal) + (Outcome if Jesse betrays) × (Probability Jesse betrays)**

Let's say there's a probability *p* that Jesse will betray Walter. Then there's a probability *(1-p)* that Jesse stays loyal.

The math for Walter's expected prison sentence:
- **When staying loyal**: E[Loyal] = 3(1-p) + 15p = 3 + 12p years
  - If Jesse stays loyal (probability 1-p): 3 years
  - If Jesse betrays (probability p): 15 years
- **When blaming Jesse**: E[Blame] = 0(1-p) + 5p = 5p years  
  - If Jesse stays loyal (probability 1-p): 0 years (Walter goes free)
  - If Jesse betrays (probability p): 5 years

Since we want to minimize prison time, Walter should stay loyal when 3 + 12p < 5p, which is ... *never*. For a single game
Walter is always better off to blame Jesse, no matter what he thinks Jesse will do. So, if both players are rational and think the same way, they will both blame each other, leading to 5 years each.
Clearly, this is not yet best outcome for them as a team, but the incentive to betray is too strong.

### The general calculation

We can extend the previous discussion to the more general case. We will introduce the following
notations:

- *T = 0* years is the temptation that Walter and Jesse have to blame the other one.
- *R = 3* years is the reward that they get for being loyal to each other.
- *P = 5* years is the punishment that they get for blaming each other.
- *S = 15* years is the suckers payout that they get for being loyal but getting blamed.

In the general case, you can always assume that *T < R < P, S*. Otherwise the whole situation would fall apart. So
we can now simply rewrite the conditions above as follows:

- **When staying loyal**: E[Loyal] = R(1-p) + Sp = R + (S-R)p 
  - If Jesse stays loyal (probability 1-p): R years
  - If Jesse betrays (probability p): S years
- **When blaming Jesse**: E[Blame] = T(1-p) + Pp = T + (P-T)p years  
  - If Jesse stays loyal (probability 1-p): T years (Walter goes free)
  - If Jesse betrays (probability p): P years

We can now analyze the situation for T=0, as T is anyways always the smallest value. 
We then see that Walter should stay loyal when:

$$
\\begin{align*}
E[\\text{Loyal}] &< E[\\text{Blame}] \\\\
R + (S-R)p &<  Pp \\\\
p&>\\frac{R}{R+P-S} 
\\end{align*}
$$

First we see that $S < R+P$, as we would otherwise have $p<0$, which is not viable for a probability.
We further have the condition that p has to be smaller than one, which directly means that:

$$
S < P
$$

So Walter should only stay loyal if the the punishment of both blaming each other is 
higher than the punishment of being loyal and getting blamed by the other one. in the interactive simulation below
you can explort how Walter's rational decision should change within different scenarios .

`}</ReactMarkdown>
      <ExpectedUtilityPlot />
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
### An intermediate stop: What we have learned so far

Walter and Jesse's problems in that DEA interrogation room captures some typical conflicts that we encounter frequently. Both would be better off if they could trust each other to stay loyal (3 years each vs. 5 years each), yet the math shows Walter should betray Jesse regardless of what he thinks Jesse will do. This is the heart of the Prisoner's Dilemma: **individual rationality destroys collective benefit**.

You can easily think about Walter's internal monologue: "If Jesse stays loyal, I walk free by betraying him. If Jesse betrays me, I still get a lighter sentence by betraying him first. Either way, betrayal is my best move." But Jesse is thinking the exact same thing. 
The "rational" choice for both individually leads them to a worse outcome than if they had somehow coordinated to both stay loyal.

**However, there is also fascinating twist:** The mathematical analysis revealed that Walter should only stay loyal if the punishment for mutual betrayal is higher than the punishment for being the "sucker" who stays loyal while getting betrayed (S = 15 years). 
You could imagine this scenario to unfold if Walter and Jesse were part of a larger criminal organization - like the cartel. If both betray each other, they don't just get 5 years in prison; they also face execution by the cartel for breaking the code of silence. 
Suddenly, mutual betrayal might carry a "sentence" of 20+ years (or death), while being betrayed by your partner only gets you the original 15 years in prison - at least you're alive and might get witness protection.

This is one nice explanation why organized crime groups, military units, and tight-knit communities often develop such strong codes of loyalty - they artificially raise the cost of mutual defection to make cooperation the individually rational choice.

But what if Walter and Jesse don't have a cartel breathing down their necks? What if they're just two guys who have to work together repeatedly over many "episodes"? This opens up another interesting possibility: maybe they can learn to cooperate through experience. 
If they know they'll face similar dilemmas again and again, betraying your partner today might mean getting betrayed tomorrow. Suddenly, building a reputation for loyalty becomes valuable - not because of external threats, but because it encourages your partner to cooperate in future rounds. 
We will have a deeper look into this scenario in the next section.


      `}</ReactMarkdown>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
## When Breaking Bad Becomes a Series: Repeated Interactions

Neither life, nor Breaking Bad is a single episode. So let us follow up on our initial though experiment
and look into a series with repeated interactions between Walter and Jesse. This changes everything:

### Breaking Bad Character Strategies:
- **Always loyal** (Season 1 Jesse): Stick with your partner no matter what
- **Always selfish** (Season 5 Walter): Prioritize yourself, always betray when convenient  
- **Tit-for-Tat** (Realistic relationship): Start loyal, then match whatever your partner did last time
- **Unpredictable** (Chaotic storylines): Random decisions based on emotions and circumstances

See how different character arcs would play out over multiple "episodes":
      `}</ReactMarkdown>

      <GameSimulation />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
## Which Breaking Bad Character Strategy Wins?

Over the course of a full series, which character approach leads to the best outcomes? Let's analyze all strategies against each other:
      `}</ReactMarkdown>

      <StrategyAnalysis />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
## Breaking Bad Lessons: What Walter and Jesse Teach Us About Game Theory

The Prisoner's Dilemma through Breaking Bad's lens reveals profound insights about human nature and strategic thinking:

### 1. **Rational Self-Interest vs. Mutual Benefit**
Walter's chemistry teacher logic tells him to betray Jesse (especially when he thinks Jesse might betray him first). But this "rational" thinking leads to worse outcomes for both. The show perfectly illustrates how individual rationality can destroy collective welfare.

### 2. **Trust is Everything - But Hard to Maintain**
Walter and Jesse's best outcomes always came when they trusted each other (both staying silent = 3 years each). But trust erodes quickly - one betrayal leads to cycles of retaliation, just like their relationship in the show.

### 3. **Repeated Interactions Change the Game**
In a single episode (one-shot game), betrayal might seem optimal. But Breaking Bad is a series - Walter and Jesse had to work together repeatedly. This changes everything: reputation, future cooperation, and long-term strategy become crucial.

### 4. **Emotions Make Us "Irrational" - But Maybe That's Good**
Pure game theory suggests Walter should always be calculating and Jesse should always be selfish. But their emotional bonds (partnership, loyalty, even love) often led to cooperation that benefited both. Sometimes being "irrational" is the most rational thing to do.

### 5. **Real Life is More Complex Than Models**
Breaking Bad shows that real prisoner's dilemmas involve:
- **Multiple players** (DEA, family, other criminals)
- **Asymmetric information** (who knows what?)
- **Changing payoffs** (stakes get higher over time)
- **External consequences** (reputation in the criminal world)

## The Breaking Bad Paradox

The show's genius is that it demonstrates both sides:
- **Walter's transformation**: From cooperator (early seasons) to defector (later seasons)
- **Jesse's evolution**: From naive loyalty to strategic thinking
- **Their relationship**: How repeated games can build trust... or destroy it

## Why This Matters Beyond TV

Understanding these dynamics helps in:
- **Business partnerships**: When to compete vs. cooperate
- **International relations**: Arms races, trade wars, climate agreements
- **Personal relationships**: Building trust, handling conflicts
- **Social systems**: Why cooperation emerges (and breaks down) in society

The Prisoner's Dilemma isn't just an abstract math problem - it's the story of every partnership, every relationship, every society. Breaking Bad just happens to tell it with exceptional chemistry.

*Literally.*

### A discussion of the main learnings

Walter and Jesse's predicament in that DEA interrogation room captures something profound about human nature. Both would be better off if they could trust each other to stay loyal (3 years each vs. 5 years each), yet the math shows Walter should betray Jesse regardless of what he thinks Jesse will do. This is the heart of the Prisoner's Dilemma: **individual rationality destroys collective benefit**.

Think about Walter's internal monologue: "If Jesse stays loyal, I walk free by betraying him. If Jesse betrays me, I still get a lighter sentence by betraying him first. Either way, betrayal is my best move." But Jesse is thinking the exact same thing. The "rational" choice for both leads them to a worse outcome than if they had somehow coordinated to both stay loyal.

**This Walter-Jesse dynamic isn't unique to criminals** - it's a fundamental tension that appears throughout society whenever individual incentives conflict with group welfare:

- **Climate Change**: Like Walter and Jesse, every country thinks "If others cut emissions, I benefit from a stable climate while keeping my economy strong. If others don't cut emissions, I need to stay competitive." Result: everyone keeps polluting.

- **Arms Races**: Each nation reasons "If others disarm, I'll be the strongest. If others arm up, I can't be left defenseless." Result: costly military buildups that make everyone less secure.

- **Corporate Tax Avoidance**: Companies think "If others pay taxes, public infrastructure improves while I save money. If others avoid taxes, I can't afford to be the only one paying." Result: crumbling public services.

- **Team Projects**: Each member thinks "If others work hard, the project succeeds while I coast. If others slack off, my extra effort won't save it anyway." Result: mediocre outcomes for everyone.

Walter and Jesse's story reveals why cooperation is both essential and fragile. Their mathematical dilemma explains why we need contracts, laws, reputation systems, and social norms - these mechanisms help bridge the gap between what's rational for individuals and what's beneficial for the group. Without these structures, we all end up like Walter and Jesse: pursuing our individual best interests straight into collectively worse outcomes.


      `}</ReactMarkdown>
    </article>
  );
};

// Post metadata
export const meta = {
  title: "The Prisoner&apos;s Dilemma",
  description:
    "Explore game theory through Breaking Bad: Interactive simulations of Walter White and Jesse Pinkman's strategic decisions and prisoner's dilemmas",
  publishing_date: "2025-06-22",
  image: "/images/breaking-bad-prisoners-dilemma.jpg",
  readTime: "15 min",
  tags: ["Game Theory", "Breaking Bad", "Interactive", "Mathematics", "TV Analysis"],
};

export default PrisonersDilemmaPost;
