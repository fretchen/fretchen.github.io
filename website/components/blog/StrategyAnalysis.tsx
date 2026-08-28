import React, { useState } from "react";
import { css } from "../../styled-system/css";
import { playRepeatedGame, type Strategy } from "./prisonersDilemmaModel";

export default function StrategyAnalysis() {
  const [analysisResults, setAnalysisResults] = useState<Record<
    Strategy,
    Record<Strategy, { avgScore1: string; avgScore2: string }>
  > | null>(null);
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
      const results: Record<Strategy, Record<Strategy, { avgScore1: string; avgScore2: string }>> = {} as Record<
        Strategy,
        Record<Strategy, { avgScore1: string; avgScore2: string }>
      >;

      strategies.forEach((strat1) => {
        results[strat1] = {} as Record<Strategy, { avgScore1: string; avgScore2: string }>;
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
        margin: "32px 0",
        padding: "6",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderRadius: "sm",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      })}
    >
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          marginBottom: "4",
          textAlign: "center",
          color: "gray.700",
        })}
      >
        🧪 Walter&apos;s Strategy Guide: How to Handle Different Types of Jesse
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "gray.500",
          fontSize: "md",
          marginBottom: "6",
        })}
      >
        Analyzes how different Walter strategies perform against each type of Jesse over a full season (100 episodes, 50
        simulations per matchup). Find the optimal approach for each Jesse personality.
      </p>

      <div className={css({ textAlign: "center", marginBottom: "6" })}>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className={css({
            padding: "12px 24px",
            backgroundColor: isAnalyzing ? "gray.400" : "brand",
            color: "white",
            borderRadius: "sm",
            border: "none",
            fontSize: "md",
            fontWeight: "semibold",
            cursor: isAnalyzing ? "not-allowed" : "pointer",
            transition: "background-color {durations.normal} ease",
            _hover: {
              backgroundColor: isAnalyzing ? "gray.400" : "brandHover",
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
              gap: "4",
              marginBottom: "8",
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
                    backgroundColor: "slate.50",
                    border: "2px solid #e2e8f0",
                    borderRadius: "lg",
                    padding: "4",
                  })}
                >
                  <div className={css({ textAlign: "center", marginBottom: "3" })}>
                    <h6
                      className={css({
                        fontSize: "md",
                        fontWeight: "bold",
                        color: "gray.700",
                        marginBottom: "1",
                      })}
                    >
                      If Jesse is: {strategyNames[jesseStrat]}
                    </h6>
                    <p className={css({ fontSize: "xs", color: "gray.500", lineHeight: "tight" })}>
                      {jesseStrategyDescriptions[jesseStrat]}
                    </p>
                  </div>

                  {best && (
                    <div
                      className={css({
                        textAlign: "center",
                        padding: "3",
                        borderRadius: "md",
                        backgroundColor: "white",
                        border: `2px solid ${color}`,
                      })}
                    >
                      <div
                        className={css({
                          color: color,
                          fontWeight: "bold",
                          fontSize: "sm",
                          marginBottom: "1",
                        })}
                      >
                        🎯 Walter should be: {strategyNames[best.strategy as keyof typeof strategyNames]}
                      </div>
                      <div className={css({ fontSize: "xs", color: "gray.500", marginBottom: "1" })}>
                        Average: {best.score} years prison
                      </div>
                      <div className={css({ fontSize: "xs", color: color, fontWeight: "semibold" })}>
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
              borderRadius: "md",
              padding: "4",
              marginBottom: "4",
            })}
          >
            <h6
              className={css({
                fontSize: "sm",
                fontWeight: "semibold",
                marginBottom: "3",
                textAlign: "center",
                color: "gray.700",
              })}
            >
              📊 Detailed Results: Walter&apos;s Average Prison Sentence
            </h6>
            <div className={css({ overflowX: "auto" })}>
              <table className={css({ width: "100%", borderCollapse: "collapse", fontSize: "sm" })}>
                <thead>
                  <tr>
                    <th
                      className={css({
                        border: "1px solid #d1d5db",
                        padding: "2",
                        backgroundColor: "codeBg",
                        textAlign: "left",
                      })}
                    >
                      Walter&apos;s Strategy ↓ / Jesse&apos;s Strategy →
                    </th>
                    {strategies.map((strat) => (
                      <th
                        key={strat}
                        className={css({
                          border: "1px solid #d1d5db",
                          padding: "2",
                          backgroundColor: "codeBg",
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
                          padding: "2",
                          backgroundColor: "codeBg",
                          fontWeight: "semibold",
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
                              padding: "2",
                              textAlign: "center",
                              backgroundColor: isBest ? "sky.50" : "white",
                              fontWeight: isBest ? "bold" : "normal",
                              color: isBest ? "brand" : "gray.700",
                            })}
                          >
                            {score.toFixed(1)} years
                            {isBest && <div className={css({ fontSize: "xs", color: "brand" })}>✓ Best</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={css({ fontSize: "xs", color: "gray.500", textAlign: "center", marginTop: "3" })}>
              Lower numbers = better outcomes for Walter. Blue cells show the optimal Walter strategy for each Jesse
              type.
            </p>
          </div>

          <div className={css({ fontSize: "xs", color: "gray.400", textAlign: "center" })}>
            💡 Understanding your partner&apos;s behavior is key to choosing the right strategy in repeated games
          </div>
        </div>
      )}
    </div>
  );
}
