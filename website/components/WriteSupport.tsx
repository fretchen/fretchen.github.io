import * as React from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { getChain, getSupportContractConfig } from "../utils/getChain";

export default function WriteSupport({ url }: { url: string }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const donationAmount = parseEther("0.0002");
  const { writeContract, isPending, data: hash, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  // get the chain
  const chain = getChain();
  const supportContractConfig = getSupportContractConfig();

  // Prüfen, ob das richtige Netzwerk verwendet wird
  const isCorrectNetwork = chainId === chain.id;

  const handleSupport = async () => {
    setErrorMessage(null);
    if (!url) {
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
      args: [url],
      value: donationAmount,
    });
  };

  React.useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      setErrorMessage(null);
    }
    if (error) {
      setIsLoading(false);
      setErrorMessage(error?.message || "Transaktion fehlgeschlagen");
    }
  }, [isSuccess, error]);

  // Bestimme die Warnung, die angezeigt werden soll (wenn vorhanden)
  const warningMessage =
    errorMessage || (!isCorrectNetwork && isConnected ? `Bitte wechsle zum ${chain.name} Netzwerk` : null);

  // Bestimme die Farbe des Tooltips
  const tooltipColor = errorMessage ? "red" : "orange";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={handleSupport}
        disabled={!isConnected || isLoading || isPending || isConfirming}
        style={{
          padding: "8px 16px",
          backgroundColor: isLoading ? "#cccccc" : "#4a4a4a",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
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
            // Kleines Dreieck für den Tooltip-Pfeil
            "&::after": {
              content: "''",
              position: "absolute",
              top: "100%",
              left: "50%",
              marginLeft: "-5px",
              borderWidth: "5px",
              borderStyle: "solid",
              borderColor: `${tooltipColor} transparent transparent transparent`,
            },
          }}
        >
          {warningMessage}
        </div>
      )}
    </div>
  );
}
