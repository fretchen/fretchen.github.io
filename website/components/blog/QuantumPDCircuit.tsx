import React, { useState } from "react";
import { css } from "../../styled-system/css";

// ============================================================
// The scorecard game as a two-line "circuit"
// ------------------------------------------------------------
// Two players (A on top, B on bottom). Each picks a move that
// sits as a box on their own line. The referee's coupling brackets
// the moves on both sides (J … moves … J†). At the end each line is
// read out (measured) and the outcome pays out.
//
// The move → outcome map below is the exact, verified table from
// notebooks/quantum_pd.ipynb — no quantum math runs in the browser.
// ============================================================

type Move = "C" | "D" | "Q";

const MOVES: Move[] = ["C", "D", "Q"];

const MOVE_INFO: Record<Move, { label: string; quantum: string; color: string }> = {
  C: { label: "Cooperate", quantum: "I", color: "#059669" },
  D: { label: "Defect", quantum: "iσx", color: "#dc2626" },
  Q: { label: "Commit", quantum: "iσz", color: "#7b3fa0" },
};

// Outcome basis state |A B⟩ for each (moveA, moveB) — from quantum_pd.ipynb
const OUTCOME: Record<Move, Record<Move, string>> = {
  C: { C: "CC", D: "CD", Q: "DD" },
  D: { C: "DC", D: "DD", Q: "CD" },
  Q: { C: "DD", D: "DC", Q: "CC" },
};

// Payoffs by outcome letter pair (T=5, R=3, P=1, S=0)
const PAYOFF: Record<string, [number, number]> = {
  CC: [3, 3],
  CD: [0, 5],
  DC: [5, 0],
  DD: [1, 1],
};

const LETTER: Record<string, string> = { C: "Cooperate", D: "Defect" };

// ── Geometry ────────────────────────────────────────────────
const W = 560;
const H = 210;
const yA = 74; // Player A wire
const yB = 152; // Player B wire
const xWire0 = 96;
const xWire1 = 524;
const xJ = 136; // referee coupling (J) centre
const xGate = 256; // player gate centre
const xJd = 376; // referee un-coupling (J†) centre
const xMeasure = 448; // measurement centre
const xOut = 500; // outcome readout on the wire

// A small measurement-meter glyph centred at (cx, cy)
const MeasureGlyph: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <rect x={cx - 16} y={cy - 16} width={32} height={32} rx={4} fill="#f9fafb" stroke="#9ca3af" />
    <path d={`M ${cx - 9} ${cy + 5} A 9 9 0 0 1 ${cx + 9} ${cy + 5}`} fill="none" stroke="#6b7280" strokeWidth={1.5} />
    <line x1={cx} y1={cy + 5} x2={cx + 7} y2={cy - 6} stroke="#6b7280" strokeWidth={1.5} />
  </g>
);

const RefereeBox: React.FC<{ cx: number; label: string }> = ({ cx, label }) => (
  <g>
    <rect x={cx - 17} y={yA - 22} width={34} height={yB - yA + 44} rx={5} fill="rgba(55,65,81,0.06)" stroke="#9ca3af" />
    <text x={cx} y={(yA + yB) / 2 + 5} fontSize={15} fill="#374151" textAnchor="middle" fontWeight="600">
      {label}
    </text>
  </g>
);

interface GateProps {
  cy: number;
  move: Move;
  onCycle: () => void;
  player: string;
}

const Gate: React.FC<GateProps> = ({ cy, move, onCycle, player }) => {
  const info = MOVE_INFO[move];
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${player} plays ${info.label}. Activate to change.`}
      onClick={onCycle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onCycle();
        }
      }}
      className={css({ cursor: "pointer", outline: "none", _hover: { opacity: 0.85 } })}
    >
      <rect
        x={xGate - 52}
        y={cy - 19}
        width={104}
        height={38}
        rx={6}
        fill={`${info.color}18`}
        stroke={info.color}
        strokeWidth={2}
      />
      <text x={xGate} y={cy - 1} fontSize={14} fill={info.color} textAnchor="middle" fontWeight="700">
        {info.label}
      </text>
      <text x={xGate} y={cy + 13} fontSize={9} fill="#6b7280" textAnchor="middle">
        {info.quantum} · click to change
      </text>
    </g>
  );
};

export default function QuantumPDCircuit() {
  const [moveA, setMoveA] = useState<Move>("D");
  const [moveB, setMoveB] = useState<Move>("D");

  const cycle = (m: Move): Move => MOVES[(MOVES.indexOf(m) + 1) % MOVES.length];

  const outcome = OUTCOME[moveA][moveB];
  const [payA, payB] = PAYOFF[outcome];
  const letterA = outcome[0];
  const letterB = outcome[1];

  const both = payA === payB;
  const verdict = both
    ? payA === 3
      ? "Both cooperate — the good outcome."
      : "Both stuck with the punishment."
    : payA > payB
      ? "You walk away ahead."
      : "You take the sucker's share.";

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(123, 63, 160, 0.04)",
        borderRadius: "8px",
        border: "1px solid rgba(123, 63, 160, 0.15)",
      })}
    >
      <p className={css({ fontSize: "0.95rem", fontWeight: "bold", marginBottom: "0.35rem", color: "#374151" })}>
        The scorecard game, drawn as two lines
      </p>
      <p className={css({ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1rem" })}>
        Both players start out cooperating. The referee brackets their moves on both sides. Click either player&rsquo;s
        gate to change their move and watch the tally change. Try setting both to <strong>Commit</strong>.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={css({ width: "100%", height: "auto", display: "block", maxWidth: "600px", margin: "0 auto" })}
      >
        {/* Player labels */}
        <text x={10} y={yA + 4} fontSize={12} fill="#374151" fontWeight="600">
          You (A)
        </text>
        <text x={10} y={yB + 4} fontSize={12} fill="#374151" fontWeight="600">
          Them (B)
        </text>

        {/* Wires */}
        <line x1={xWire0} y1={yA} x2={xWire1} y2={yA} stroke="#9ca3af" strokeWidth={1.5} />
        <line x1={xWire0} y1={yB} x2={xWire1} y2={yB} stroke="#9ca3af" strokeWidth={1.5} />

        {/* Start markers */}
        <circle cx={xWire0} cy={yA} r={3} fill="#9ca3af" />
        <circle cx={xWire0} cy={yB} r={3} fill="#9ca3af" />

        {/* Referee coupling before and after the moves */}
        <RefereeBox cx={xJ} label="J" />
        <RefereeBox cx={xJd} label="J†" />

        {/* Player gates (interactive) */}
        <Gate cy={yA} move={moveA} onCycle={() => setMoveA(cycle(moveA))} player="You" />
        <Gate cy={yB} move={moveB} onCycle={() => setMoveB(cycle(moveB))} player="Them" />

        {/* Measurement */}
        <MeasureGlyph cx={xMeasure} cy={yA} />
        <MeasureGlyph cx={xMeasure} cy={yB} />

        {/* Outcome letters on each wire */}
        <text
          x={xOut}
          y={yA + 5}
          fontSize={16}
          fontWeight="700"
          textAnchor="middle"
          fill={letterA === "D" ? "#dc2626" : "#059669"}
        >
          {letterA}
        </text>
        <text
          x={xOut}
          y={yB + 5}
          fontSize={16}
          fontWeight="700"
          textAnchor="middle"
          fill={letterB === "D" ? "#dc2626" : "#059669"}
        >
          {letterB}
        </text>

        {/* Column captions */}
        <text x={xJ} y={H - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">
          referee sets up
        </text>
        <text x={xGate} y={H - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">
          players move
        </text>
        <text x={xJd} y={H - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">
          referee tallies
        </text>
        <text x={(xMeasure + xOut) / 2} y={H - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">
          scorecard
        </text>
      </svg>

      {/* Outcome readout */}
      <div
        className={css({
          marginTop: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <span
          className={css({
            padding: "0.35rem 0.8rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: "600",
            border: "1px solid",
            borderColor: letterA === "D" ? "#dc2626" : "#059669",
            color: letterA === "D" ? "#dc2626" : "#059669",
          })}
        >
          You: {LETTER[letterA]} → {payA}
        </span>
        <span
          className={css({
            padding: "0.35rem 0.8rem",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: "600",
            border: "1px solid",
            borderColor: letterB === "D" ? "#dc2626" : "#059669",
            color: letterB === "D" ? "#dc2626" : "#059669",
          })}
        >
          Them: {LETTER[letterB]} → {payB}
        </span>
      </div>
      <p className={css({ fontSize: "0.85rem", color: "#374151", textAlign: "center", marginTop: "0.6rem" })}>
        Scorecard reads <strong>{outcome}</strong>. {verdict}
      </p>
    </div>
  );
}
