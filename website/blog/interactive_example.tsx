import React, { useState } from "react";

// Meta information for this post
export const meta = {
  title: "Interactive Calculator Example",
  publishing_date: "2025-06-19",
  tokenID: 100,
};

// Simple calculator component
const Calculator: React.FC = () => {
  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [operation, setOperation] = useState<string>('+');
  
  const calculate = () => {
    switch (operation) {
      case '+': return num1 + num2;
      case '-': return num1 - num2;
      case '*': return num1 * num2;
      case '/': return num2 !== 0 ? num1 / num2 : 'Error: Division by zero';
      default: return 0;
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '20px', 
      margin: '20px 0', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Interactive Calculator</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <input 
          type="number" 
          value={num1} 
          onChange={(e) => setNum1(Number(e.target.value))}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <select 
          value={operation} 
          onChange={(e) => setOperation(e.target.value)}
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
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
          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <span>=</span>
        <strong style={{ fontSize: '18px', color: '#007acc' }}>{calculate()}</strong>
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
    <div style={{ 
      border: '1px solid #ccc', 
      padding: '20px', 
      margin: '20px 0',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Interactive Data Visualization</h3>
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={addRandomPoint}
          style={{ 
            padding: '8px 16px', 
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #007acc',
            backgroundColor: '#007acc',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Add Random Point
        </button>
        <button 
          onClick={clearData}
          style={{ 
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #dc3545',
            backgroundColor: '#dc3545',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Clear Data
        </button>
      </div>
      
      {/* Simple ASCII-style bar chart */}
      <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
        {dataPoints.map((value, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ width: '30px', textAlign: 'right', marginRight: '10px' }}>
              {value}:
            </span>
            <div 
              style={{ 
                height: '20px', 
                backgroundColor: '#007acc', 
                width: `${value * 4}px`,
                borderRadius: '2px'
              }}
            ></div>
          </div>
        ))}
      </div>
      {dataPoints.length === 0 && (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No data points to display</p>
      )}
    </div>
  );
};

// Main post component
const InteractiveExample: React.FC = () => {
  return (
    <article>
      <h1>Interactive Blog Post Example</h1>
      
      <p>
        Willkommen zu diesem interaktiven Blog-Post! Dies ist ein Beispiel dafür, wie TypeScript-basierte 
        Posts funktionieren können. Im Gegensatz zu statischen Markdown-Posts können wir hier vollständig 
        interaktive React-Komponenten einbauen.
      </p>

      <h2>Was macht dies besonders?</h2>
      <ul>
        <li><strong>State Management:</strong> Komponenten können internen Zustand verwalten</li>
        <li><strong>Event Handling:</strong> Benutzerinteraktionen werden in Echtzeit verarbeitet</li>
        <li><strong>Dynamic Content:</strong> Inhalte können sich basierend auf Benutzereingaben ändern</li>
        <li><strong>TypeScript Support:</strong> Vollständige Typisierung und Entwicklerunterstützung</li>
      </ul>

      <Calculator />

      <h2>Dynamische Datenvisualisierung</h2>
      <p>
        Hier ist ein einfaches Beispiel für dynamische Datenvisualisierung. Sie können neue Datenpunkte 
        hinzufügen oder alle Daten löschen:
      </p>

      <DataChart />

      <h2>Weitere Möglichkeiten</h2>
      <p>
        Mit diesem Ansatz können Sie beliebig komplexe interaktive Inhalte erstellen:
      </p>
      <ul>
        <li>Formulare mit Validierung</li>
        <li>Interaktive Diagramme und Grafiken</li>
        <li>Spiele und Simulationen</li>
        <li>API-Aufrufe und Datenintegration</li>
        <li>Komplexe Benutzeroberflächen</li>
      </ul>

      <p>
        Die Möglichkeiten sind endlos, und Sie haben die volle Macht von React und TypeScript zur Verfügung!
      </p>
    </article>
  );
};

export default InteractiveExample;
