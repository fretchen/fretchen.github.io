import React from "react";
import { css } from "../../styled-system/css";
import { token } from "../../styled-system/tokens";

export interface SequenceParticipant {
  id: string;
  /** Single-line label. Omit in favor of `labelLines` for a wrapped label. */
  label?: string;
  /** Stacked lines for a wrapped label (replaces mermaid's `<br/>` — no dangerouslySetInnerHTML). */
  labelLines?: string[];
}

export interface SequenceMessage {
  kind: "message";
  /** Participant id. */
  from: string;
  /** Participant id. */
  to: string;
  label: string;
  /** Solid ("->>") or dashed ("-->>") arrow. Defaults to solid. */
  style?: "solid" | "dashed";
}

export interface SequenceNote {
  kind: "note";
  /** Left edge participant id. Equal to `to` for a single-column note. */
  from: string;
  /** Right edge participant id. */
  to: string;
  label: string;
}

interface SequenceDiagramProps {
  participants: SequenceParticipant[];
  /** One ordered list — row position depends on messages and notes interleaved, matching
   * mermaid's own linear source order. */
  steps: (SequenceMessage | SequenceNote)[];
  /** Rendered as a `<figcaption>` below the diagram; styled globally in layouts/panda.css. */
  caption?: string;
  /**
   * Page territory, matching the `<PageHeader territory>` of the page this sits on. Tints the
   * elements that *name* things — participant boxes and their labels. Arrows and message text
   * stay neutral: the messages are the content. Omit for an all-grey diagram.
   */
  territory?: DiagramTerritory;
}

const VIEW_WIDTH = 640;
const MARGIN_X = 80;
const HEADER_H = 56;
const FOOTER_PAD = 16;
const MESSAGE_ROW_H = 46;
const NOTE_ROW_H = 44;
const BOX_H = 40;
const BOX_MAX_W = 140;
const NOTE_H = 30;
const NOTE_PAD = 40;
const EDGE_PAD = 10;
const LABEL_OFFSET = 8;
const ARROWHEAD_ID = "sequenceDiagramArrowhead";

/**
 * Territory hue -> the plain value an SVG attribute needs. Mirrors the `sectionRule` recipe's
 * variants, but not its type: that one is a Panda `ConditionalValue` (it accepts responsive
 * objects and arrays), and a diagram needs exactly one colour.
 */
const TERRITORY_ACCENT = {
  voice: token("colors.brand"),
  explore: token("colors.explore"),
} as const;

export type DiagramTerritory = keyof typeof TERRITORY_ACCENT;

/** Clamps a box/note's [x, x+width] span to stay inside the viewBox, edges included. */
function clampSpan(x1: number, x2: number): [number, number] {
  const w = x2 - x1;
  const clampedX1 = Math.max(EDGE_PAD, Math.min(x1, VIEW_WIDTH - EDGE_PAD - w));
  return [clampedX1, clampedX1 + w];
}

/**
 * Minimal hand-rolled replacement for mermaid's `sequenceDiagram` — a plain participant/
 * message/note layout with fixed row heights (not mermaid's content-proportional spacing).
 * No activations, loops, or alt/opt blocks: nothing on this site's diagrams uses them.
 *
 * Deliberately carries no container styling: figures sit on the page ground (see IDENTITY.md
 * → Figures), and `layouts/panda.css` owns figure margin, centering and caption typography.
 */
export function SequenceDiagram({ participants, steps, caption, territory }: SequenceDiagramProps) {
  const colGap = (VIEW_WIDTH - 2 * MARGIN_X) / Math.max(participants.length - 1, 1);
  const idToX = Object.fromEntries(participants.map((p, i) => [p.id, MARGIN_X + i * colGap]));

  const rows = steps.reduce<{ step: SequenceMessage | SequenceNote; y: number }[]>((acc, step) => {
    const prevY = acc.length > 0 ? acc[acc.length - 1].y : HEADER_H;
    const prevStep = acc.length > 0 ? acc[acc.length - 1].step : undefined;
    const rowY = acc.length > 0 ? prevY + (prevStep?.kind === "note" ? NOTE_ROW_H : MESSAGE_ROW_H) : HEADER_H;
    return [...acc, { step, y: rowY }];
  }, []);
  const lastRow = rows[rows.length - 1];
  const contentBottom = lastRow ? lastRow.y + (lastRow.step.kind === "note" ? NOTE_ROW_H : MESSAGE_ROW_H) : HEADER_H;
  const lifelineBottom = contentBottom + FOOTER_PAD / 2;
  const totalHeight = contentBottom + FOOTER_PAD;

  // Ink hierarchy — three tiers ranked by value, not width (README.md → Figures):
  // messages are the content, participants name it, lifelines are scaffolding. `border`
  // (#eeeeee) is for dividers between page blocks and is far too light for figure internals.
  const lifelineStroke = token("colors.gray.300");
  const boxFill = token("colors.background");
  const arrowStroke = token("colors.gray.700");

  // A figure may wear its page's territory hue on the elements that name things; the content
  // stays neutral (README.md → Figures). Without a territory the diagram is entirely grey.
  const accent = territory ? TERRITORY_ACCENT[territory] : null;
  const boxStroke = accent ?? token("colors.gray.400");
  const participantText = accent ?? token("colors.text");
  const textMuted = token("colors.textMuted");
  const fontUi = token("fonts.ui");

  return (
    <figure>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${totalHeight}`}
        className={css({ width: "100%", height: "auto", display: "block" })}
      >
        <defs>
          <marker
            id={ARROWHEAD_ID}
            viewBox="0 0 8 6"
            refX={7}
            refY={3}
            markerWidth={8}
            markerHeight={6}
            orient="auto-start-reverse"
          >
            <path d="M0,0 L8,3 L0,6 z" fill={arrowStroke} />
          </marker>
        </defs>

        {/* Lifelines, drawn first so everything else layers on top. */}
        {participants.map((p) => (
          <line
            key={p.id}
            x1={idToX[p.id]}
            x2={idToX[p.id]}
            y1={HEADER_H}
            y2={lifelineBottom}
            stroke={lifelineStroke}
            strokeWidth={1.5}
          />
        ))}

        {/* Participant boxes. */}
        {participants.map((p) => {
          const lines = p.labelLines ?? [p.label ?? ""];
          const cx = idToX[p.id];
          const boxW = Math.min(colGap - 16, BOX_MAX_W);
          const [boxX] = clampSpan(cx - boxW / 2, cx + boxW / 2);
          return (
            <g key={p.id}>
              <rect x={boxX} y={0} width={boxW} height={BOX_H} rx={4} fill={boxFill} stroke={boxStroke} />
              <text
                x={cx}
                y={BOX_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={participantText}
                fontFamily={fontUi}
                fontSize={12}
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={cx} dy={i === 0 ? -((lines.length - 1) * 6) : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* Steps: messages and notes, in sequence order. */}
        {rows.map(({ step, y: rowY }, i) => {
          if (step.kind === "note") {
            const [x1, x2] = clampSpan(
              Math.min(idToX[step.from], idToX[step.to]) - NOTE_PAD,
              Math.max(idToX[step.from], idToX[step.to]) + NOTE_PAD,
            );
            return (
              <g key={i}>
                <rect x={x1} y={rowY} width={x2 - x1} height={NOTE_H} rx={4} fill={boxFill} stroke={boxStroke} />
                <text
                  x={(x1 + x2) / 2}
                  y={rowY + NOTE_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textMuted}
                  fontFamily={fontUi}
                  fontSize={11}
                >
                  {step.label}
                </text>
              </g>
            );
          }

          const x1 = idToX[step.from];
          const x2 = idToX[step.to];
          const arrowY = rowY + MESSAGE_ROW_H - LABEL_OFFSET - 6;
          return (
            <g key={i}>
              <text
                x={(x1 + x2) / 2}
                y={arrowY - LABEL_OFFSET}
                textAnchor="middle"
                fill={textMuted}
                fontFamily={fontUi}
                fontSize={11}
              >
                {step.label}
              </text>
              <line
                x1={x1}
                x2={x2}
                y1={arrowY}
                y2={arrowY}
                stroke={arrowStroke}
                strokeWidth={1.5}
                strokeDasharray={step.style === "dashed" ? "4 3" : undefined}
                markerEnd={`url(#${ARROWHEAD_ID})`}
              />
            </g>
          );
        })}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export default SequenceDiagram;
