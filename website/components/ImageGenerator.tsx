import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useChainId, useSwitchChain, useConnect } from "wagmi";
import { getChain, genAiNFTContractConfig } from "../utils/getChain";
import { css } from "../styled-system/css";
import { TransactionReceipt, MintingStatus } from "../types/blockchain";
import { ImageGeneratorProps } from "../types/components";
import * as styles from "../layouts/styles";
import InfoIcon from "./InfoIcon";
import { LocaleText } from "./LocaleText";
import { useLocale } from "../hooks/useLocale";

const defaultImageUrl = "https://mypersonaljscloudivnad9dy-readnftv2.functions.fnc.fr-par.scw.cloud";

// Helper function to wait for transaction confirmation
export const waitForTransaction = async (hash: `0x${string}`): Promise<TransactionReceipt> => {
  return new Promise<TransactionReceipt>((resolve, reject) => {
    const checkReceipt = async () => {
      try {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [hash],
        });
        if (receipt) {
          resolve(receipt as TransactionReceipt);
        } else {
          setTimeout(checkReceipt, 2000);
        }
      } catch (error) {
        reject(error);
      }
    };
    checkReceipt();
  });
};

export function ImageGenerator({
  apiUrl = import.meta.env.PUBLIC_ENV___IMAGE_URL || defaultImageUrl,
  onSuccess,
  onError,
}: ImageGeneratorProps) {
  // Verwende die stabile genAiNFTContractConfig Konstante
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>();
  const [tokenId, setTokenId] = useState<bigint>();

  // Preview area state
  const [currentPreviewImage, setCurrentPreviewImage] = useState<string>();
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Reference image state
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(null);

  // Preview area state machine
  type PreviewState = "empty" | "reference" | "generated" | "editing";
  const [previewState, setPreviewState] = useState<PreviewState>("empty");

  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1792x1024">("1024x1024");
  const [isListed, setIsListed] = useState(false); // Default: not publicly listed
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<MintingStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Blockchain interaction
  const { address, isConnected } = useAccount();
  const chain = getChain();
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { connectors, connect } = useConnect();

  // Read mint price from contract
  const { data: mintPrice } = useReadContract({
    ...genAiNFTContractConfig,
    functionName: "mintPrice",
    args: [],
    ...(chain?.id && { chainId: chain.id }),
  });

  // Contract write operations
  const { writeContractAsync } = useWriteContract();

  // Helper function to wait for chain switch completion
  const waitForChainSwitch = async (targetChainId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const checkChain = () => {
        if (currentChainId === targetChainId) {
          resolve();
        } else {
          setTimeout(checkChain, 100); // Check every 100ms
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error("Chain switch timeout - please try again"));
      }, 10000);

      checkChain();
    });
  };

  // Handle wallet connection
  const handleWalletConnection = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] }); // Use first available connector
    }
  };

  // Helper functions for button state
  // Localized button texts
  const connectWalletButtonText = useLocale({ label: "imagegen.connectWalletButton" });
  const connectWalletTitleText = useLocale({ label: "imagegen.connectWalletTitle" });
  const enterPromptText = useLocale({ label: "imagegen.enterPrompt" });
  const switchingNetworkText = useLocale({ label: "imagegen.switchingNetwork" });
  const creatingText = useLocale({ label: "imagegen.creating" });
  const generatingText = useLocale({ label: "imagegen.generating" });
  const createArtworkText = useLocale({ label: "imagegen.createArtwork" });
  const promptPlaceholderText = useLocale({ label: "imagegen.promptPlaceholder" });
  const editImageText = "Edit the image now";

  const getButtonState = () => {
    if (isSwitchingChain) return "switching";
    if (isLoading) return "loading";
    if (!isConnected) return "connect";
    if (!prompt.trim()) return "needsPrompt";
    return "ready";
  };

  const getButtonText = (state: string) => {
    switch (state) {
      case "switching":
        return switchingNetworkText;
      case "loading":
        return mintingStatus === "minting" ? creatingText : generatingText;
      case "connect":
        return connectWalletButtonText;
      case "needsPrompt":
        return enterPromptText;
      case "ready":
        return previewState !== "empty" ? editImageText : createArtworkText;
      default:
        return previewState !== "empty" ? editImageText : createArtworkText;
    }
  };

  const buttonState = getButtonState();

  // Button Components
  const ConnectWalletButton = () => (
    <button
      onClick={handleWalletConnection}
      className={`${styles.primaryButton}`}
      title={connectWalletTitleText}
      aria-describedby="create-artwork-info"
    >
      🔗 {connectWalletButtonText}
    </button>
  );

  const CreateArtworkButton = () => {
    const isDisabled = buttonState === "needsPrompt";
    const isLoadingState = buttonState === "loading" || buttonState === "switching";

    return (
      <button
        onClick={handleMintAndGenerate}
        disabled={isDisabled}
        className={`${styles.primaryButton} ${isDisabled ? styles.primaryButtonDisabled : ""}`}
        title={useLocale({ label: "imagegen.mintingInfo" })}
        aria-describedby="create-artwork-info"
      >
        {isLoadingState ? (
          <>
            <div className={styles.spinner}></div>
            {getButtonText(buttonState)}
          </>
        ) : (
          <>
            🎨 {getButtonText(buttonState)}
            <InfoIcon size="xs" className={css({ ml: "1", opacity: "0.7" })} />
          </>
        )}
      </button>
    );
  };

  const handleMintAndGenerate = async () => {
    if (!isConnected || !address) {
      const errorMsg = "Please connect your account first";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Check if connected to the correct chain
    const expectedChainId = chain?.id;
    if (expectedChainId && currentChainId !== expectedChainId) {
      try {
        setError("Switching to Optimism network...");
        await switchChain({ chainId: expectedChainId });

        // Wait for the chain switch to complete using polling
        await waitForChainSwitch(expectedChainId);

        setError(null);
      } catch (switchError) {
        console.error("Failed to switch chain:", switchError);
        const errorMsg =
          switchError instanceof Error ? switchError.message : "Please switch to Optimism network to create artworks";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }
    }

    if (!prompt.trim()) {
      const errorMsg = "Please enter a prompt";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    if (!mintPrice) {
      const errorMsg = "Could not load creation fee from system";
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setMintingStatus("minting");

    try {
      // Start minting with empty URI - backend will update it with real metadata
      const tempUri = "";
      const txHash = await writeContractAsync({
        ...genAiNFTContractConfig,
        functionName: "safeMint",
        args: [tempUri, isListed], // Use the new safeMint(uri, isListed) function
        value: mintPrice as bigint,
        ...(chain?.id && { chainId: chain.id }),
      });

      console.log("Minting transaction sent:", txHash);
      const receipt = await waitForTransaction(txHash);

      // Extract Token ID from transfer event
      const transferEvent = receipt?.logs.find(
        (log) => log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      );

      if (!transferEvent || transferEvent.topics.length < 4) {
        throw new Error("Could not extract artwork ID from transaction");
      }

      const tokenIdHex = transferEvent.topics[3];
      const newTokenId = BigInt(tokenIdHex);
      console.log("Created artwork ID:", newTokenId);
      setTokenId(newTokenId);

      // Proceed with image generation
      setMintingStatus("generating");

      // Determine mode and prepare request body
      const isEditMode = referenceImage !== null;
      const mode = isEditMode ? "edit" : "generate";

      // Prepare request body
      const requestBody = {
        prompt,
        tokenId: newTokenId.toString(),
        size,
        mode,
      };

      // If in edit mode, convert reference image to base64
      if (isEditMode && referenceImage) {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(referenceImage);
        });
        // Remove the data:image/jpeg;base64, prefix to get just the base64 data
        const base64Data = base64Image.split(",")[1];
        requestBody.referenceImage = base64Data;
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Image generation completed", data);
      const imageUrl = data.image_url;
      setGeneratedImageUrl(imageUrl);
      setCurrentPreviewImage(imageUrl); // Set preview image
      setPreviewState("generated"); // Transition to generated state
      setMintingStatus("idle");

      // Erstelle Metadaten-Objekt aus der API-Antwort
      const metadata = {
        name: `AI Generated Artwork #${newTokenId}`,
        description: `AI generated artwork based on the prompt: "${prompt}"`,
        image: imageUrl,
        external_url: data.metadata_url || "",
        attributes: [
          {
            trait_type: "Prompt",
            value: prompt,
          },
          {
            trait_type: "Generation Method",
            value: "AI Generated",
          },
        ],
      };

      // Erfolgreich - rufe Callback auf mit erweiterten Daten
      onSuccess?.(newTokenId, imageUrl, metadata);

      // Reset form für nächste Erstellung (but keep preview visible)
      setTimeout(() => {
        if (!isEditingMode) {
          setPrompt("");
          setSize("1024x1024");
        }
        setGeneratedImageUrl(undefined);
        setTokenId(undefined);
        setError(null);
        // Don't clear currentPreviewImage or previewState - let it persist for editing
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMsg);
      setMintingStatus("error");
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  const mintingInfoLabel = useLocale({ label: "imagegen.mintingInfo" });

  // File handling logic
  const validateImageFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, WebP, or GIF)");
      return false;
    }

    if (file.size > maxSize) {
      setError("Image file size must be less than 10MB");
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateImageFile(file)) return;

    setReferenceImage(file);
    setError(null);

    // Generate preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferencePreviewUrl(e.target?.result as string);
      setPreviewState("reference");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    setReferencePreviewUrl(null);
    setPreviewState("empty");

    // Clear the file input so it can accept the same file again
    const fileInput = document.getElementById("reference-image-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className={styles.imageGen.compactLayout}>
      <div className={styles.imageGen.compactContainer}>
        <div className={styles.imageGen.compactHeader}>
          <h3 className={styles.imageGen.compactTitle}>
            🎨
            <LocaleText label="imagegen.title" />
          </h3>
        </div>

        <div className={styles.imageGen.compactForm}>
          {/* Unified Preview/Upload Area */}
          <div
            className={css({
              mb: "4",
              p: "6",
              border: "2px dashed",
              borderColor: previewState === "empty" ? "gray.300" : "blue.400",
              borderRadius: "lg",
              bg: previewState === "empty" ? "gray.50" : "blue.50",
              position: "relative",
              transition: "all 0.2s ease",
              cursor: previewState === "empty" ? "pointer" : "default",
              _hover: {
                borderColor: previewState === "empty" ? "blue.400" : undefined,
                bg: previewState === "empty" ? "blue.50" : undefined,
              },
            })}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onClick={() => {
              if (previewState === "empty") {
                document.getElementById("reference-image-input")?.click();
              }
            }}
          >
            {/* Hidden file input */}
            <input
              id="reference-image-input"
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className={css({
                position: "absolute",
                opacity: 0,
                width: 0,
                height: 0,
                pointerEvents: "none",
              })}
            />

            {previewState === "empty" && (
              <div
                className={css({
                  textAlign: "center",
                  py: "8",
                })}
              >
                <div
                  className={css({
                    fontSize: "3xl",
                    mb: "2",
                  })}
                >
                  📸
                </div>
                <h4
                  className={css({
                    fontSize: "lg",
                    fontWeight: "semibold",
                    color: "gray.700",
                    mb: "2",
                  })}
                >
                  Upload Reference Image (Optional)
                </h4>
                <p
                  className={css({
                    fontSize: "sm",
                    color: "gray.600",
                    mb: "4",
                  })}
                >
                  Drag & drop an image here, or click to browse
                </p>
                <p
                  className={css({
                    fontSize: "xs",
                    color: "gray.500",
                  })}
                >
                  Supports JPEG, PNG, WebP, GIF • Max 10MB
                </p>
              </div>
            )}

            {previewState === "reference" && referencePreviewUrl && (
              <div>
                <div
                  className={css({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: "3",
                  })}
                >
                  <h4
                    className={css({
                      fontSize: "sm",
                      fontWeight: "semibold",
                      color: "gray.700",
                      m: 0,
                    })}
                  >
                    📸 Reference Image
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearReferenceImage();
                    }}
                    className={css({
                      px: "2",
                      py: "1",
                      fontSize: "xs",
                      bg: "red.500",
                      color: "white",
                      border: "none",
                      borderRadius: "sm",
                      cursor: "pointer",
                      _hover: {
                        bg: "red.600",
                      },
                    })}
                  >
                    ✕ Remove
                  </button>
                </div>
                <div
                  className={css({
                    display: "flex",
                    justifyContent: "center",
                    maxHeight: "250px",
                    overflow: "hidden",
                    borderRadius: "md",
                  })}
                >
                  <img
                    src={referencePreviewUrl}
                    alt="Reference image"
                    className={css({
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "md",
                      boxShadow: "sm",
                    })}
                  />
                </div>
                <p
                  className={css({
                    fontSize: "xs",
                    color: "blue.600",
                    textAlign: "center",
                    mt: "2",
                  })}
                >
                  💡 This image will be used as reference for generation
                </p>
              </div>
            )}

            {previewState === "generated" && currentPreviewImage && (
              <div>
                <div
                  className={css({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: "3",
                  })}
                >
                  <h4
                    className={css({
                      fontSize: "sm",
                      fontWeight: "semibold",
                      color: "gray.700",
                      m: 0,
                    })}
                  >
                    🎨 Generated Artwork
                  </h4>
                  <button
                    onClick={() => {
                      setPreviewState(previewState === "generated" ? "editing" : "generated");
                      setIsEditingMode(!isEditingMode);
                    }}
                    className={css({
                      px: "2",
                      py: "1",
                      fontSize: "xs",
                      bg: isEditingMode ? "blue.500" : "gray.200",
                      color: isEditingMode ? "white" : "gray.700",
                      border: "none",
                      borderRadius: "sm",
                      cursor: "pointer",
                      _hover: {
                        bg: isEditingMode ? "blue.600" : "gray.300",
                      },
                    })}
                    disabled={isLoading || mintingStatus !== "idle"}
                  >
                    {isEditingMode ? "✏️ Editing" : "👁️ Preview"}
                  </button>
                </div>
                <div
                  className={css({
                    display: "flex",
                    justifyContent: "center",
                    maxHeight: "250px",
                    overflow: "hidden",
                    borderRadius: "md",
                  })}
                >
                  <img
                    src={currentPreviewImage}
                    alt="Generated artwork"
                    className={css({
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "md",
                      boxShadow: "sm",
                    })}
                  />
                </div>
                {isEditingMode && (
                  <div
                    className={css({
                      mt: "3",
                      p: "3",
                      bg: "blue.50",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "blue.200",
                    })}
                  >
                    <p
                      className={css({
                        fontSize: "xs",
                        color: "blue.700",
                        m: 0,
                        textAlign: "center",
                      })}
                    >
                      💡 Edit your prompt below to refine this artwork
                    </p>
                  </div>
                )}
              </div>
            )}

            {previewState === "editing" && (
              <div
                className={css({
                  textAlign: "center",
                  py: "8",
                })}
              >
                <div
                  className={css({
                    fontSize: "2xl",
                    mb: "2",
                  })}
                >
                  ✏️
                </div>
                <h4
                  className={css({
                    fontSize: "lg",
                    fontWeight: "semibold",
                    color: "gray.700",
                    mb: "2",
                  })}
                >
                  Editing Mode
                </h4>
                <p
                  className={css({
                    fontSize: "sm",
                    color: "gray.600",
                  })}
                >
                  Modify your prompt below to refine the artwork
                </p>
              </div>
            )}
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={previewState !== "empty" ? "Describe the changes to the image..." : promptPlaceholderText}
            disabled={isLoading || mintingStatus !== "idle" || isSwitchingChain}
            className={styles.imageGen.compactTextarea}
          />

          <div className={styles.imageGen.controlBar}>
            <div className={styles.imageGen.optionsGroup}>
              <select
                id="imageSizeSelect"
                value={size}
                onChange={(e) => setSize(e.target.value as "1024x1024" | "1792x1024")}
                disabled={isLoading || mintingStatus !== "idle" || isSwitchingChain}
                className={styles.imageGen.compactSelect}
                aria-label="Select image format for your artwork"
              >
                <option value="1024x1024">{useLocale({ label: "imagegen.square" })}</option>
                <option value="1792x1024">{useLocale({ label: "imagegen.wide" })}</option>
              </select>

              <label
                className={styles.nftCard.checkboxLabel}
                title={
                  isListed
                    ? "NFT will be publicly visible in the 'All Public Artworks' gallery"
                    : "NFT will remain unlisted from the 'All Public Artworks' gallery"
                }
              >
                <input
                  type="checkbox"
                  checked={isListed}
                  onChange={(e) => setIsListed(e.target.checked)}
                  disabled={isLoading || mintingStatus !== "idle" || isSwitchingChain}
                  className={styles.nftCard.checkbox}
                />
                <LocaleText label="imagegen.listed" />
              </label>
            </div>

            {buttonState === "connect" ? <ConnectWalletButton /> : <CreateArtworkButton />}
          </div>
        </div>

        {/* Contract details under Create Artwork button */}
        <div className={css({ mt: "2", fontSize: "xs", color: "gray.600", textAlign: "center" })}>
          Powered by{" "}
          <a
            href="https://optimism.io"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about Optimism (opens in new tab)"
            className={css({ color: "blue.600", textDecoration: "underline", _hover: { color: "blue.800" } })}
          >
            Optimism
          </a>{" "}
          •{" "}
          <a
            href={`https://optimistic.etherscan.io/address/${genAiNFTContractConfig.address}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View smart contract on Optimism Etherscan (opens in new tab)"
            className={css({ color: "blue.600", textDecoration: "underline", _hover: { color: "blue.800" } })}
          >
            View Contract ↗
          </a>
        </div>

        {/* Hidden accessible description used by aria-describedby for the Create Artwork button */}
        <span
          id="create-artwork-info"
          className={css({
            position: "absolute",
            left: "-9999px",
            top: "auto",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          })}
        >
          {useLocale({ label: "imagegen.mintingInfo" })}
        </span>

        {/* Mobile Info Text - only visible on small screens */}
        <div
          className={css({
            display: { base: "block", md: "none" },
            mt: "2",
            fontSize: "xs",
            color: "gray.600",
            textAlign: "center",
          })}
        >
          <InfoIcon size="xs" className={css({ mr: "1" })} />
          {mintingInfoLabel}
        </div>

        {/* Status-Anzeige */}
        {mintingStatus !== "idle" && (
          <div className={styles.imageGen.compactStatus}>
            <div className={styles.spinner}></div>
            <span>{mintingStatus === "minting" ? "Creating your artwork..." : "Generating image..."}</span>
          </div>
        )}

        {error && <div className={styles.imageGen.compactError}>{error}</div>}

        {/* Erfolgreiche Erstellung */}
        {tokenId && generatedImageUrl && (
          <div className={styles.successMessage}>
            <h4 className={css({ margin: 0, fontSize: "sm" })}>✅ Artwork created successfully!</h4>
            <p className={css({ margin: "xs 0", fontSize: "sm" })}>
              ID: {tokenId.toString()} - Check your gallery below
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageGenerator;
