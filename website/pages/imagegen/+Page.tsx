import React, { useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

import { getChain, getGenAiNFTContractConfig } from "../../utils/getChain";

function ImageGenerator({ onGenerate }: { onGenerate: (imageBase64?: string, tokenId?: bigint) => void }) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<"idle" | "minting" | "generating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentTokenId, setCurrentTokenId] = useState<bigint | undefined>(undefined);

  // Blockchain-Interaktion
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Lese Mint-Preis vom Contract
  const { data: mintPrice } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "mintPrice",
    args: [],
    chainId: chain.id,
  });
  console.log("2. Mintpreis:", mintPrice ? mintPrice.toString() : "Lade...");
  // transform the mintPrice to eth
  const mintPriceEth = mintPrice ? parseFloat(mintPrice.toString()) / 1e18 : undefined;
  console.log("3. Mintpreis in ETH:", mintPriceEth ? mintPriceEth.toString() : "Lade...");

  // Contract-Schreiboperationen
  const { writeContractAsync, isPending: isWritePending } = useWriteContract();

  // Warten auf Transaktionsbestätigung
  const { data: txReceipt, isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: mintingStatus === "minting" ? undefined : undefined,
  });

  const handleMintAndGenerate = async () => {
    // Prüfe Bedingungen einzeln mit präzisen Fehlermeldungen
    if (!isConnected || !address) {
      setError("Bitte verbinde deine Wallet zuerst");
      return;
    }

    if (!prompt.trim()) {
      setError("Bitte gib einen Prompt ein");
      return;
    }

    if (!mintPrice) {
      setError("Mint-Preis konnte nicht vom Contract geladen werden");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMintingStatus("minting");

    try {
      // Wir beginnen mit dem Minting - mit einem temporären URI
      const tempUri = `ipfs://tempURI/${Date.now()}`;

      // Führe safeMint mit temporärer URI aus
      const txHash = await writeContractAsync({
        ...genAiNFTContractConfig,
        functionName: "safeMint",
        args: [tempUri],
        value: mintPrice,
        chainId: chain.id,
      });

      console.log("Minting Transaktion gesendet:", txHash);

      // Warte auf Bestätigung und extrahiere Token ID
      const receipt = await waitForTransaction(txHash);

      // Token ID aus dem Transfer-Event extrahieren
      const transferEvent = receipt?.logs.find(
        (log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      );

      if (!transferEvent || transferEvent.topics.length < 4) {
        throw new Error("Konnte Token ID nicht aus Transaktion extrahieren");
      }

      const tokenIdHex = transferEvent.topics[3];
      const tokenId = BigInt(tokenIdHex);
      console.log("Gemintete Token ID:", tokenId);
      setCurrentTokenId(tokenId);

      // Jetzt mit der Bildgenerierung fortfahren
      setMintingStatus("generating");

      // URL des API-Services für die Bildgenerierung
      //const apiUrl = "http://localhost:8080";
      const apiUrl = "https://mypersonaljscloudivnad9dy-readnft.functions.fnc.fr-par.scw.cloud";

      // GET-Anfrage mit Prompt und Token ID als Parameter
      const response = await fetch(`${apiUrl}?prompt=${encodeURIComponent(prompt)}&tokenId=${tokenId}`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Bildgenerierung abgeschlossen");

      // Extrahiere die Bild-URL aus der Antwort
      const imageUrl = data.image_url;

      // Hole das Bild als JSON-Objekt
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Fehler beim Abrufen des Bildes: ${imageResponse.status} ${imageResponse.statusText}`);
      }

      const imageData = await imageResponse.json();
      // Extrahiere das Base64-Bild aus der Antwort
      const imageBase64 = imageData.b64_image;

      // Übergebe Bild und Token ID an die übergeordnete Komponente
      onGenerate(imageBase64, tokenId);

      setMintingStatus("idle");
    } catch (err) {
      console.error("Fehler:", err);
      setError(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten");
      setMintingStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Hilfsfunktion zum Warten auf Transaktionsbestätigung
  const waitForTransaction = async (hash: `0x${string}`) => {
    return new Promise<any>((resolve, reject) => {
      const checkReceipt = async () => {
        try {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [hash],
          });

          if (receipt) {
            resolve(receipt);
          } else {
            setTimeout(checkReceipt, 2000); // Alle 2 Sekunden prüfen
          }
        } catch (error) {
          reject(error);
        }
      };

      checkReceipt();
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexDirection: "column" }}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Beschreibe dein Bild..."
          disabled={isLoading || mintingStatus !== "idle"}
          style={{
            padding: "8px",
            width: "300px",
            height: "150px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "vertical",
            opacity: isLoading || mintingStatus !== "idle" ? 0.7 : 1,
          }}
        />
        <button
          onClick={handleMintAndGenerate}
          disabled={isLoading || !prompt.trim() || !isConnected || !address}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading || !prompt.trim() || !isConnected || !address ? "not-allowed" : "pointer",
            width: "300px",
            opacity: isLoading || !prompt.trim() || !isConnected || !address ? 0.7 : 1,
          }}
        >
          {isLoading
            ? mintingStatus === "minting"
              ? "NFT wird geminted..."
              : "Bild wird generiert..."
            : "Mint & Generate"}
        </button>

        {!isConnected && <p style={{ color: "#666" }}>Verbinde deine Wallet, um ein NFT zu erzeugen</p>}

        {error && <p style={{ color: "red", margin: "10px 0" }}>{error}</p>}

        {currentTokenId && mintingStatus === "idle" && (
          <p style={{ color: "green" }}>NFT erfolgreich erstellt! Token ID: {currentTokenId.toString()}</p>
        )}
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
        <p style={{ color: "#666" }}>Dein Bild wird hier erscheinen</p>
      )}
    </div>
  );
}

export default function Page() {
  // Chain und Contract Konfiguration
  const chainId = useChainId();
  const chain = getChain();
  const genAiNFTContractConfig = getGenAiNFTContractConfig();

  // Mintpreis abrufen
  //const { data: mintPrice } = useReadContract({
  //  ...genAiNFTContractConfig,
  //  functionName: "mintPrice",
  //  args: [],
  //  chainId: chain.id,
  // });

  // console.log("Mintpreis:", mintPrice ? mintPrice.toString() : "Lade...");
  const [generatedImage, setGeneratedImage] = useState<string>();
  const [tokenId, setTokenId] = useState<bigint>();

  const handleGenerate = (imageBase64?: string, mintedTokenId?: bigint) => {
    setGeneratedImage(imageBase64);
    if (mintedTokenId) {
      setTokenId(mintedTokenId);
    }
  };

  return (
    <>
      <h1>KI-Bild NFT Generator</h1>
      <p>Erstelle einzigartige KI-generierte Kunst und besitze sie als NFT. Der Prozess:</p>
      <ol>
        <li>Gib einen Prompt ein</li>
        <li>Klicke auf "Mint & Generate"</li>
        <li>Zuerst wird ein NFT erstellt, dann das Bild generiert</li>
      </ol>

      <ImageGenerator onGenerate={handleGenerate} />
      <ImageDisplay imageBase64={generatedImage} />

      {tokenId && (
        <div style={{ marginTop: "20px", padding: "15px", border: "1px solid #28a745", borderRadius: "4px" }}>
          <h3>🎉 NFT erfolgreich erstellt!</h3>
          <p>
            <strong>Token ID:</strong> {tokenId.toString()}
          </p>
          <p>
            <a
              href={`https://optimistic.etherscan.io/token/${genAiNFTContractConfig.address}?a=${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0066cc", textDecoration: "none" }}
            >
              {" "}
              Auf Etherscan anzeigen →
            </a>
          </p>
        </div>
      )}
    </>
  );
}
