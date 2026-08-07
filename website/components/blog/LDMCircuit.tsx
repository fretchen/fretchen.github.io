import React from "react";
import { css } from "../../styled-system/css";

// ============================================================
// The Li–Du–Massar protocol applied to a two-island fishery, drawn twice.
// ------------------------------------------------------------
// Two islands — island 1 (top wire) and island 2 (bottom wire). Each declares
// a number of boats bⱼ; a referee brackets both declarations on either side;
// a read-out at the end gives the *licensed* fleet bⱼᶜ that each island is
// actually billed and paid on:
//
//     b₁ᶜ = b₁ cosh γ + b₂ sinh γ        (LDM Eq. 11 / Grau-Climent Eq. 5)
//
// The `variant` prop is the whole point of this component. The geometry, the
// boxes and the read-out formula are IDENTICAL in both variants; only the
// labels change. `quantum` tells the story in optics (vacuum modes, a two-mode
// squeezer Ĵ(γ), displacements, homodyne detection); `classical` tells the
// same story as a harbourmaster applying a clearing rule to declared boats.
// Rendering both in one post is the argument: same picture, no quantum needed.
// Do not fork this into two components — that would destroy the comparison.
//
// Static diagram — no state, no quantum math runs here. Colours follow the
// essay-series convention in palette.ts: island 1 = blue.600, island 2 =
// violet.600, referee = neutral gray.
// ============================================================

// ── Geometry (shared by both variants — do not branch on `variant` here) ──────
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

type Variant = "quantum" | "classical";

// The read-out glyph: a homodyne detector in the quantum reading, the
// harbourmaster reading his ledger in the classical one. Same mark either way.
const MeasureGlyph: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <rect x={cx - 16} y={cy - 16} width={32} height={32} rx={4} fill="#f9fafb" stroke={REFEREE} />
    <path d={`M ${cx - 9} ${cy + 5} A 9 9 0 0 1 ${cx + 9} ${cy + 5}`} fill="none" stroke="#6b7280" strokeWidth={1.5} />
    <line x1={cx} y1={cy + 5} x2={cx + 7} y2={cy - 6} stroke="#6b7280" strokeWidth={1.5} />
  </g>
);

// A referee operation spanning both lines. Horizontal operator label in the
// quantum reading; rotated actor name in the classical one, matching the
// MediatorBox convention in QuantumPDCircuit.tsx.
const RefereeBox: React.FC<{ cx: number; label: string; rotated: boolean }> = ({ cx, label, rotated }) => (
  <g>
    <rect x={cx - 27} y={yA - 24} width={54} height={yB - yA + 48} rx={5} fill="rgba(55,65,81,0.06)" stroke={REFEREE} />
    <text
      x={cx}
      y={rotated ? yMid : yMid + 5}
      fontSize={rotated ? 13 : 15}
      fill={INK}
      textAnchor="middle"
      fontWeight="600"
      transform={rotated ? `rotate(-90 ${cx} ${yMid})` : undefined}
    >
      {label}
    </text>
  </g>
);

// An island's move: a displacement of its own mode, or simply a declaration.
const MoveBox: React.FC<{ cy: number; color: string; label: string }> = ({ cy, color, label }) => (
  <g>
    <rect x={xGate - 46} y={cy - 20} width={92} height={40} rx={6} fill={`${color}18`} stroke={color} strokeWidth={2} />
    <text x={xGate} y={cy + 6} fontSize={15} fill={color} textAnchor="middle" fontWeight="700">
      {label}
    </text>
  </g>
);

// Everything that differs between the two readings lives in this table.
const COPY: Record<
  Variant,
  {
    title: string;
    intro: React.ReactNode;
    input: string;
    boxBefore: string;
    boxAfter: string;
    rotatedBoxLabel: boolean;
    move: (i: string) => string;
    readout: string;
    captions: [string, string, string, string];
    aria: string;
    caption: React.ReactNode;
  }
> = {
  quantum: {
    title: "The LDM protocol as a circuit",
    intro: (
      <>
        Each island holds one mode of a two-mode field, and its only move is a displacement of that mode by its chosen
        number of boats. The referee brackets both moves: he entangles the two vacua before the islands choose, and
        undoes the entanglement after. The squeezing parameter <strong>γ</strong> is fixed once, in advance.
      </>
    ),
    input: "|0⟩",
    boxBefore: "Ĵ(γ)",
    boxAfter: "Ĵ(γ)†",
    rotatedBoxLabel: false,
    move: (i) => `D̂${i}(b${i})`,
    readout: "X̂",
    captions: ["referee entangles", "islands displace", "referee disentangles", "licensed fleet"],
    aria:
      "Circuit for the Li–Du–Massar protocol applied to a fishery. Two wires, one per island, each starting in " +
      "the vacuum state. A referee box labelled J-hat of gamma spans both wires; then each island applies a " +
      "displacement D-hat-j of b-j to its own wire; then a second referee box labelled J-hat of gamma dagger " +
      "spans both wires; then each wire is read out by homodyne detection of the amplitude quadrature X-hat-j, " +
      "yielding b1c = b1 cosh gamma + b2 sinh gamma and b2c = b2 cosh gamma + b1 sinh gamma.",
    caption: (
      <>
        At γ = 0 the referee does nothing, b<sub>j</sub>
        <sup>c</sup> = b<sub>j</sub>, and the islands fish in isolation. Turning γ up mixes each island&rsquo;s
        neighbour into its own licensed fleet.
      </>
    ),
  },
  classical: {
    title: "The same protocol, with the physics taken out",
    intro: (
      <>
        Identical picture, identical read-out, no quantum mechanics anywhere. Each island opens a blank ledger line and
        writes down a number of boats. The harbourmaster seals the declarations, then clears them against one another
        using a rule published in advance, and licenses each island the fleet that comes out. The coefficient{" "}
        <strong>γ</strong> is a line in his rulebook.
      </>
    ),
    input: "0",
    boxBefore: "harbourmaster",
    boxAfter: "harbourmaster",
    rotatedBoxLabel: true,
    move: (i) => `declare b${i}`,
    readout: "ledger",
    captions: ["seals the declarations", "islands declare", "clears them", "licensed fleet"],
    aria:
      "The same circuit drawn as a classical clearing rule. Two ledger lines, one per island, each starting at " +
      "zero. A harbourmaster box spans both lines; then each island declares its boats b-j; then a second " +
      "harbourmaster box spans both lines; then each line is read off the ledger, yielding the licensed fleet " +
      "b1c = b1 cosh gamma + b2 sinh gamma and b2c = b2 cosh gamma + b1 sinh gamma — the same formula as the " +
      "quantum circuit.",
    caption: (
      <>
        The licensed fleet is the same function of the declarations as above. Nothing in this diagram is entangled,
        superposed, or measured — γ is a coefficient in a published rule.
      </>
    ),
  },
};

export default function LDMCircuit({ variant = "quantum" }: { variant?: Variant }) {
  const c = COPY[variant];

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
      <p className={css({ fontSize: "md", fontWeight: "bold", marginBottom: "1.5", color: "gray.700" })}>{c.title}</p>
      <p className={css({ fontSize: "sm", color: "gray.500", marginBottom: "4" })}>{c.intro}</p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={c.aria}
        className={css({ width: "100%", height: "auto", display: "block", maxWidth: "700px", margin: "0 auto" })}
      >
        {/* Island labels */}
        <text x={8} y={yA + 5} fontSize={13} fill={ISLAND_1} fontWeight="700">
          Island 1
        </text>
        <text x={8} y={yB + 5} fontSize={13} fill={ISLAND_2} fontWeight="700">
          Island 2
        </text>

        {/* Inputs: vacuum modes, or blank ledger lines */}
        <text x={xIn} y={yA + 5} fontSize={15} fill={INK} textAnchor="middle">
          {c.input}
        </text>
        <text x={xIn} y={yB + 5} fontSize={15} fill={INK} textAnchor="middle">
          {c.input}
        </text>

        {/* Wires */}
        <line x1={xWire0} y1={yA} x2={xWire1} y2={yA} stroke={REFEREE} strokeWidth={1.5} />
        <line x1={xWire0} y1={yB} x2={xWire1} y2={yB} stroke={REFEREE} strokeWidth={1.5} />

        {/* The referee brackets both declarations */}
        <RefereeBox cx={xJ} label={c.boxBefore} rotated={c.rotatedBoxLabel} />
        <RefereeBox cx={xJd} label={c.boxAfter} rotated={c.rotatedBoxLabel} />

        {/* Each island moves on its own line */}
        <MoveBox cy={yA} color={ISLAND_1} label={c.move("₁")} />
        <MoveBox cy={yB} color={ISLAND_2} label={c.move("₂")} />

        {/* Read-out */}
        <MeasureGlyph cx={xMeasure} cy={yA} />
        <MeasureGlyph cx={xMeasure} cy={yB} />
        <text x={xMeasure} y={yA - 22} fontSize={12} fill={INK} textAnchor="middle">
          {variant === "quantum" ? `${c.readout}₁` : c.readout}
        </text>
        <text x={xMeasure} y={yB - 22} fontSize={12} fill={INK} textAnchor="middle">
          {variant === "quantum" ? `${c.readout}₂` : c.readout}
        </text>

        {/* Licensed fleet — identical in both variants, which is the point */}
        <text x={xOut} y={yA + 5} fontSize={12.5} fill={ISLAND_1} fontWeight="600">
          b₁ᶜ = b₁ cosh γ + b₂ sinh γ
        </text>
        <text x={xOut} y={yB + 5} fontSize={12.5} fill={ISLAND_2} fontWeight="600">
          b₂ᶜ = b₂ cosh γ + b₁ sinh γ
        </text>

        {/* Column captions */}
        <text x={xJ} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle">
          {c.captions[0]}
        </text>
        <text x={xGate} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle">
          {c.captions[1]}
        </text>
        <text x={xJd} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle">
          {c.captions[2]}
        </text>
        <text x={xOut + 78} y={H - 8} fontSize={10} fill={MUTED} textAnchor="middle">
          {c.captions[3]}
        </text>
      </svg>

      <figcaption className={css({ fontSize: "sm", color: "gray.700", textAlign: "center", marginTop: "4" })}>
        {c.caption}
      </figcaption>
    </figure>
  );
}
