import React, { useState } from "react";
import { css, cx } from "../../styled-system/css";
import { playRepeatedGame, type Strategy } from "./prisonersDilemmaModel";
import { severityBox, severityText, type SeverityLevel } from "./severityStyle";
import { widgetCard } from "./widgetCard";
import { SvgLineChart } from "./SvgLineChart";

export default function GameSimulation() {
  const [walterStrategy, setWalterStrategy] = useState<Strategy>("tit-for-tat");
  const numGames = 50;
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

    const avgDifference = walterAvg - jesseAvg;
    const walterExploitingJesse = avgDifference < -3; // Walter gets 3+ years less than Jesse (better for Walter)
    const jesseExploitingWalter = avgDifference > 3; // Walter gets 3+ years more than Jesse (worse for Walter)

    let verdict: string;
    let level: SeverityLevel;

    if (walterExploitingJesse) {
      verdict = "Exploitative partnership - you're taking advantage of Jesse's cooperation.";
      level = "danger";
    } else if (jesseExploitingWalter) {
      verdict = "You're being exploited - Jesse is getting better deals while you suffer.";
      level = "danger";
    } else if (walterAvg < 4 && jesseAvg < 4) {
      verdict = "Excellent partnership! You're both doing well.";
      level = "success";
    } else if (walterAvg < 6 && jesseAvg < 6) {
      verdict = "Decent cooperation with some conflicts.";
      level = "warning";
    } else if (walterAvg < 10) {
      verdict = "Troubled relationship with frequent betrayals.";
      level = "warning";
    } else {
      verdict = "Toxic partnership - this relationship is falling apart.";
      level = "danger";
    }

    return { verdict, level, walterAvg, jesseAvg };
  };

  const analysis = getOutcomeAnalysis();

  return (
    <div className={widgetCard()}>
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          marginBottom: "4",
          textAlign: "center",
          color: "gray.700",
        })}
      >
        🎭 Walter&apos;s Strategy Simulator: How Will Your Partnership Play Out?
      </h4>

      <p className={css({ textAlign: "center", color: "gray.500", fontSize: "md", marginBottom: "6" })}>
        Choose your approach as Walter. Jesse&apos;s strategy will be randomly selected to simulate the uncertainty of
        working with a partner. Each simulation runs for 50 episodes (two seasons).
      </p>

      <div className={css({ marginBottom: "4" })}>
        <div>
          <label
            className={css({
              display: "block",
              fontSize: "sm",
              fontWeight: "semibold",
              marginBottom: "2",
              color: "gray.700",
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
                padding: "2",
                border: "1px solid #d1d5db",
                borderRadius: "sm",
                fontSize: "sm",
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
              fontSize: "xs",
              color: "gray.500",
              marginTop: "2",
              lineHeight: "tight",
              textAlign: "center",
            })}
          >
            {strategyDescriptions[walterStrategy]}
          </p>
        </div>
      </div>

      <div className={css({ textAlign: "center", marginBottom: "4" })}>
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className={css({
            padding: "12px 24px",
            backgroundColor: isRunning ? "gray.400" : "brand",
            color: "white",
            borderRadius: "sm",
            border: "none",
            fontSize: "md",
            fontWeight: "semibold",
            cursor: isRunning ? "not-allowed" : "pointer",
            transition: "background-color {durations.normal} ease",
            _hover: {
              backgroundColor: isRunning ? "gray.400" : "brandHover",
            },
          })}
        >
          {isRunning ? "🎬 Filming the season..." : "🎬 Start the Season"}
        </button>
      </div>

      {gameData && analysis && (
        <div className={css({ marginTop: "4" })}>
          {/* Strategy matchup prominently displayed */}
          <div
            className={css({
              backgroundColor: "slate.50",
              border: "2px solid #e2e8f0",
              borderRadius: "lg",
              padding: "4",
              marginBottom: "4",
            })}
          >
            <div className={css({ textAlign: "center", marginBottom: "4" })}>
              <h5 className={css({ fontSize: "md", fontWeight: "bold", color: "gray.700", marginBottom: "2" })}>
                🎪 Season Finale: Walter vs Jesse
              </h5>
              <div
                className={css({
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  gap: "2",
                  alignItems: "center",
                  margin: "16px 0",
                })}
              >
                <div
                  className={css({
                    textAlign: "center",
                    padding: "3",
                    backgroundColor: "blue.100",
                    borderRadius: "md",
                  })}
                >
                  <div className={css({ fontSize: "sm", fontWeight: "bold", color: "blue.700" })}>Walter (You)</div>
                  <div className={css({ fontSize: "xs", color: "indigo.800", marginTop: "1" })}>
                    {strategyDescriptions[walterStrategy].split(" - ")[0]}
                  </div>
                </div>
                <div className={css({ fontSize: "2xl", textAlign: "center" })}>⚡</div>
                <div
                  className={css({
                    textAlign: "center",
                    padding: "3",
                    backgroundColor: "purple.50",
                    borderRadius: "md",
                    border: "2px solid #a855f7",
                  })}
                >
                  <div className={css({ fontSize: "sm", fontWeight: "bold", color: "violet.600" })}>Jesse</div>
                  <div className={css({ fontSize: "xs", color: "purple.800", marginTop: "1" })}>
                    {jesseStrategyDescriptions[gameData.jesseStrategy].split(" - ")[0]}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={css({
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4",
                marginBottom: "4",
                fontSize: "sm",
              })}
            >
              <div className={css({ textAlign: "center" })}>
                <div className={css({ color: "blue.600", fontWeight: "bold", fontSize: "xl" })}>
                  {analysis.walterAvg.toFixed(1)} years
                </div>
                <div className={css({ color: "gray.500", fontSize: "xs" })}>Walter&apos;s Average Sentence</div>
                <div className={css({ color: "blue.600", fontSize: "xs", marginTop: "1" })}>
                  Total: {gameData.totalPayoffs1[gameData.totalPayoffs1.length - 1]} years
                </div>
              </div>
              <div className={css({ textAlign: "center" })}>
                <div className={css({ color: "violet.600", fontWeight: "bold", fontSize: "xl" })}>
                  {analysis.jesseAvg.toFixed(1)} years
                </div>
                <div className={css({ color: "gray.500", fontSize: "xs" })}>Jesse&apos;s Average Sentence</div>
                <div className={css({ color: "violet.600", fontSize: "xs", marginTop: "1" })}>
                  Total: {gameData.totalPayoffs2[gameData.totalPayoffs2.length - 1]} years
                </div>
              </div>
            </div>

            <div className={cx(severityBox({ level: analysis.level }), css({ marginBottom: "4" }))}>
              <div className={cx(severityText({ level: analysis.level }), css({ fontWeight: "bold", fontSize: "md" }))}>
                {analysis.verdict}
              </div>
            </div>
          </div>

          {/* Accumulation Chart */}
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
              📈 Cumulative Prison Sentences Over Time
            </h6>
            <div style={{ position: "relative", height: "200px", width: "100%" }}>
              <SvgLineChart
                height={200}
                series={[
                  { label: "Walter (You)", values: gameData.totalPayoffs1, color: "#2563eb" },
                  { label: "Jesse", values: gameData.totalPayoffs2, color: "#7c3aed" },
                ]}
                yAxisTitle="Total Prison Years"
                yMin={0}
              />
            </div>
            <p className={css({ fontSize: "xs", color: "gray.500", textAlign: "center", marginTop: "2" })}>
              Lower is better - shows how prison sentences accumulate as the partnership progresses
            </p>
          </div>

          <div className={css({ fontSize: "xs", color: "gray.400", textAlign: "center" })}>
            💡 Try different strategies to see how they affect your partnership with Jesse
          </div>
        </div>
      )}
    </div>
  );
}
