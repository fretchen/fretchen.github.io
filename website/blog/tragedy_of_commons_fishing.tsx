import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
import { css } from "../styled-system/css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Types
type GovernanceType = "none" | "quotas" | "ostrom";


// Types für Moana's Choice Game
// Angepasst: Jeder Chief einzeln sichtbar

type FishingChoice = "careful" | "intensive";

const otherChiefs = ["Chief Kai", "Chief Leilani", "Chief Tane"];

type RoundHistory = {
  round: number;
  moanaChoice: FishingChoice | null;
  moanaFish: number | null;
  otherChiefs: FishingChoice[] | null;
  chiefsFish: number[] | null; // Fang pro Chief
  fishAfter: number | null;
  regeneration: number | null;
};

const FishingGameSimulator: React.FC = () => {
  const [round, setRound] = useState(1); // 1, 2, 3
  const [fishStock, setFishStock] = useState(120);
  const [moanaTotal, setMoanaTotal] = useState(0);
  const [history, setHistory] = useState<RoundHistory[]>([
    {
      round: 1,
      moanaChoice: null,
      moanaFish: null,
      otherChiefs: null,
      chiefsFish: null,
      fishAfter: null,
      regeneration: null,
    },
    {
      round: 2,
      moanaChoice: null,
      moanaFish: null,
      otherChiefs: null,
      chiefsFish: null,
      fishAfter: null,
      regeneration: null,
    },
    {
      round: 3,
      moanaChoice: null,
      moanaFish: null,
      otherChiefs: null,
      chiefsFish: null,
      fishAfter: null,
      regeneration: null,
    },
  ]);
  const [gameOver, setGameOver] = useState(false);

  function handleChoice(choice: FishingChoice) {
    if (gameOver || history[round - 1].moanaChoice) return;
    // Chiefs wählen zufällig
    const otherChoices = otherChiefs.map(() => (Math.random() < 0.6 ? "careful" : "intensive"));
    const moanaFish = choice === "careful" ? 3 : 6;
    const chiefsFish = otherChoices.map((c) => (c === "careful" ? 3 : 6));
    let prevStock = round === 1 ? 120 : (history[round - 2].fishAfter ?? 120);
    let nextStock = Math.max(0, prevStock - moanaFish - chiefsFish.reduce((a, b) => a + b, 0));
    // Regeneration: 15% falls Bestand > 25, max 150
    const regeneration = nextStock > 25 ? Math.floor(nextStock * 0.15) : 0;
    nextStock = Math.min(150, nextStock + regeneration);
    // Update history
    const newHistory = history.map((h, idx) =>
      idx === round - 1
        ? {
            round,
            moanaChoice: choice,
            moanaFish,
            otherChiefs: otherChoices,
            chiefsFish,
            fishAfter: nextStock,
            regeneration,
          }
        : h
    );
    setHistory(newHistory);
    setMoanaTotal(moanaTotal + moanaFish);
    setFishStock(nextStock);
    if (round === 3) {
      setGameOver(true);
    } else {
      setRound(round + 1);
    }
  }

  function reset() {
    setRound(1);
    setFishStock(120);
    setMoanaTotal(0);
    setHistory([
      {
        round: 1,
        moanaChoice: null,
        moanaFish: null,
        otherChiefs: null,
        chiefsFish: null,
        fishAfter: null,
        regeneration: null,
      },
      {
        round: 2,
        moanaChoice: null,
        moanaFish: null,
        otherChiefs: null,
        chiefsFish: null,
        fishAfter: null,
        regeneration: null,
      },
      {
        round: 3,
        moanaChoice: null,
        moanaFish: null,
        otherChiefs: null,
        chiefsFish: null,
        fishAfter: null,
        regeneration: null,
      },
    ]);
    setGameOver(false);
  }

  // Minimalistisches Konzept: Action-Bereich (Status + Buttons + Feedback) über Scoreboard-Tabelle
  function ActionBar() {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}>
        {/* Statusleiste */}
        <div style={{ display: "flex", gap: 18, fontSize: 16, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span role="img" aria-label="Moana">🌺</span>
            <b>{moanaTotal}</b> Fische
          </span>
          <span style={{ color: "#64748b" }}>|</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span role="img" aria-label="Fisch">🐟</span>
            <b>{fishStock}</b> im Riff
          </span>
          <span style={{ color: "#64748b" }}>|</span>
          <span>Runde <b>{gameOver ? 3 : round}/3</b></span>
        </div>
        {/* Buttons */}
        {!gameOver && (
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            <button
              onClick={() => handleChoice("careful")}
              disabled={gameOver || history[round - 1].moanaChoice !== null}
              style={{
                padding: "10px 18px",
                border: "1px solid #10b981",
                borderRadius: 6,
                background: gameOver || history[round - 1].moanaChoice !== null ? "#e5e7eb" : "#fff",
                color: gameOver || history[round - 1].moanaChoice !== null ? "#94a3b8" : "#222",
                cursor: gameOver || history[round - 1].moanaChoice !== null ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: 15,
                minWidth: 120,
              }}
            >
              🌊 Sorgsam (3 Fische)
            </button>
            <button
              onClick={() => handleChoice("intensive")}
              disabled={gameOver || history[round - 1].moanaChoice !== null}
              style={{
                padding: "10px 18px",
                border: "1px solid #f59e0b",
                borderRadius: 6,
                background: gameOver || history[round - 1].moanaChoice !== null ? "#e5e7eb" : "#fff",
                color: gameOver || history[round - 1].moanaChoice !== null ? "#94a3b8" : "#222",
                cursor: gameOver || history[round - 1].moanaChoice !== null ? "not-allowed" : "pointer",
                fontWeight: 500,
                fontSize: 15,
                minWidth: 120,
              }}
            >
              ⚡ Intensiv (6 Fische)
            </button>
          </div>
        )}
        {/* Rundenfeedback */}
        {!gameOver && history[round - 1].moanaChoice && (
          <div style={{ fontSize: 15, color: "#64748b", marginTop: 4, textAlign: "center" }}>
            Du hast <b>{history[round - 1].moanaChoice === "careful" ? "sorgsam" : "intensiv"}</b> gefischt und {history[round - 1].moanaFish} Fische gefangen.<br />
            Die anderen Chiefs: {history[round - 1].otherChiefs?.map((c, i) => `${otherChiefs[i]}: ${c === "careful" ? "sorgsam" : "intensiv"}`).join(", ")}
            <br />Insgesamt wurden {history[round - 1].moanaFish! + history[round - 1].chiefsFish!.reduce((a, b) => a + b, 0)} Fische gefangen.
            {history[round - 1].regeneration && history[round - 1].regeneration > 0 && (
              <span> &ndash; Das Riff erholt sich: +{history[round - 1].regeneration} Fische</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vergleichs-Tabelle: Moana + alle Chiefs einzeln + Summary-Zeile + nachhaltige Entscheidung farblich
  function ResultsTable() {
    // Summen berechnen
    const moanaSum = history.reduce((sum, h) => sum + (h.moanaFish ?? 0), 0);
    const chiefsSums = otherChiefs.map((_, i) =>
      history.reduce((sum, h) => sum + (h.chiefsFish && h.chiefsFish[i] !== undefined ? h.chiefsFish[i] : 0), 0)
    );
    // Hilfsfunktion für Zellen-Highlight
    function choiceCell(choice: FishingChoice | null, fish: number | null) {
      if (choice === null || fish === null) return <span>-</span>;
      const isSustainable = choice === "careful";
      return (
        <span
          style={{
            background: isSustainable ? "#d1fae5" : "#fef9c3",
            color: isSustainable ? "#047857" : "#b45309",
            borderRadius: 4,
            padding: "2px 6px",
            fontWeight: 500,
            display: "inline-block",
            minWidth: 24,
          }}
          title={isSustainable ? "Sorgsam (nachhaltig)" : "Intensiv (nicht nachhaltig)"}
        >
          {isSustainable ? "🌊" : "⚡"} {fish}
        </span>
      );
    }
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "18px 0" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 15, minWidth: 420 }}>
          <thead>
            <tr style={{ background: "#bae6fd" }}>
              <th style={{ padding: "6px 8px" }}>Runde</th>
              <th style={{ padding: "6px 8px" }}>Moana</th>
              {otherChiefs.map((chief) => (
                <th key={chief} style={{ padding: "6px 8px" }}>{chief}</th>
              ))}
              <th style={{ padding: "6px 8px" }}>Fischbestand</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr
                key={idx}
                style={{
                  background:
                    idx === round - 1 && !gameOver
                      ? "#f0fdf4"
                      : idx % 2 === 0
                      ? "#f8fafc"
                      : "#fff",
                }}
              >
                <td style={{ padding: "4px 8px", textAlign: "center", fontWeight: idx === round - 1 && !gameOver ? 600 : 400 }}>{h.round}</td>
                {/* Moana */}
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  {choiceCell(h.moanaChoice, h.moanaFish)}
                </td>
                {/* Chiefs */}
                {otherChiefs.map((_, i) => (
                  <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>
                    {h.otherChiefs && h.chiefsFish && h.otherChiefs[i] !== undefined && h.chiefsFish[i] !== undefined
                      ? choiceCell(h.otherChiefs[i], h.chiefsFish[i])
                      : "-"}
                  </td>
                ))}
                {/* Fischbestand */}
                <td style={{ padding: "4px 8px", textAlign: "center" }}>{h.fishAfter !== null ? h.fishAfter : "-"}</td>
              </tr>
            ))}
            {/* Summary Row */}
            <tr style={{ background: "#e0e7ef", fontWeight: 600, borderTop: "2px solid #bae6fd" }}>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>Σ</td>
              <td style={{ padding: "4px 8px", textAlign: "center" }}>{moanaSum}</td>
              {chiefsSums.map((sum, i) => (
                <td key={i} style={{ padding: "4px 8px", textAlign: "center" }}>{sum}</td>
              ))}
              <td style={{ padding: "4px 8px", textAlign: "center", color: "#64748b" }}>–</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Nach 3 Runden: Zusammenfassung
  function EndSummary() {
    const collapsed = fishStock <= 10;
    const struggling = !collapsed && fishStock <= 40;
    return (
      <div style={{ textAlign: "center", margin: "18px 0" }}>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Ergebnis nach 3 Runden</div>
        <div style={{ fontSize: 15, marginBottom: 6 }}>🐟 <b>{fishStock}</b> Fische im Riff</div>
        <div style={{ fontSize: 15, marginBottom: 6 }}>🌺 <b>{moanaTotal}</b> Fische für Moana</div>
        <div style={{ fontSize: 15, marginBottom: 12 }}>
          {collapsed ? (
            <span style={{ color: "#ef4444" }}>Das Riff ist kollabiert.</span>
          ) : struggling ? (
            <span style={{ color: "#f59e0b" }}>Das Riff ist geschwächt.</span>
          ) : (
            <span style={{ color: "#10b981" }}>Das Riff ist gesund.</span>
          )}
        </div>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px",
            border: "none",
            borderRadius: 6,
            background: "#0891b2",
            color: "#fff",
            fontWeight: 500,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #bae6fd", borderRadius: 8, padding: 18, margin: "18px 0", background: "#f8fafc" }}>
      <ActionBar />
      <ResultsTable />
      {gameOver && <EndSummary />}
    </div>
  );
};

// Governance Designer Component
const GovernanceDesigner: React.FC = () => {
  const [selectedGovernance, setSelectedGovernance] = useState<GovernanceType>("none");
  const [simulationResult, setSimulationResult] = useState<{
    sustainability: number;
    efficiency: number;
    fairness: number;
    cost: number;
  } | null>(null);

  const governanceOptions = {
    none: {
      name: "Keine Regulierung",
      description: "Jeder fischt so viel er will",
      sustainability: 20,
      efficiency: 70,
      fairness: 30,
      cost: 0,
    },
    quotas: {
      name: "Staatliche Quoten",
      description: "Feste Fangmengen pro Boot",
      sustainability: 80,
      efficiency: 60,
      fairness: 70,
      cost: 40,
    },
    ostrom: {
      name: "Ostrom'sche Selbstverwaltung",
      description: "8 Erfolgsprinzipien für Commons",
      sustainability: 88,
      efficiency: 78,
      fairness: 92,
      cost: 25,
    },
  };

  const testGovernance = (type: GovernanceType) => {
    setSelectedGovernance(type);
    setSimulationResult(governanceOptions[type]);
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#fefce8",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>⚖️ Governance-Designer</h3>

      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        })}
      >
        {Object.entries(governanceOptions).map(([key, option]) => (
          <button
            key={key}
            onClick={() => testGovernance(key as GovernanceType)}
            className={css({
              padding: "12px",
              backgroundColor: selectedGovernance === key ? "#fbbf24" : "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              cursor: "pointer",
              textAlign: "left",
              "&:hover": { backgroundColor: "#fef3c7" },
            })}
          >
            <div className={css({ fontWeight: "bold", marginBottom: "4px" })}>{option.name}</div>
            <div className={css({ fontSize: "12px", color: "#6b7280" })}>{option.description}</div>
          </button>
        ))}
      </div>

      {simulationResult && (
        <div className={css({ backgroundColor: "#fff", padding: "16px", borderRadius: "6px" })}>
          <h4 className={css({ marginBottom: "12px", fontWeight: "bold" })}>
            Ergebnis: {governanceOptions[selectedGovernance].name}
          </h4>

          {selectedGovernance === "ostrom" && (
            <div
              className={css({
                backgroundColor: "#f0f9ff",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
                border: "1px solid #c7d2fe",
              })}
            >
              <h5 className={css({ fontWeight: "bold", marginBottom: "8px" })}>Elinor Ostroms 8 Erfolgsprinzipien:</h5>
              <div className={css({ fontSize: "14px", lineHeight: "1.5" })}>
                <div>
                  1. 🎯 <strong>Klare Grenzen:</strong> Wer gehört zur Gemeinschaft?
                </div>
                <div>
                  2. 📋 <strong>Lokale Regeln:</strong> An lokale Bedingungen angepasst
                </div>
                <div>
                  3. 🗳️ <strong>Partizipation:</strong> Betroffene gestalten Regeln mit
                </div>
                <div>
                  4. 👀 <strong>Monitoring:</strong> Gemeinschaft überwacht sich selbst
                </div>
                <div>
                  5. ⚖️ <strong>Graduierte Sanktionen:</strong> Faire, stufenweise Strafen
                </div>
                <div>
                  6. 🤝 <strong>Konfliktlösung:</strong> Schnelle, lokale Streitbeilegung
                </div>
                <div>
                  7. 🛡️ <strong>Anerkennung:</strong> Externe Autorität respektiert Autonomie
                </div>
                <div>
                  8. 🌐 <strong>Verschachtelte Systeme:</strong> Multi-Level Governance
                </div>
              </div>
            </div>
          )}

          <div className={css({ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" })}>
            {[
              { label: "Nachhaltigkeit", value: simulationResult.sustainability, color: "#10b981" },
              { label: "Effizienz", value: simulationResult.efficiency, color: "#3b82f6" },
              { label: "Fairness", value: simulationResult.fairness, color: "#8b5cf6" },
              { label: "Kosten", value: simulationResult.cost, color: "#ef4444" },
            ].map((metric) => (
              <div key={metric.label} className={css({ marginBottom: "8px" })}>
                <div className={css({ display: "flex", justifyContent: "space-between", marginBottom: "4px" })}>
                  <span className={css({ fontSize: "14px" })}>{metric.label}</span>
                  <span className={css({ fontSize: "14px", fontWeight: "bold" })}>{metric.value}%</span>
                </div>
                <div className={css({ width: "100%", backgroundColor: "#e5e7eb", borderRadius: "4px", height: "8px" })}>
                  <div
                    className={css({
                      height: "100%",
                      borderRadius: "4px",
                      backgroundColor: metric.color,
                      width: `${metric.value}%`,
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Blog Post Component

const TragedyOfCommonsFishing: React.FC = () => {
  return (
    <article>
      <h1>Games on the common pool ressources</h1>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`

I recently wrote about the prisoners dilemma. However, it feels overly gloomy and the not that realistic.
So I started to look around into more complex games that might apply more directly to my life experiences. In this
context I kept coming back to the question of how can we govern common pools ?

In the a completely unrestrained version it depletes and collapses. This led to the wide belief that only the state or the market can govern common resources.
However, Elinor Ostrom showed that communities can self-organize to govern common resources. And she did this again around beautiful social 
games, which I will explore here.
`}</ReactMarkdown>
      <p className={css({ lineHeight: "1.6", fontStyle: "italic", textAlign: "center" })}>
        &ldquo;Weder Staat noch Markt sind die einzigen Lösungen. Menschen können lernen, gemeinsame Ressourcen selbst
        zu verwalten.&rdquo; — Elinor Ostrom
      </p>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{`
## Setting up the scene
            
Given that we are talking about a social game, I really like the idea to look into the 
problem from the perspective of a specific person and its community. For the common pool the field 
of fishing is a great example that is visual and keeps coming back in the literature. So, we will set
up the scene around the famous Disney character Moana. 
            
She has now become the young chief of here island and therefore has to decide how many ships she has to send out every morning. The neighboring islands' chiefs have called an urgent meeting. The fish that have sustained your communities
          for generations are becoming scarce. The great tuna schools that once darkened the waters now appear only
          occasionally. **Something must be done, but what?**

### The dilemma of the island chiefs

We can now use this setting to sketch out the rule of the game.
            
- Each morning, Moana and the other three chief of the neighboring islands have to decide how many ships they send out to fish.
- In the evening they count the fish they caught and share it on the beach of each island.

            `}</ReactMarkdown>

      <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
        As Moana sits with the other three chiefs in the sacred meeting place overlooking the shared fishing grounds,
        the dilemma becomes crystal clear. Each chief faces the same choice:
      </p>

      <FishingGameSimulator />

      <section className={css({ marginBottom: "32px" })}>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Was ist passiert?</strong> Wahrscheinlich haben Sie erlebt, was Millionen von Menschen vor Ihnen
          erlebt haben: Selbst mit den besten Absichten ist es schwer, nachhaltig zu handeln, wenn andere es nicht tun.
        </p>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Herzlichen Glückwunsch!</strong> Sie haben gerade eine der grundlegendsten mathematischen Fallen der
          menschlichen Zivilisation erlebt. Das Nash-Gleichgewicht zeigt:{" "}
          <em>Defektieren ist immer die rational beste Wahl</em> - egal was die anderen tun.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Ostrom's Durchbruch: Es gibt einen dritten Weg
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Jahrzehntelang glaubten Ökonomen, es gäbe nur zwei Lösungen für Commons-Probleme:
        </p>
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          <div
            className={css({
              backgroundColor: "#fef2f2",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            })}
          >
            <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>🏛️ Lösung 1: Der Staat</h4>
            <p className={css({ fontSize: "14px", lineHeight: "1.5" })}>
              Zentrale Kontrolle, Quoten, Strafen. Funktioniert, aber teuer und oft ineffizient.
            </p>
          </div>
          <div
            className={css({
              backgroundColor: "#fef2f2",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
            })}
          >
            <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>💰 Lösung 2: Der Markt</h4>
            <p className={css({ fontSize: "14px", lineHeight: "1.5" })}>
              Privatisierung der Ressource. Kein Commons-Problem mehr, aber sozialer Ausschluss.
            </p>
          </div>
        </div>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Aber Elinor Ostrom verbrachte ihr Leben damit, <strong>erfolgreiche Gemeinschaften</strong> zu studieren, die
          Commons verwalten - ohne Staat, ohne Privatisierung. Von Fischerdörfern in der Türkei bis zu
          Bewässerungssystemen in Spanien.
        </p>
        <div
          className={css({
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            🌟 Ostrom's 8 Design-Prinzipien für Commons:
          </h4>
          <div className={css({ fontSize: "14px", lineHeight: "1.6" })}>
            <div className={css({ marginBottom: "8px" })}>
              1. <strong>Klare Grenzen:</strong> Wer gehört dazu, was ist die Ressource?
            </div>
            <div className={css({ marginBottom: "8px" })}>
              2. <strong>Lokale Regeln:</strong> An lokale Bedingungen angepasst
            </div>
            <div className={css({ marginBottom: "8px" })}>
              3. <strong>Partizipation:</strong> Betroffene können Regeln mitbestimmen
            </div>
            <div className={css({ marginBottom: "8px" })}>
              4. <strong>Monitoring:</strong> Überwachung durch die Gemeinschaft
            </div>
            <div className={css({ marginBottom: "8px" })}>
              5. <strong>Sanktionen:</strong> Graduierte Strafen bei Regelbruch
            </div>
            <div className={css({ marginBottom: "8px" })}>
              6. <strong>Konfliktlösung:</strong> Schnelle, günstige Mechanismen
            </div>
            <div className={css({ marginBottom: "8px" })}>
              7. <strong>Anerkennung:</strong> Externe Behörden akzeptieren das System
            </div>
            <div>
              8. <strong>Verschachtelte Institutionen:</strong> Mehrebenen-Governance
            </div>
          </div>
        </div>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Das Revolutionäre daran:</strong> Diese Prinzipien funktionieren nicht nur in Fischerdörfern. Sie
          erklären, warum Open-Source-Software funktioniert, warum manche Teams effektiver Wissen teilen, und warum
          bestimmte Online-Communities gedeihen.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Das Neufundland-Beispiel: Wenn Commons kollabieren
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Was Sie gerade im Spiel erlebt haben, passierte vor Neufundland über 40 Jahre hinweg. 1992 brach der
          Kabeljau-Bestand vollständig zusammen - <strong>40.000 Fischer verloren über Nacht ihre Jobs.</strong>
        </p>
        <div
          className={css({
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <p className={css({ fontWeight: "bold", marginBottom: "8px" })}>Die fatale Logik:</p>
          <div className={css({ fontSize: "14px", lineHeight: "1.6" })}>
            <em>&ldquo;Wenn ich heute nicht fische, fischt es jemand anders. Lieber ich als die Konkurrenz.&rdquo;</em>
          </div>
        </div>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Das Nash-Gleichgewicht in Aktion: Jeder handelt rational, das Ergebnis ist irrational.{" "}
          <strong>Ein Musterbeispiel der Tragedy of Commons.</strong>
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Lösungsansätze: Was hätte funktionieren können?
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Die gute Nachricht: Es gibt bewährte Lösungen für Commons-Probleme. Testen Sie verschiedene
          Governance-Systeme:
        </p>

        <GovernanceDesigner />

        <div
          className={css({
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>Erfolgreiche Beispiele:</h4>
          <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
            <li>
              <strong>Island:</strong> Handelbare Quoten (ITQ) retteten die Fischerei
            </li>
            <li>
              <strong>Maine Lobster:</strong> Community-Management durch Fischer-Kooperativen
            </li>
            <li>
              <strong>Neuseeland:</strong> Kombination aus Quoten und Technologie-Monitoring
            </li>
            <li>
              <strong>🏆 Ostrom-Beispiele:</strong> Spanische Huertas, Schweizer Alpweiden, philippinische Bewässerung
            </li>
          </ul>
        </div>

        <div
          className={css({
            backgroundColor: "#f0f9ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            🎓 Elinor Ostrom: Nobelpreis für Commons-Forschung
          </h4>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            2009 erhielt Elinor Ostrom als erste Frau den Wirtschaftsnobelpreis für ihre Forschung zu Commons. Sie
            bewies: Weder reine Privatisierung noch staatliche Kontrolle sind die einzigen Lösungen.
          </p>
          <p className={css({ lineHeight: "1.6", fontStyle: "italic" })}>
            &ldquo;Selbst-organisierte Institutionen können Commons nachhaltig verwalten, wenn sie bestimmte
            Design-Prinzipien befolgen.&rdquo;
          </p>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Ostrom's Vermächtnis: Von Fischerdörfern zu Silicon Valley
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Ostrom's Prinzipien funktionieren nicht nur in traditionellen Commons. Sie erklären, warum manche moderne
          Organisationen gedeihen:
        </p>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          {[
            {
              title: "🔗 Open Source",
              desc: "Linux, Wikipedia: Klare Regeln, Community-Governance, graduierte Sanktionen",
            },
            {
              title: "💡 Wissens-Commons",
              desc: "Erfolgreiche Teams teilen Wissen durch formelle und informelle Institutionen",
            },
            {
              title: "🌐 Online-Communities",
              desc: "Reddit, Stack Overflow: Reputation, Moderation, Community-Standards",
            },
            {
              title: "🏢 Agile Teams",
              desc: "Scrum, Cross-functional Teams: Selbstorganisation mit klaren Grenzen",
            },
          ].map((example) => (
            <div
              key={example.title}
              className={css({
                padding: "16px",
                backgroundColor: "#f0fdf4",
                borderRadius: "6px",
                border: "1px solid #bbf7d0",
              })}
            >
              <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>{example.title}</h4>
              <p className={css({ fontSize: "14px", color: "#374151", lineHeight: "1.5" })}>{example.desc}</p>
            </div>
          ))}
        </div>

        <div
          className={css({
            backgroundColor: "#f0f9ff",
            border: "1px solid #c7d2fe",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "12px" })}>
            💡 Die drei Wege zum Umgang mit Commons-Dilemmas:
          </h4>
          <div className={css({ fontSize: "15px", lineHeight: "1.6" })}>
            <div className={css({ marginBottom: "8px" })}>
              <strong>🏛️ Staatliche Regulierung:</strong> Quoten, Überwachung, Strafen (funktioniert, aber teuer)
            </div>
            <div className={css({ marginBottom: "8px" })}>
              <strong>💰 Marktlösungen:</strong> Privatisierung, handelbare Rechte (effizient, aber exklusiv)
            </div>
            <div className={css({ marginBottom: "8px" })}>
              <strong>🤝 Ostrom's Weg:</strong> Community-Governance mit Design-Prinzipien (nachhaltig und inklusiv)
            </div>
          </div>
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          <strong>Die nächste Commons-Krise?</strong> Künstliche Intelligenz. Wie teilen wir die Vorteile von AI, ohne
          dass wenige alle Ressourcen monopolisieren? Wie verhindern wir, dass das &ldquo;KI-Commons&rdquo; durch
          kurzsichtige Konkurrenz zerstört wird?
        </p>
        <p className={css({ lineHeight: "1.6", marginTop: "16px" })}>
          Elinor Ostrom hätte gewusst, wo sie anfangen würde: Bei den Menschen, die das Problem lösen müssen.
          <strong> Denn am Ende sind Commons-Probleme Menschen-Probleme.</strong>
        </p>
      </section>
    </article>
  );
};
export default TragedyOfCommonsFishing;

// Post metadata
export const meta = {
  title: "Tragedy of the Commons: Moana's Choice",
  description: "Ein narratives, interaktives Blogspiel zur Tragedy of the Commons und Ostroms Theorien.",
};