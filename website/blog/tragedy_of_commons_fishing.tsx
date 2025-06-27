import React, { useState } from "react";
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
type FishingStrategy = "sustainable" | "moderate" | "aggressive" | "greedy";
type GovernanceType = "none" | "quotas" | "ostrom";

// Historical data for Newfoundland cod fishery
const historicalData = [
  { year: 1950, catch: 800, stock: 100, employment: 40000 },
  { year: 1960, catch: 850, stock: 95, employment: 42000 },
  { year: 1970, catch: 900, stock: 85, employment: 45000 },
  { year: 1975, catch: 750, stock: 70, employment: 38000 },
  { year: 1980, catch: 600, stock: 50, employment: 32000 },
  { year: 1985, catch: 400, stock: 30, employment: 25000 },
  { year: 1990, catch: 200, stock: 15, employment: 15000 },
  { year: 1992, catch: 0, stock: 5, employment: 0 },
];

// Fishing Game Component
const FishingGameSimulator: React.FC = () => {
  const [userHours, setUserHours] = useState(8);
  const [fishStock, setFishStock] = useState(100);
  const [week, setWeek] = useState(1);
  const [userIncome, setUserIncome] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [gameHistory, setGameHistory] = useState<
    Array<{ week: number; stock: number; userCatch: number; income: number }>
  >([]);
  const [gameOver, setGameOver] = useState(false);
  const [aiStrategies] = useState<FishingStrategy[]>(["sustainable", "moderate", "aggressive", "greedy"]);

  const calculateCatch = (hours: number, stock: number) => {
    // Catch efficiency decreases as stock depletes
    const efficiency = Math.max(0.1, stock / 100);
    return Math.round(hours * efficiency * 5);
  };

  const calculateAICatch = (strategy: FishingStrategy, stock: number, _week: number) => {
    const baseHours = {
      sustainable: 6,
      moderate: 8,
      aggressive: 10,
      greedy: 12,
    };

    // Some strategies adapt based on stock level
    let hours = baseHours[strategy];
    if (strategy === "moderate" && stock < 50) hours = 6;
    if (strategy === "aggressive" && stock < 30) hours = 8;

    return calculateCatch(hours, stock);
  };

  const runWeek = () => {
    if (gameOver || week > 10) return;

    // Calculate catches
    const userCatch = calculateCatch(userHours, fishStock);
    const aiCatches = aiStrategies.map((strategy) => calculateAICatch(strategy, fishStock, week));
    const totalCatch = userCatch + aiCatches.reduce((sum, catchAmount) => sum + catchAmount, 0);

    // Calculate income (price decreases if too much fish in market)
    const basePrice = 10;
    const marketPrice = Math.max(5, basePrice - totalCatch * 0.02);
    const weekIncome = userCatch * marketPrice;

    // Update fish stock (natural reproduction minus total catch)
    const reproduction = Math.max(0, fishStock * 0.1); // 10% natural growth
    const newStock = Math.max(0, fishStock + reproduction - totalCatch);

    // Update state
    setFishStock(newStock);
    setUserIncome(weekIncome);
    setTotalIncome((prev) => prev + weekIncome);
    setGameHistory((prev) => [
      ...prev,
      {
        week,
        stock: newStock,
        userCatch,
        income: weekIncome,
      },
    ]);

    if (newStock < 5) {
      setGameOver(true);
    }

    setWeek((prev) => prev + 1);
  };

  const resetGame = () => {
    setFishStock(100);
    setWeek(1);
    setUserIncome(0);
    setTotalIncome(0);
    setGameHistory([]);
    setGameOver(false);
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f0f9ff",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>🎣 Fischerdorf-Simulator</h3>

      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        })}
      >
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Woche</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold" })}>{week}</div>
        </div>
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Fischbestand</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: fishStock < 30 ? "#ef4444" : "#10b981" })}>
            {Math.round(fishStock)}%
          </div>
        </div>
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Diese Woche</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold" })}>${Math.round(userIncome)}</div>
        </div>
        <div className={css({ padding: "12px", backgroundColor: "#fff", borderRadius: "6px" })}>
          <div className={css({ fontSize: "14px", color: "#6b7280" })}>Gesamt</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold" })}>${Math.round(totalIncome)}</div>
        </div>
      </div>

      {!gameOver && week <= 10 && (
        <div className={css({ marginBottom: "20px" })}>
          <label className={css({ display: "block", marginBottom: "8px", fontWeight: "bold" })}>
            Fischstunden pro Tag: {userHours}
          </label>
          <input
            type="range"
            min="0"
            max="12"
            value={userHours}
            onChange={(e) => setUserHours(parseInt(e.target.value))}
            className={css({ width: "100%", marginBottom: "12px" })}
          />
          <button
            onClick={runWeek}
            className={css({
              padding: "10px 20px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              "&:hover": { backgroundColor: "#2563eb" },
            })}
          >
            Woche {week} starten
          </button>
        </div>
      )}

      {gameOver && (
        <div
          className={css({
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ color: "#dc2626", fontWeight: "bold" })}>🚨 Fischbestand kollabiert!</h4>
          <p>Der See ist leergefischt. Gesamteinkommen: ${Math.round(totalIncome)}</p>
          <button
            onClick={resetGame}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "8px",
            })}
          >
            Neues Spiel
          </button>
        </div>
      )}

      {week > 10 && !gameOver && (
        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "6px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ color: "#16a34a", fontWeight: "bold" })}>✅ Nachhaltiger Erfolg!</h4>
          <p>Du hast 10 Wochen überlebt. Gesamteinkommen: ${Math.round(totalIncome)}</p>
          <button
            onClick={resetGame}
            className={css({
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "8px",
            })}
          >
            Neues Spiel
          </button>
        </div>
      )}
    </div>
  );
};

// Historical Timeline Component
const HistoricalTimeline: React.FC = () => {
  const data = {
    labels: historicalData.map((d) => d.year.toString()),
    datasets: [
      {
        label: "Fischbestand (%)",
        data: historicalData.map((d) => d.stock),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        yAxisID: "y",
      },
      {
        label: "Fang (1000 Tonnen)",
        data: historicalData.map((d) => d.catch),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Neufundland Kabeljau-Fischerei 1950-1992",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Jahr",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Fischbestand (%)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Fang (1000 Tonnen)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <div className={css({ height: "300px" })}>
        <Line data={data} options={options} />
      </div>
      <div className={css({ fontSize: "14px", color: "#6b7280", marginTop: "12px" })}>
        <strong>1992:</strong> Kompletter Fangstopp. 40.000 Fischer verlieren ihre Jobs über Nacht.
      </div>
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
export default function TragedyOfCommonsFishing() {
  return (
    <article className={css({ maxWidth: "800px", margin: "0 auto", padding: "20px" })}>
      <header className={css({ marginBottom: "32px" })}>
        <h1
          className={css({
            fontSize: "32px",
            fontWeight: "bold",
            lineHeight: "1.2",
            marginBottom: "16px",
          })}
        >
          Die Kabeljau-Katastrophe: Eine interaktive Lektion über die Tragedy of Commons
        </h1>
        <div
          className={css({
            fontSize: "16px",
            color: "#6b7280",
            marginBottom: "24px",
          })}
        >
          Veröffentlicht am 27. Juni 2025
        </div>
      </header>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Die größte Umweltkatastrophe Kanadas
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Am 2. Juli 1992 verkündete die kanadische Regierung ein komplettes Moratorium für die Kabeljau-Fischerei vor
          Neufundland. Über Nacht verloren <strong>40.000 Fischer</strong> ihre Jobs. Ein Fischbestand, der 500 Jahre
          lang nachhaltig befischt worden war, brach vollständig zusammen.
        </p>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Wie konnte das passieren? Die Antwort liegt in einem einfachen, aber tödlichen Spiel, das jeder von uns
          täglich spielt - oft ohne es zu merken.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>Das Fischerdorf-Spiel</h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Stellen Sie sich vor, Sie sind Kapitän eines Fischerboots in einem kleinen Dorf. Sie teilen sich einen See mit
          4 anderen Fischern. Jeden Tag müssen Sie entscheiden: Wie viele Stunden sollen Sie fischen?
        </p>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Die Regeln sind einfach:</strong> Mehr Stunden bedeuten mehr Fang heute - aber weniger Fische für alle
          morgen.
        </p>

        <FishingGameSimulator />

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Was ist passiert?</strong> Wahrscheinlich haben Sie erlebt, was Millionen von Menschen vor Ihnen
          erlebt haben: Selbst mit den besten Absichten ist es schwer, nachhaltig zu handeln, wenn andere es nicht tun.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Die historische Realität: 40 Jahre Überfischung
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Was in unserem Spiel in 10 Wochen passiert, spielte sich vor Neufundland über 40 Jahre ab. Die moderne
          Fischerei-Industrie steigerte ihre Kapazitäten dramatisch, aber der Fischbestand hielt nicht mit.
        </p>

        <HistoricalTimeline />

        <div
          className={css({
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          })}
        >
          <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>Die Warnsignale wurden ignoriert:</h4>
          <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
            <li>
              <strong>1970er:</strong> Wissenschaftler warnen vor Überfischung
            </li>
            <li>
              <strong>1980er:</strong> &ldquo;Nur ein schlechtes Jahr&rdquo; - Politik ignoriert Daten
            </li>
            <li>
              <strong>1990er:</strong> Zu spät - der Bestand ist unter kritische Masse gefallen
            </li>
          </ul>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Warum rationale Menschen irrationale Entscheidungen treffen
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Das Kabeljau-Dilemma ist ein perfektes Beispiel für die <strong>&ldquo;Tragedy of the Commons&rdquo;</strong>.
          Jeder einzelne Fischer handelt rational aus seiner Sicht:
        </p>

        <div
          className={css({
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
          })}
        >
          <div>
            <strong>Wenn alle anderen nachhaltig fischen:</strong>
          </div>
          <div>• Du fischst nachhaltig: Alle profitieren langfristig</div>
          <div>• Du fischst mehr: Du bekommst kurzfristig mehr Gewinn</div>
          <br />
          <div>
            <strong>Wenn alle anderen überfischen:</strong>
          </div>
          <div>• Du fischst nachhaltig: Du bekommst fast nichts</div>
          <div>• Du fischst auch mehr: Wenigstens gleiche Verluste</div>
        </div>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Das Nash-Gleichgewicht:</strong> Jeder fischt zu viel, der Bestand kollabiert, alle verlieren.
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
          Was lernen wir für heute?
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Die Tragedy of Commons ist überall um uns herum:
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
            { title: "Klimawandel", desc: "Jedes Land 'fischt' CO2 aus der Atmosphäre" },
            { title: "Antibiotika", desc: "Übernutzung führt zu Resistenz für alle" },
            { title: "Internet", desc: "Bandbreiten-Überlastung bei hoher Nutzung" },
            { title: "Open Source", desc: "Nutzen ohne Beitragen schadet allen" },
          ].map((example) => (
            <div
              key={example.title}
              className={css({
                padding: "16px",
                backgroundColor: "#f8fafc",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
              })}
            >
              <h4 className={css({ fontWeight: "bold", marginBottom: "8px" })}>{example.title}</h4>
              <p className={css({ fontSize: "14px", color: "#6b7280" })}>{example.desc}</p>
            </div>
          ))}
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          Das nächste Mal, wenn Sie sehen, wie Teams in Ihrem Unternehmen Wissen horten statt teilen, oder wenn Länder
          bei Klimaverhandlungen blockieren - denken Sie an die Fischer von Neufundland.
          <strong> Die Mathematik ist dieselbe. Aber jetzt kennen Sie auch die Lösungen.</strong>
        </p>
      </section>

      <footer
        className={css({
          borderTop: "1px solid #e5e7eb",
          paddingTop: "16px",
          fontSize: "14px",
          color: "#6b7280",
        })}
      >
        <p>
          <em>
            Interessiert, wie das in der Innovation aussieht? Der nächste Post untersucht, wie Unternehmen ihre
            &ldquo;Wissens-Commons&rdquo; verwalten können.
          </em>
        </p>
      </footer>
    </article>
  );
}

// Post metadata
export const meta = {
  title: "Die Kabeljau-Katastrophe: Tragedy of Commons",
  description: "Eine interaktive Lektion über die Tragedy of Commons am Beispiel der Neufundland-Fischerei",
  publishing_date: "2025-06-27",
  tags: ["Spieltheorie", "Commons", "Nachhaltigkeit", "Geschichte", "Umwelt"],
  readTime: 10,
};
