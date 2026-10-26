import React, { useState } from "react";
import { css } from "../../styled-system/css";
import { widgetCard } from "./widgetCard";
import { OST, TRUST_OST, TRUST_WEST, VOTE_OST, VOTE_WEST, WEST, X_TICKS } from "./TrustVoteChart";

/**
 * Interactive companion to TrustVoteChart: trust (left axis) and populist vote share
 * (right axis) in one panel. The vote axis is fixed at 0–60 %, the trust axis is the
 * reader's to tune — the point being that a dual axis can be made to draw any desired
 * relationship. One vertical slider sits flush beside the trust axis and interpolates
 * between the honest full scale (0–10, slider at the bottom) and the data window
 * (3.0–4.9, slider at the top), so tuning is a single motion along the axis itself.
 * The tune state is labelled ("getunt"), so the figure never pretends.
 */

const VIEW_WIDTH = 600;
const HEIGHT = 250;
const VOTE_MAX = 60;
const ZOOMED_MIN = 3.0;
const ZOOMED_MAX = 4.9;
const AXIS_COLOR = "#9ca3af";
const TICK_COLOR = "#6b7280";
const TITLE_COLOR = "#374151";
// Plot area as a fraction of the SVG height — keeps the slider flush with the axis
// it tunes at any rendered size (flex-basis percentages resolve against the row height).
const PLOT_TOP_FRACTION = `${(24 / HEIGHT) * 100}%`;
const PLOT_BOTTOM_FRACTION = `${(22 / HEIGHT) * 100}%`;

const fmt = (v: number) => v.toFixed(1).replace(".", ",");

export default function TrustAxisTuner() {
  const [zoom, setZoom] = useState(0);
  const tuned = zoom > 0;
  const trustMin = zoom * ZOOMED_MIN;
  const trustMax = 10 + zoom * (ZOOMED_MAX - 10);

  const n = TRUST_WEST.length;
  const margin = { top: 24, right: 46, left: 46, bottom: 22 };
  const plotW = VIEW_WIDTH - margin.left - margin.right;
  const plotH = HEIGHT - margin.top - margin.bottom;

  const xScale = (i: number) => margin.left + (i / (n - 1)) * plotW;
  const trustY = (v: number) => margin.top + plotH - ((v - trustMin) / (trustMax - trustMin)) * plotH;
  const voteY = (v: number) => margin.top + plotH - (v / VOTE_MAX) * plotH;

  const line = (values: number[], y: (v: number) => number) => values.map((v, i) => `${xScale(i)},${y(v)}`).join(" ");

  const legend = [
    { label: "Vertrauen West", color: WEST, dash: false },
    { label: "Vertrauen Ost", color: OST, dash: false },
    { label: "Populisten West", color: WEST, dash: true },
    { label: "Populisten Ost", color: OST, dash: true },
  ];

  return (
    <div className={widgetCard()}>
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          textAlign: "center",
          marginBottom: "2",
          color: "gray.700",
        })}
      >
        Vertrauen und Populisten-Stimmen in einer Figur — die linke Achse gehört dir
      </h4>
      <p
        className={css({
          textAlign: "center",
          fontSize: "sm",
          marginBottom: "2",
          color: tuned ? "red.600" : "gray.500",
        })}
      >
        Vertrauensachse: {fmt(trustMin)} – {fmt(trustMax)}
        {tuned ? " (getunt)" : ""}
      </p>
      <div className={css({ display: "flex", alignItems: "stretch" })}>
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: "0",
          })}
        >
          <div className={css({ flexBasis: PLOT_TOP_FRACTION })} />
          <span className={css({ fontSize: "xs", color: "gray.500" })}>zugespitzt</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            aria-label="Vertrauensachse zwischen der vollen Skala 0 bis 10 und dem Datenfenster verstellen"
            className={css({ width: "20px", flex: "1", marginY: "1" })}
            style={{
              writingMode: "vertical-lr",
              direction: "rtl",
              WebkitAppearance: "slider-vertical",
            }}
          />
          <span className={css({ fontSize: "xs", color: "gray.500" })}>0–10</span>
          <div className={css({ flexBasis: PLOT_BOTTOM_FRACTION })} />
        </div>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${HEIGHT}`}
          className={css({ flex: "1", minWidth: "0", display: "block", aspectRatio: "600 / 250" })}
        >
          <clipPath id="trust-axis-tuner-plot">
            <rect x={margin.left} y={margin.top} width={plotW} height={plotH} />
          </clipPath>
          {legend.map((s, i) => (
            <g key={s.label} transform={`translate(${margin.left + i * 122}, 4)`}>
              <line
                x1={0}
                y1={6}
                x2={16}
                y2={6}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dash ? "6,4" : undefined}
              />
              <text x={20} y={9} fontSize={11} fill={TICK_COLOR}>
                {s.label}
              </text>
            </g>
          ))}
          <g clipPath="url(#trust-axis-tuner-plot)">
            <polyline points={line(TRUST_WEST, trustY)} fill="none" stroke={WEST} strokeWidth={2} />
            <polyline points={line(TRUST_OST, trustY)} fill="none" stroke={OST} strokeWidth={2} />
            <polyline points={line(VOTE_WEST, voteY)} fill="none" stroke={WEST} strokeWidth={2} strokeDasharray="6,4" />
            <polyline points={line(VOTE_OST, voteY)} fill="none" stroke={OST} strokeWidth={2} strokeDasharray="6,4" />
          </g>
          <line
            x1={margin.left}
            y1={margin.top + plotH}
            x2={margin.left + plotW}
            y2={margin.top + plotH}
            stroke={AXIS_COLOR}
            strokeWidth={1}
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={margin.top + plotH}
            stroke={AXIS_COLOR}
            strokeWidth={1}
          />
          <line
            x1={margin.left + plotW}
            y1={margin.top}
            x2={margin.left + plotW}
            y2={margin.top + plotH}
            stroke={AXIS_COLOR}
            strokeWidth={1}
          />
          {X_TICKS.map((t) => (
            <text
              key={t.label}
              x={xScale(t.index)}
              y={margin.top + plotH + 14}
              fontSize={10}
              fill={TICK_COLOR}
              textAnchor="middle"
            >
              {t.label}
            </text>
          ))}
          <text x={margin.left - 8} y={margin.top + 4} fontSize={10} fill={TICK_COLOR} textAnchor="end">
            {fmt(trustMax)}
          </text>
          <text x={margin.left - 8} y={margin.top + plotH + 4} fontSize={10} fill={TICK_COLOR} textAnchor="end">
            {fmt(trustMin)}
          </text>
          <text x={margin.left + plotW + 8} y={margin.top + 4} fontSize={10} fill={TICK_COLOR}>
            {VOTE_MAX} %
          </text>
          <text x={margin.left + plotW + 8} y={margin.top + plotH + 4} fontSize={10} fill={TICK_COLOR}>
            0 %
          </text>
          <text
            x={margin.left - 34}
            y={margin.top + plotH / 2}
            fontSize={11}
            fill={TITLE_COLOR}
            textAnchor="middle"
            transform={`rotate(-90, ${margin.left - 34}, ${margin.top + plotH / 2})`}
          >
            Vertrauen (0–10)
          </text>
          <text
            x={VIEW_WIDTH - 10}
            y={margin.top + plotH / 2}
            fontSize={11}
            fill={TITLE_COLOR}
            textAnchor="middle"
            transform={`rotate(90, ${VIEW_WIDTH - 10}, ${margin.top + plotH / 2})`}
          >
            Populisten (%)
          </text>
        </svg>
      </div>
      <p
        className={css({
          textAlign: "center",
          fontSize: "sm",
          color: "gray.600",
          marginTop: "2",
        })}
      >
        Was du verstellst, ist die Achse — nicht ein einziger Datenpunkt.
      </p>
    </div>
  );
}
