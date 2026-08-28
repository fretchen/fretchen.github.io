import React, { useState, useEffect } from "react";
import { css } from "../../styled-system/css";
import { StandardMerkleTree } from "../../utils/minimalMerkleTree";

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

// Build the OpenZeppelin StandardMerkleTree for the current batch of requests
const buildMerkleTree = (requests: LLMRequest[]) => {
  const treeData = requests.map((req) => [
    req.leafData!.id,
    req.leafData!.timestamp,
    req.leafData!.tokenCount,
    req.leafData!.wallet,
  ]);
  const demoTypes = ["uint256", "string", "uint256", "string"];
  return StandardMerkleTree.of(treeData, demoTypes);
};

// Render the Merkle Tree structure for an already-built tree
const visualizeMerkleTree = (tree: ReturnType<typeof buildMerkleTree>): string => {
  let visualization = "Merkle Tree (OpenZeppelin StandardMerkleTree):\n";
  visualization += `Root: ${tree.root.substring(0, 16)}...\n`;

  // Display tree structure
  visualization += "\nTree Structure:\n";
  for (const [index, value] of tree.entries()) {
    const leafHash = tree.leafHash(value);
    visualization += `Leaf ${index + 1}: ${leafHash.substring(0, 16)}... (${String(value[0])}, ${String(value[3])})\n`;
  }

  return visualization;
};

const BATCH_SIZE_THRESHOLD = 4; // Small threshold for demo purposes

export default function BatchCreator() {
  const [requests, setRequests] = useState<LLMRequest[]>([]);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [merkleTreeVisualization, setMerkleTreeVisualization] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(1);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [currentWallet, setCurrentWallet] = useState(mockWallets[0]);
  // Simulate sending an LLM call (using StandardMerkleTree for consistency)
  const sendLLMCall = (wallet: string, prompt: string) => {
    // Create leaf data
    const leafData = {
      id: nextRequestId,
      timestamp: new Date().toISOString(),
      tokenCount: Math.floor(Math.random() * 200) + 100,
      wallet: wallet,
    };

    // Calculate leaf hash using StandardMerkleTree for consistency
    const leafArray = [leafData.id, leafData.timestamp, leafData.tokenCount, leafData.wallet];
    const demoTypes = ["uint256", "string", "uint256", "string"];

    // Create a temporary tree to get the leaf hash
    const tempTree = StandardMerkleTree.of([leafArray], demoTypes);
    const leafHash = tempTree.leafHash(leafArray);

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
    const createMerkleTree = () => {
      if (requests.length >= BATCH_SIZE_THRESHOLD && !batchRegistered) {
        const tree = buildMerkleTree(requests);
        setMerkleRoot(tree.root);
        setMerkleTreeVisualization(visualizeMerkleTree(tree));
        setBatchRegistered(true);
      }
    };

    void createMerkleTree();
  }, [requests, batchRegistered]);

  const handleSendRequest = () => {
    if (!currentPrompt.trim()) return;
    sendLLMCall(currentWallet, currentPrompt);
  };

  const handleRandomRequest = () => {
    const randomPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
    const randomWallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];
    setCurrentWallet(randomWallet);
    sendLLMCall(randomWallet, randomPrompt);
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
        borderRadius: "lg",
        padding: "5",
        margin: "20px 0",
        backgroundColor: "codeBg",
      })}
    >
      {/* h4, not h3 — see components/TableOfContents.tsx's doc comment */}
      <h4 className={css({ fontSize: "lg", fontWeight: "bold", marginBottom: "4" })}>
        🧪 Interactive LLM Batch Processing Demo
      </h4>

      <div
        className={css({
          marginBottom: "5",
          padding: "4",
          backgroundColor: "blue.50",
          borderRadius: "lg",
          border: "1px solid #bfdbfe",
        })}
      >
        <p className={css({ fontSize: "sm", color: "blue.800", marginBottom: "2" })}>
          <strong>How it works:</strong> Send LLM requests and get immediate responses. After {BATCH_SIZE_THRESHOLD}{" "}
          requests, a Merkle tree is automatically created for cost-efficient blockchain settlement.
        </p>
      </div>

      {/* Request Input */}
      <div
        className={css({
          marginBottom: "6",
          padding: "4",
          backgroundColor: "white",
          borderRadius: "sm",
          border: "1px solid #e5e7eb",
        })}
      >
        <h4 className={css({ fontSize: "md", fontWeight: "semibold", marginBottom: "4" })}>Send LLM Request</h4>

        <div className={css({ marginBottom: "3" })}>
          <label className={css({ display: "block", fontSize: "sm", marginBottom: "1" })}>Wallet Address:</label>
          <select
            value={currentWallet}
            onChange={(e) => setCurrentWallet(e.target.value)}
            className={css({
              width: "100%",
              padding: "2",
              border: "1px solid #d1d5db",
              borderRadius: "sm",
              fontFamily: "code",
              fontSize: "sm",
            })}
          >
            {mockWallets.map((wallet) => (
              <option key={wallet} value={wallet}>
                {wallet}
              </option>
            ))}
          </select>
        </div>

        <div className={css({ marginBottom: "3" })}>
          <label className={css({ display: "block", fontSize: "sm", marginBottom: "1" })}>Prompt:</label>
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            placeholder="Enter your LLM prompt..."
            className={css({
              width: "100%",
              padding: "2",
              border: "1px solid #d1d5db",
              borderRadius: "sm",
              fontSize: "sm",
            })}
            onKeyPress={(e) => e.key === "Enter" && handleSendRequest()}
          />
        </div>

        <div className={css({ display: "flex", gap: "2", fontSize: "sm" })}>
          <button
            onClick={handleSendRequest}
            disabled={!currentPrompt.trim()}
            className={css({
              padding: "8px 16px",
              backgroundColor: currentPrompt.trim() ? "gray.700" : "gray.400",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: currentPrompt.trim() ? "pointer" : "not-allowed",
              transition: "background-color {durations.normal} ease",
              "&:hover": { backgroundColor: currentPrompt.trim() ? "gray.600" : "gray.400" },
            })}
          >
            Send Request
          </button>

          <button
            onClick={handleRandomRequest}
            className={css({
              padding: "8px 16px",
              backgroundColor: "gray.700",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: "pointer",
              transition: "background-color {durations.normal} ease",
              "&:hover": { backgroundColor: "gray.600" },
            })}
          >
            Send Random Request
          </button>

          <button
            onClick={resetDemo}
            className={css({
              padding: "8px 16px",
              backgroundColor: "red.500",
              color: "white",
              border: "none",
              borderRadius: "sm",
              cursor: "pointer",
              transition: "background-color {durations.normal} ease",
              "&:hover": { backgroundColor: "red.600" },
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
            padding: "3",
            backgroundColor: "green.50",
            border: "1px solid #bbf7d0",
            borderRadius: "sm",
            marginBottom: "4",
          })}
        >
          <strong>🌳 Merkle Root:</strong> <code className={css({ fontSize: "sm" })}>{merkleRoot}</code>
          <div className={css({ fontSize: "sm", color: "green.800", marginTop: "1" })}>
            All requests can now be processed with a single blockchain transaction!
          </div>
          {/* Tree Visualization */}
          {merkleTreeVisualization && (
            <div className={css({ marginTop: "3" })}>
              <strong>Tree Structure:</strong>
              <pre
                className={css({
                  fontSize: "xs",
                  fontFamily: "code",
                  backgroundColor: "white",
                  padding: "2",
                  borderRadius: "sm",
                  border: "1px solid #bbf7d0",
                  marginTop: "1",
                  lineHeight: "normal",
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
              padding: "6",
              textAlign: "center",
              color: "gray.500",
              backgroundColor: "white",
              borderRadius: "sm",
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
                padding: "4",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "sm",
                marginBottom: "3",
              })}
            >
              {/* Prompt & Response (not part of leaf/hash) */}
              <div className={css({ marginBottom: "2" })}>
                <div className={css({ fontWeight: 500, fontSize: "md", marginBottom: "0.5", color: "#444" })}>
                  Prompt (not part of Merkle-Leafs):
                </div>
                <div
                  className={css({
                    fontSize: "md",
                    fontFamily: "code",
                    backgroundColor: "#fafbfc",
                    padding: "6px 10px",
                    borderRadius: "sm",
                    border: "1px solid #e5e7eb",
                    marginBottom: "1",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  })}
                >
                  {request.prompt}
                </div>
                <div className={css({ fontWeight: 500, fontSize: "md", marginBottom: "0.5", color: "#444" })}>
                  Response (not part of Merkle-Leafs):
                </div>
                <div
                  className={css({
                    fontSize: "md",
                    fontFamily: "code",
                    backgroundColor: "#fafbfc",
                    padding: "6px 10px",
                    borderRadius: "sm",
                    border: "1px solid #e5e7eb",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  })}
                >
                  {request.response}
                </div>
              </div>

              {/* Leaf Data */}
              {request.leafData && (
                <div className={css({ marginBottom: "2" })}>
                  <div
                    className={css({
                      fontWeight: 500,
                      fontSize: "md",
                      marginBottom: "0.5",
                      color: "#222",
                    })}
                  >
                    Merkle Leaf Data R<sub>{index + 1}</sub> (used for hash):
                  </div>
                  <pre
                    className={css({
                      fontSize: "sm",
                      fontFamily: "code",
                      backgroundColor: "#fafbfc",
                      padding: "8px 10px",
                      borderRadius: "sm",
                      border: "1px solid #e5e7eb",
                      overflow: "auto",
                      lineHeight: "tight",
                    })}
                  >
                    {JSON.stringify(request.leafData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Leaf Hash */}
              {request.leafHash && (
                <div>
                  <div
                    className={css({
                      fontWeight: 500,
                      fontSize: "md",
                      marginBottom: "0.5",
                      color: "#222",
                    })}
                  >
                    Merkle Leaf Hash H<sub>{index + 1}</sub>:
                  </div>
                  <code
                    className={css({
                      fontSize: "sm",
                      fontFamily: "code",
                      backgroundColor: "gray.100",
                      padding: "4px 8px",
                      borderRadius: "sm",
                      border: "1px solid #e5e7eb",
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
}
