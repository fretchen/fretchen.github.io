import React, { useMemo, useState } from "react";
import { css } from "../../styled-system/css";
import { widgetCard } from "./widgetCard";
import { SvgLineChart, pickEvenTicks } from "./SvgLineChart";

export default function ExpectedUtilityPlot() {
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

  const probabilities = useMemo(() => Array.from({ length: 101 }, (_, i) => i / 100), []);
  const cooperateValues = useMemo(() => probabilities.map((p) => R * (1 - p) + S * p), [probabilities, S]);
  const defectValues = useMemo(() => probabilities.map((p) => T * (1 - p) + P * p), [probabilities, P]);

  const xTicks = useMemo(
    () =>
      pickEvenTicks(
        probabilities.map((p, index) => ({ index, label: (p * 100).toFixed(0) + "%" })),
        6,
      ),
    [probabilities],
  );

  return (
    <div className={widgetCard()}>
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          textAlign: "center",
          marginBottom: "4",
          color: "gray.700",
        })}
      >
        When should Walter cooperate vs. defect against Jesse?
      </h4>

      <p
        className={css({
          textAlign: "center",
          color: "gray.500",
          fontSize: "md",
          marginBottom: "4",
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
          gap: "4",
          marginBottom: "4",
          fontSize: "sm",
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
          marginBottom: "4",
        })}
      >
        <label
          className={css({
            display: "block",
            fontSize: "sm",
            color: "gray.700",
            marginBottom: "2",
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
            backgroundColor: "gray.200",
            borderRadius: "xs",
            outline: "none",
            cursor: "pointer",
          })}
        />
      </div>
      <div
        className={css({
          height: "250px",
          marginBottom: "4",
        })}
      >
        <SvgLineChart
          height={250}
          series={[
            { label: "Cooperate with Jesse", values: cooperateValues, color: "rgb(59, 130, 246)" },
            { label: "Defect against Jesse", values: defectValues, color: "rgb(239, 68, 68)" },
          ]}
          xTicks={xTicks}
          xAxisTitle="How likely Jesse is to defect (%)"
          yAxisTitle="Walter's expected prison sentence (years)"
          markerXFraction={probabilityDefect}
        />
      </div>

      {/* Decision Recommendation Section */}
      <div
        className={css({
          backgroundColor: expectedDefect < expectedCooperate ? "red.50" : "sky.50",
          border: expectedDefect < expectedCooperate ? "2px solid #dc2626" : "2px solid #0066cc",
          borderRadius: "md",
          padding: "4",
          marginBottom: "4",
        })}
      >
        <div
          className={css({
            textAlign: "center",
            fontSize: "md",
            fontWeight: "bold",
            color: expectedDefect < expectedCooperate ? "red.600" : "brand",
            marginBottom: "2",
          })}
        >
          🎯 Walter&apos;s Rational Choice: {expectedDefect < expectedCooperate ? "Defect" : "Cooperate"}
        </div>

        <div
          className={css({
            fontSize: "sm",
            color: "gray.700",
            textAlign: "center",
          })}
        >
          Expected outcome: <strong>{Math.min(expectedCooperate, expectedDefect).toFixed(1)} years in prison</strong>
        </div>
      </div>
    </div>
  );
}
