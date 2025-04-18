import * as React from "react";

import { usePageContext } from "vike-react/usePageContext";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";

import { type BaseError, useReadContract } from "wagmi";
import { getChain, getSupportContractConfig } from "../utils/getChain";

export default function SupportArea() {
  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;

  // Initialer State ist nur der Pfad (wird auf Server und Client identisch sein)
  const [fullUrl, setFullUrl] = React.useState(currentUrl);

  // WriteSupport Zustände
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  
  // WriteSupport Hooks
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const donationAmount = parseEther("0.0002");
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Nach der Hydration den vollständigen URL setzen und trailing slashes entfernen
  React.useEffect(() => {
    const rawUrl = window.location.origin + currentUrl;
    // Entferne nachstehenden Schrägstrich, falls vorhanden
    const cleanUrl = rawUrl.replace(/\/+$/, "");
    setFullUrl(cleanUrl);
  }, [currentUrl]);

  // Chain und Contract Konfiguration
  const chain = getChain();
  const supportContractConfig = getSupportContractConfig();
  
  // Netzwerk-Check
  const isCorrectNetwork = chainId === chain.id;

  // WriteSupport Handler
  const handleSupport = async () => {
    setErrorMessage(null);
    if (!fullUrl) {
      setErrorMessage("URL ist erforderlich");
      return;
    }

    if (!isCorrectNetwork) {
      setErrorMessage(`Bitte wechsle zum ${chain.name} Netzwerk`);
      return;
    }

    setIsLoading(true);

    writeContract({
      ...supportContractConfig,
      functionName: "donate",
      args: [fullUrl],
      value: donationAmount,
    });
  };

  // WriteSupport Effekt für Status-Updates
  React.useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      setErrorMessage(null);
    }
    if (writeError) {
      setIsLoading(false);
      setErrorMessage(writeError?.message || "Transaktion fehlgeschlagen");
    }
  }, [isSuccess, writeError]);

  // WriteSupport Warnungs-Logik
  const warningMessage =
    errorMessage || (!isCorrectNetwork && isConnected ? `Bitte wechsle zum ${chain.name} Netzwerk` : null);
  const tooltipColor = errorMessage ? "red" : "orange";

  // READ SUPPORT LOGIK
  const { data, error: readError, isPending: isReadPending } = useReadContract({
    ...supportContractConfig,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: chain.id,
  });

  // Gemeinsame Basis-Stile
  const baseButtonStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#3a5a8c",
    color: "white",
    fontWeight: "bold",
    height: "36px", // Feste Höhe für beide Elemente
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  };

  // Stile definieren
  const writeSupportStyle: React.CSSProperties = {
    ...baseButtonStyle,
    borderRadius: "4px 0 0 4px",
    borderRight: "1px solid white", // Behält nur die weiße Trennlinie
    borderLeft: "none", // Entfernt den linken Rand
    borderTop: "none", // Entfernt den oberen Rand
    borderBottom: "none", // Entfernt den unteren Rand
    cursor: isLoading ? "not-allowed" : "pointer",
    backgroundColor: isLoading ? "#5a7aac" : "#3a5a8c", // Helleres Blau für Loading-Zustand
  };

  const readSupportStyle: React.CSSProperties = {
    ...baseButtonStyle,
    borderRadius: "0 4px 4px 0",
    border: "none", // Entfernt alle Ränder
    minWidth: "10px", // Minimale Breite für gleichmäßiges Aussehen
  };

  // Render-Komponente für ReadSupport basierend auf Status
  const renderReadSupport = () => {
    if (isReadPending) return <div style={readSupportStyle}>Loading...</div>;
    if (readError) return <div style={readSupportStyle}>Error: {(readError as BaseError).shortMessage || readError.message}</div>;
    return <div style={readSupportStyle}>{data?.toString() || "0"}</div>;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        margin: "16px 0",
      }}
    >
      <div style={{ display: "flex" }}>
        {/* WriteSupport-Button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={handleSupport}
            disabled={!isConnected || isLoading || isPending || isConfirming}
            style={writeSupportStyle}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {isLoading || isPending ? "Processing..." : isSuccess ? "Supported!" : "Support"}
          </button>

          {/* Tooltip */}
          {showTooltip && warningMessage && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: "8px",
                padding: "8px",
                backgroundColor: "white",
                border: `1px solid ${tooltipColor}`,
                borderRadius: "4px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                color: tooltipColor,
                width: "max-content",
                maxWidth: "250px",
                zIndex: 100,
              }}
            >
              {warningMessage}
            </div>
          )}
        </div>
        
        {/* ReadSupport direkt hier */}
        {renderReadSupport()}
      </div>
    </div>
  );
}
