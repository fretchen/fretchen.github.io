import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Meta information for this post
export const meta = {
  title: "Interactive Calculator Example",
  publishing_date: "2025-06-19",
  tokenID: 2,
};

// Simple calculator component
const Calculator: React.FC = () => {
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [operation, setOperation] = useState<string>("+");

  const calculate = () => {
    switch (operation) {
      case "+":
        return num1 + num2;
      case "-":
        return num1 - num2;
      case "*":
        return num1 * num2;
      case "/":
        return num2 !== 0 ? num1 / num2 : "Error: Division by zero";
      default:
        return 0;
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3>Interactive Calculator</h3>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
        <input
          type="number"
          value={num1}
          onChange={(e) => setNum1(Number(e.target.value))}
          style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ddd" }}
        >
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">×</option>
          <option value="/">/</option>
        </select>
        <input
          type="number"
          value={num2}
          onChange={(e) => setNum2(Number(e.target.value))}
          style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
        <span>=</span>
        <strong style={{ fontSize: "18px", color: "#007acc" }}>{calculate()}</strong>
      </div>
    </div>
  );
};

// Data visualization component
const DataChart: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<number[]>([10, 25, 15, 40, 30]);

  const addRandomPoint = () => {
    const newPoint = Math.floor(Math.random() * 50) + 1;
    setDataPoints([...dataPoints, newPoint]);
  };

  const clearData = () => {
    setDataPoints([]);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        margin: "20px 0",
        borderRadius: "8px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3>Interactive Data Visualization</h3>
      <div style={{ marginBottom: "15px" }}>
        <button
          onClick={addRandomPoint}
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            borderRadius: "4px",
            border: "1px solid #007acc",
            backgroundColor: "#007acc",
            color: "white",
            cursor: "pointer",
          }}
        >
          Add Random Point
        </button>
        <button
          onClick={clearData}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #dc3545",
            backgroundColor: "#dc3545",
            color: "white",
            cursor: "pointer",
          }}
        >
          Clear Data
        </button>
      </div>

      {/* Simple ASCII-style bar chart */}
      <div style={{ fontFamily: "monospace", fontSize: "14px" }}>
        {dataPoints.map((value, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "2px" }}>
            <span style={{ width: "30px", textAlign: "right", marginRight: "10px" }}>{value}:</span>
            <div
              style={{
                height: "20px",
                backgroundColor: "#007acc",
                width: `${value * 4}px`,
                borderRadius: "2px",
              }}
            ></div>
          </div>
        ))}
      </div>
      {dataPoints.length === 0 && <p style={{ color: "#666", fontStyle: "italic" }}>No data points to display</p>}
    </div>
  );
};

// Main post component using mixed Markdown + React approach
const InteractiveExample: React.FC = () => {
  // Markdown content as template literals
  const introContent = `
# Interactive Blog Post mit Markdown + React

Willkommen zu diesem **interaktiven Blog-Post**! Dies ist ein Beispiel dafür, wie TypeScript-basierte Posts 
funktionieren können, wenn man Markdown innerhalb von React-Komponenten verwendet.

## Was macht dies besonders?

- **State Management:** Komponenten können internen Zustand verwalten
- **Event Handling:** Benutzerinteraktionen werden in Echtzeit verarbeitet  
- **Dynamic Content:** Inhalte können sich basierend auf Benutzereingaben ändern
- **TypeScript Support:** Vollständige Typisierung und Entwicklerunterstützung
- **Markdown Integration:** Einfache Formatierung mit \`#\`, \`**bold**\`, \`*italic*\` etc.

> **Hinweis:** Dieser Text wird mit react-markdown gerendert, während die interaktiven Komponenten
> darunter native React-Komponenten sind!
  `;

  const middleContent = `
## Dynamische Datenvisualisierung

Hier ist ein einfaches Beispiel für **dynamische Datenvisualisierung**. Sie können neue Datenpunkte 
hinzufügen oder alle Daten löschen:

### Funktionen der Visualisierung:
1. **Hinzufügen** von zufälligen Datenpunkten
2. **Löschen** aller Daten
3. **Echtzeit-Updates** der Darstellung
  `;

  const conclusionContent = `
## Weitere Möglichkeiten

Mit diesem **Hybrid-Ansatz** können Sie beliebig komplexe interaktive Inhalte erstellen:

### Frontend-Entwicklung
- Formulare mit Validierung
- Interaktive Diagramme und Grafiken
- Spiele und Simulationen

### Backend-Integration  
- API-Aufrufe und Datenintegration
- Komplexe Benutzeroberflächen
- Real-time Updates mit WebSockets

### Styling & UX
- \`Styled Components\` Integration
- Responsive Design
- Accessibility Features

---

**Fazit:** Die Möglichkeiten sind endlos, und Sie haben die volle Macht von **React**, **TypeScript** 
und **Markdown** zur Verfügung!

\`\`\`typescript
// Beispiel: Einfache Syntax-Highlighting funktioniert auch!
const example = {
  markdown: true,
  react: true,
  typescript: true
};
\`\`\`
  `;

  return (
    <article>
      {/* Intro section with Markdown */}
      <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {introContent}
      </Markdown>

      {/* Interactive Calculator Component */}
      <Calculator />

      {/* Middle section with Markdown */}
      <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {middleContent}
      </Markdown>

      {/* Interactive Data Visualization Component */}
      <DataChart />

      {/* Conclusion section with Markdown */}
      <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {conclusionContent}
      </Markdown>
    </article>
  );
};

export default InteractiveExample;
