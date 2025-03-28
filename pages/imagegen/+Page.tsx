import React, { useState } from "react";

function ImageGenerator({ onGenerate }: { onGenerate: (imageBase64?: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // URL of the API for image generation
      const apiUrl = "https://mypersonalcloudmaqsyplo-ionosimagegen.functions.fnc.fr-par.scw.cloud";

      // GET request with prompt as parameter
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      // Extract the Base64 image from the response
      const imageBase64 = data.b64_image;
      console.log("Image Base64 (first 50 chars):", imageBase64?.substring(0, 50));

      // Pass only the image
      onGenerate(imageBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error during API call:", err);
    } finally {
      setIsLoading(false);
    }
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
          disabled={isLoading || !prompt.trim()}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
            width: "300px",
            opacity: isLoading || !prompt.trim() ? 0.7 : 1,
          }}
        >
          {isLoading ? "Generating..." : "Generate image"}
        </button>
        {error && <p style={{ color: "red", margin: "10px 0" }}>{error}</p>}
      </div>
    </div>
  );
}

interface ImageDisplayProps {
  imageBase64?: string;
}

function ImageDisplay({ imageBase64 }: ImageDisplayProps) {
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
      {imageBase64 ? (
        <img
          src={`data:image/jpeg;base64,${imageBase64}`}
          alt="Generated"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      ) : (
        <p style={{ color: "#666" }}>Your image will appear here</p>
      )}
    </div>
  );
}

export default function Page() {
  const [generatedImage, setGeneratedImage] = useState<string>();

  const handleGenerate = (imageBase64?: string) => {
    console.log("Received image base64:", imageBase64 ? "yes (length: " + imageBase64.length + ")" : "no");
    setGeneratedImage(imageBase64);
  };

  return (
    <>
      <h1>Image Generator</h1>
      <p>On this page I have started to implement an image generator. Anything different to your standard setup ?</p>
      <p>
        It is a simple React component that sends a prompt to an API and displays the generated image. And it is fully
        privacy conserving.
      </p>
      <ImageGenerator onGenerate={handleGenerate} />
      <ImageDisplay imageBase64={generatedImage} />
    </>
  );
}
