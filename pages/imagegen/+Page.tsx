import React, { useState } from "react";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    console.log("Generating image for:", prompt);
    // Hier später die Bildgenerierung implementieren
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexDirection: "column" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your picture..."
          style={{
            padding: "8px",
            width: "300px",
            height: "150px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "vertical",
          }}
        />
        <button
          onClick={handleGenerate}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            width: "300px",
          }}
        >
          Generate image
        </button>
      </div>
    </div>
  );
}

interface ImageDisplayProps {
  imageUrl?: string;
}
export function ImageDisplay({ imageUrl }: ImageDisplayProps) {
  return (
    <div
      style={{
        width: "300px",
        height: "300px",
        border: "2px dashed #ccc",
        borderRadius: "4px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "20px",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Generated" style={{ maxWidth: "100%", maxHeight: "100%" }} />
      ) : (
        <p style={{ color: "#666" }}>Ihr Bild wird hier erscheinen</p>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <p> This is the place, where we will generate images for you.</p>
      <ImageGenerator />
      <ImageDisplay />
    </>
  );
}
