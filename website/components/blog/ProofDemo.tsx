import React, { useState } from "react";
import { css } from "../../styled-system/css";
import { StandardMerkleTree } from "../../utils/minimalMerkleTree";

// Sample data for demonstrations
const sampleBatch = {
  merkleRoot: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  requests: [
    {
      id: 1,
      owner: "0xUser1Address...",
      prompt: "Analyze the sentiment of this customer review: 'The product is amazing!'",
      leafData: {
        id: 1,
        timestamp: "2024-01-15T10:30:00.000Z",
        tokenCount: 150,
        wallet: "0xUser1Address...",
      },
      leafHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    },
    {
      id: 2,
      owner: "0xUser2Address...",
      prompt: "Translate this text to German: 'Hello, how are you today?'",
      leafData: {
        id: 2,
        timestamp: "2024-01-15T10:32:00.000Z",
        tokenCount: 120,
        wallet: "0xUser2Address...",
      },
      leafHash: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
    },
    {
      id: 3,
      owner: "0xUser3Address...",
      prompt: "Write a short Python function to calculate fibonacci numbers",
      leafData: {
        id: 3,
        timestamp: "2024-01-15T10:35:00.000Z",
        tokenCount: 180,
        wallet: "0xUser3Address...",
      },
      leafHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
    },
  ],
};

// Types for proof demo
interface MerkleProof {
  leafIndex: number;
  leafData: {
    id: number;
    timestamp: string;
    tokenCount: number;
    wallet: string;
  };
  leafHash: string;
  proof: { data: string; position: "left" | "right" }[];
  root: string;
}

// Generate a Merkle Proof using OpenZeppelin StandardMerkleTree
const generateMerkleProof = (leafIndex: number): MerkleProof => {
  const selectedRequest = sampleBatch.requests[leafIndex];

  // Prepare tree data in the same format as calculateMerkleRoot
  const treeData = sampleBatch.requests.map((req) => [
    req.leafData.id,
    req.leafData.timestamp,
    req.leafData.tokenCount,
    req.leafData.wallet,
  ]);

  // Define types for demo (simplified version of production REQUEST_TYPES)
  const demoTypes = ["uint256", "string", "uint256", "string"];

  // Create StandardMerkleTree
  const tree = StandardMerkleTree.of(treeData, demoTypes);

  // Get proof for the specific leaf
  const proof = tree.getProof(leafIndex);
  const root = tree.root;

  return {
    leafIndex,
    leafData: selectedRequest.leafData,
    leafHash: selectedRequest.leafHash,
    proof: proof.map((hash, index) => ({
      data: hash,
      position: index % 2 === 0 ? "left" : "right",
    })),
    root: root,
  };
};

// Validate a Merkle Proof using OpenZeppelin StandardMerkleTree
const validateMerkleProof = (proof: MerkleProof): { isValid: boolean; message: string; steps: string[] } => {
  try {
    // Recreate the tree using StandardMerkleTree for validation
    const allRequests = sampleBatch.requests;

    // Convert to the same format used in generation
    const treeData = allRequests.map((req) => [
      req.leafData.id,
      req.leafData.timestamp,
      req.leafData.tokenCount,
      req.leafData.wallet,
    ]);

    const demoTypes = ["uint256", "string", "uint256", "string"];
    const tree = StandardMerkleTree.of(treeData, demoTypes);

    // Get the specific leaf data for verification
    const leafData = [proof.leafData.id, proof.leafData.timestamp, proof.leafData.tokenCount, proof.leafData.wallet];

    // Convert proof format from our custom format back to StandardMerkleTree format
    const standardProof = proof.proof.map((p) => p.data);

    // Use StandardMerkleTree's built-in verification
    const isValid = StandardMerkleTree.verify(tree.root, demoTypes, leafData, standardProof);

    // Additional check: verify the leaf exists in the tree
    let leafExists = false;
    let foundIndex = -1;
    for (const [index, value] of tree.entries()) {
      if (JSON.stringify(value) === JSON.stringify(leafData)) {
        leafExists = true;
        foundIndex = index;
        break;
      }
    }

    const steps = [
      `✅ Used OpenZeppelin StandardMerkleTree.verify()`,
      `📋 Leaf Data: [${leafData.join(", ")}]`,
      `🌳 Tree Root: ${tree.root.substring(0, 16)}...`,
      `🔍 Proof Root: ${proof.root.substring(0, 16)}...`,
      `📍 Leaf Index: ${foundIndex} (expected: ${proof.leafIndex})`,
      `🎯 Root Match: ${tree.root === proof.root}`,
      `🔍 Leaf Exists: ${leafExists}`,
      `${isValid ? "✅ Verification: VALID" : "❌ Verification: INVALID"}`,
    ];

    return {
      isValid: isValid && leafExists && tree.root === proof.root,
      message:
        isValid && leafExists
          ? "Proof is valid! Alice's payment is confirmed."
          : "Proof is invalid! This payment cannot be verified.",
      steps,
    };
  } catch (error) {
    console.error("Proof validation failed:", error);
    return {
      isValid: false,
      message: "Error validating proof: " + (error as Error).message,
      steps: [],
    };
  }
};

export default function ProofDemo() {
  const [selectedUser, setSelectedUser] = useState(0);
  const [generatedProof, setGeneratedProof] = useState<MerkleProof | null>(null);
  const [validationInput, setValidationInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    steps: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "validate">("generate");

  const handleGenerateProof = () => {
    try {
      const proof = generateMerkleProof(selectedUser);
      setGeneratedProof(proof);
    } catch (_error) {
      console.error("Error generating proof:", _error);
    }
  };

  const handleValidateProof = () => {
    try {
      const proof = JSON.parse(validationInput) as MerkleProof;
      const result = validateMerkleProof(proof);
      setValidationResult(result);
    } catch (error) {
      console.error("Proof validation failed:", error);
      setValidationResult({
        isValid: false,
        message: "Invalid JSON format",
        steps: [],
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "lg",
        padding: "5",
        margin: "20px 0",
        backgroundColor: "codeBg",
      })}
    >
      {/* h4, not h3: this is a widget title, not a document section — the ToC scans h2/h3,
          and this post's real sections shouldn't share a heading level with widget chrome. */}
      <h4 className={css({ fontSize: "lg", fontWeight: "bold", marginBottom: "4" })}>
        🔍 Interactive Proof Demo: Alice&apos;s Story
      </h4>

      {/* Sample Batch Display */}
      <div
        className={css({
          marginBottom: "5",
          padding: "4",
          backgroundColor: "codeBg",
          borderRadius: "lg",
          border: "1px solid #d1d5db",
        })}
      >
        <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
          Sample Batch (Merkle Root: {sampleBatch.merkleRoot.substring(0, 20)}...)
        </h4>
        <div className={css({ display: "grid", gap: "2" })}>
          {sampleBatch.requests.map((req, index) => (
            <div
              key={req.id}
              className={css({
                padding: "8px 12px",
                backgroundColor: "white",
                borderRadius: "sm",
                border: "1px solid #d1d5db",
                fontSize: "sm",
              })}
            >
              <strong>{req.owner}</strong> (R<sub>{index + 1}</sub>): {req.prompt} - {req.leafData.tokenCount} tokens
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={css({ marginBottom: "4", borderBottom: "1px solid #e5e7eb" })}>
        <div className={css({ display: "flex", gap: "0" })}>
          <button
            onClick={() => setActiveTab("generate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "generate" ? "codeBg" : "transparent",
              color: activeTab === "generate" ? "gray.700" : "gray.500",
              border: activeTab === "generate" ? "1px solid #d1d5db" : "1px solid transparent",
              borderBottom: activeTab === "generate" ? "1px solid #f9fafb" : "1px solid #e5e7eb",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "sm",
              fontWeight: activeTab === "generate" ? "medium" : "normal",
            })}
          >
            Generate Proof
          </button>
          <button
            onClick={() => setActiveTab("validate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "validate" ? "codeBg" : "transparent",
              color: activeTab === "validate" ? "gray.700" : "gray.500",
              border: activeTab === "validate" ? "1px solid #d1d5db" : "1px solid transparent",
              borderBottom: activeTab === "validate" ? "1px solid #f9fafb" : "1px solid #e5e7eb",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "sm",
              fontWeight: activeTab === "validate" ? "medium" : "normal",
            })}
          >
            Validate Proof
          </button>
        </div>
      </div>

      {/* Generate Proof Tab */}
      {activeTab === "generate" && (
        <div>
          <div
            className={css({
              marginBottom: "4",
              padding: "4",
              backgroundColor: "white",
              borderRadius: "sm",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
              Step 1: Select User to Generate Proof
            </h4>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              className={css({
                width: "100%",
                padding: "2",
                border: "1px solid #d1d5db",
                borderRadius: "sm",
                marginBottom: "3",
              })}
            >
              {sampleBatch.requests.map((req, index) => (
                <option key={req.id} value={index}>
                  {req.owner} - {req.prompt}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateProof}
              className={css({
                padding: "8px 16px",
                backgroundColor: "gray.700",
                color: "white",
                border: "1px solid #374151",
                borderRadius: "sm",
                cursor: "pointer",
                fontSize: "sm",
                "&:hover": {
                  backgroundColor: "gray.600",
                  borderColor: "gray.600",
                },
              })}
            >
              Generate Merkle Proof
            </button>
          </div>

          {generatedProof && (
            <div
              className={css({
                padding: "4",
                backgroundColor: "codeBg",
                borderRadius: "sm",
                border: "1px solid #e5e7eb",
              })}
            >
              <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3", color: "gray.700" })}>
                Generated Proof for {sampleBatch.requests[selectedUser].owner}
              </h4>
              <div className={css({ marginBottom: "3" })}>
                <strong>Proof Path:</strong>
                <div className={css({ fontSize: "xs", fontFamily: "code", marginTop: "1" })}>
                  {generatedProof.proof.map((proofItem, index) => (
                    <div key={index}>
                      Level {index + 1}: {proofItem.data.substring(0, 20)}... ({proofItem.position})
                    </div>
                  ))}
                </div>
              </div>
              <div className={css({ marginBottom: "3" })}>
                <strong>Complete Proof JSON:</strong>
                <div className={css({ position: "relative" })}>
                  <pre
                    className={css({
                      fontSize: "xs",
                      fontFamily: "code",
                      backgroundColor: "white",
                      padding: "2",
                      borderRadius: "sm",
                      border: "1px solid #d1d5db",
                      overflow: "auto",
                      maxHeight: "200px",
                      marginTop: "1",
                    })}
                  >
                    {JSON.stringify(generatedProof, null, 2)}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(generatedProof, null, 2))}
                    className={css({
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      padding: "4px 8px",
                      backgroundColor: "gray.500",
                      color: "white",
                      border: "none",
                      borderRadius: "sm",
                      fontSize: "xs",
                      cursor: "pointer",
                    })}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validate Proof Tab */}
      {activeTab === "validate" && (
        <div>
          <div
            className={css({
              marginBottom: "4",
              padding: "4",
              backgroundColor: "white",
              borderRadius: "sm",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>
              Step 2: Validate a Proof
            </h4>
            <label className={css({ display: "block", fontSize: "sm", marginBottom: "2" })}>Paste Proof JSON:</label>
            <textarea
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="Paste the complete proof JSON here..."
              className={css({
                width: "100%",
                height: "120px",
                padding: "2",
                border: "1px solid #d1d5db",
                borderRadius: "sm",
                fontSize: "xs",
                fontFamily: "code",
                marginBottom: "3",
                resize: "vertical",
              })}
            />
            <button
              onClick={handleValidateProof}
              disabled={!validationInput.trim()}
              className={css({
                padding: "8px 16px",
                backgroundColor: validationInput.trim() ? "gray.700" : "gray.400",
                color: "white",
                border: "none",
                borderRadius: "sm",
                cursor: validationInput.trim() ? "pointer" : "not-allowed",
                fontSize: "sm",
                "&:hover": validationInput.trim()
                  ? {
                      backgroundColor: "gray.600",
                    }
                  : {},
              })}
            >
              Validate Proof
            </button>
          </div>

          {validationResult && (
            <div
              className={css({
                padding: "4",
                backgroundColor: validationResult.isValid ? "codeBg" : "red.50",
                borderRadius: "sm",
                border: `1px solid ${validationResult.isValid ? "gray.300" : "red.200"}`,
              })}
            >
              <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "3" })}>Validation Result</h4>
              <div
                className={css({
                  fontSize: "sm",
                  fontWeight: "semibold",
                  marginBottom: "3",
                  color: validationResult.isValid ? "green.800" : "red.600",
                })}
              >
                {validationResult.message}
              </div>
              {validationResult.steps.length > 0 && (
                <div>
                  <strong>Verification Steps:</strong>
                  <div className={css({ marginTop: "2" })}>
                    {validationResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className={css({
                          fontSize: "xs",
                          fontFamily: "code",
                          backgroundColor: "white",
                          padding: "4px 8px",
                          borderRadius: "sm",
                          border: "1px solid #e5e7eb",
                          marginBottom: "1",
                        })}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
