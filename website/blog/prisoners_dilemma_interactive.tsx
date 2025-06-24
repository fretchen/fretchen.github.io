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
  const R = 3; // Reward for mutual cooperation (both cooperate)
  const T = 0; // Temptation to defect (defect while opponent cooperates)

  // Adjustable parameters
  const [P, setP] = useState(5); // Punishment for mutual defection (both defect)
  const [S, setS] = useState(15); // Sucker's payoff (cooperate while opponent defects)

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
        label: "Cooperate with Jesse",
        data: cooperateValues,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
      },
      {
        label: "Defect against Jesse",
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
          text: "How likely Jesse is to defect (%)",
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
        When should Walter cooperate vs. defect against Jesse?
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
          marginBottom: "1rem",
        })}
      >
        We know that if <strong>both cooperate, each gets 3 years</strong>, and if{" "}
        <strong>Walter defects while Jesse cooperates, Walter goes free (0 years)</strong>. But what about the other
        scenarios? Adjust the sliders below to see when cooperation becomes Walter&rsquo;s best choice.
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
            <strong>If both defect:</strong> {P} years each
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
            <strong>If Jesse defects against Walter:</strong> {S} years for Walter
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
          How likely is Jesse to defect: <strong>{(probabilityDefect * 100).toFixed(0)}%</strong>
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
          🎯 Walter's Rational Choice: {expectedDefect < expectedCooperate ? "Defect" : "Cooperate"}
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
  // C = Cooperate, D = Defect
  if (choice1 === "C" && choice2 === "C") return [3, 3]; // Both cooperate: 3 years each
  if (choice1 === "C" && choice2 === "D") return [15, 0]; // Walter cooperates, Jesse defects: Walter 15 years, Jesse free
  if (choice1 === "D" && choice2 === "C") return [0, 15]; // Walter defects, Jesse cooperates: Walter free, Jesse 15 years
  return [5, 5]; // Both defect: 5 years each
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
    return "We both cooperate - 3 years each, best mutual outcome!";
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
            Cooperate
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
              <strong>My choice:</strong> {playerChoice === "D" ? "Blame Jesse" : "Cooperate"}
            </p>
            <p
              className={css({
                fontSize: "0.9rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              })}
            >
              <strong>Jesse&apos;s choice (simulated):</strong> {opponentChoice === "D" ? "Blame me" : "Cooperate"}
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
          while cooperating
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
    random: "Unpredictable - chaotic storylines with random decisions based on emotions and circumstances",
    cooperate: "Always Cooperate - stick with your partner no matter what (Season 1 Jesse approach)",
    defect: "Always selfish - prioritize yourself and betray when convenient (Season 5 Walter approach)",
    "tit-for-tat": "Tit-for-Tat - realistic relationship, start cooperating then match whatever Jesse did last time",
  };

  const jesseStrategyDescriptions = {
    random: "Unpredictable Jesse - makes chaotic, emotion-driven decisions",
    cooperate: "Always Cooperate - always tries to stick with you (Season 1 Jesse)",
    defect: "Always selfish Jesse - prioritizes himself, always looks for an advantage",
    "tit-for-tat": "Tit-for-Tat Jesse - mirrors your behavior from previous interactions",
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

    // Check for exploitation in both directions
    let exploited = false;
    let exploitationMessage = "";

    const avgDifference = walterAvg - jesseAvg;
    const walterExploitingJesse = avgDifference < -3; // Walter gets 3+ years less than Jesse (better for Walter)
    const jesseExploitingWalter = avgDifference > 3; // Walter gets 3+ years more than Jesse (worse for Walter)

    if (jesseExploitingWalter) {
      exploited = true;
      exploitationMessage = `Jesse consistently got better deals while you suffered. Average difference: ${avgDifference.toFixed(1)} years worse for you.`;
    } else if (walterExploitingJesse) {
      exploited = true;
      exploitationMessage = `You consistently got better deals while Jesse suffered. Average difference: ${Math.abs(avgDifference).toFixed(1)} years worse for Jesse.`;
    } else if (walterStrategy === "cooperate" && jesseAvg < 4 && walterAvg > 8) {
      exploited = true;
      exploitationMessage = "You cooperated but Jesse took advantage of your cooperation repeatedly.";
    }

    let verdict = "";
    let color = "";

    if (walterExploitingJesse) {
      verdict = "Exploitative partnership - you're taking advantage of Jesse's cooperation.";
      color = "#dc2626"; // red
    } else if (jesseExploitingWalter) {
      verdict = "You're being exploited - Jesse is getting better deals while you suffer.";
      color = "#dc2626"; // red
    } else if (walterAvg < 4 && jesseAvg < 4) {
      verdict = "Excellent partnership! You're both doing well.";
      color = "#10b981"; // green
    } else if (walterAvg < 6 && jesseAvg < 6) {
      verdict = "Decent cooperation with some conflicts.";
      color = "#f59e0b"; // yellow
    } else if (walterAvg < 10) {
      verdict = "Troubled relationship with frequent betrayals.";
      color = "#f97316"; // orange
    } else {
      verdict = "Toxic partnership - this relationship is falling apart.";
      color = "#ef4444"; // red
    }

    return { verdict, color, walterAvg, jesseAvg, exploited, exploitationMessage };
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
        🎭 Walter&apos;s Strategy Simulator: How Will Your Partnership Play Out?
      </h4>

      <p className={css({ textAlign: "center", color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" })}>
        Choose your approach as Walter. Jesse&apos;s strategy will be randomly selected to simulate the uncertainty of
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
            Walter&apos;s Strategy (You):
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
              <option value="tit-for-tat">Tit-for-Tat</option>
              <option value="cooperate">Always Cooperate</option>
              <option value="defect">Always selfish</option>
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
          {/* Strategy matchup prominently displayed */}
          <div
            className={css({
              backgroundColor: "#f8fafc",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            })}
          >
            <div className={css({ textAlign: "center", marginBottom: "1rem" })}>
              <h5 className={css({ fontSize: "1rem", fontWeight: "bold", color: "#374151", marginBottom: "0.5rem" })}>
                🎪 Season Finale: Walter vs Jesse
              </h5>
              <div
                className={css({
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: "0.5rem",
                  alignItems: "center",
                  margin: "1rem 0",
                })}
              >
                <div
                  className={css({
                    textAlign: "center",
                    padding: "0.75rem",
                    backgroundColor: "#dbeafe",
                    borderRadius: "6px",
                  })}
                >
                  <div className={css({ fontSize: "0.85rem", fontWeight: "bold", color: "#1d4ed8" })}>Walter (You)</div>
                  <div className={css({ fontSize: "0.75rem", color: "#3730a3", marginTop: "0.25rem" })}>
                    {strategyDescriptions[walterStrategy].split(" - ")[0]}
                  </div>
                </div>
                <div className={css({ fontSize: "1.5rem", textAlign: "center" })}>⚡</div>
                <div
                  className={css({
                    textAlign: "center",
                    padding: "0.75rem",
                    backgroundColor: "#faf5ff",
                    borderRadius: "6px",
                    border: "2px solid #a855f7",
                  })}
                >
                  <div className={css({ fontSize: "0.85rem", fontWeight: "bold", color: "#7c3aed" })}>Jesse</div>
                  <div className={css({ fontSize: "0.75rem", color: "#6b21a8", marginTop: "0.25rem" })}>
                    {jesseStrategyDescriptions[gameData.jesseStrategy].split(" - ")[0]}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={css({
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
                fontSize: "0.85rem",
              })}
            >
              <div className={css({ textAlign: "center" })}>
                <div className={css({ color: "#2563eb", fontWeight: "bold", fontSize: "1.2rem" })}>
                  {analysis.walterAvg.toFixed(1)} years
                </div>
                <div className={css({ color: "#6b7280", fontSize: "0.75rem" })}>Walter&apos;s Average Sentence</div>
                <div className={css({ color: "#2563eb", fontSize: "0.7rem", marginTop: "0.25rem" })}>
                  Total: {gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1]} years
                </div>
              </div>
              <div className={css({ textAlign: "center" })}>
                <div className={css({ color: "#7c3aed", fontWeight: "bold", fontSize: "1.2rem" })}>
                  {analysis.jesseAvg.toFixed(1)} years
                </div>
                <div className={css({ color: "#6b7280", fontSize: "0.75rem" })}>Jesse&apos;s Average Sentence</div>
                <div className={css({ color: "#7c3aed", fontSize: "0.7rem", marginTop: "0.25rem" })}>
                  Total: {gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1]} years
                </div>
              </div>
            </div>

            <div
              className={css({
                textAlign: "center",
                padding: "0.75rem",
                borderRadius: "6px",
                backgroundColor: "white",
                border: `2px solid ${analysis.color}`,
                marginBottom: "1rem",
              })}
            >
              <div className={css({ color: analysis.color, fontWeight: "bold", fontSize: "0.9rem" })}>
                {analysis.verdict}
              </div>
            </div>
          </div>

          {/* Accumulation Chart */}
          <div
            className={css({
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "1rem",
              marginBottom: "1rem",
            })}
          >
            <h6
              className={css({
                fontSize: "0.85rem",
                fontWeight: "medium",
                marginBottom: "0.75rem",
                textAlign: "center",
                color: "#374151",
              })}
            >
              📈 Cumulative Prison Sentences Over Time
            </h6>
            <div style={{ position: "relative", height: "200px", width: "100%" }}>
              <Line
                data={{
                  labels: Array.from({ length: numGames }, (_, i) => `Episode ${i + 1}`),
                  datasets: [
                    {
                      label: "Walter (You)",
                      data: gameData.totalPayoffs1,
                      borderColor: "#2563eb",
                      backgroundColor: "rgba(37, 99, 235, 0.1)",
                      borderWidth: 2,
                      fill: false,
                    },
                    {
                      label: "Jesse",
                      data: gameData.totalPayoffs2,
                      borderColor: "#7c3aed",
                      backgroundColor: "rgba(124, 58, 237, 0.1)",
                      borderWidth: 2,
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top" as const,
                      labels: {
                        boxWidth: 12,
                        font: { size: 11 },
                      },
                    },
                  },
                  scales: {
                    x: {
                      display: false, // Hide x-axis labels for cleaner look
                    },
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: "Total Prison Years",
                        font: { size: 10 },
                      },
                      ticks: {
                        font: { size: 10 },
                      },
                    },
                  },
                  elements: {
                    point: {
                      radius: 0, // Hide individual points for cleaner lines
                    },
                  },
                }}
              />
            </div>
            <p className={css({ fontSize: "0.7rem", color: "#6b7280", textAlign: "center", marginTop: "0.5rem" })}>
              Lower is better - shows how prison sentences accumulate as the partnership progresses
            </p>
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
    random: "Unpredictable",
    cooperate: "Always Cooperate",
    defect: "Always selfish",
    "tit-for-tat": "Tit-for-Tat",
  };

  const jesseStrategyDescriptions = {
    random: "Unpredictable Jesse - makes chaotic, emotion-driven decisions",
    cooperate: "Always Cooperate - always tries to stick with you (Season 1 Jesse)",
    defect: "Always selfish Jesse - prioritizes himself, always looks for an advantage",
    "tit-for-tat": "Tit-for-Tat Jesse - mirrors your behavior from previous interactions",
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

  const getBestStrategy = (jesseStrategy: Strategy) => {
    if (!analysisResults) return null;

    let bestStrategy = "tit-for-tat";
    let bestScore = parseFloat(analysisResults["tit-for-tat"][jesseStrategy].avgScore1);

    strategies.forEach((strategy) => {
      const score = parseFloat(analysisResults[strategy][jesseStrategy].avgScore1);
      if (score < bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    });

    return { strategy: bestStrategy, score: bestScore };
  };

  const getRecommendationColor = (score: number) => {
    if (score < 4) return "#10b981"; // green - excellent
    if (score < 6) return "#f59e0b"; // yellow - decent
    if (score < 10) return "#f97316"; // orange - troubled
    return "#ef4444"; // red - bad
  };

  const getRecommendationText = (score: number) => {
    if (score < 4) return "Excellent outcome";
    if (score < 6) return "Decent cooperation";
    if (score < 10) return "Troubled relationship";
    return "Toxic partnership";
  };

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
        🧪 Walter's Strategy Guide: How to Handle Different Types of Jesse
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
        })}
      >
        Analyzes how different Walter strategies perform against each type of Jesse over a full season (100 episodes, 50
        simulations per matchup). Find the optimal approach for each Jesse personality.
      </p>

      <div className={css({ textAlign: "center", marginBottom: "1.5rem" })}>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className={css({
            padding: "0.75rem 1.5rem",
            backgroundColor: isAnalyzing ? "#9ca3af" : "#0066cc",
            color: "white",
            borderRadius: "4px",
            border: "none",
            fontSize: "0.9rem",
            fontWeight: "medium",
            cursor: isAnalyzing ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            _hover: {
              backgroundColor: isAnalyzing ? "#9ca3af" : "#0052a3",
            },
          })}
        >
          {isAnalyzing ? "🔬 Analyzing character dynamics..." : "🎭 Analyze Breaking Bad Strategies"}
        </button>
      </div>

      {analysisResults && (
        <div>
          {/* Strategy Recommendations */}
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            })}
          >
            {strategies.map((jesseStrat) => {
              const best = getBestStrategy(jesseStrat);
              const color = best ? getRecommendationColor(best.score) : "#6b7280";
              const recommendationText = best ? getRecommendationText(best.score) : "";

              return (
                <div
                  key={jesseStrat}
                  className={css({
                    backgroundColor: "#f8fafc",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "1rem",
                  })}
                >
                  <div className={css({ textAlign: "center", marginBottom: "0.75rem" })}>
                    <h6
                      className={css({
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        color: "#374151",
                        marginBottom: "0.25rem",
                      })}
                    >
                      If Jesse is: {strategyNames[jesseStrat]}
                    </h6>
                    <p className={css({ fontSize: "0.7rem", color: "#6b7280", lineHeight: "1.3" })}>
                      {jesseStrategyDescriptions[jesseStrat]}
                    </p>
                  </div>

                  {best && (
                    <div
                      className={css({
                        textAlign: "center",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        backgroundColor: "white",
                        border: `2px solid ${color}`,
                      })}
                    >
                      <div
                        className={css({
                          color: color,
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          marginBottom: "0.25rem",
                        })}
                      >
                        🎯 Walter should be: {strategyNames[best.strategy]}
                      </div>
                      <div className={css({ fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.25rem" })}>
                        Average: {best.score} years prison
                      </div>
                      <div className={css({ fontSize: "0.7rem", color: color, fontWeight: "medium" })}>
                        {recommendationText}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Results Table */}
          <div
            className={css({
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "1rem",
              marginBottom: "1rem",
            })}
          >
            <h6
              className={css({
                fontSize: "0.85rem",
                fontWeight: "medium",
                marginBottom: "0.75rem",
                textAlign: "center",
                color: "#374151",
              })}
            >
              📊 Detailed Results: Walter's Average Prison Sentence
            </h6>
            <div className={css({ overflowX: "auto" })}>
              <table className={css({ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" })}>
                <thead>
                  <tr>
                    <th
                      className={css({
                        border: "1px solid #d1d5db",
                        padding: "0.5rem",
                        backgroundColor: "#f9fafb",
                        textAlign: "left",
                      })}
                    >
                      Walter's Strategy ↓ / Jesse's Strategy →
                    </th>
                    {strategies.map((strat) => (
                      <th
                        key={strat}
                        className={css({
                          border: "1px solid #d1d5db",
                          padding: "0.5rem",
                          backgroundColor: "#f9fafb",
                          textAlign: "center",
                        })}
                      >
                        {strategyNames[strat]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((strat1) => (
                    <tr key={strat1}>
                      <td
                        className={css({
                          border: "1px solid #d1d5db",
                          padding: "0.5rem",
                          backgroundColor: "#f9fafb",
                          fontWeight: "medium",
                        })}
                      >
                        {strategyNames[strat1]}
                      </td>
                      {strategies.map((strat2) => {
                        const score = parseFloat(analysisResults[strat1][strat2].avgScore1);
                        const isBest = getBestStrategy(strat2)?.strategy === strat1;
                        return (
                          <td
                            key={strat2}
                            className={css({
                              border: "1px solid #d1d5db",
                              padding: "0.5rem",
                              textAlign: "center",
                              backgroundColor: isBest ? "#f0f9ff" : "white",
                              fontWeight: isBest ? "bold" : "normal",
                              color: isBest ? "#0066cc" : "#374151",
                            })}
                          >
                            {score.toFixed(1)} years
                            {isBest && <div className={css({ fontSize: "0.6rem", color: "#0066cc" })}>✓ Best</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={css({ fontSize: "0.7rem", color: "#6b7280", textAlign: "center", marginTop: "0.75rem" })}>
              Lower numbers = better outcomes for Walter. Blue cells show the optimal Walter strategy for each Jesse
              type.
            </p>
          </div>

          <div className={css({ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" })}>
            💡 Understanding your partner's behavior is key to choosing the right strategy in repeated games
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
        Why did the 2024 Nobel Prize in Economics go to researchers that study why some countries prosper with strong
        institutions while others remain trapped in cycles of corruption and poverty? When I digged into the question,
        the answer turned out to be connected to a famous social game called Prisoners Dilemma.
      </p>
      <p>
        I had encountered the Prisoner&rsquo;s Dilemma before as a single-game thought experiment, but the{" "}
        <a href="https://www.nobelprize.org/prizes/economic-sciences/2024/press-release/">Nobel Prize work</a> focuses
        on repeated interactions. When the same dilemma plays out over and over, questions like &quot;Why should I pay
        taxes anyway?&quot; or &quot;Why should my country cut emissions if others won&apos;t?&quot; become surprisingly
        complex strategic problems.
      </p>
      <p>
        To explore dilemma, I wanted to work through its basic mechanics using a scenario that makes the
        challenges clear. This is why I choose to embed the discussion it into the context of Breaking Bad, which felt
        just like a perfect example.
      </p>
      <h2>Setting the scene with Breaking Bad</h2>
      <p>
        The characters are: <strong>Walter White</strong> (high school chemistry teacher turned meth cook),{" "}
        <strong>Jesse Pinkman</strong> (Walter&rsquo;s former student and business partner), and{" "}
        <strong>Hank Schrader</strong> (DEA agent and Walter&rsquo;s brother-in-law).
      </p>
      <p>
        We can now consider these three characters in a standard scenario for the prisoner&rsquo;s: Walter White and
        Jesse Pinkman have been arrested by the DEA and are being interrogated separately. Agent Hank Schrader offers
        each the same deal: testify against your partner to get immunity, or stay silent and face whatever charges can
        be proven.
      </p>
      <p>
        This setup—two people who must choose between cooperation and defection without being able to
        communicate—provides a clean framework for analyzing why mutually beneficial cooperation often breaks down. The
        outcome depends entirely on what each person believes the other will do.
      </p>

      <h3>The Breaking Bad scenario</h3>
      <p>
        This is the <strong>perfect</strong> Prisoner&rsquo;s Dilemma scenario. Walter and Jesse each have exactly two
        choices:
      </p>
      <ul>
        <li>
          <strong>Cooperate (C)</strong>: Stay loyal to your partner - &quot;I don&rsquo;t know this person, we&rsquo;ve
          never met.&quot;
        </li>
        <li>
          <strong>Defect (D)</strong>: Blame your partner - &quot;He forced me into this, he&rsquo;s the real
          criminal.&quot;
        </li>
      </ul>
      <p>The sentences depend on what both choose:</p>
      <ul>
        <li>
          <strong>Both cooperate (C, C)</strong>: Each gets 3 years. The DEA has some evidence but not enough for major
          charges without testimony.
        </li>
        <li>
          <strong>One blames the other (D, C)</strong>: The betrayer walks free with immunity, the cooperator gets 15
          years for &quot;being the mastermind.&quot;
        </li>
        <li>
          <strong>Both blame each other (D, D)</strong>: Each gets 5 years. Their contradictory stories help neither
          case.
        </li>
      </ul>

      <h3>The Dilemma Unfolds</h3>
      <p>
        Now try putting yourself in Walter&rsquo;s position. You&rsquo;re sitting across from DEA Agent Hank Schrader,
        knowing Jesse is in the next room facing the exact same choice. What goes through your mind?
      </p>

      <PayoffMatrix />

      <p>
        The interactive game above reveals something unsettling: there&rsquo;s a strong pull toward betrayal. You might
        find yourself thinking, &quot;If I blame Jesse, I could walk free. What do I owe him anyway?&quot; This gut
        reaction points to the heart of the dilemma.
      </p>

      <h3>Two Ways to Think About It</h3>

      <p>
        <strong>The Team Perspective:</strong> If Walter and Jesse could step back and ask &quot;What&rsquo;s best for
        us together?&quot;, the answer is clear. Both cooperating (3 years each) beats both betraying (5 years each).
        Total time served: 6 years versus 10 years. They&rsquo;re partners against the DEA, not enemies.
      </p>

      <p>
        <strong>The Individual Perspective:</strong> But here&rsquo;s where Walter&rsquo;s mind would really go:
        &quot;What&rsquo;s best for <em>me</em>?&quot; And that&rsquo;s where the mathematics becomes crucial—and
        troubling.
      </p>

      <h3>Walter&rsquo;s Cold Calculation</h3>

      <p>
        Walter is, at heart, a high school chemistry teacher who thinks systematically. He&rsquo;d probably work
        through the logic like this: &quot;Let me figure out what Jesse might do, then decide accordingly.&quot;
      </p>

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

Suppose Walter estimates there's a probability *p* that Jesse will betray him. That means there's a probability *(1-p)* that Jesse cooperates.

**Walter's expected sentence if he cooperates:**
- If Jesse cooperates (probability 1-p): 3 years
- If Jesse betrays (probability p): 15 years  
- Expected sentence: 3(1-p) + 15p = 3 + 12p years

**Walter's expected sentence if he betrays Jesse:**
- If Jesse cooperates (probability 1-p): 0 years (Walter goes free)
- If Jesse betrays (probability p): 5 years
- Expected sentence: 0(1-p) + 5p = 5p years

For Walter to prefer cooperating, we'd need: 3 + 12p < 5p

Solving this: 3 < 5p - 12p = -7p

This gives us: p < -3/7

Since probabilities can't be negative, this condition is impossible to satisfy. **Walter should always betray Jesse, regardless of what he thinks Jesse will do.**

This is the mathematical heart of the Prisoner's Dilemma: individual rationality leads both players to a worse outcome than cooperation would provide. The outcome where both players 
betray is what game theorists call a ["Nash equilibrium"](https://en.wikipedia.org/wiki/Nash_equilibrium) - a stable situation where neither player can improve their payoff by unilaterally changing their strategy. Even though both would prefer mutual cooperation, neither wants to be the "sucker" who cooperates while the other defects.

### When Cooperation Becomes Rational

Walter's calculation revealed a stark conclusion: betrayal dominates in his specific situation. But this raises a deeper question: are there *any* circumstances where cooperation becomes the rational choice in a prisoner's dilemma?

Let's step back from Walter's specific numbers and examine how this logic applies to any prisoner's dilemma. Game theorists use a standard notation to describe these situations:

- **T** = Temptation payoff (what you get for defecting when your partner cooperates)
- **R** = Reward for mutual cooperation (what both get when both cooperate)  
- **P** = Punishment for mutual defection (what both get when both defect)
- **S** = Sucker's payoff (what you get for cooperating when your partner defects)

In Walter's case: T = 0 years (immunity), R = 3 years, P = 5 years, S = 15 years.

For any situation to be a true prisoner's dilemma, we need T < R < P and S is the worst outcome. Using this general framework, let's rewrite Walter's expected value calculation:

**Expected sentence when cooperating:**

$$E[\\text{Cooperate}] = R(1-p) + Sp = R + (S-R)p$$

**Expected sentence when defecting :**  
$$E[\\text{Defect}] = T(1-p) + Pp = T + (P-T)p$$

For cooperation to be rational, we'd need: 

$$
E[\\text{Cooperate}] < E[\\text{Defect}]
$$

This gives us the condition (where we assume T=0 for simplicity):

$$
\\begin{align*}
R + (S-R)p &< Pp \\\\
R &< (R+P-S)p \\\\
p &> \\frac{R}{R+P-S}
\\end{align*}
$$

We can directly see that this equation only makes sense if S < R+P, as we would handle negative probabilities otherwise. This replicates the situation
which we encountered previously and hence confirms our earlier conclusion that Walter should betray Jesse.

But notice what happens if we change the payoffs. We know that $p<1$, which directly implies that cooperation become a viable option for $S < P$. The condition above
tells us exactly when cooperation becomes rational, and the interactive plot below lets you explore how different scenarios affect this critical threshold. 
Try adjusting the payoff values to see how they change the probability at which cooperation becomes individually rational.

`}</ReactMarkdown>

      <ExpectedUtilityPlot />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

As you can see from experimenting with the plot, the condition for rational cooperation depends critically on the relationship between the payoffs. When the punishment for mutual defection becomes severe enough relative to being betrayed, cooperation can emerge as the individually rational choice.

**Real-World Applications:**

The mathematical analysis reveals something surprising: Walter should only cooperate if the punishment for mutual defection (P) exceeds the punishment for being betrayed while cooperating (S). In our scenario, mutual defection gives 5 years each, while being the "sucker" gives 15 years—so defection dominates.

But imagine if Walter and Jesse were part of a larger criminal organization. If both betray each other, they don't just get 5 years in prison—they 
also face execution by the organization for breaking the code of silence. Suddenly, mutual defection might carry a sentence equivalent to 20+ years (or death), while being betrayed only gets you the original 15 years.

This explains why organized crime groups, military units, and tight-knit communities develop strong codes of loyalty: they artificially raise the cost of mutual defection to make cooperation individually rational.

### The Single Game Conclusion

In our DEA interrogation room, Walter's rational analysis points to one conclusion: betray Jesse. 
The general mathematical framework confirms this isn't unique to Walter's situation—it's a fundamental feature of prisoner's dilemmas where the sucker's payoff is worse than mutual defection.

But Walter and Jesse don't just interact once—they're partners in a long-running operation. What happens when the same dilemma repeats over multiple "episodes"? This is where the mathematics becomes more hopeful, and where we can explore whether reputation, trust, and reciprocity can overcome the pull of individual rationality.

`}</ReactMarkdown>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
## When Breaking Bad Becomes a Series: Repeated Interactions

Walter's rational analysis reveals a troubling conclusion: in a single encounter, defection dominates. But this raises an important question: if everyone follows this logic, how does cooperation ever emerge in the real world?

### The Power of Repetition

The key insight is that repetition fundamentally changes the game. When Walter and Jesse know they'll face similar situations again, each decision carries weight beyond the immediate outcome. Future interactions create new incentives that can make cooperation rational even when it wouldn't be in a single encounter.

Consider Walter's strategic calculus now: "If I betray Jesse today, he'll remember that when we face our next crisis together. But if I stay loyal, maybe he'll reciprocate, and we'll both benefit in the long run." This forward-looking reasoning can make cooperation rational even when defection would be better in isolation.

The mathematical foundation is surprisingly simple: if both players value future payoffs enough (not discounting them too heavily), cooperative strategies can become Nash equilibria in repeated games. The exact threshold depends on the payoffs, but the principle holds broadly.

### Four Strategic Approaches

In repeated prisoner's dilemmas, players typically adopt consistent behavioral rules rather than making isolated decisions. Let's examine four fundamental strategies that capture different approaches to the cooperation-defection dilemma:

**1. Always Cooperate** (Season 1 Jesse approach)
- *Rule*: Stay loyal to your partner regardless of their past behavior
- *Logic*: Trust and loyalty should be unconditional
- *Risk*: Vulnerable to exploitation by defectors

**2. Always Defect** (Season 5 Walter approach)  
- *Rule*: Always prioritize self-interest, minimize your own sentence
- *Logic*: Others can't be trusted, so protect yourself first
- *Advantage*: Cannot be exploited, guarantees reasonable outcomes

**3. Tit-for-Tat** (Reciprocal relationship)
- *Rule*: Start by cooperating, then match whatever your partner did in the previous interaction
- *Logic*: Reward cooperation with cooperation, punish defection with defection
- *Balance*: Enables mutual benefit while deterring exploitation

**4. Random** (Unpredictable behavior)
- *Rule*: Make decisions based on emotions, circumstances, or chance
- *Logic*: Unpredictability might confuse opponents
- *Problem*: Cannot build trust or sustain beneficial patterns

### Interactive Strategy Exploration

These strategies aren't just theoretical—they reflect real behavioral patterns we see in ongoing relationships. Let's explore how they perform when Walter and Jesse face repeated crises: 
      `}</ReactMarkdown>

      <GameSimulation />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`


The simulation reveals key insights about repeated interactions:

- **Always cooperating** works well with trustworthy partners but becomes costly against defectors
- **Always defecting** provides security but forecloses opportunities for mutual benefit  
- **Tit-for-tat** balances cooperation and protection: starts nice, retaliates against betrayal, forgives when partners return to cooperation
- **Random strategies** perform poorly because they can't build the consistent patterns needed for trust

💡 **Key Insight**: There's no universally "best" strategy—success depends on what your opponent does.

### Systematic Strategy Comparison

To move beyond individual simulations, let's examine how these strategies perform when they face each other systematically. This approach mirrors the famous research by political scientist Robert Axelrod, who ran computer tournaments in the 1970s to identify the most successful strategies in repeated prisoner's dilemmas.

Axelrod's key finding was that "nice" strategies (those that never defect first) often outperformed "nasty" strategies, but only when the population included enough other cooperative players. The winning strategy in his tournament was tit-for-tat—exactly the reciprocal approach we've been examining.

Let's run our own tournament to see how the Breaking Bad strategies fare against each other:
      `}</ReactMarkdown>

      <StrategyAnalysis />

      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

### Interpreting the Tournament Results

The tournament results reveal a crucial insight about repeated interactions: **the dominance of defection in single games doesn't necessarily carry over to repeated games**. Here's what the data typically shows:

**When Strategies Face Each Other:**
- **Tit-for-Tat vs. Always Cooperate**: Mutual cooperation emerges, both players benefit
- **Always Defect vs. Always Cooperate**: Defection exploits cooperation, creating large payoff differences  
- **Tit-for-Tat vs. Always Defect**: Initial cooperation is punished, leading to mutual defection
- **Random vs. Any Strategy**: Unpredictability prevents stable cooperation patterns

**Key Findings from Game Theory Research:**
1. **Nice strategies** (never defect first) can outperform nasty ones when there are enough cooperative players
2. **Retaliatory strategies** (punish defection) prevent exploitation better than unconditional cooperation
3. **Forgiving strategies** (return to cooperation after punishment) enable recovery from conflicts
4. **Clear strategies** (predictable rules) build trust better than complex or random approaches

This connects directly to Robert Axelrod's famous finding: tit-for-tat succeeded because it was nice, retaliatory, forgiving, and clear. It could cooperate with other cooperative strategies while defending against exploitative ones.

## Conclusion: What Walter and Jesse Taught Us

Walter and Jesse's predicament in that DEA interrogation room captures something profound about human cooperation. In a single interaction, both would be better off if they could trust each other to stay loyal (3 years each vs. 5 years each), yet individual rationality pushes them toward mutual betrayal (5 years each).

But as we've seen, repetition changes everything. When the same players expect to face similar situations again, strategies like tit-for-tat can sustain cooperation by making betrayal costly in the long run. The prospect of future interactions makes present cooperation rational.

However, our analysis also reveals why cooperation remains fragile. Always-defect strategies are surprisingly robust—they can't be exploited, even if they forgo mutual benefits. This explains why selfish behavior persists even in repeated interactions, and why building cooperative institutions requires careful design.

**This Walter-Jesse dynamic isn't unique to criminal partnerships**—similar patterns appear throughout society whenever individual incentives conflict with group welfare:

- **Team Projects**: Each member faces the repeated choice between contributing effort or free-riding on others' work. Successful teams develop tit-for-tat norms: contribute when others do, withdraw effort when others slack.

- **Neighborhood Maintenance**: Each homeowner decides whether to maintain their property, knowing it affects everyone's property values. Communities with strong reciprocal norms (contribute to neighborhood appearance and receive social approval) maintain higher standards.

- **Climate Action**: Nations face repeated decisions about emissions, with each country's choices affecting all others. Successful climate agreements attempt to create tit-for-tat dynamics through monitoring and graduated sanctions.

- **International Trade**: Countries must repeatedly decide whether to honor agreements or pursue short-term advantages. Trade relationships prosper when nations adopt reciprocal strategies—cooperation for cooperation, retaliation for cheating.

The mathematical insight is that **cooperation can emerge from purely self-interested behavior when interactions repeat and players value future outcomes**. We don't need to change human nature—we need to create institutional structures that make cooperation rational for self-interested individuals.

This brings us full circle to the Nobel Prize research that started our exploration. When institutions create repeated-game dynamics with clear rules, predictable enforcement, and expectations of ongoing interaction, even selfish individuals find cooperation profitable. When institutions fail to create these conditions, societies can become trapped in cycles of mistrust and mutual defection—exactly what we see in countries with weak governance and extractive institutions.
      `}</ReactMarkdown>
    </article>
  );
};

// Post metadata
export const meta = {
  title: "The Prisoner's Dilemma",
  publishing_date: "2025-06-22",
  tokenID: 30,
};

export default PrisonersDilemmaPost;
