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

const defaultImageUrl = "https://mypersonaljscloudivnad9dy-genimgbfl.functions.fnc.fr-par.scw.cloud";

// Image compression helpers
const calculateOptimalDimensions = (originalWidth: number, originalHeight: number, maxDimension: number = 1920) => {
  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }

  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
};

const compressImage = (file: File, maxSizeKB: number = 1024): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const { width, height } = calculateOptimalDimensions(img.width, img.height);
      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Weißer Hintergrund für PNG → JPEG Konvertierung (Transparenz)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      // Zeichne das Bild auf den Canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Progressive Qualitätsreduzierung bis Zielgröße erreicht
      let quality = 0.9;
      const attemptCompression = () => {
        // Explizit zu JPEG konvertieren - garantiert einheitliches Format
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        const sizeKB = (compressedDataUrl.length * 0.75) / 1024; // Base64 Overhead

        if (sizeKB <= maxSizeKB || quality <= 0.1) {
          resolve({
            base64: compressedDataUrl.split(",")[1], // Return base64 without prefix
            mimeType: "image/jpeg", // Garantiert JPEG nach Konvertierung
          });
        } else {
          quality -= 0.1;
          setTimeout(attemptCompression, 0); // Non-blocking iteration
        }
      };
      attemptCompression();
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

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

  // Unified reference image state (base64 for all sources)
  const [referenceImageBase64, setReferenceImageBase64] = useState<string | null>(null);
  const [referenceImageMimeType, setReferenceImageMimeType] = useState<string>("image/jpeg");

  // Blockchain interaction
  const { address, isConnected } = useAccount();

  // Preview area state machine
  type PreviewState = "empty" | "reference" | "generated";
  const [previewState, setPreviewState] = useState<PreviewState>("empty");

  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1792x1024">("1024x1024");
  const [isListed, setIsListed] = useState(false); // Default: not publicly listed
  const [isLoading, setIsLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState<MintingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
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
        reject(new Error(chainSwitchTimeoutText));
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
  const enterPromptText = useLocale({ label: "imagegen.enterPrompt" });
  const switchingNetworkText = useLocale({ label: "imagegen.switchingNetwork" });
  const creatingText = useLocale({ label: "imagegen.creating" });
  const generatingText = useLocale({ label: "imagegen.generating" });
  const createArtworkText = useLocale({ label: "imagegen.createArtwork" });
  const promptPlaceholderText = useLocale({ label: "imagegen.promptPlaceholder" });
  const editPromptPlaceholderText = useLocale({ label: "imagegen.editPromptPlaceholder" });
  const editImageText = useLocale({ label: "imagegen.editImage" });

  // Error messages
  const connectAccountFirstText = useLocale({ label: "imagegen.connectAccountFirst" });
  const switchToOptimismText = useLocale({ label: "imagegen.switchToOptimism" });
  const enterPromptErrorText = useLocale({ label: "imagegen.enterPromptError" });
  const loadMintPriceText = useLocale({ label: "imagegen.loadMintPrice" });
  const chainSwitchTimeoutText = useLocale({ label: "imagegen.chainSwitchTimeout" });
  const extractTokenIdText = useLocale({ label: "imagegen.extractTokenId" });
  const unknownErrorText = useLocale({ label: "imagegen.unknownError" });

  // File upload
  const uploadReferenceImageText = useLocale({ label: "imagegen.uploadReferenceImage" });
  const dragDropHereText = useLocale({ label: "imagegen.dragDropHere" });
  const supportedFormatsText = useLocale({ label: "imagegen.supportedFormats" });
  const referenceImageTitleText = useLocale({ label: "imagegen.referenceImageTitle" });
  const generatedArtworkTitleText = useLocale({ label: "imagegen.generatedArtworkTitle" });
  const removeText = useLocale({ label: "imagegen.remove" });
  const referenceImageAltText = useLocale({ label: "imagegen.referenceImageAlt" });
  const generatedArtworkAltText = useLocale({ label: "imagegen.generatedArtworkAlt" });
  const referenceImageHintText = useLocale({ label: "imagegen.referenceImageHint" });

  // File validation
  const invalidFileTypeText = useLocale({ label: "imagegen.invalidFileType" });
  const fileTooLargeText = useLocale({ label: "imagegen.fileTooLarge" });
  const compressionFailedText = useLocale({ label: "imagegen.compressionFailed" });
  const failedToProcessImageText = useLocale({ label: "imagegen.failedToProcessImage" });

  // Status messages
  const creatingArtworkText = useLocale({ label: "imagegen.creatingArtwork" });
  const generatingImageText = useLocale({ label: "imagegen.generatingImage" });

  // Collapsed state texts
  const titleText = useLocale({ label: "imagegen.title" });
  const collapsedTitleText = useLocale({ label: "imagegen.collapsedTitle" });
  const collapsedDescriptionText = useLocale({ label: "imagegen.collapsedDescription" });

  // Options texts
  const squareText = useLocale({ label: "imagegen.square" });
  const wideText = useLocale({ label: "imagegen.wide" });
  const mintingInfoText = useLocale({ label: "imagegen.mintingInfo" });
  const artworkCreatedText = useLocale({ label: "imagegen.artworkCreated" });
  const checkGalleryText = useLocale({ label: "imagegen.checkGallery" });
  const switchingToOptimismText = useLocale({ label: "imagegen.switchingToOptimism" });

  // Links
  const poweredByText = useLocale({ label: "imagegen.poweredBy" });
  const viewContractText = useLocale({ label: "imagegen.viewContract" });
  const learnMoreOptimismText = useLocale({ label: "imagegen.learnMoreOptimism" });
  const viewContractEtherscanText = useLocale({ label: "imagegen.viewContractEtherscan" });

  const getButtonState = () => {
    if (isSwitchingChain) return "switching";
    if (isLoading) return "loading";
    // Note: !isConnected check removed - only reachable in connected state
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
      const errorMsg = connectAccountFirstText;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Check if connected to the correct chain
    const expectedChainId = chain?.id;
    if (expectedChainId && currentChainId !== expectedChainId) {
      try {
        setError(switchingToOptimismText);
        await switchChain({ chainId: expectedChainId });

        // Wait for the chain switch to complete using polling
        await waitForChainSwitch(expectedChainId);

        setError(null);
      } catch (switchError) {
        console.error("Failed to switch chain:", switchError);
        const errorMsg = switchError instanceof Error ? switchError.message : switchToOptimismText;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }
    }

    if (!prompt.trim()) {
      const errorMsg = enterPromptErrorText;
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }
    if (!mintPrice) {
      const errorMsg = loadMintPriceText;
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
        throw new Error(extractTokenIdText);
      }

      const tokenIdHex = transferEvent.topics[3];
      const newTokenId = BigInt(tokenIdHex);
      console.log("Created artwork ID:", newTokenId);
      setTokenId(newTokenId);

      // Proceed with image generation
      setMintingStatus("generating");

      // Determine mode and prepare request body
      const isEditMode = referenceImageBase64 !== null;
      const mode = isEditMode ? "edit" : "generate";

      // Prepare request body
      const requestBody: {
        prompt: string;
        tokenId: string;
        size: string;
        mode: string;
        referenceImage?: string;
      } = {
        prompt,
        tokenId: newTokenId.toString(),
        size,
        mode,
      };

      // If in edit mode, use the base64 reference image
      if (isEditMode && referenceImageBase64) {
        requestBody.referenceImage = referenceImageBase64;
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

      // Convert generated image to base64 for potential editing
      try {
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });
        // Remove the data:image/jpeg;base64, prefix to get just the base64 data
        const base64Data = base64String.split(",")[1];
        setReferenceImageBase64(base64Data);
      } catch (error) {
        console.warn("Failed to convert generated image to base64:", error);
        // Don't fail the whole operation if base64 conversion fails
      }

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
        setPrompt("");
        setSize("1024x1024");
        setGeneratedImageUrl(undefined);
        setTokenId(undefined);
        setError(null);
        // Don't clear currentPreviewImage or previewState - let it persist for editing
      }, 3000);
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err instanceof Error ? err.message : unknownErrorText;
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
    // Strikte Validierung: Nur JPEG und PNG erlaubt
    const validTypes = ["image/jpeg", "image/png"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError(invalidFileTypeText);
      return false;
    }

    if (file.size > maxSize) {
      setError(fileTooLargeText);
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateImageFile(file)) return;

    setError(null);
    setIsLoading(true);

    try {
      // Komprimiere das Bild auf unter 1MB (PNG → JPEG Konvertierung)
      const compressedResult = await compressImage(file, 1024);
      setReferenceImageBase64(compressedResult.base64);
      setReferenceImageMimeType(compressedResult.mimeType);
      setPreviewState("reference");

      // Zeige Erfolg-Feedback
      const originalSizeKB = Math.round(file.size / 1024);
      const compressedSizeKB = Math.round((compressedResult.base64.length * 0.75) / 1024);
      console.log(
        `Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${file.type} → ${compressedResult.mimeType})`,
      );
    } catch (err) {
      console.error("Image compression failed:", err);
      const errorMsg = err instanceof Error ? err.message : failedToProcessImageText;
      setError(`${compressionFailedText}: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
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
    setReferenceImageBase64(null);
    setReferenceImageMimeType("image/jpeg");

    // Clear the file input
    const fileInput = document.getElementById("reference-image-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    // Intelligent state management:
    // If we have a generated image, switch to "generated" state
    // If no generated image, switch back to "empty" state
    if (currentPreviewImage) {
      setPreviewState("generated");
    } else {
      setPreviewState("empty");
    }
  };

  // Simple format detection based on user selection
  const formatSelected = size === "1792x1024" ? "wide" : "square";

  // Handle expansion trigger for collapsed state
  const handleExpand = () => {
    // Always trigger wallet connection when in collapsed state
    handleWalletConnection();
  };

  return (
    <div
      className={css({
        transition: "all 0.5s ease-in-out",
        overflow: "hidden",
      })}
    >
      {!isConnected ? (
        // Collapsed State - Clean & Simple
        <div
          className={css({
            maxWidth: "500px",
            margin: "0 auto",
            textAlign: "center",
          })}
        >
          {/* Simple Title - centered, no border */}
          <h3
            className={css({
              fontSize: "2xl",
              fontWeight: "semibold",
              marginBottom: "4",
              color: "gray.800",
            })}
          >
            🎨 {titleText}
          </h3>

          {/* Action-oriented title */}
          <div
            className={css({
              fontSize: "md",
              fontWeight: "medium",
              color: "gray.800",
              mb: "3",
              textAlign: "center",
            })}
          >
            {collapsedTitleText}
          </div>

          {/* Single clear message + CTA */}
          <p
            className={css({
              fontSize: "sm",
              color: "gray.600",
              mb: "lg",
              lineHeight: "1.5",
            })}
          >
            {collapsedDescriptionText}
          </p>

          {/* CTA Button - centered with website style */}
          <div className={css({ display: "flex", justifyContent: "center" })}>
            <button onClick={handleExpand} className={styles.primaryButton}>
              {connectWalletButtonText}
            </button>
          </div>
        </div>
      ) : (
        // Expanded State - Current Full Design
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
                data-testid="drop-zone"
                className={css({
                  mb: "4",
                  border: "1px solid",
                  borderColor: previewState === "empty" ? "gray.300" : "gray.400",
                  borderRadius: "md",
                  bg: previewState === "empty" ? "gray.50" : "white",
                  position: "relative",
                  cursor: previewState === "empty" ? "pointer" : "default",
                  overflow: "hidden",
                  // Full width layout to match textarea
                  width: "100%",
                  // Subtle hover for empty state only
                  _hover:
                    previewState === "empty"
                      ? {
                          borderColor: "gray.400",
                          bg: "gray.100",
                        }
                      : {},
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
                  data-testid="reference-image-input"
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      py: "6",
                      px: "4",
                      gap: "3",
                    })}
                  >
                    <div
                      className={css({
                        fontSize: "xl",
                        color: "gray.500",
                      })}
                    >
                      📸
                    </div>
                    <div className={css({ textAlign: "left" })}>
                      <h4
                        className={css({
                          fontSize: "sm",
                          fontWeight: "medium",
                          color: "gray.700",
                          mb: "1",
                        })}
                      >
                        {uploadReferenceImageText}
                      </h4>
                      <p
                        className={css({
                          fontSize: "xs",
                          color: "gray.500",
                          mb: "0",
                        })}
                      >
                        {dragDropHereText} • {supportedFormatsText}
                      </p>
                    </div>
                  </div>
                )}

                {previewState === "reference" && referenceImageBase64 && (
                  <div className={css({ p: "3" })}>
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
                          fontWeight: "medium",
                          color: "gray.700",
                          m: 0,
                        })}
                      >
                        {referenceImageTitleText}
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
                          bg: "gray.600",
                          color: "white",
                          border: "none",
                          borderRadius: "sm",
                          cursor: "pointer",
                          _hover: {
                            bg: "gray.700",
                          },
                        })}
                      >
                        ✕ {removeText}
                      </button>
                    </div>
                    <div
                      className={css({
                        position: "relative",
                        width: "100%",
                        // Intelligent height: larger for wide images, smaller for square
                        height: formatSelected === "wide" ? "250px" : "200px",
                        overflow: "hidden",
                        borderRadius: "sm",
                        bg: "gray.100",
                      })}
                    >
                      <img
                        src={`data:${referenceImageMimeType};base64,${referenceImageBase64}`}
                        alt={referenceImageAltText}
                        className={css({
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          borderRadius: "sm",
                        })}
                      />
                    </div>
                    <p
                      className={css({
                        fontSize: "xs",
                        color: "gray.500",
                        textAlign: "center",
                        mt: "2",
                        mb: "0",
                      })}
                    >
                      {referenceImageHintText}
                    </p>
                  </div>
                )}

                {previewState === "generated" && currentPreviewImage && (
                  <div className={css({ p: "3" })}>
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
                          fontWeight: "medium",
                          color: "gray.700",
                          m: 0,
                        })}
                      >
                        {generatedArtworkTitleText}
                      </h4>
                      <div className={css({ display: "flex", gap: "2" })}>
                        <button
                          onClick={() => {
                            // Clear both reference and generated images when in generated state
                            setReferenceImageBase64(null);
                            setReferenceImageMimeType("image/jpeg");
                            setCurrentPreviewImage(undefined);
                            setPreviewState("empty");

                            // Clear the file input
                            const fileInput = document.getElementById("reference-image-input") as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                          }}
                          className={css({
                            px: "2",
                            py: "1",
                            fontSize: "xs",
                            bg: "gray.600",
                            color: "white",
                            border: "none",
                            borderRadius: "sm",
                            cursor: "pointer",
                            _hover: {
                              bg: "gray.700",
                            },
                          })}
                          disabled={isLoading || mintingStatus !== "idle"}
                        >
                          ✕ {removeText}
                        </button>
                      </div>
                    </div>
                    <div
                      className={css({
                        position: "relative",
                        width: "100%",
                        // Intelligent height based on format selection
                        height: formatSelected === "wide" ? "250px" : "200px",
                        overflow: "hidden",
                        borderRadius: "sm",
                        bg: "gray.100",
                      })}
                    >
                      <img
                        src={currentPreviewImage}
                        alt={generatedArtworkAltText}
                        className={css({
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          borderRadius: "sm",
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={previewState === "reference" ? editPromptPlaceholderText : promptPlaceholderText}
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
                    <option value="1024x1024">{squareText}</option>
                    <option value="1792x1024">{wideText}</option>
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

                <CreateArtworkButton />
              </div>
            </div>

            {/* Contract details under Create Artwork button */}
            <div className={css({ mt: "2", fontSize: "xs", color: "gray.600", textAlign: "center" })}>
              {poweredByText}{" "}
              <a
                href="https://optimism.io"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={learnMoreOptimismText}
                className={css({ color: "blue.600", textDecoration: "underline", _hover: { color: "blue.800" } })}
              >
                Optimism
              </a>{" "}
              •{" "}
              <a
                href={`https://optimistic.etherscan.io/address/${genAiNFTContractConfig.address}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={viewContractEtherscanText}
                className={css({ color: "blue.600", textDecoration: "underline", _hover: { color: "blue.800" } })}
              >
                {viewContractText} ↗
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
              {mintingInfoText}
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
                <span>{mintingStatus === "minting" ? creatingArtworkText : generatingImageText}</span>
              </div>
            )}

            {error && <div className={styles.imageGen.compactError}>{error}</div>}

            {/* Erfolgreiche Erstellung */}
            {tokenId && generatedImageUrl && (
              <div className={styles.successMessage}>
                <h4 className={css({ margin: 0, fontSize: "sm" })}>{artworkCreatedText}</h4>
                <p className={css({ margin: "xs 0", fontSize: "sm" })}>
                  ID: {tokenId.toString()} - {checkGalleryText}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGenerator;
