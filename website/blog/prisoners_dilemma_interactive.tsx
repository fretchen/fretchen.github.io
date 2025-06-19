import React, { useState, useEffect, useMemo } from "react";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Game types and functions
type Choice = "D" | "C";
type Strategy = "random" | "defect" | "cooperate" | "tit-for-tat";

function prisonersDilemma(choice1: Choice, choice2: Choice): [number, number] {
  if (choice1 === "C" && choice2 === "C") return [2, 2];
  if (choice1 === "C" && choice2 === "D") return [-1, 4];
  if (choice1 === "D" && choice2 === "C") return [4, -1];
  return [0, 0];
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

// Interactive Payoff Matrix Component
const PayoffMatrix: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);
  const [gameHistory, setGameHistory] = useState<
    Array<{
      player: Choice;
      opponent: Choice;
      playerPayoff: number;
      opponentPayoff: number;
    }>
  >([]);

  const matrix = [
    [
      { p1: 0, p2: 0, label: "Mutual Defection" },
      { p1: -1, p2: 4, label: "Betrayed" },
    ],
    [
      { p1: 4, p2: -1, label: "Betrayer" },
      { p1: 2, p2: 2, label: "Mutual Cooperation" },
    ],
  ];

  const choiceLabels = ["Defect (D)", "Cooperate (C)"];
  const choiceDescriptions = {
    D: "Blame Jesse for everything",
    C: "Keep quiet, protect Jesse",
  };

  const outcomes = [
    {
      p1: "D",
      p2: "D",
      result: "Both Walter and Jesse blame each other",
      color: "bg-orange-100 border-orange-300",
      tvExplanation:
        "🧪 Walter: 'Jesse forced me to cook!' Jesse: 'Mr. White was the mastermind!' Both end up with medium sentences as their stories contradict each other.",
      pointExplanation:
        "0 points = 5 years each. The DEA doesn't buy either story completely since they're contradictory. Both get convicted for manufacturing.",
    },
    {
      p1: "D",
      p2: "C",
      result: "Walter blames Jesse, Jesse stays loyal",
      color: "bg-red-100 border-red-300",
      tvExplanation:
        "🧪 Walter: 'Jesse Pinkman was my dealer, he forced me to cook for him.' Jesse stays silent. Walter gets immunity deal, Jesse takes the fall.",
      pointExplanation:
        "4 points = Walter walks free with immunity. Jesse gets -1 point = 15 years for manufacturing and distribution charges.",
    },
    {
      p1: "C",
      p2: "D",
      result: "Walter stays loyal, Jesse blames Walter",
      color: "bg-red-100 border-red-300",
      tvExplanation:
        "🧪 Jesse: 'Mr. White forced me to cook! He threatened my family!' Walter keeps quiet. Jesse gets a plea deal, Walter gets the book thrown at him.",
      pointExplanation:
        "-1 point = Walter gets 15 years for being the 'mastermind.' Jesse gets 4 points = 2 years with cooperation deal.",
    },
    {
      p1: "C",
      p2: "C",
      result: "Both Walter and Jesse stay silent",
      color: "bg-green-100 border-green-300",
      tvExplanation:
        "🧪 Both follow the criminal code: 'We don't know each other.' Without testimony, the DEA can only prove possession charges.",
      pointExplanation:
        "2 points each = 3 years for possession and equipment charges. Best joint outcome - neither betrays the other.",
    },
  ];

  const playRound = () => {
    if (playerChoice && opponentChoice) {
      const [playerPayoff, opponentPayoff] = prisonersDilemma(playerChoice, opponentChoice);
      setGameHistory((prev) => [
        ...prev,
        {
          player: playerChoice,
          opponent: opponentChoice,
          playerPayoff,
          opponentPayoff,
        },
      ]);
    }
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setOpponentChoice(null);
    setGameHistory([]);
  };

  const getScenarioDescription = (p1: Choice, p2: Choice) => {
    if (p1 === "D" && p2 === "D")
      return {
        text: "Both Walter and Jesse betray each other - Mutual destruction!",
        color: "bg-orange-100 text-orange-800",
      };
    if (p1 === "D" && p2 === "C")
      return {
        text: "Walter betrays Jesse - The teacher becomes the ultimate villain!",
        color: "bg-red-100 text-red-800",
      };
    if (p1 === "C" && p2 === "D")
      return {
        text: "Walter stays loyal, Jesse betrays - The student burns the teacher!",
        color: "bg-red-100 text-red-800",
      };
    return { text: "Both stay loyal - Partners till the end!", color: "bg-green-100 text-green-800" };
  };

  return (
    <div className="my-8 p-8 border-4 border-blue-300 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.01] relative overflow-hidden">
      {/* Interactive indicator badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg border border-blue-600 z-10">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-xs font-bold tracking-wider">INTERAKTIV</span>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(59,130,246,0.4)_2px,transparent_0)] bg-[length:24px_24px]"></div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-transparent to-purple-400/10 rounded-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-center mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse shadow-lg"></div>
            <h3 className="text-2xl font-bold text-gray-800 text-center">
              🧪 Interactive Payoff Matrix: Walter vs Jesse - DEA Interrogation
            </h3>
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200 mb-6">
          <p className="text-gray-700 text-center text-lg font-medium">
            🎭 <strong>Sie sind Walter White</strong> (Blau). Jesse Pinkman ist im nächsten Raum. Ihre Wahl?
          </p>
        </div>
        <div className="relative z-10">
          <div className="flex justify-center gap-6 mb-6">
            <button
              onClick={() => setPlayerChoice("D")}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-110 shadow-lg border-2 ${
                playerChoice === "D"
                  ? "bg-red-500 text-white shadow-red-300 border-red-600 animate-pulse"
                  : "bg-white border-red-300 text-red-600 hover:bg-red-50 hover:shadow-red-200"
              }`}
            >
              �️ Betray (Defect)
              <div className="text-xs font-normal mt-1">({choiceDescriptions["D"]})</div>
            </button>
            <button
              onClick={() => setPlayerChoice("C")}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-110 shadow-lg border-2 ${
                playerChoice === "C"
                  ? "bg-green-500 text-white shadow-green-300 border-green-600 animate-pulse"
                  : "bg-white border-green-300 text-green-600 hover:bg-green-50 hover:shadow-green-200"
              }`}
            >
              🤐 Stay Silent (Cooperate)
              <div className="text-xs font-normal mt-1">({choiceDescriptions["C"]})</div>
            </button>
          </div>
        </div>

        {playerChoice && (
          <div className="mb-6 bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-blue-200">
            <p className="text-center text-gray-800 mb-4 text-lg font-medium">
              🤔 Was wird <strong>Jesse Pinkman</strong> im anderen Verhörraum wählen?
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setOpponentChoice("D")}
                className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-md border-2 ${
                  opponentChoice === "D"
                    ? "bg-red-400 text-white border-red-500 shadow-red-200"
                    : "bg-white border-red-300 text-red-600 hover:bg-red-50 hover:shadow-red-200"
                }`}
              >
                Jesse verrät Walter
              </button>
              <button
                onClick={() => setOpponentChoice("C")}
                className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-md border-2 ${
                  opponentChoice === "C"
                    ? "bg-green-400 text-white border-green-500 shadow-green-200"
                    : "bg-white border-green-300 text-green-600 hover:bg-green-50 hover:shadow-green-200"
                }`}
              >
                Jesse bleibt stumm
              </button>
            </div>
          </div>
        )}

        {playerChoice && opponentChoice && (
          <div className="mb-6 bg-white/70 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-300 shadow-xl">
            <div
              className={`p-6 rounded-xl border-2 ${getScenarioDescription(playerChoice, opponentChoice).color} mb-4 shadow-lg`}
            >
              <h4 className="font-bold text-xl mb-3 text-center">🎬 Breaking Bad Ausgang:</h4>
              <p className="text-base mb-4 text-center font-medium">
                {getScenarioDescription(playerChoice, opponentChoice).text}
              </p>
              <div className="flex justify-center gap-12">
                <div className="text-center bg-white/80 rounded-lg p-4 shadow-md">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {prisonersDilemma(playerChoice, opponentChoice)[0]}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Walter's Jahre</div>
                </div>
                <div className="text-center bg-white/80 rounded-lg p-4 shadow-md">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {prisonersDilemma(playerChoice, opponentChoice)[1]}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Jesse's Jahre</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={playRound}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ✅ Play Round
          </button>
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {gameHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold mb-2">🎬 Breaking Bad Episodes:</h4>
          <div className="bg-white p-4 rounded-lg border">
            {gameHistory.map((round, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <span className="text-sm">
                  Episode {index + 1}: Walter {round.player === "D" ? "Blamed Jesse" : "Protected Jesse"}, Jesse{" "}
                  {round.opponent === "D" ? "Blamed Walter" : "Protected Walter"}
                </span>
                <span className="text-sm font-bold">
                  <span className="text-blue-600">{round.playerPayoff}</span> vs{" "}
                  <span className="text-red-600">{round.opponentPayoff}</span>
                </span>
              </div>
            ))}
            <div className="pt-2 font-bold text-center">
              Total Prison Years:
              <span className="text-blue-600 ml-2">
                Walter: {gameHistory.reduce((sum, round) => sum + round.playerPayoff, 0)} points
              </span>
              <span className="mx-2">vs</span>
              <span className="text-red-600">
                Jesse: {gameHistory.reduce((sum, round) => sum + round.opponentPayoff, 0)} points
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => setShowAllOutcomes(!showAllOutcomes)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          {showAllOutcomes ? "Hide" : "Show"} All Possible Outcomes
        </button>
      </div>

      {showAllOutcomes && (
        <div className="mt-4">
          <h4 className="font-bold text-lg mb-4 text-center">🧪 All Breaking Bad Scenarios - DEA Interrogation Room</h4>
          <div className="grid grid-cols-1 gap-6">
            {outcomes.map((outcome, index) => (
              <div key={index} className={`p-6 rounded-lg border-2 ${outcome.color}`}>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="lg:w-1/3">
                    <div className="font-bold text-center mb-2 text-lg">
                      Walter: {outcome.p1 === "D" ? "🔴 Blames Jesse" : "🔵 Protects Jesse"} | Jesse:{" "}
                      {outcome.p2 === "D" ? "🔴 Blames Walter" : "🔵 Protects Walter"}
                    </div>
                    <div className="flex justify-center gap-4 text-center mb-4">
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-bold text-blue-600 text-xl">
                          {prisonersDilemma(outcome.p1 as Choice, outcome.p2 as Choice)[0]}
                        </div>
                        <div className="text-xs text-gray-600">Walter's Points</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-bold text-red-600 text-xl">
                          {prisonersDilemma(outcome.p1 as Choice, outcome.p2 as Choice)[1]}
                        </div>
                        <div className="text-xs text-gray-600">Jesse's Points</div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-2/3 space-y-3">
                    <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-800 mb-1">📋 What Happens:</div>
                      <div className="text-sm">{outcome.result}</div>
                    </div>

                    <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-800 mb-1">🎬 Breaking Bad Scene:</div>
                      <div className="text-sm italic">{outcome.tvExplanation}</div>
                    </div>

                    <div className="bg-white bg-opacity-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-800 mb-1">⚖️ Prison Sentences:</div>
                      <div className="text-sm font-medium">{outcome.pointExplanation}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-bold text-yellow-800 mb-2">🧪 Breaking Bad Insight:</h5>
            <p className="text-sm text-yellow-700">
              The points represent prison sentences in <strong>Breaking Bad</strong> terms:{" "}
              <strong>Higher points = Better outcome for the character</strong>
              <br />• <strong>4 points</strong> = Walk free with immunity (like when someone cooperates with DEA) •{" "}
              <strong>2 points</strong> = 3 years light sentence (both keep quiet, minimal evidence) •{" "}
              <strong>0 points</strong> = 5 years medium sentence (both blame each other, contradictory stories) •{" "}
              <strong>-1 point</strong> = 15 years harsh sentence (betrayed by partner, full blame)
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              <strong>Just like in the show:</strong> Walter and Jesse's relationship constantly faced these dilemmas.
              Trust vs. self-preservation. Loyalty vs. survival. The math is brutal but the emotions make it human.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Expected Utility Plot Component
const ExpectedUtilityPlot: React.FC = () => {
  const [probabilityDefect, setProbabilityDefect] = useState(0.5);

  const expectedCooperate = 2 - 3 * probabilityDefect;
  const expectedDefect = 4 * probabilityDefect;

  const probabilities = Array.from({ length: 101 }, (_, i) => i / 100);
  const cooperateValues = probabilities.map((p) => 2 - 3 * p);
  const defectValues = probabilities.map((p) => 4 * p);

  const data = {
    labels: probabilities.map((p) => p.toFixed(2)),
    datasets: [
      {
        label: "Cooperate",
        data: cooperateValues,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
      },
      {
        label: "Defect",
        data: defectValues,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Expected Payoff by Probability",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Probability that Player 2 defects",
        },
      },
      y: {
        title: {
          display: true,
          text: "Expected payoff for Player 1",
        },
      },
    },
  };

  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🧠 Walter's Expected Utility Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        Walter is a chemistry teacher - he thinks rationally. If he estimates the probability that Jesse will betray
        him, what should he do?
      </p>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Probability that Jesse betrays Walter: {probabilityDefect.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={probabilityDefect}
          onChange={(e) => setProbabilityDefect(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-blue-50 rounded">
          <div className="font-semibold text-blue-800">Protect Jesse</div>
          <div className="text-lg font-bold text-blue-600">{expectedCooperate.toFixed(2)} points</div>
          <div className="text-xs text-gray-500">Stay loyal strategy</div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="font-semibold text-red-800">Blame Jesse</div>
          <div className="text-lg font-bold text-red-600">{expectedDefect.toFixed(2)} points</div>
          <div className="text-xs text-gray-500">Betray first strategy</div>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        <strong>Walter's best move:</strong> {expectedDefect > expectedCooperate ? "Blame Jesse" : "Protect Jesse"}
        <br />
        <strong>Expected difference:</strong> {Math.abs(expectedDefect - expectedCooperate).toFixed(2)} points better
      </div>
      <div style={{ height: "300px" }}>
        <Line data={data} options={options} />
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
    // Simulate delay for visual effect
    setTimeout(() => {
      const result = playRepeatedGame(numGames, strategy1, strategy2);
      setGameData(result);
      setIsRunning(false);
    }, 500);
  };

  const chartData = useMemo(() => {
    if (!gameData) return null;

    return {
      labels: Array.from({ length: numGames }, (_, i) => i + 1),
      datasets: [
        {
          label: "Walter (Cumulative)",
          data: gameData.totalPayoffs1,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
        },
        {
          label: "Jesse (Cumulative)",
          data: gameData.totalPayoffs2,
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.1,
        },
      ],
    };
  }, [gameData, numGames]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Breaking Bad: Walter vs Jesse Over Multiple Encounters",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Episode Number",
        },
      },
      y: {
        title: {
          display: true,
          text: "Cumulative Points",
        },
      },
    },
  };

  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">🎬 Breaking Bad Series Simulation</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Walter's Strategy</label>
          <select
            value={strategy1}
            onChange={(e) => setStrategy1(e.target.value as Strategy)}
            className="w-full p-2 border rounded"
          >
            <option value="random">Emotional/Unpredictable</option>
            <option value="cooperate">Always loyal</option>
            <option value="defect">Always selfish</option>
            <option value="tit-for-tat">Tit-for-Tat</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Jesse's Strategy</label>
          <select
            value={strategy2}
            onChange={(e) => setStrategy2(e.target.value as Strategy)}
            className="w-full p-2 border rounded"
          >
            <option value="random">Emotional/Unpredictable</option>
            <option value="cooperate">Always loyal</option>
            <option value="defect">Always selfish</option>
            <option value="tit-for-tat">Tit-for-Tat</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Number of Episodes</label>
          <input
            type="number"
            min="10"
            max="500"
            value={numGames}
            onChange={(e) => setNumGames(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <button
        onClick={runSimulation}
        disabled={isRunning}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isRunning ? "Creating episodes..." : "🎬 Start Breaking Bad Series"}
      </button>

      {gameData && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-semibold text-blue-800">Walter's Series Outcome</div>
              <div className="text-lg font-bold text-blue-600">
                {gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1]} points
              </div>
              <div className="text-sm text-gray-600">
                Average: {(gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1] / numGames).toFixed(2)} per episode
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="font-semibold text-red-800">Jesse's Series Outcome</div>
              <div className="text-lg font-bold text-red-600">
                {gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1]} points
              </div>
              <div className="text-sm text-gray-600">
                Average: {(gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1] / numGames).toFixed(2)} per episode
              </div>
            </div>
          </div>

          {chartData && (
            <div style={{ height: "300px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </>
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

      <h3>Walter&apos;s Rational Analysis</h3>

      <ReactMarkdown>{`

Walter White is a chemistry teacher - he thinks in probabilities and expected outcomes. If he can estimate how likely Jesse is to betray him, what should he do?

The math for Walter's expected outcome:
- **When protecting Jesse**: E[Protect] = 2 - 3p (where p is probability Jesse betrays)
- **When blaming Jesse**: E[Blame] = 4p

This is the cold, rational calculation Walter would make:
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
