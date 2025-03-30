import React, { useState, useEffect } from "react";

export default function Page() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funktion zum Abrufen der JSON-Daten
  const fetchJsonData = async (apiUrl: string) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      console.log("API Response:", jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten");
      console.error("Fehler beim API-Aufruf:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>JSON Data Viewer</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          placeholder="API URL eingeben"
        />
        
        <button
          onClick={() => fetchJsonData(url)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Daten abrufen
        </button>
      </div>
      
      {isLoading && <p>Lade Daten...</p>}
      
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      {data && (
        <div>
          <h2>JSON Response:</h2>
          <pre
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "4px",
              overflowX: "auto"
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
