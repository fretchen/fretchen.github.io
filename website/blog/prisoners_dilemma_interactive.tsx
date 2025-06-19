import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Game types and functions
type Choice = 'D' | 'C';
type Strategy = 'random' | 'defect' | 'cooperate' | 'tit-for-tat';

function prisonersDilemma(choice1: Choice, choice2: Choice): [number, number] {
  if (choice1 === 'C' && choice2 === 'C') return [2, 2];
  if (choice1 === 'C' && choice2 === 'D') return [-1, 4];
  if (choice1 === 'D' && choice2 === 'C') return [4, -1];
  return [0, 0];
}

function playRepeatedGame(
  numGames: number,
  strategy1: Strategy,
  strategy2: Strategy
): { payoffs1: number[], payoffs2: number[], totalPayoffs1: number[], totalPayoffs2: number[] } {
  const choices = ['D', 'C'] as const;
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
      case 'random':
        choice1 = choices[Math.floor(Math.random() * 2)];
        break;
      case 'defect':
        choice1 = 'D';
        break;
      case 'cooperate':
        choice1 = 'C';
        break;
      case 'tit-for-tat':
        choice1 = i === 0 ? 'C' : history2[i - 1];
        break;
    }
    
    switch (strategy2) {
      case 'random':
        choice2 = choices[Math.floor(Math.random() * 2)];
        break;
      case 'defect':
        choice2 = 'D';
        break;
      case 'cooperate':
        choice2 = 'C';
        break;
      case 'tit-for-tat':
        choice2 = i === 0 ? 'C' : history1[i - 1];
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
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  
  const matrix = [
    [{ p1: 0, p2: 0 }, { p1: -1, p2: 4 }],
    [{ p1: 4, p2: -1 }, { p1: 2, p2: 2 }]
  ];
  
  const labels = ['Defect (D)', 'Cooperate (C)'];
  
  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Interactive Payoff Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100"></th>
              <th className="border p-2 bg-gray-100">Player 2: Defect</th>
              <th className="border p-2 bg-gray-100">Player 2: Cooperate</th>
            </tr>
          </thead>
          <tbody>
            {labels.map((rowLabel, rowIndex) => (
              <tr key={rowIndex}>
                <td className="border p-2 bg-gray-100 font-medium">
                  Player 1: {rowLabel}
                </td>
                {matrix[rowIndex].map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`border p-3 cursor-pointer text-center transition-colors ${
                      selectedRow === rowIndex && selectedCol === colIndex
                        ? 'bg-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedRow(rowIndex);
                      setSelectedCol(colIndex);
                    }}
                  >
                    <div className="text-sm">
                      <div className="text-blue-600 font-bold">P1: {cell.p1}</div>
                      <div className="text-red-600 font-bold">P2: {cell.p2}</div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRow !== null && selectedCol !== null && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm">
            <strong>Scenario:</strong> Player 1 chooses {labels[selectedRow]}, Player 2 chooses {labels[selectedCol]}
            <br />
            <strong>Result:</strong> Player 1 receives {matrix[selectedRow][selectedCol].p1} points,{" "}
            Player 2 receives {matrix[selectedRow][selectedCol].p2} points
          </p>
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
  const cooperateValues = probabilities.map(p => 2 - 3 * p);
  const defectValues = probabilities.map(p => 4 * p);
  
  const data = {
    labels: probabilities.map(p => p.toFixed(2)),
    datasets: [
      {
        label: 'Cooperate',
        data: cooperateValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Defect',
        data: defectValues,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Expected Payoff by Probability',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Probability that Player 2 defects',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Expected payoff for Player 1',
        },
      },
    },
  };
  
  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Expected Utility Analysis</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Probability that Player 2 defects: {probabilityDefect.toFixed(2)}
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
          <div className="font-semibold text-blue-800">Cooperate</div>
          <div className="text-lg font-bold text-blue-600">
            {expectedCooperate.toFixed(2)} points
          </div>
        </div>
        <div className="p-3 bg-red-50 rounded">
          <div className="font-semibold text-red-800">Defect</div>
          <div className="text-lg font-bold text-red-600">
            {expectedDefect.toFixed(2)} points
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-4">
        <strong>Recommendation:</strong> {expectedDefect > expectedCooperate ? 'Defect' : 'Cooperate'} is optimal
        (Difference: {Math.abs(expectedDefect - expectedCooperate).toFixed(2)} points)
      </div>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

// Game Simulation Component
const GameSimulation: React.FC = () => {
  const [strategy1, setStrategy1] = useState<Strategy>('random');
  const [strategy2, setStrategy2] = useState<Strategy>('random');
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
          label: 'Player 1 (Cumulative)',
          data: gameData.totalPayoffs1,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
        },
        {
          label: 'Player 2 (Cumulative)',
          data: gameData.totalPayoffs2,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
        },
      ],
    };
  }, [gameData, numGames]);
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Cumulative Payoffs Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Game Number',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Cumulative Points',
        },
      },
    },
  };
  
  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Game Simulation</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Player 1 Strategy</label>
          <select
            value={strategy1}
            onChange={(e) => setStrategy1(e.target.value as Strategy)}
            className="w-full p-2 border rounded"
          >
            <option value="random">Random</option>
            <option value="cooperate">Always cooperate</option>
            <option value="defect">Always defect</option>
            <option value="tit-for-tat">Tit-for-Tat</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Player 2 Strategy</label>
          <select
            value={strategy2}
            onChange={(e) => setStrategy2(e.target.value as Strategy)}
            className="w-full p-2 border rounded"
          >
            <option value="random">Random</option>
            <option value="cooperate">Always cooperate</option>
            <option value="defect">Always defect</option>
            <option value="tit-for-tat">Tit-for-Tat</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Number of Games</label>
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
        {isRunning ? 'Simulating...' : 'Start Simulation'}
      </button>
      
      {gameData && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded">
              <div className="font-semibold text-blue-800">Player 1 Final Score</div>
              <div className="text-lg font-bold text-blue-600">
                {gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1]} points
              </div>
              <div className="text-sm text-gray-600">
                Average: {(gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1] / numGames).toFixed(2)} per game
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="font-semibold text-red-800">Player 2 Final Score</div>
              <div className="text-lg font-bold text-red-600">
                {gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1]} points
              </div>
              <div className="text-sm text-gray-600">
                Average: {(gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1] / numGames).toFixed(2)} per game
              </div>
            </div>
          </div>
          
          {chartData && (
            <div style={{ height: '300px' }}>
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
  
  const strategies: Strategy[] = ['random', 'cooperate', 'defect', 'tit-for-tat'];
  const strategyNames = {
    random: 'Random',
    cooperate: 'Cooperate',
    defect: 'Defect',
    'tit-for-tat': 'Tit-for-Tat'
  };
  
  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const results: any = {};
      
      strategies.forEach(strat1 => {
        results[strat1] = {};
        strategies.forEach(strat2 => {
          // Run multiple simulations for statistical reliability
          const simulations = Array.from({ length: 50 }, () => {
            const { totalPayoffs1, totalPayoffs2 } = playRepeatedGame(100, strat1, strat2);
            return {
              score1: totalPayoffs1[totalPayoffs1.length - 1],
              score2: totalPayoffs2[totalPayoffs2.length - 1]
            };
          });
          
          const avgScore1 = simulations.reduce((sum, sim) => sum + sim.score1, 0) / simulations.length;
          const avgScore2 = simulations.reduce((sum, sim) => sum + sim.score2, 0) / simulations.length;
          
          results[strat1][strat2] = {
            avgScore1: avgScore1.toFixed(1),
            avgScore2: avgScore2.toFixed(1)
          };
        });
      });
      
      setAnalysisResults(results);
      setIsAnalyzing(false);
    }, 2000);
  };
  
  return (
    <div className="my-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Strategy Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        Analyzes the average outcomes of different strategies against each other over 100 games (50 simulations per pairing).
      </p>
      
      <button
        onClick={runAnalysis}
        disabled={isAnalyzing}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
      >
        {isAnalyzing ? 'Analyzing...' : 'Analyze Strategies'}
      </button>
      
      {analysisResults && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-100">Player 1 \ Player 2</th>
                {strategies.map(strat => (
                  <th key={strat} className="border p-2 bg-gray-100">
                    {strategyNames[strat]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strategies.map(strat1 => (
                <tr key={strat1}>
                  <td className="border p-2 bg-gray-100 font-medium">
                    {strategyNames[strat1]}
                  </td>
                  {strategies.map(strat2 => (
                    <td key={strat2} className="border p-2 text-center">
                      <div className="text-blue-600 font-bold">
                        {analysisResults[strat1][strat2].avgScore1}
                      </div>
                      <div className="text-red-600 text-xs">
                        vs {analysisResults[strat1][strat2].avgScore2}
                      </div>
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
      <ReactMarkdown>{`
# The Prisoner's Dilemma: An Interactive Analysis

The Prisoner's Dilemma is one of the most famous examples from game theory and shows how rationally acting individuals can arrive at suboptimal results when they only consider their own advantage.

## The Basics

Imagine two prisoners being interrogated separately and unable to communicate with each other. Each has two options:
- **Cooperate (C)**: Stay silent and don't betray the partner
- **Defect (D)**: Rat out the partner to the police

The payoffs depend on what both players choose:
      `}</ReactMarkdown>
      
      <PayoffMatrix />
      
      <ReactMarkdown>{`
## Expected Utility Analysis

When we don't know what the other player will do, we can work with probabilities. Suppose Player 2 defects with a certain probability - how should Player 1 act then?

The expected payoff for Player 1 is:
- **When cooperating**: E[C] = 2 - 3p (where p is the probability that Player 2 defects)
- **When defecting**: E[D] = 4p

Interactively, you can see when which strategy is optimal:
      `}</ReactMarkdown>
      
      <ExpectedUtilityPlot />
      
      <ReactMarkdown>{`
## Repeated Games and Strategies

In reality, people often play repeatedly with each other. This opens up new strategic possibilities:

### Known Strategies:
- **Always cooperate**: Nice, but exploitable
- **Always defect**: Selfish, but leads to poor overall results
- **Tit-for-Tat**: Start with cooperation, then do what the opponent did last
- **Random**: Unpredictable, but without clear strategy

Test different strategies against each other:
      `}</ReactMarkdown>
      
      <GameSimulation />
      
      <ReactMarkdown>{`
## Strategy Comparison

Which strategy is most successful in the long run? The following analysis shows the average results of all strategies against each other:
      `}</ReactMarkdown>
      
      <StrategyAnalysis />
      
      <ReactMarkdown>{`
## Insights and Conclusions

The Prisoner's Dilemma shows several important principles:

1. **Individual Rationality ≠ Collective Rationality**: What seems optimal for each individual (defecting) leads to a worse overall outcome.

2. **Cooperation Requires Trust**: Only when both players cooperate do they achieve the best joint outcome.

3. **Repetition Changes Everything**: In repeated games, strategies like Tit-for-Tat can promote cooperation.

4. **Reputation Matters**: When players know they'll meet again, the incentives change.

These insights have implications for many areas of life - from international relations to business negotiations to personal relationships.

## Further Considerations

- How would the results change if the payoffs were different?
- What happens with more than two players?
- What role does communication between players play?
- How do emotions and irrational behavior influence the results?

The Prisoner's Dilemma remains a fascinating model for understanding human cooperation and competition.
      `}</ReactMarkdown>
    </article>
  );
};

// Post metadata
export const meta = {
  title: "The Prisoner's Dilemma: An Interactive Analysis",
  description: "Explore game theory through interactive simulations and visualizations of the classic Prisoner's Dilemma",
  publishing_date: "2024-01-20",
  image: "/images/prisoners-dilemma.jpg",
  readTime: "15 min",
  tags: ["Game Theory", "Mathematics", "Interactive", "Cooperation"],
};

export default PrisonersDilemmaPost;
