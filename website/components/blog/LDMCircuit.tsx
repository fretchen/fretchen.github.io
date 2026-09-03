import React from "react";
import { css } from "../../styled-system/css";
import { token } from "../../styled-system/tokens";

// ============================================================
// The Li–Du–Massar protocol applied to a two-island fishery.
// ------------------------------------------------------------
// Two islands declare a number of boats bⱼ; a referee brackets both declarations
// on either side; a read-out gives the *licensed* fleet bⱼᶜ that each island is
// billed and paid on:
//
//     b₁ᶜ = e^(−γ) (b₁ cosh γ + b₂ sinh γ)   (LDM Eq. 11 / Grau-Climent Eq. 5)
//
// The diagram is deliberately labelled twice over: the operator names sit in the
// boxes, and the plain-language reading of each step sits in the caption row
// underneath. That is the whole argument of the post in one picture — the
// quantum protocol and a clerk with a ledger are the same object, so they get
// the same drawing rather than two drawings.
//
// Static — no state, no quantum mechanics runs here.
//
// Colour carries exactly one thing: which island. The two hues are the essay-series
// pair from palette.ts, shared with QuantumPDCircuit's Walter and Jesse, because
// this post is that post's sequel and the two players are the same kind of object.
// Everything that is not an island — wires, referee, detectors — follows the figure
// ink hierarchy in README.md → Figures instead. The licensed fleets are deliberately
// neutral: bⱼᶜ mixes both declarations, so it is no longer anyone's alone, and that
// is the result the post turns on.
// ============================================================

// ── Geometry ─────────────────────────────────────────────────
const W = 560;
const H = 214;
const yA = 78; // island 1's line
const yB = 156; // island 2's line
const yMid = (yA + yB) / 2;
const xIn = 78; // input marker
const xWire0 = 100;
const xJ = 144; // referee, before
const xGate = 266; // islands declare
const xJd = 390; // referee, after
const xMeasure = 462; // read-out
const xWire1 = 486; // wires stop just past the read-out
const xOut = 500; // licensed fleet, left-anchored

// The two players. Everything else is ranked by value, not identity.
const ISLAND_1 = token("colors.blue.600");
const ISLAND_2 = token("colors.violet.600");

const WIRE = token("colors.gray.300"); // scaffolding
const BOX = token("colors.gray.400"); // the referee — a role, not a player
const GROUND = token("colors.background");
const INK = token("colors.text"); // the content
const MUTED = token("colors.textMuted"); // annotation
// Two faces, per IDENTITY.md -> Typography. The operators, kets and licensed-fleet
// formulas are equations: they must sit with the KaTeX in the prose, so they read in the
// serif. Island names and the plain-language row are chrome, so they operate in the sans.
const FONT_MATH = token("fonts.reading");
const FONT_UI = token("fonts.ui");

// A single maths variable: italic letter, upright subscript, raised upright superscript.
// SVG has no MathML here, so the parts are positioned by hand rather than spelled with
// Unicode modifier letters, which few text faces actually carry.
const Variable: React.FC<{ x: number; y: number; letter: string; sub: string; sup?: string }> = ({
  x,
  y,
  letter,
  sub,
  sup,
}) => (
  <text x={x} y={y} fontSize={14} fill={INK} fontFamily={FONT_MATH}>
    <tspan fontStyle="italic">{letter}</tspan>
    <tspan>{sub}</tspan>
    {sup && (
      <tspan dy={-6} fontSize={10}>
        {sup}
      </tspan>
    )}
  </text>
);

// Homodyne detector — which is also just the clerk reading his ledger.
const MeasureGlyph: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <rect x={cx - 16} y={cy - 16} width={32} height={32} rx={4} fill={GROUND} stroke={BOX} />
    <path d={`M ${cx - 9} ${cy + 5} A 9 9 0 0 1 ${cx + 9} ${cy + 5}`} fill="none" stroke={BOX} strokeWidth={1.5} />
    <line x1={cx} y1={cy + 5} x2={cx + 7} y2={cy - 6} stroke={BOX} strokeWidth={1.5} />
  </g>
);

// A referee operation spanning both lines.
const RefereeBox: React.FC<{ cx: number; dagger?: string }> = ({ cx, dagger = "" }) => (
  <g>
    <rect x={cx - 27} y={yA - 24} width={54} height={yB - yA + 48} rx={5} fill={GROUND} stroke={BOX} />
    <text x={cx} y={yMid + 5} fontSize={15} fill={INK} textAnchor="middle" fontFamily={FONT_MATH}>
      <tspan fontStyle="italic">Ĵ</tspan>
      <tspan>(γ){dagger}</tspan>
    </text>
  </g>
);

// An island's move: a displacement of its own mode by its declared fleet.
const MoveBox: React.FC<{ cy: number; color: string; index: string }> = ({ cy, color, index }) => (
  <g>
    <rect x={xGate - 46} y={cy - 20} width={92} height={40} rx={6} fill={GROUND} stroke={color} strokeWidth={2} />
    <text x={xGate} y={cy + 6} fontSize={15} fill={color} textAnchor="middle" fontFamily={FONT_MATH}>
      <tspan fontStyle="italic">D̂</tspan>
      <tspan>{index}(</tspan>
      <tspan fontStyle="italic">b</tspan>
      <tspan>{index})</tspan>
    </text>
  </g>
);

// Plain-language reading of each column, sitting under the operator names.
const CAPTIONS: [number, string][] = [
  [xJ, "seals the declarations"],
  [xGate, "each island declares"],
  [xJd, "clears them"],
  [xOut + 12, "licensed fleet"],
];

export default function LDMCircuit() {
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          "Circuit for the Li–Du–Massar protocol applied to a fishery. Two wires, one per island, each starting in " +
          "the vacuum state. A referee box labelled J-hat of gamma spans both wires and seals the declarations; then " +
          "each island applies a displacement D-hat-j of b-j to its own wire; then a second referee box labelled " +
          "J-hat of gamma dagger clears them; then each wire is read out by homodyne detection of the amplitude " +
          "quadrature X-hat-j, giving the licensed fleets b1c and b2c."
        }
        className={css({ width: "100%", height: "auto", display: "block" })}
      >
        {/* Island labels */}
        <text x={8} y={yA + 5} fontSize={12} fill={ISLAND_1} fontFamily={FONT_UI} fontWeight="600">
          Island 1
        </text>
        <text x={8} y={yB + 5} fontSize={12} fill={ISLAND_2} fontFamily={FONT_UI} fontWeight="600">
          Island 2
        </text>

        {/* Vacuum inputs */}
        <text x={xIn} y={yA + 5} fontSize={17} fill={INK} textAnchor="middle" fontFamily={FONT_MATH}>
          |0⟩
        </text>
        <text x={xIn} y={yB + 5} fontSize={17} fill={INK} textAnchor="middle" fontFamily={FONT_MATH}>
          |0⟩
        </text>

        {/* Wires */}
        <line x1={xWire0} y1={yA} x2={xWire1} y2={yA} stroke={WIRE} strokeWidth={1.5} />
        <line x1={xWire0} y1={yB} x2={xWire1} y2={yB} stroke={WIRE} strokeWidth={1.5} />

        {/* The referee brackets both declarations */}
        <RefereeBox cx={xJ} />
        <RefereeBox cx={xJd} dagger="†" />

        {/* Each island moves on its own line */}
        <MoveBox cy={yA} color={ISLAND_1} index="₁" />
        <MoveBox cy={yB} color={ISLAND_2} index="₂" />

        {/* Read-out */}
        <MeasureGlyph cx={xMeasure} cy={yA} />
        <MeasureGlyph cx={xMeasure} cy={yB} />
        <text x={xMeasure} y={yA - 22} fontSize={13} fill={MUTED} textAnchor="middle" fontFamily={FONT_MATH}>
          <tspan fontStyle="italic">X̂</tspan>
          <tspan>₁</tspan>
        </text>
        <text x={xMeasure} y={yB - 22} fontSize={13} fill={MUTED} textAnchor="middle" fontFamily={FONT_MATH}>
          <tspan fontStyle="italic">X̂</tspan>
          <tspan>₂</tspan>
        </text>

        {/* Licensed fleet — neutral, because each one mixes both declarations. The formula
            itself is the display equation directly below the figure in the prose; repeating
            it here only bought a worse setting of it. */}
        <Variable x={xOut} y={yA + 5} letter="b" sub="₁" sup="c" />
        <Variable x={xOut} y={yB + 5} letter="b" sub="₂" sup="c" />

        {/* Plain-language reading */}
        {CAPTIONS.map(([x, text]) => (
          <text key={text} x={x} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle" fontFamily={FONT_UI}>
            {text}
          </text>
        ))}
      </svg>

      <figcaption>
        The same drawing describes a two-mode squeezer and a clerk with a ledger; the bottom row is the reading that
        mentions no physics.
      </figcaption>
    </figure>
  );
}
