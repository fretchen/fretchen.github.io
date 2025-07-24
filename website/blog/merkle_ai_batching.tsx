import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { MerkleTree } from "merkletreejs";
import { Buffer } from "buffer";

// Export meta for blog post
export const meta = {
  title: "Merkle Trees for LLM API Batching: Cost-Optimized Blockchain Payments for AI Services",
  publishing_date: "2025-07-29",
  tags: ["Blockchain", "LLM", "API", "Merkle Trees", "Ethereum", "Cost Optimization", "AI Services"],
  readTime: 8,
};

// Mock types and interfaces
interface LLMRequest {
  id: number;
  prompt: string;
  model: string;
  recipient: string;
  estimatedTokens: number;
  response?: string;
  leafData?: {
    id: number;
    timestamp: string;
    tokenCount: number;
    wallet: string;
  };
  leafHash?: string;
}

// Mock wallet addresses for simulation
const mockWallets = [
  "0xUser1Address...",
  "0xUser2Address...",
  "0xUser3Address...",
  "0xUser4Address...",
  "0xUser5Address...",
];

// Mock prompts for LLM requests
const mockPrompts = [
  "Analyze the sentiment of this customer review: 'The product is amazing!'",
  "Translate this text to German: 'Hello, how are you today?'",
  "Write a short Python function to calculate fibonacci numbers",
  "Explain quantum computing in simple terms",
  "Generate a creative story about a time-traveling cat",
  "Summarize the benefits of renewable energy",
  "Create a marketing strategy for a new mobile app",
  "Debug this JavaScript code: console.log(hello world)",
];

// Synchronous hash function for merkletreejs compatibility
const createSyncHash = (data: string | Buffer): Buffer => {
  // Convert to consistent format
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);

  // Deterministic hash function for demo purposes
  let hash = 0x811c9dc5; // FNV-1a initial value
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = (hash * 0x01000193) >>> 0; // FNV-1a prime and ensure 32-bit
  }

  // Create a deterministic 32-byte buffer
  const result = new Uint8Array(32);
  for (let i = 0; i < 32; i += 4) {
    result[i] = (hash >>> 24) & 0xff;
    result[i + 1] = (hash >>> 16) & 0xff;
    result[i + 2] = (hash >>> 8) & 0xff;
    result[i + 3] = hash & 0xff;
    hash = (hash * 0x01000193) >>> 0; // Continue hashing for next 4 bytes
  }

  return Buffer.from(result);
};

// Shared hash function for Merkle Tree construction
const createMerkleHashFn = () => {
  return (data: Buffer) => createSyncHash(data);
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
  proof: Array<{
    data: string;
    position: "left" | "right";
  }>;
  root: string;
}

// Sample data for proof demo (Alice's story)
const sampleBatch = {
  requests: [
    {
      id: 1,
      leafData: { id: 1, timestamp: "2025-07-29T10:00:00.000Z", tokenCount: 150, wallet: "0xAliceAddress..." },
      leafHash: "0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      prompt: "Analyze the sentiment of customer feedback",
      owner: "Alice",
    },
    {
      id: 2,
      leafData: { id: 2, timestamp: "2025-07-29T10:01:00.000Z", tokenCount: 200, wallet: "0xBobAddress..." },
      leafHash: "0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567",
      prompt: "Generate marketing copy for new product",
      owner: "Bob",
    },
    {
      id: 3,
      leafData: { id: 3, timestamp: "2025-07-29T10:02:00.000Z", tokenCount: 175, wallet: "0xCharlieAddress..." },
      leafHash: "0xc3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678",
      prompt: "Translate technical documentation to Spanish",
      owner: "Charlie",
    },
    {
      id: 4,
      leafData: { id: 4, timestamp: "2025-07-29T10:03:00.000Z", tokenCount: 120, wallet: "0xDaveAddress..." },
      leafHash: "0xd4e5f6789012345678901234567890abcdef1234567890abcdef123456789",
      prompt: "Debug Python code for data analysis",
      owner: "Dave",
    },
  ],
  merkleRoot: "0x1a2b3c4d5e6f789012345678901234567890abcdef1234567890abcdef123456",
};

// Generate Merkle Proof for a specific leaf
const generateMerkleProof = async (leafIndex: number): Promise<MerkleProof> => {
  const requests = sampleBatch.requests;
  const selectedRequest = requests[leafIndex];

  // Convert leaf data to buffers for merkletreejs - use same hash function!
  const leafBuffers = requests.map((req) => {
    const serialized = JSON.stringify(req.leafData, Object.keys(req.leafData).sort());
    return createSyncHash(serialized);
  });

  const hashFn = createMerkleHashFn();
  const tree = new MerkleTree(leafBuffers, hashFn);

  // Get proof for the specific leaf
  const leaf = leafBuffers[leafIndex];
  const proof = tree.getProof(leaf);
  const root = tree.getRoot();

  return {
    leafIndex,
    leafData: selectedRequest.leafData,
    leafHash: selectedRequest.leafHash,
    proof: proof.map((p) => ({
      data: `0x${p.data.toString("hex")}`,
      position: p.position as "left" | "right",
    })),
    root: `0x${root.toString("hex")}`,
  };
};

// Validate a Merkle Proof using merkletreejs built-in verification
const validateMerkleProof = async (
  proof: MerkleProof,
): Promise<{ isValid: boolean; message: string; steps: string[] }> => {
  try {
    // Recreate the original tree to use instance verification
    const allRequests = sampleBatch.requests;
    const allLeafBuffers = allRequests.map((req) => {
      const serialized = JSON.stringify(req.leafData, Object.keys(req.leafData).sort());
      return createSyncHash(serialized);
    });

    const hashFn = createMerkleHashFn();
    const tree = new MerkleTree(allLeafBuffers, hashFn);

    // Get the leaf buffer for the proof
    const leafBuffer = createSyncHash(JSON.stringify(proof.leafData, Object.keys(proof.leafData).sort()));

    // Use the tree instance verify method (this is the most reliable approach)
    const originalProof = tree.getProof(leafBuffer);
    const treeRoot = tree.getRoot();
    const isValid = tree.verify(originalProof, leafBuffer, treeRoot);

    // Alternative: Check if the leaf exists in the tree
    const leafIndex = allLeafBuffers.findIndex((buf) => buf.equals(leafBuffer));
    const alternativeValid = leafIndex === proof.leafIndex && leafIndex >= 0;

    const steps = [
      `✅ Used merkletreejs tree.verify()`,
      `📋 Leaf: ${leafBuffer.toString("hex").substring(0, 10)}...`,
      `🌳 Tree Root: 0x${treeRoot.toString("hex").substring(0, 10)}...`,
      `🔍 Proof Root: ${proof.root.substring(0, 10)}...`,
      `� Leaf Index: ${leafIndex} (expected: ${proof.leafIndex})`,
      `� Root Match: ${`0x${treeRoot.toString("hex")}` === proof.root}`,
      `🎯 Index Match: ${alternativeValid}`,
      `${isValid ? "✅ Verification: VALID" : "❌ Verification: INVALID"}`,
    ];

    return {
      isValid: isValid && alternativeValid && `0x${treeRoot.toString("hex")}` === proof.root,
      message: isValid
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

// Interactive Proof Demo Component
const ProofDemo: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState(0);
  const [generatedProof, setGeneratedProof] = useState<MerkleProof | null>(null);
  const [validationInput, setValidationInput] = useState("");
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
    steps: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "validate">("generate");

  const handleGenerateProof = async () => {
    try {
      const proof = await generateMerkleProof(selectedUser);
      setGeneratedProof(proof);
    } catch (_error) {
      console.error("Error generating proof:", _error);
    }
  };

  const handleValidateProof = async () => {
    try {
      const proof = JSON.parse(validationInput) as MerkleProof;
      const result = await validateMerkleProof(proof);
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
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        🔍 Interactive Proof Demo: Alice&apos;s Story
      </h3>

      {/* Story Introduction */}
      <div
        className={css({
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#fef3c7",
          borderRadius: "8px",
          border: "1px solid #f59e0b",
        })}
      >
        <p className={css({ fontSize: "14px", color: "#92400e", marginBottom: "8px" })}>
          <strong>📖 The Story:</strong> Alice, Bob, Charlie, and Dave all made LLM requests that were batched together
          in a single Merkle tree. Now Alice needs to prove to a third party that she made her payment without revealing
          everyone else&apos;s transaction details.
        </p>
      </div>

      {/* Sample Batch Display */}
      <div
        className={css({
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#f0fdf4",
          borderRadius: "8px",
          border: "1px solid #bbf7d0",
        })}
      >
        <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
          Sample Batch (Merkle Root: {sampleBatch.merkleRoot.substring(0, 20)}...)
        </h4>
        <div className={css({ display: "grid", gap: "8px" })}>
          {sampleBatch.requests.map((req, index) => (
            <div
              key={req.id}
              className={css({
                padding: "8px 12px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "13px",
              })}
            >
              <strong>{req.owner}</strong> (R<sub>{index + 1}</sub>): {req.prompt} - {req.leafData.tokenCount} tokens
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={css({ marginBottom: "16px", borderBottom: "1px solid #e5e7eb" })}>
        <div className={css({ display: "flex", gap: "0" })}>
          <button
            onClick={() => setActiveTab("generate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "generate" ? "#3b82f6" : "transparent",
              color: activeTab === "generate" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "medium",
            })}
          >
            Generate Proof
          </button>
          <button
            onClick={() => setActiveTab("validate")}
            className={css({
              padding: "8px 16px",
              backgroundColor: activeTab === "validate" ? "#3b82f6" : "transparent",
              color: activeTab === "validate" ? "white" : "#6b7280",
              border: "none",
              borderRadius: "4px 4px 0 0",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "medium",
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
              marginBottom: "16px",
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
              Step 1: Select User to Generate Proof
            </h4>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              className={css({
                width: "100%",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                marginBottom: "12px",
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
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              })}
            >
              Generate Merkle Proof
            </button>
          </div>

          {generatedProof && (
            <div
              className={css({
                padding: "16px",
                backgroundColor: "#f0fdf4",
                borderRadius: "4px",
                border: "1px solid #bbf7d0",
              })}
            >
              <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
                Generated Proof for {sampleBatch.requests[selectedUser].owner}
              </h4>
              <div className={css({ marginBottom: "12px" })}>
                <strong>Proof Path:</strong>
                <div className={css({ fontSize: "12px", fontFamily: "monospace", marginTop: "4px" })}>
                  {generatedProof.proof.map((proofItem, index) => (
                    <div key={index}>
                      Level {index + 1}: {proofItem.data.substring(0, 20)}... ({proofItem.position})
                    </div>
                  ))}
                </div>
              </div>
              <div className={css({ marginBottom: "12px" })}>
                <strong>Complete Proof JSON:</strong>
                <div className={css({ position: "relative" })}>
                  <pre
                    className={css({
                      fontSize: "11px",
                      fontFamily: "monospace",
                      backgroundColor: "#fff",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      overflow: "auto",
                      maxHeight: "200px",
                      marginTop: "4px",
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
                      backgroundColor: "#6b7280",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
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
              marginBottom: "16px",
              padding: "16px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            })}
          >
            <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
              Step 2: Validate a Proof
            </h4>
            <label className={css({ display: "block", fontSize: "14px", marginBottom: "8px" })}>
              Paste Proof JSON:
            </label>
            <textarea
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="Paste the complete proof JSON here..."
              className={css({
                width: "100%",
                height: "120px",
                padding: "8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "12px",
                fontFamily: "monospace",
                marginBottom: "12px",
                resize: "vertical",
              })}
            />
            <button
              onClick={handleValidateProof}
              disabled={!validationInput.trim()}
              className={css({
                padding: "8px 16px",
                backgroundColor: validationInput.trim() ? "#3b82f6" : "#9ca3af",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: validationInput.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
              })}
            >
              Validate Proof
            </button>
          </div>

          {validationResult && (
            <div
              className={css({
                padding: "16px",
                backgroundColor: validationResult.isValid ? "#f0fdf4" : "#fef2f2",
                borderRadius: "4px",
                border: `1px solid ${validationResult.isValid ? "#bbf7d0" : "#fecaca"}`,
              })}
            >
              <h4 className={css({ fontSize: "16px", fontWeight: "medium", marginBottom: "12px" })}>
                Validation Result
              </h4>
              <div
                className={css({
                  fontSize: "14px",
                  fontWeight: "medium",
                  marginBottom: "12px",
                  color: validationResult.isValid ? "#166534" : "#dc2626",
                })}
              >
                {validationResult.message}
              </div>
              {validationResult.steps.length > 0 && (
                <div>
                  <strong>Verification Steps:</strong>
                  <div className={css({ marginTop: "8px" })}>
                    {validationResult.steps.map((step, index) => (
                      <div
                        key={index}
                        className={css({
                          fontSize: "12px",
                          fontFamily: "monospace",
                          backgroundColor: "#fff",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #e5e7eb",
                          marginBottom: "4px",
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
};

// Mock Merkle Tree functions using merkletreejs with consistent hash function
const calculateMerkleRoot = async (requests: LLMRequest[]): Promise<string> => {
  // Use the actual leaf data from requests (don't recreate timestamps)
  const publicLeaves = requests.map((req) => req.leafData!);

  // Convert to buffer format for merkletreejs using same hash function
  const leafBuffers = publicLeaves.map((leaf) => {
    const serialized = JSON.stringify(leaf, Object.keys(leaf).sort());
    return createSyncHash(serialized);
  });

  // Use the shared hash function
  const hashFn = createMerkleHashFn();

  const tree = new MerkleTree(leafBuffers, hashFn);
  const root = tree.getRoot();

  return `0x${root.toString("hex")}`;
};

// Function to visualize the Merkle Tree structure
const visualizeMerkleTree = async (requests: LLMRequest[]): Promise<string> => {
  if (requests.length === 0) return "";

  // Use the same leaf data as in calculateMerkleRoot
  const publicLeaves = requests.map((req) => req.leafData!);

  const leafBuffers = publicLeaves.map((leaf) => {
    const serialized = JSON.stringify(leaf, Object.keys(leaf).sort());
    return createSyncHash(serialized);
  });

  // Use the same hash function as calculateMerkleRoot
  const hashFn = createMerkleHashFn();

  const tree = new MerkleTree(leafBuffers, hashFn);

  // Get the layers of the tree
  const layers = tree.getLayers();
  let visualization = "Merkle Tree:\n";

  // Root (top level)
  const root = layers[layers.length - 1][0];
  visualization += `Root: ${root.toString("hex").substring(0, 8)}\n`;

  // Intermediate levels (if any)
  for (let i = layers.length - 2; i > 0; i--) {
    const level = layers[i];
    const levelHashes = level.map((hash) => hash.toString("hex").substring(0, 8));
    visualization += `Level ${layers.length - 1 - i}: ${levelHashes.join(" | ")}\n`;
  }

  // Leaf level
  const leaves = layers[0];
  const leafHashes = leaves.map((hash, index) => `H${index + 1}: ${hash.toString("hex").substring(0, 8)}`);
  visualization += `Leaves: ${leafHashes.join(" | ")}`;

  return visualization;
};

// Interactive Batch Creator Component
const BatchCreator: React.FC = () => {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [merkleTreeVisualization, setMerkleTreeVisualization] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(1);
  const [currentWallet, setCurrentWallet] = useState(mockWallets[0]);
  const [currentPrompt, setCurrentPrompt] = useState("");

  const BATCH_SIZE_THRESHOLD = 4; // Create merkle tree after 4 requests

  // Simulate sending an LLM call (like in the notebook)
  const sendLLMCall = async (wallet: string, prompt: string) => {
    // Create leaf data
    const leafData = {
      id: nextRequestId,
      timestamp: new Date().toISOString(),
      tokenCount: Math.floor(Math.random() * 200) + 100,
      wallet: wallet,
    };

    // Calculate leaf hash using same hash function as tree construction
    const serialized = JSON.stringify(leafData, Object.keys(leafData).sort());
    const leafHashBuffer = createSyncHash(serialized);
    const leafHash = `0x${leafHashBuffer.toString("hex")}`;

    // Simulate LLM response
    const mockResponses = [
      "The sentiment of this review is positive, indicating customer satisfaction.",
      "Hallo, wie geht es dir heute?",
      "Here's a Python function: def fibonacci(n): return n if n <= 1 else fibonacci(n-1) + fibonacci(n-2)",
      "Quantum computing uses quantum mechanical phenomena like superposition and entanglement to process information.",
      "Once upon a time, a curious cat named Whiskers discovered a mysterious clock that could bend time...",
      "Renewable energy reduces carbon emissions, creates jobs, and provides sustainable power solutions.",
      "Focus on user experience, social media marketing, and influencer partnerships for app growth.",
      "Fixed code: console.log('hello world'); // Missing quotes around string",
    ];

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    const newRequest: LLMRequest = {
      id: nextRequestId,
      prompt: prompt,
      model: "gpt-4-turbo",
      recipient: wallet,
      estimatedTokens: leafData.tokenCount,
      response: response,
      leafData: leafData,
      leafHash: leafHash,
    };

    setRequests((prev) => [...prev, newRequest]);
    setNextRequestId((prev) => prev + 1);
    setCurrentPrompt("");

    return newRequest;
  };

  // Create merkle tree when threshold is reached
  useEffect(() => {
    const createMerkleTree = async () => {
      if (requests.length >= BATCH_SIZE_THRESHOLD && !batchRegistered) {
        const root = await calculateMerkleRoot(requests);
        const treeVis = await visualizeMerkleTree(requests);
        setMerkleRoot(root);
        setMerkleTreeVisualization(treeVis);
        setBatchRegistered(true);
      }
    };

    createMerkleTree();
  }, [requests.length, batchRegistered]);

  const handleSendRequest = async () => {
    if (!currentPrompt.trim()) return;
    await sendLLMCall(currentWallet, currentPrompt);
  };

  const handleRandomRequest = async () => {
    const randomPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
    const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
    setCurrentWallet(randomWallet);
    await sendLLMCall(randomWallet, randomPrompt);
  };

  const resetDemo = () => {
    setRequests([]);
    setMerkleRoot("");
    setMerkleTreeVisualization("");
    setBatchRegistered(false);
    setNextRequestId(1);
    setCurrentPrompt("");
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        🧪 Interactive LLM Batch Processing Demo
      </h3>

      <div
        className={css({
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          border: "1px solid #bfdbfe",
        })}
      >
        <p className={css({ fontSize: "14px", color: "#1e40af", marginBottom: "8px" })}>
          <strong>How it works:</strong> Send LLM requests and get immediate responses. After {BATCH_SIZE_THRESHOLD}{" "}
          requests, a Merkle tree is automatically created for cost-efficient blockchain settlement.
        </p>
      </div>

      {/* Request Input */}
      <div
        className={css({
          marginBottom: "1.5rem",
          padding: "1rem",
          backgroundColor: "#fff",
          borderRadius: "4px",
          border: "1px solid #e5e7eb",
        })}
      >
        <h4 className={css({ fontSize: "1rem", fontWeight: "medium", marginBottom: "1rem" })}>Send LLM Request</h4>

        <div className={css({ marginBottom: "0.75rem" })}>
          <label className={css({ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" })}>
            Wallet Address:
          </label>
          <select
            value={currentWallet}
            onChange={(e) => setCurrentWallet(e.target.value)}
            className={css({
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            })}
          >
            {mockWallets.map((wallet) => (
              <option key={wallet} value={wallet}>
                {wallet}
              </option>
            ))}
          </select>
        </div>

        <div className={css({ marginBottom: "0.75rem" })}>
          <label className={css({ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" })}>Prompt:</label>
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your LLM prompt..."
            className={css({
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              fontSize: "0.85rem",
            })}
            onKeyPress={(e) => e.key === "Enter" && handleSendRequest()}
          />
        </div>

        <div className={css({ display: "flex", gap: "0.5rem", fontSize: "0.85rem" })}>
          <button
            onClick={handleSendRequest}
            disabled={!currentPrompt.trim()}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: currentPrompt.trim() ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: currentPrompt.trim() ? "pointer" : "not-allowed",
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: currentPrompt.trim() ? "#2563eb" : "#9ca3af" },
            })}
          >
            Send Request
          </button>

          <button
            onClick={handleRandomRequest}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: "#059669" },
            })}
          >
            Send Random Request
          </button>

          <button
            onClick={resetDemo}
            className={css({
              padding: "0.5rem 1rem",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background-color 0.2s",
              "&:hover": { backgroundColor: "#dc2626" },
            })}
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Merkle Root Display */}
      {batchRegistered && (
        <div
          className={css({
            padding: "0.75rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "4px",
            marginBottom: "1rem",
          })}
        >
          <strong>🌳 Merkle Root:</strong> <code className={css({ fontSize: "0.8rem" })}>{merkleRoot}</code>
          <div className={css({ fontSize: "0.8rem", color: "#166534", marginTop: "0.25rem" })}>
            All requests can now be processed with a single blockchain transaction!
          </div>
          {/* Tree Visualization */}
          {merkleTreeVisualization && (
            <div className={css({ marginTop: "0.75rem" })}>
              <strong>Tree Structure:</strong>
              <pre
                className={css({
                  fontSize: "0.7rem",
                  fontFamily: "monospace",
                  backgroundColor: "#fff",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #bbf7d0",
                  marginTop: "0.25rem",
                  lineHeight: "1.4",
                  overflow: "auto",
                })}
              >
                {merkleTreeVisualization}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Request List */}
      <div className={css({ maxHeight: "400px", overflowY: "auto" })}>
        {requests.length === 0 ? (
          <div
            className={css({
              padding: "1.5rem",
              textAlign: "center",
              color: "#6b7280",
              backgroundColor: "#fff",
              borderRadius: "4px",
              border: "1px solid #e5e7eb",
            })}
          >
            No requests yet. Send your first LLM request above! 🚀
          </div>
        ) : (
          requests.map((request, index) => (
            <div
              key={request.id}
              className={css({
                padding: "1rem",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                marginBottom: "0.75rem",
              })}
            >
              {/* Leaf Data */}
              {request.leafData && (
                <div className={css({ marginBottom: "0.5rem" })}>
                  <div className={css({ fontWeight: "medium", fontSize: "0.85rem", marginBottom: "0.25rem" })}>
                    Leaf Data R<sub>{index + 1}</sub>:
                  </div>
                  <pre
                    className={css({
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      backgroundColor: "#f9fafb",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #e5e7eb",
                      overflow: "auto",
                      lineHeight: "1.3",
                    })}
                  >
                    {JSON.stringify(request.leafData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Leaf Hash */}
              {request.leafHash && (
                <div>
                  <div className={css({ fontWeight: "medium", fontSize: "0.85rem", marginBottom: "0.25rem" })}>
                    Leaf Hash H<sub>{index + 1}</sub>:
                  </div>
                  <code
                    className={css({
                      fontSize: "0.7rem",
                      fontFamily: "monospace",
                      backgroundColor: "#f3f4f6",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      wordBreak: "break-all",
                      display: "block",
                    })}
                  >
                    {request.leafHash}
                  </code>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article className={css({ maxWidth: "800px", margin: "0 auto", padding: "20px" })}>
      <section className={css({ marginBottom: "32px" })}>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          The integration of Large Language Models (LLMs) into my website is an exciting possibility. But one problem
          remains: How can I reduce the blockchain transaction costs when users need multiple LLM API calls in an
          application? One possible answer lies in an elegant data structure: <strong>Merkle Trees</strong>.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          The Problem: High Gas Costs for Individual LLM Payments
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Imagine a dApp wants to process 10 different LLM API requests for its users. With the traditional approach,
          each LLM payment would require a separate blockchain transaction:
        </p>

        <div
          className={css({
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
          })}
        >
          <div>Individual Transactions:</div>
          <div>- LLM Request #1: ~$15 Gas Costs</div>
          <div>- LLM Request #2: ~$15 Gas Costs</div>
          <div>- LLM Request #3: ~$15 Gas Costs</div>
          <div>...</div>
          <div>
            <strong>Total: ~$150 for 10 LLM Requests</strong>
          </div>
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          This is not only expensive, but also inefficient for the network and makes AI services unaffordable.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          The Solution: Merkle Tree Batching for LLM Payments
        </h2>

        <div
          className={css({
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e293b" })}>
            📊 How Merkle Trees Work
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            A Merkle tree is a binary tree structure where each leaf represents a data element (in our case, an LLM
            request), and each parent node contains a cryptographic hash of its children. The mathematical foundation
            is:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: "1.4",
            })}
          >
            <div>
              <strong>For requests R₁, R₂, R₃, R₄:</strong>
            </div>
            <div>H₁ = hash(R₁), H₂ = hash(R₂), H₃ = hash(R₃), H₄ = hash(R₄)</div>
            <div>H₁₂ = hash(H₁ + H₂), H₃₄ = hash(H₃ + H₄)</div>
            <div>
              <strong>Root = hash(H₁₂ + H₃₄)</strong>
            </div>
          </div>
          <p className={css({ marginTop: "12px", lineHeight: "1.6" })}>
            This single root hash can represent an entire batch of requests, enabling us to register thousands of LLM
            requests with just one blockchain transaction while maintaining cryptographic proof of each individual
            request.
          </p>
        </div>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          With Merkle Trees, we can bundle multiple LLM API payments into a single blockchain transaction. Try it in the
          interactive demo:
        </p>

        <BatchCreator />

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Cost:</strong> Only ~$15 for the entire batch + $2 per LLM request instead of $150!
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Step 3: Proving Individual Transactions with Merkle Proofs
        </h2>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Now that we've seen how to batch LLM requests into a Merkle tree, let's explore the next crucial step:
          <strong> proving individual transactions</strong>. This is where the true power of Merkle trees shines.
        </p>

        <div
          className={css({
            backgroundColor: "#fef3c7",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#92400e" })}>
            📖 Alice&apos;s Challenge
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#92400e" })}>
            Alice made an LLM request that was batched with 1,000 other users&apos; requests into a single Merkle tree.
            The batch was registered on-chain with just one transaction. Now Alice needs to prove to Bob (a third party)
            that she actually made her payment, but she doesn&apos;t want to reveal the details of the other 999
            transactions.
          </p>
          <p className={css({ lineHeight: "1.6", color: "#92400e", fontWeight: "medium" })}>
            <strong>Question:</strong> How can Alice prove her payment without downloading the entire batch of 1,000
            transactions?
          </p>
        </div>

        <div
          className={css({
            backgroundColor: "#f0fdf4",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#166534" })}>
            🔍 The Solution: Merkle Proofs
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#166534" })}>
            A Merkle proof is a cryptographic proof that allows Alice to demonstrate her transaction is included in the
            Merkle tree without revealing any other transactions. Instead of downloading 1,000 transactions, Alice only
            needs:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: "1.4",
              color: "#166534",
            })}
          >
            <div>✅ Her original transaction data (R₁)</div>
            <div>✅ ~10 hash values (the "proof path")</div>
            <div>✅ The public Merkle root</div>
            <div className={css({ marginTop: "8px", fontWeight: "bold" })}>
              Total: ~320 bytes instead of ~1MB for full batch!
            </div>
          </div>
        </div>

        <div
          className={css({
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e293b" })}>
            🧮 How Merkle Proofs Work Mathematically
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            To prove that Alice&apos;s transaction R₁ is in the tree, she provides a "proof path" - the minimum set of
            hash values needed to reconstruct the path from her leaf to the root:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: "1.4",
            })}
          >
            <div>
              <strong>Alice&apos;s proof for R₁:</strong>
            </div>
            <div>1. Start with H₁ = hash(R₁)</div>
            <div>2. Proof provides H₂ (sibling hash)</div>
            <div>3. Compute H₁₂ = hash(H₁ + H₂)</div>
            <div>4. Proof provides H₃₄ (sibling hash)</div>
            <div>5. Compute Root = hash(H₁₂ + H₃₄)</div>
            <div className={css({ marginTop: "8px", fontWeight: "bold" })}>
              6. Verify: Computed Root = Published Root ✅
            </div>
          </div>
          <p className={css({ marginTop: "12px", lineHeight: "1.6" })}>
            This mathematical verification proves Alice&apos;s transaction is authentic without revealing any other
            transaction details.
          </p>
        </div>

        <ProofDemo />

        <div
          className={css({
            backgroundColor: "#eff6ff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
            marginTop: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e40af" })}>
            🏗️ Real-World Applications
          </h3>
          <div className={css({ lineHeight: "1.6", color: "#1e40af" })}>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Payment Verification:</strong> Users can prove payments to service providers
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Audit Compliance:</strong> Companies can prove specific transactions to auditors
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>Privacy Protection:</strong> Individual verification without mass data disclosure
            </p>
            <p>
              <strong>Efficient Validation:</strong> Third parties can verify proofs instantly without blockchain
              queries
            </p>
          </div>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Step 4: From Theory to Practice - Prepaid Settlement Workflow
        </h2>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Now that we understand how Merkle proofs work, let&apos;s see how this translates to a real-world prepaid
          system for LLM API payments. This approach solves the &quot;money availability&quot; problem by requiring
          users to deposit funds upfront.
        </p>

        <div
          className={css({
            backgroundColor: "#fef3c7",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#92400e" })}>
            🏦 The Prepaid Model: How It Ensures Payment
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#92400e" })}>
            Unlike the &quot;pay later&quot; approach where users might not pay, prepaid settlement guarantees payment
            by requiring deposits before service usage. This creates a trustless system where:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: "1.4",
              color: "#92400e",
            })}
          >
            <div>✅ User deposits $50 → Guaranteed $50 available</div>
            <div>✅ LLM requests consume balance → No payment risk</div>
            <div>✅ Batch settlement → Efficient blockchain transactions</div>
            <div>✅ Refunds possible → User controls remaining balance</div>
          </div>
        </div>


        <div
          className={css({
            backgroundColor: "#eff6ff",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
            marginTop: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e40af" })}>
            🔄 Smart Contract Extension for Your NFT Project
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#1e40af" })}>
            To integrate this with your existing `GenImNFTv3.sol` contract, you would extend it with prepaid
            functionality:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "12px",
              lineHeight: "1.4",
              overflow: "auto",
            })}
          >
            {`// GenImNFTv4.sol - Extended with LLM Prepaid System
contract GenImNFTv4 is GenImNFTv3 {
    mapping(address => uint256) public llmBalance;
    mapping(bytes32 => bool) public processedBatches;
    
    function depositForLLM() external payable {
        llmBalance[msg.sender] += msg.value;
        emit LLMDeposit(msg.sender, msg.value);
    }
    
    function processBatch(
        bytes32 merkleRoot,
        LLMRequest[] calldata requests,
        bytes32[][] calldata proofs
    ) external onlyOperator {
        // Batch settlement with Merkle proof verification
        // Deducts from prepaid balances atomically
    }
}`}
          </div>
          <p className={css({ marginTop: "12px", lineHeight: "1.6", color: "#1e40af" })}>
            This extension maintains full backward compatibility with your existing NFT functionality while adding
            cost-efficient LLM payment processing.
          </p>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Step 5: Economic Impact Analysis
        </h2>

        <div
          className={css({
            backgroundColor: "#f0fdf4",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#166534" })}>
            📊 Why This Matters for Your Project
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6", color: "#166534" })}>
            For your NFT project with LLM integration, this architecture enables:
          </p>
          <div className={css({ color: "#166534", lineHeight: "1.6" })}>
            <p className={css({ marginBottom: "8px" })}>
              <strong>💰 Cost Efficiency:</strong> Reduce LLM payment costs from $17 to $2.15 per request (87% savings)
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>⚡ User Experience:</strong> Instant LLM responses without individual transaction confirmations
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>🔒 Payment Security:</strong> Guaranteed settlement through prepaid balances
            </p>
            <p className={css({ marginBottom: "8px" })}>
              <strong>📈 Scalability:</strong> Support thousands of users with minimal blockchain overhead
            </p>
            <p>
              <strong>🛠️ Compatibility:</strong> Seamless integration with existing GenImNFTv3 contract
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
