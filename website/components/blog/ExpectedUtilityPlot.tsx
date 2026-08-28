import React, { useMemo, useState } from "react";
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
import { css } from "../../styled-system/css";
import { widgetCard } from "./widgetCard";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

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

  const data = useMemo(
    () => ({
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
    }),
    [probabilities, cooperateValues, defectValues],
  );

  const options = useMemo(
    () => ({
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
    }),
    [probabilityDefect],
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
        <Line data={data} options={options} />
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
