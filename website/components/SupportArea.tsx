import * as React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { parseEther } from "viem";
import { type BaseError, useReadContract } from "wagmi";
import { getChain, getSupportContractConfig } from "../utils/getChain";
import { supportArea } from "../layouts/styles";

/**
 * SupportArea Component
 *
 * Allows users to support content by donating a small amount of ETH.
 * Displays the current support count for the URL.
 */
export default function SupportArea() {
  const pageContext = usePageContext();
  const currentUrl = pageContext.urlPathname;

  // States
  const [fullUrl, setFullUrl] = React.useState(currentUrl);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);

  // Wagmi hooks
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const donationAmount = parseEther("0.0002");
  const { writeContract, isPending, data: hash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Set full URL after hydration
  React.useEffect(() => {
    const rawUrl = window.location.origin + currentUrl;
    const cleanUrl = rawUrl.replace(/\/+$/, "");
    setFullUrl(cleanUrl);
  }, [currentUrl]);

  // Chain and contract configuration
  const chain = getChain();
  const supportContractConfig = getSupportContractConfig();
  const isCorrectNetwork = chainId === chain.id;

  // Read support data
  const {
    data,
    error: readError,
    isPending: isReadPending,
    refetch,
  } = useReadContract({
    ...supportContractConfig,
    functionName: "getLikesForUrl",
    args: [fullUrl],
    chainId: chain.id,
  });

  // Handle support action
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

  // Update state after transaction
  React.useEffect(() => {
    if (isSuccess) {
      setIsLoading(false);
      setErrorMessage(null);
      setTimeout(() => {
        refetch();
      }, 2000);
    }
    if (writeError) {
      setIsLoading(false);
      setErrorMessage(writeError?.message || "Transaktion fehlgeschlagen");
    }
  }, [isSuccess, writeError, refetch]);

  // Warning message logic
  const warningMessage =
    errorMessage || (!isCorrectNetwork && isConnected ? `Bitte wechsle zum ${chain.name} Netzwerk` : null);

  // PandaCSS styles
  const styles = supportArea;

  // Render ReadSupport based on status
  const renderReadSupport = () => {
    if (isReadPending) return <div className={styles.readDisplay}>Loading...</div>;
    if (readError)
      return (
        <div className={styles.readDisplay}>Error: {(readError as BaseError).shortMessage || readError.message}</div>
      );
    return <div className={styles.readDisplay}>{data?.toString() || "0"}</div>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        {/* WriteSupport Button */}
        <div className={styles.tooltipContainer}>
          <button
            onClick={handleSupport}
            disabled={!isConnected || isLoading || isPending || isConfirming}
            className={styles.writeButton}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {isLoading || isPending ? "Processing..." : isSuccess ? "Supported!" : "Support"}
          </button>

          {/* Tooltip */}
          {showTooltip && warningMessage && <div className={styles.tooltip}>{warningMessage}</div>}
        </div>

        {/* ReadSupport */}
        {renderReadSupport()}
      </div>
    </div>
  );
}
