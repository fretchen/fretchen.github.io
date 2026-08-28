import React, { useState } from "react";
import { css } from "../../styled-system/css";
import { prisonersDilemma, type Choice } from "./prisonersDilemmaModel";

export default function PayoffMatrix() {
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

  return (
    <div
      className={css({
        margin: "32px 0",
        padding: "6",
        backgroundColor: "rgba(59, 130, 246, 0.05)", // Very subtle blue background
        borderRadius: "sm",
        border: "1px solid rgba(59, 130, 246, 0.2)", // Subtle border
      })}
    >
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          textAlign: "center",
          marginBottom: "4",
          color: "gray.700",
        })}
      >
        Interactive Scenario: What do you do?
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "gray.500",
          fontSize: "md",
          marginBottom: "6",
        })}
      >
        Jesse&apos;s decision will be simulated randomly after you choose.
      </p>

      {!playerChoice ? (
        <div
          className={css({
            display: "flex",
            justifyContent: "center",
            gap: "4",
          })}
        >
          <button
            onClick={() => makeDecision("D")}
            className={css({
              padding: "8px 16px",
              backgroundColor: "gray.700",
              color: "white",
              borderRadius: "sm",
              border: "none",
              fontSize: "md",
              cursor: "pointer",
              transition: "background-color {durations.normal} ease",
              _hover: {
                backgroundColor: "gray.800",
              },
            })}
          >
            Blame Jesse
          </button>
          <button
            onClick={() => makeDecision("C")}
            className={css({
              padding: "8px 16px",
              backgroundColor: "brand",
              color: "white",
              borderRadius: "sm",
              border: "none",
              fontSize: "md",
              cursor: "pointer",
              transition: "background-color {durations.normal} ease",
              _hover: {
                backgroundColor: "brandHover",
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
              marginBottom: "4",
            })}
          >
            <p
              className={css({
                fontSize: "md",
                color: "gray.700",
                marginBottom: "2",
              })}
            >
              <strong>My choice:</strong> {playerChoice === "D" ? "Blame Jesse" : "Cooperate"}
            </p>
            <p
              className={css({
                fontSize: "md",
                color: "gray.500",
                marginBottom: "2",
              })}
            >
              <strong>Jesse&apos;s choice (simulated):</strong> {opponentChoice === "D" ? "Blame me" : "Cooperate"}
            </p>
          </div>

          {gameResult && (
            <div
              className={css({
                padding: "3",
                borderRadius: "sm",
                border: "1px solid #d1d5db",
                backgroundColor: "codeBg",
                marginTop: "4",
              })}
            >
              <p
                className={css({
                  textAlign: "center",
                  fontSize: "sm",
                  color: "gray.700",
                  marginBottom: "2",
                })}
              >
                {getOutcomeText(playerChoice, opponentChoice!)}
              </p>
              <div
                className={css({
                  display: "flex",
                  justifyContent: "center",
                  gap: "8",
                  fontSize: "sm",
                  color: "gray.500",
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
              marginTop: "4",
            })}
          >
            <button
              onClick={resetGame}
              className={css({
                padding: "6px 12px",
                backgroundColor: "gray.100",
                color: "gray.700",
                borderRadius: "sm",
                border: "1px solid #d1d5db",
                fontSize: "sm",
                cursor: "pointer",
                transition: "background-color {durations.normal} ease",
                _hover: {
                  backgroundColor: "gray.200",
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
          marginTop: "4",
          fontSize: "xs",
          color: "gray.400",
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
}
