import React, { useState } from "react";
import { css } from "../../styled-system/css";

// ============================================================
// The mediated prisoner's-dilemma game as a two-line "circuit"
// ------------------------------------------------------------
// Two players — Walter (top line) and Jesse (bottom line). Each picks a
// move that sits as a box on their own line. Saul brackets the moves on
// both sides — setting the terms before, settling up after.
// At the end each line is read out and the sentences are handed down.
//
// Payoffs are prison YEARS (lower is better), matching the Breaking Bad
// prisoner's-dilemma post: both loyal = 3, both betray = 5, betrayer walks
// free (0), the betrayed partner gets 15. The move → outcome map is the
// verified table from notebooks/quantum_pd.ipynb — no quantum math runs here.
// ============================================================

type Move = "C" | "D" | "Q";

const MOVES: Move[] = ["C", "D", "Q"];

// Move colors reuse the Breaking Bad post's palette.
const MOVE_INFO: Record<Move, { label: string; color: string }> = {
  C: { label: "Stay loyal", color: "#0066cc" },
  D: { label: "Betray", color: "#374151" },
  Q: { label: "Flip both", color: "#10b981" },
};

// Outcome basis state |Walter Jesse⟩ for each (moveWalter, moveJesse) — from quantum_pd.ipynb
const OUTCOME: Record<Move, Record<Move, string>> = {
  C: { C: "CC", D: "CD", Q: "DD" },
  D: { C: "DC", D: "DD", Q: "CD" },
  Q: { C: "DD", D: "DC", Q: "CC" },
};

// Prison years by outcome letter pair (T=0/Free, R=3, P=5, S=15). Lower is better.
const PAYOFF: Record<string, [number, number]> = {
  CC: [3, 3],
  CD: [15, 0],
  DC: [0, 15],
  DD: [5, 5],
};

const yearsLabel = (y: number): string => (y === 0 ? "Free" : `${y} yrs`);
const yearsColor = (y: number): string => (y <= 3 ? "#10b981" : y <= 5 ? "#f59e0b" : "#dc2626");

// ── Geometry ────────────────────────────────────────────────
const W = 560;
const H = 210;
const yA = 74; // Walter's wire
const yB = 152; // Jesse's wire
const yMid = (yA + yB) / 2;
const xWire0 = 96;
const xWire1 = 466; // stops just past the measurement glyph, before the outcome text
const xJ = 136; // Mediator sets the terms
const xGate = 256; // player move
const xJd = 376; // Mediator settles up
const xMeasure = 448; // sentence read-out
const xOut = 500; // outcome on the wire

// A small measurement-meter glyph centred at (cx, cy)
const MeasureGlyph: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <rect x={cx - 16} y={cy - 16} width={32} height={32} rx={4} fill="#f9fafb" stroke="#9ca3af" />
    <path d={`M ${cx - 9} ${cy + 5} A 9 9 0 0 1 ${cx + 9} ${cy + 5}`} fill="none" stroke="#6b7280" strokeWidth={1.5} />
    <line x1={cx} y1={cy + 5} x2={cx + 7} y2={cy - 6} stroke="#6b7280" strokeWidth={1.5} />
  </g>
);

const MediatorBox: React.FC<{ cx: number }> = ({ cx }) => (
  <g>
    <rect x={cx - 17} y={yA - 22} width={34} height={yB - yA + 44} rx={5} fill="rgba(55,65,81,0.06)" stroke="#9ca3af" />
    <text
      x={cx}
      y={yMid}
      fontSize={13}
      fill="#374151"
      textAnchor="middle"
      fontWeight="600"
      transform={`rotate(-90 ${cx} ${yMid})`}
    >
      Saul
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
      aria-label={`${player}: ${info.label}. Activate to change the move.`}
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
      <text x={xGate} y={cy + 5} fontSize={14} fill={info.color} textAnchor="middle" fontWeight="700">
        {info.label}
      </text>
    </g>
  );
};

interface MoveSelectorProps {
  player: string;
  color: string;
  move: Move;
  onSelect: (move: Move) => void;
}

// The primary, unambiguous control: real buttons, not the clickable-but-easy-to-miss SVG boxes.
const MoveSelector: React.FC<MoveSelectorProps> = ({ player, color, move, onSelect }) => (
  <div className={css({ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" })}>
    <span className={css({ fontSize: "0.8rem", fontWeight: "700", color, minWidth: "3.5rem" })}>{player}</span>
    {MOVES.map((m) => {
      const info = MOVE_INFO[m];
      const active = move === m;
      return (
        <button
          key={m}
          type="button"
          aria-pressed={active}
          onClick={() => onSelect(m)}
          className={css({
            fontSize: "0.78rem",
            fontWeight: "600",
            padding: "0.3rem 0.65rem",
            borderRadius: "999px",
            border: "2px solid",
            borderColor: info.color,
            backgroundColor: active ? info.color : "transparent",
            color: active ? "#fff" : info.color,
            cursor: "pointer",
            transition: "opacity 0.15s",
            _hover: { opacity: 0.85 },
          })}
        >
          {info.label}
        </button>
      );
    })}
  </div>
);

export default function QuantumPDCircuit() {
  const [moveW, setMoveW] = useState<Move>("D");
  const [moveJ, setMoveJ] = useState<Move>("D");

  const cycle = (m: Move): Move => MOVES[(MOVES.indexOf(m) + 1) % MOVES.length];

  const outcome = OUTCOME[moveW][moveJ];
  const [yearsW, yearsJ] = PAYOFF[outcome];

  let verdict: string;
  if (moveW === "Q" && moveJ === "Q") {
    verdict =
      "Three years each — and this time it's stable. Flip both is the new equilibrium: betraying against it costs 15 years instead of paying off.";
  } else if (moveW === "C" && moveJ === "C") {
    verdict =
      "Three years each — the mutual-loyalty outcome. Fragile, though: either player can do better by betraying.";
  } else if (moveW === "Q" && moveJ === "C") {
    verdict =
      "Five years each — Walter's flip-both drags loyal Jesse's stack into it too: mutual betrayal, even though Jesse never chose to betray.";
  } else if (moveW === "C" && moveJ === "Q") {
    verdict =
      "Five years each — Jesse's flip-both drags loyal Walter's stack into it too: mutual betrayal, even though Walter never chose to betray.";
  } else if (yearsW === yearsJ) {
    verdict = "Five years each — the mutual-betrayal outcome, the classic trap.";
  } else if (yearsW < yearsJ) {
    verdict = `Walter walks free; Jesse takes ${yearsJ} years.`;
  } else {
    verdict = `Jesse walks free; Walter takes ${yearsW} years.`;
  }

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
        Try it yourself: can loyalty become the smart move?
      </p>
      <p className={css({ fontSize: "0.8rem", color: "#6b7280", marginBottom: "1rem" })}>
        Right now, Walter and Jesse both betray — the classic trap, five years each. Pick a move for each of them below
        and watch Saul&rsquo;s file, and the sentences, update live. Try setting both to <strong>Flip both</strong>.
      </p>

      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1.25rem",
        })}
      >
        <MoveSelector player="Walter" color="#2563eb" move={moveW} onSelect={setMoveW} />
        <MoveSelector player="Jesse" color="#7c3aed" move={moveJ} onSelect={setMoveJ} />
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={css({ width: "100%", height: "auto", display: "block", maxWidth: "600px", margin: "0 auto" })}
      >
        {/* Player labels */}
        <text x={10} y={yA + 4} fontSize={13} fill="#2563eb" fontWeight="700">
          Walter
        </text>
        <text x={10} y={yB + 4} fontSize={13} fill="#7c3aed" fontWeight="700">
          Jesse
        </text>

        {/* Wires */}
        <line x1={xWire0} y1={yA} x2={xWire1} y2={yA} stroke="#9ca3af" strokeWidth={1.5} />
        <line x1={xWire0} y1={yB} x2={xWire1} y2={yB} stroke="#9ca3af" strokeWidth={1.5} />

        {/* Start markers */}
        <circle cx={xWire0} cy={yA} r={3} fill="#9ca3af" />
        <circle cx={xWire0} cy={yB} r={3} fill="#9ca3af" />

        {/* Mediator brackets the moves on both sides */}
        <MediatorBox cx={xJ} />
        <MediatorBox cx={xJd} />

        {/* Player moves (interactive) */}
        <Gate cy={yA} move={moveW} onCycle={() => setMoveW(cycle(moveW))} player="Walter" />
        <Gate cy={yB} move={moveJ} onCycle={() => setMoveJ(cycle(moveJ))} player="Jesse" />

        {/* Sentence read-out */}
        <MeasureGlyph cx={xMeasure} cy={yA} />
        <MeasureGlyph cx={xMeasure} cy={yB} />

        {/* Outcome (prison years) on each wire */}
        <text x={xOut} y={yA + 5} fontSize={13} fontWeight="700" textAnchor="middle" fill={yearsColor(yearsW)}>
          {yearsLabel(yearsW)}
        </text>
        <text x={xOut} y={yB + 5} fontSize={13} fontWeight="700" textAnchor="middle" fill={yearsColor(yearsJ)}>
          {yearsLabel(yearsJ)}
        </text>

        {/* Column captions */}
        <text x={xJ} y={H - 6} fontSize={10} fill="#9ca3af" textAnchor="middle">
          sets the terms
        </text>
        <text x={xGate} y={H - 6} fontSize={10} fill="#9ca3af" textAnchor="middle">
          players move
        </text>
        <text x={xJd} y={H - 6} fontSize={10} fill="#9ca3af" textAnchor="middle">
          settles up
        </text>
        <text x={(xMeasure + xOut) / 2} y={H - 6} fontSize={10} fill="#9ca3af" textAnchor="middle">
          sentence
        </text>
      </svg>

      <p className={css({ fontSize: "0.85rem", color: "#374151", textAlign: "center", marginTop: "1rem" })}>
        {verdict} <span className={css({ color: "#6b7280" })}>(lower is better)</span>
      </p>
    </div>
  );
}
