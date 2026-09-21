import React from "react";
import { css } from "../../styled-system/css";
import { token } from "../../styled-system/tokens";

export type MerkleNodeId = "R1" | "R2" | "R3" | "R4" | "H1" | "H2" | "H3" | "H4" | "H12" | "H34" | "ROOT";

interface MerkleTreeDiagramProps {
  /** Rendered as a `<figcaption>` below the diagram; omit when the prose already names the
   * figure (README.md → Figures: a caption that restates the lead-in is an echo). */
  caption?: string;
  /** Node ids to highlight as the proof path Alice must recompute. */
  proofPathNodes?: MerkleNodeId[];
  /** Node ids to highlight as the sibling hashes Alice must provide. */
  proofSiblingNodes?: MerkleNodeId[];
}

const VIEW_WIDTH = 640;
const ROW_GAP = 90;
const BOX_W = 130;
const BOX_H = 50;
const EDGE_PAD = 8;
// A column centre has to clear half a box, or the outer boxes hang off the viewBox and clip.
const MARGIN_X = BOX_W / 2 + EDGE_PAD;
const ARROWHEAD_ID = "merkleTreeDiagramArrowhead";

const COL_GAP = (VIEW_WIDTH - 2 * MARGIN_X) / 3;
const COL_X = [0, 1, 2, 3].map((i) => MARGIN_X + i * COL_GAP);

/**
 * The fixed 4-leaf Merkle tree this site's Merkle posts illustrate: R₁–R₄ hash into H₁–H₄, pair
 * into H₁₂/H₃₄, and combine into ROOT. Always this exact shape — geometry and labels are
 * constants, not props, because every caller draws the same tree and only which nodes are
 * highlighted (the proof path for a given request) ever changes.
 */
const NODES: { id: MerkleNodeId; x: number; y: number; lines: string[]; bold?: boolean }[] = [
  { id: "R1", x: COL_X[0], y: 0, lines: ["R₁", "(Request 1)"] },
  { id: "R2", x: COL_X[1], y: 0, lines: ["R₂", "(Request 2)"] },
  { id: "R3", x: COL_X[2], y: 0, lines: ["R₃", "(Request 3)"] },
  { id: "R4", x: COL_X[3], y: 0, lines: ["R₄", "(Request 4)"] },
  { id: "H1", x: COL_X[0], y: ROW_GAP, lines: ["H₁", "= hash(R₁)"] },
  { id: "H2", x: COL_X[1], y: ROW_GAP, lines: ["H₂", "= hash(R₂)"] },
  { id: "H3", x: COL_X[2], y: ROW_GAP, lines: ["H₃", "= hash(R₃)"] },
  { id: "H4", x: COL_X[3], y: ROW_GAP, lines: ["H₄", "= hash(R₄)"] },
  { id: "H12", x: (COL_X[0] + COL_X[1]) / 2, y: 2 * ROW_GAP, lines: ["H₁₂", "= hash(H₁ + H₂)"] },
  { id: "H34", x: (COL_X[2] + COL_X[3]) / 2, y: 2 * ROW_GAP, lines: ["H₃₄", "= hash(H₃ + H₄)"] },
  { id: "ROOT", x: (COL_X[0] + COL_X[3]) / 2, y: 3 * ROW_GAP, lines: ["ROOT", "hash(H₁₂ + H₃₄)"], bold: true },
];

const EDGES: [MerkleNodeId, MerkleNodeId][] = [
  ["R1", "H1"],
  ["R2", "H2"],
  ["R3", "H3"],
  ["R4", "H4"],
  ["H1", "H12"],
  ["H2", "H12"],
  ["H3", "H34"],
  ["H4", "H34"],
  ["H12", "ROOT"],
  ["H34", "ROOT"],
];

const TOTAL_HEIGHT = 3 * ROW_GAP + BOX_H;

/**
 * Hand-rolled replacement for the two mermaid `graph TD` Merkle-tree diagrams in
 * `blog/merkle_ai_batching_fundamentals.mdx` — same fixed-geometry approach as
 * `SequenceDiagram.tsx`. Follows README.md → Figures: no container, no title, a plain
 * `<figure>` with the three-tier ink ranking (node text is content, boxes name the hashes,
 * edges are scaffolding).
 */
export function MerkleTreeDiagram({ caption, proofPathNodes = [], proofSiblingNodes = [] }: MerkleTreeDiagramProps) {
  const edgeStroke = token("colors.gray.300");
  const boxFill = token("colors.background");
  const boxStroke = token("colors.gray.400");
  const boxText = token("colors.text");
  const fontUi = token("fonts.ui");

  const pathFill = token("colors.warningSurface");
  const pathStroke = token("colors.warningBorder");
  const pathText = token("colors.warning");
  const siblingFill = token("colors.successSurface");
  const siblingStroke = token("colors.successBorder");
  const siblingText = token("colors.success");

  const roleFor = (id: MerkleNodeId) => {
    if (proofPathNodes.includes(id)) return { fill: pathFill, stroke: pathStroke, text: pathText };
    if (proofSiblingNodes.includes(id)) return { fill: siblingFill, stroke: siblingStroke, text: siblingText };
    return { fill: boxFill, stroke: boxStroke, text: boxText };
  };

  const idToNode = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <figure>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${TOTAL_HEIGHT}`}
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
            <path d="M0,0 L8,3 L0,6 z" fill={edgeStroke} />
          </marker>
        </defs>

        {/* Edges, drawn first so node boxes layer on top. */}
        {EDGES.map(([fromId, toId]) => {
          const from = idToNode[fromId];
          const to = idToNode[toId];
          return (
            <line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y + BOX_H}
              x2={to.x}
              y2={to.y}
              stroke={edgeStroke}
              strokeWidth={1.5}
              markerEnd={`url(#${ARROWHEAD_ID})`}
            />
          );
        })}

        {/* Node boxes. */}
        {NODES.map((n) => {
          const { fill, stroke, text } = roleFor(n.id);
          return (
            <g key={n.id}>
              <rect
                x={n.x - BOX_W / 2}
                y={n.y}
                width={BOX_W}
                height={BOX_H}
                rx={4}
                fill={fill}
                stroke={stroke}
                strokeWidth={n.bold ? 2 : 1}
              />
              <text
                x={n.x}
                y={n.y + BOX_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={text}
                fontFamily={fontUi}
                fontSize={11}
              >
                {n.lines.map((line, i) => (
                  <tspan key={i} x={n.x} dy={i === 0 ? -((n.lines.length - 1) * 6) : 12}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export default MerkleTreeDiagram;
