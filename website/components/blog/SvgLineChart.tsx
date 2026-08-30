import React from "react";
import { css } from "../../styled-system/css";

export interface LineSeriesData {
  label: string;
  values: number[];
  /** SVG stroke colour — literal, not a Panda token (this is chart *data*, see palette.ts). */
  color: string;
  width?: number;
}

export interface XTick {
  /** Index into each series' `values` array. */
  index: number;
  label: string;
}

interface SvgLineChartProps {
  /** All series must have the same `values.length`. */
  series: LineSeriesData[];
  height?: number;
  xTicks?: XTick[];
  xAxisTitle?: string;
  yAxisTitle?: string;
  /** Fixed y-domain bounds. Omit either to auto-fit from the data (with a little padding). */
  yMin?: number;
  yMax?: number;
  showLegend?: boolean;
  /** Dashed vertical marker line, as a 0–1 fraction across the plotted x-domain. */
  markerXFraction?: number;
}

/**
 * Evenly picks at most `max` items from `items`, always keeping the first and last.
 * Mirrors what chart.js's `ticks.maxTicksLimit` did for the widgets this replaces.
 */
export function pickEvenTicks<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  if (max <= 1) return items.slice(0, 1);
  const step = (items.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => items[Math.round(i * step)]);
}

const VIEW_WIDTH = 600;
const AXIS_COLOR = "#9ca3af";
const TICK_COLOR = "#6b7280";
const TITLE_COLOR = "#374151";

/**
 * Minimal hand-rolled replacement for the `react-chartjs-2` `<Line>` chart used by the
 * essay widgets — a plain multi-series line chart with an optional legend, axis titles,
 * tick labels, and one optional dashed vertical marker line. No hover tooltips (chart.js
 * gave those for free; nothing else in this codebase's SVG widgets has them, and the
 * pedagogical point here is each curve's shape, not exact hover values).
 */
export function SvgLineChart({
  series,
  height = 260,
  xTicks = [],
  xAxisTitle,
  yAxisTitle,
  yMin,
  yMax,
  showLegend = true,
  markerXFraction,
}: SvgLineChartProps) {
  const n = series[0]?.values.length ?? 0;
  const legendHeight = showLegend ? 20 : 0;
  const margin = {
    top: 8 + legendHeight,
    right: 12,
    bottom: xAxisTitle ? 34 : xTicks.length > 0 ? 22 : 8,
    left: yAxisTitle ? 44 : 34,
  };
  const plotW = VIEW_WIDTH - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const allValues = series.flatMap((s) => s.values);
  let resolvedMin = yMin ?? Math.min(...allValues, 0);
  let resolvedMax = yMax ?? Math.max(...allValues, 0);
  if (resolvedMin === resolvedMax) {
    resolvedMin -= 1;
    resolvedMax += 1;
  }
  // Auto-fit gets a little breathing room; a fixed yMin/yMax (e.g. beginAtZero, or an
  // explicit suggestedMin/Max) is used exactly as given.
  if (yMin === undefined) resolvedMin -= (resolvedMax - resolvedMin) * 0.05;
  if (yMax === undefined) resolvedMax += (resolvedMax - resolvedMin) * 0.05;

  const xScale = (i: number) => margin.left + (n > 1 ? (i / (n - 1)) * plotW : 0);
  const yScale = (v: number) => margin.top + plotH - ((v - resolvedMin) / (resolvedMax - resolvedMin)) * plotH;

  const toPoints = (values: number[]) => values.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} className={css({ width: "100%", height: "100%", display: "block" })}>
      {showLegend && (
        <g>
          {series.map((s, i) => {
            const x = margin.left + i * 130;
            return (
              <g key={s.label} transform={`translate(${x}, 4)`}>
                <line x1={0} y1={6} x2={16} y2={6} stroke={s.color} strokeWidth={s.width ?? 2} />
                <text x={20} y={9} fontSize={11} fill={TICK_COLOR}>
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {n > 1 &&
        series.map((s) => (
          <polyline key={s.label} points={toPoints(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} />
        ))}

      {markerXFraction !== undefined && (
        <line
          x1={margin.left + markerXFraction * plotW}
          y1={margin.top}
          x2={margin.left + markerXFraction * plotW}
          y2={margin.top + plotH}
          stroke="rgba(0, 0, 0, 0.5)"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      )}

      {/* Axis line */}
      <line
        x1={margin.left}
        y1={margin.top + plotH}
        x2={margin.left + plotW}
        y2={margin.top + plotH}
        stroke={AXIS_COLOR}
        strokeWidth={1}
      />

      {xTicks.map((t) => (
        <text
          key={t.index}
          x={xScale(t.index)}
          y={margin.top + plotH + 14}
          fontSize={10}
          fill={TICK_COLOR}
          textAnchor="middle"
        >
          {t.label}
        </text>
      ))}

      {xAxisTitle && (
        <text x={margin.left + plotW / 2} y={height - 4} fontSize={11} fill={TITLE_COLOR} textAnchor="middle">
          {xAxisTitle}
        </text>
      )}

      {yAxisTitle && (
        <text
          x={12}
          y={margin.top + plotH / 2}
          fontSize={11}
          fill={TITLE_COLOR}
          textAnchor="middle"
          transform={`rotate(-90, 12, ${margin.top + plotH / 2})`}
        >
          {yAxisTitle}
        </text>
      )}
    </svg>
  );
}
