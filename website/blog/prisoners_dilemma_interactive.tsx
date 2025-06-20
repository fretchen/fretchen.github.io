import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
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
        label: "Cooperate (Stay loyal)",
        data: cooperateValues,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
      },
      {
        label: "Defect (Betray)",
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
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Probability opponent defects",
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
          text: "Expected prison sentence (years)",
          font: { size: 11 },
        },
        ticks: {
          font: { size: 10 },
        },
      },
    },
  };

  // Calculate crossover point where strategies are equal
  const crossoverPoint = (R - T) / (S - P + R - T);
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
        Interactive Prisoner's Dilemma Analysis
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "#6b7280",
          fontSize: "0.9rem",
          marginBottom: "1rem",
        })}
      >
        Adjust the payoff matrix and probability to explore different scenarios.
      </p>

      {/* Payoff Matrix Controls */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginBottom: "1rem",
          fontSize: "0.8rem",
        })}
      >
        <div>
          <label>R (Both cooperate): {R} years (fixed)</label>
          <div
            className={css({
              padding: "0.5rem",
              backgroundColor: "#f3f4f6",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              textAlign: "center",
              color: "#6b7280",
            })}
          >
            Breaking Bad example value
          </div>
        </div>
        <div>
          <label>T (I defect, opponent cooperates): {T} years (fixed)</label>
          <div
            className={css({
              padding: "0.5rem",
              backgroundColor: "#f3f4f6",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              textAlign: "center",
              color: "#6b7280",
            })}
          >
            Walk free = 0 years
          </div>
        </div>
        <div>
          <label>P (Both defect): {P} years</label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={P}
            onChange={(e) => setP(parseFloat(e.target.value))}
            className={css({ width: "100%" })}
          />
        </div>
        <div>
          <label>S (I cooperate, opponent defects): {S} years</label>
          <input
            type="range"
            min="5"
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
          Probability opponent defects: <strong>{(probabilityDefect * 100).toFixed(0)}%</strong>
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

      {/* Current Expected Values */}
      <div
        className={css({
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1rem",
          fontSize: "0.8rem",
          color: "#6b7280",
        })}
      >
        <div
          className={css({
            textAlign: "center",
            padding: "0.5rem",
            backgroundColor: expectedCooperate < expectedDefect ? "#f0f9ff" : "#f9fafb",
            borderRadius: "4px",
            border: expectedCooperate < expectedDefect ? "1px solid #0066cc" : "1px solid #d1d5db",
          })}
        >
          <div>
            <strong>Cooperate:</strong>
          </div>
          <div>{expectedCooperate.toFixed(1)} years</div>
        </div>
        <div
          className={css({
            textAlign: "center",
            padding: "0.5rem",
            backgroundColor: expectedDefect < expectedCooperate ? "#fef2f2" : "#f9fafb",
            borderRadius: "4px",
            border: expectedDefect < expectedCooperate ? "1px solid #dc2626" : "1px solid #d1d5db",
          })}
        >
          <div>
            <strong>Defect:</strong>
          </div>
          <div>{expectedDefect.toFixed(1)} years</div>
        </div>
      </div>

      <div
        className={css({
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#374151",
          marginBottom: "1rem",
        })}
      >
        <strong>Optimal choice:</strong> {expectedDefect < expectedCooperate ? "Defect" : "Cooperate"}
        {hasValidCrossover && (
          <span
            className={css({
              color: "#6b7280",
              marginLeft: "0.5rem",
            })}
          >
            (Crossover at {(crossoverPoint * 100).toFixed(1)}%)
          </span>
        )}
      </div>

      <div
        className={css({
          height: "250px",
          marginBottom: "0.5rem",
        })}
      >
        <Line data={data} options={options} />
      </div>

      <div
        className={css({
          fontSize: "0.7rem",
          color: "#9ca3af",
          textAlign: "center",
        })}
      >
        <p>
          Chart shows expected prison sentences. Lower is better. Valid Prisoner&apos;s Dilemma requires: T &lt; R
          &lt; P &lt; S<br />
          Current: T={T}, R={R}, P={P}, S={S} →{" "}
          {T < R && R < P && P < S ? "✓ Valid" : "✗ Invalid structure"}
        </p>
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
  const [strategy1, setStrategy1] = useState<Strategy>("random");
  const [strategy2, setStrategy2] = useState<Strategy>("random");
  const [numGames, setNumGames] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [gameData, setGameData] = useState<{
    payoffs1: number[];
    payoffs2: number[];
    totalPayoffs1: number[];
    totalPayoffs2: number[];
  } | null>(null);

  const runSimulation = () => {
    setIsRunning(true);
    const result = playRepeatedGame(numGames, strategy1, strategy2);
    setGameData(result);
    setIsRunning(false);
  };

  return (
    <div className={css({ margin: "2rem 0", padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "4px" })}>
      <h4 className={css({ fontSize: "1rem", fontWeight: "medium", marginBottom: "1rem" })}>
        Repeated Game Simulation
      </h4>

      <div className={css({ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: "0.8rem" })}>
        <div>
          <label>Strategy 1:</label>
          <select value={strategy1} onChange={(e) => setStrategy1(e.target.value as Strategy)}>
            <option value="random">Random</option>
            <option value="defect">Always Defect</option>
            <option value="cooperate">Always Cooperate</option>
            <option value="tit-for-tat">Tit-for-Tat</option>
          </select>
        </div>
        <div>
          <label>Strategy 2:</label>
          <select value={strategy2} onChange={(e) => setStrategy2(e.target.value as Strategy)}>
            <option value="random">Random</option>
            <option value="defect">Always Defect</option>
            <option value="cooperate">Always Cooperate</option>
            <option value="tit-for-tat">Tit-for-Tat</option>
          </select>
        </div>
        <div>
          <label>Games: {numGames}</label>
          <input
            type="range"
            min="10"
            max="200"
            value={numGames}
            onChange={(e) => setNumGames(parseInt(e.target.value))}
          />
        </div>
      </div>

      <button
        onClick={runSimulation}
        disabled={isRunning}
        className={css({
          padding: "0.5rem 1rem",
          backgroundColor: "#0066cc",
          color: "white",
          borderRadius: "4px",
          border: "none",
          cursor: "pointer",
        })}
      >
        {isRunning ? "Running..." : "Run Simulation"}
      </button>

      {gameData && (
        <div className={css({ marginTop: "1rem", fontSize: "0.8rem" })}>
          <p>
            Final Scores: Player 1: {gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1]?.toFixed(1)} | Player 2:{" "}
            {gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1]?.toFixed(1)}
          </p>
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
        as I could simply walk free and did not feel like I had much too loose. However, you can put feelings aside and
        simply look at the expected utility of the game.
      </p>
      <h3>A Rational Analysis</h3>

      <ReactMarkdown>{`


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

Since we want to minimize prison time, Walter should stay loyal when 3 + 12p < 5p, which is ... never. For a single game
Walter is always better off to blame Jesse, no matter what he thinks Jesse will do. So, if both players are rational and think the same way, they will both blame each other, leading to 5 years each.
Clearly, this is not yet best outcome for both of them, but the incentive to betray is too strong.

### The flexible calculation

We can extend the previous discussion to the more gernal case. We will introduce the following
notations:


- *T = 0* years is the temptation that Walter and Jesse have to blame the other one.
- *R = 3* years is the reward that they get for being loyal to each other.
- *P = 5* years is the punishment that they get for blaming each other.
- *S = 15* years is the suckers payout that they get for being loyal but getting blamed.

In the general case, you can always assume that *T < R < P < S*. Otherwise the whole situation would fall apart. So
we can now simply rewrite the conditions above as follows:

- **When staying loyal**: E[Loyal] = R(1-p) + Sp = R + (S-R)p 
  - If Jesse stays loyal (probability 1-p): R years
  - If Jesse betrays (probability p): S years
- **When blaming Jesse**: E[Blame] = T(1-p) + Pp = T + (P-T)p years  
  - If Jesse stays loyal (probability 1-p): T years (Walter goes free)
  - If Jesse betrays (probability p): P years

We then see that Walter should stay loyal when:

R + (S-R)p < T + (P-T)p
R-T < (R+P-S-T)p
R-T / (R+P-S-T) < p


Let us simplify for T=0 (which is a nice simplification):
R + (S-R)p <  Pp
R < (R+P-S)p
R / (R+P-S) < p

We have the condition that p has to be smaller than one, which directl means that:

S < P

So Walter should only stay loyal if the the punishment of both blaming each other is 
higher than the punishment of being loyal and getting blamed by the other one. 

`}</ReactMarkdown>
      <ExpectedUtilityPlot />
      <ReactMarkdown>{`
## When Breaking Bad Becomes a Series: Repeated Interactions

But Breaking Bad isn't a single episode - it's a series with repeated interactions between Walter and Jesse. This changes everything:

### Breaking Bad Character Strategies:
- **Always loyal** (Season 1 Jesse): Stick with your partner no matter what
- **Always selfish** (Season 5 Walter): Prioritize yourself, always betray when convenient  
- **Tit-for-Tat** (Realistic relationship): Start loyal, then match whatever your partner did last time
- **Unpredictable** (Chaotic storylines): Random decisions based on emotions and circumstances

See how different character arcs would play out over multiple "episodes":
      `}</ReactMarkdown>

      <GameSimulation />

      <ReactMarkdown>{`
## Which Breaking Bad Character Strategy Wins?

Over the course of a full series, which character approach leads to the best outcomes? Let's analyze all strategies against each other:
      `}</ReactMarkdown>

      <StrategyAnalysis />

      <ReactMarkdown>{`
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
