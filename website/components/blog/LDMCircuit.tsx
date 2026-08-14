import React from "react";
import { css } from "../../styled-system/css";

// ============================================================
// The Li–Du–Massar protocol applied to a two-island fishery.
// ------------------------------------------------------------
// Two islands declare a number of boats bⱼ; a referee brackets both declarations
// on either side; a read-out gives the *licensed* fleet bⱼᶜ that each island is
// billed and paid on:
//
//     b₁ᶜ = b₁ cosh γ + b₂ sinh γ        (LDM Eq. 11 / Grau-Climent Eq. 5)
//
// The diagram is deliberately labelled twice over: the operator names sit in the
// boxes, and the plain-language reading of each step sits in the caption row
// underneath. That is the whole argument of the post in one picture — the
// quantum protocol and a clerk with a ledger are the same object, so they get
// the same drawing rather than two drawings.
//
// Static — no state, no quantum mechanics runs here. Colours follow the
// essay-series convention in palette.ts: island 1 = blue.600, island 2 =
// violet.600, referee = neutral gray.
// ============================================================

// ── Geometry ─────────────────────────────────────────────────
const W = 690;
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

const ISLAND_1 = "#2563eb";
const ISLAND_2 = "#7c3aed";
const REFEREE = "#9ca3af";
const INK = "#374151";
const MUTED = "#9ca3af";

// Homodyne detector — which is also just the clerk reading his ledger.
const MeasureGlyph: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <rect x={cx - 16} y={cy - 16} width={32} height={32} rx={4} fill="#f9fafb" stroke={REFEREE} />
    <path d={`M ${cx - 9} ${cy + 5} A 9 9 0 0 1 ${cx + 9} ${cy + 5}`} fill="none" stroke="#6b7280" strokeWidth={1.5} />
    <line x1={cx} y1={cy + 5} x2={cx + 7} y2={cy - 6} stroke="#6b7280" strokeWidth={1.5} />
  </g>
);

// A referee operation spanning both lines.
const RefereeBox: React.FC<{ cx: number; label: string }> = ({ cx, label }) => (
  <g>
    <rect x={cx - 27} y={yA - 24} width={54} height={yB - yA + 48} rx={5} fill="rgba(55,65,81,0.06)" stroke={REFEREE} />
    <text x={cx} y={yMid + 5} fontSize={15} fill={INK} textAnchor="middle" fontWeight="600">
      {label}
    </text>
  </g>
);

// An island's move: a displacement of its own mode by its declared fleet.
const MoveBox: React.FC<{ cy: number; color: string; index: string }> = ({ cy, color, index }) => (
  <g>
    <rect x={xGate - 46} y={cy - 20} width={92} height={40} rx={6} fill={`${color}18`} stroke={color} strokeWidth={2} />
    <text x={xGate} y={cy + 6} fontSize={15} fill={color} textAnchor="middle" fontWeight="700">
      D̂{index}(b{index})
    </text>
  </g>
);

// Plain-language reading of each column, sitting under the operator names.
const CAPTIONS: [number, string][] = [
  [xJ, "seals the declarations"],
  [xGate, "each island declares"],
  [xJd, "clears them"],
  [xOut + 78, "licensed fleet"],
];

export default function LDMCircuit() {
  return (
    <figure
      className={css({
        margin: "32px 0",
        padding: "6",
        backgroundColor: "rgba(123, 63, 160, 0.04)",
        borderRadius: "lg",
        border: "1px solid rgba(123, 63, 160, 0.15)",
      })}
    >
      <p className={css({ fontSize: "md", fontWeight: "bold", marginBottom: "1.5", color: "gray.700" })}>
        The protocol, read two ways
      </p>
      <p className={css({ fontSize: "sm", color: "gray.500", marginBottom: "4" })}>
        Operators in the boxes, plain language underneath. Each island holds one mode of a two-mode field and displaces
        it by the number of boats it wants to send; the referee brackets both moves. The squeezing parameter{" "}
        <strong>γ</strong> is fixed once, in advance.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          "Circuit for the Li–Du–Massar protocol applied to a fishery. Two wires, one per island, each starting in " +
          "the vacuum state. A referee box labelled J-hat of gamma spans both wires and seals the declarations; then " +
          "each island applies a displacement D-hat-j of b-j to its own wire; then a second referee box labelled " +
          "J-hat of gamma dagger clears them; then each wire is read out by homodyne detection of the amplitude " +
          "quadrature X-hat-j, giving the licensed fleet b1c = b1 cosh gamma + b2 sinh gamma and b2c = b2 cosh " +
          "gamma + b1 sinh gamma."
        }
        className={css({ width: "100%", height: "auto", display: "block", maxWidth: "700px", margin: "0 auto" })}
      >
        {/* Island labels */}
        <text x={8} y={yA + 5} fontSize={13} fill={ISLAND_1} fontWeight="700">
          Island 1
        </text>
        <text x={8} y={yB + 5} fontSize={13} fill={ISLAND_2} fontWeight="700">
          Island 2
        </text>

        {/* Vacuum inputs */}
        <text x={xIn} y={yA + 5} fontSize={15} fill={INK} textAnchor="middle">
          |0⟩
        </text>
        <text x={xIn} y={yB + 5} fontSize={15} fill={INK} textAnchor="middle">
          |0⟩
        </text>

        {/* Wires */}
        <line x1={xWire0} y1={yA} x2={xWire1} y2={yA} stroke={REFEREE} strokeWidth={1.5} />
        <line x1={xWire0} y1={yB} x2={xWire1} y2={yB} stroke={REFEREE} strokeWidth={1.5} />

        {/* The referee brackets both declarations */}
        <RefereeBox cx={xJ} label="Ĵ(γ)" />
        <RefereeBox cx={xJd} label="Ĵ(γ)†" />

        {/* Each island moves on its own line */}
        <MoveBox cy={yA} color={ISLAND_1} index="₁" />
        <MoveBox cy={yB} color={ISLAND_2} index="₂" />

        {/* Read-out */}
        <MeasureGlyph cx={xMeasure} cy={yA} />
        <MeasureGlyph cx={xMeasure} cy={yB} />
        <text x={xMeasure} y={yA - 22} fontSize={12} fill={INK} textAnchor="middle">
          X̂₁
        </text>
        <text x={xMeasure} y={yB - 22} fontSize={12} fill={INK} textAnchor="middle">
          X̂₂
        </text>

        {/* Licensed fleet */}
        <text x={xOut} y={yA + 5} fontSize={12.5} fill={ISLAND_1} fontWeight="600">
          b₁ᶜ = b₁ cosh γ + b₂ sinh γ
        </text>
        <text x={xOut} y={yB + 5} fontSize={12.5} fill={ISLAND_2} fontWeight="600">
          b₂ᶜ = b₂ cosh γ + b₁ sinh γ
        </text>

        {/* Plain-language reading */}
        {CAPTIONS.map(([x, text]) => (
          <text key={text} x={x} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle">
            {text}
          </text>
        ))}
      </svg>

      <figcaption className={css({ fontSize: "sm", color: "gray.700", textAlign: "center", marginTop: "4" })}>
        Nothing in the bottom row mentions physics. That is the point: the same drawing describes a two-mode squeezer
        and a clerk with a ledger.
      </figcaption>
    </figure>
  );
}
